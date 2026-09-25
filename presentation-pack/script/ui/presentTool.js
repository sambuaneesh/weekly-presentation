// Presentation mode as a tool. While active: UI hidden, camera locked to the slide, keys and
// clicks step through slides (instant cut, no transition), and dragging annotates: a fading
// laser trail, or a highlighter stroke on the slide. Leaving restores all.
//
// In a live room (see `live` in state.js) the presenter's slide changes are published, and other
// people's editors run this tool as followers: they show whatever slide the presenter is on and
// can still point and highlight, but can't change slides.
import { StateNode, createShapeId, compressLegacySegments } from 'tldraw'
import { getSlides, getCurrentIndex } from '../lib/slides.js'
import { presentIndex, fitSlide, NO_INSETS, live, annotateMode } from './state.js'

const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'])
const PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'])

export class PresentTool extends StateNode {
	static id = 'present'

	onEnter(info) {
		const editor = this.editor
		this.follower = !!info?.follower
		this.saved = {
			cameraOptions: editor.getCameraOptions(),
			focusMode: editor.getInstanceState().isFocusMode,
		}
		const start = typeof info?.startIndex === 'number' ? info.startIndex : getCurrentIndex(editor)
		editor.selectNone()
		editor.updateInstanceState({ isFocusMode: true })
		editor.setCameraOptions({ ...this.saved.cameraOptions, isLocked: true })
		presentIndex.set(Math.max(0, start))
		this.lastScreen = null
		this.drag = null
		this.focusCanvas()
		if (!this.follower) live.get()?.onPresent(presentIndex.get())

		this.onFullscreenChange = () => {
			if (!document.fullscreenElement && editor.getCurrentToolId() === 'present') editor.setCurrentTool('select')
		}
		// Followers enter without a click, and browsers only allow fullscreen from one.
		if (!this.follower) {
			document.addEventListener('fullscreenchange', this.onFullscreenChange)
			document.documentElement.requestFullscreen?.().catch(() => {})
		}
	}

	onExit() {
		const editor = this.editor
		document.removeEventListener('fullscreenchange', this.onFullscreenChange)
		if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
		if (!this.follower) live.get()?.onPresent(null)
		else live.get()?.onStopFollowing?.()
		const slide = getSlides(editor)[presentIndex.get()]
		presentIndex.set(-1)
		editor.setCameraOptions(this.saved.cameraOptions)
		editor.updateInstanceState({ isFocusMode: this.saved.focusMode })
		// Followers hand the camera back to the live room (which resumes following the presenter).
		if (slide && !this.follower) {
			editor.select(slide.id)
			// Wait a frame so the edit UI is back before framing around it.
			requestAnimationFrame(() => fitSlide(editor, slide.id, { animate: false }))
		}
	}

	// Keys only reach tools while the tldraw container has DOM focus. The Present button that
	// started us unmounts, which drops focus to <body>, so take it back (and keep it).
	focusCanvas() {
		const container = this.editor.getContainer()
		const active = document.activeElement
		if (active && active !== document.body && container.contains(active)) return
		container.focus({ preventScroll: true })
	}

	show() {
		const slide = getSlides(this.editor)[presentIndex.get()]
		if (slide) fitSlide(this.editor, slide.id, { insets: NO_INSETS, animate: false })
	}

	// Refit whenever the window size changes (entering fullscreen, resizing).
	onTick() {
		this.focusCanvas()
		const { w, h } = this.editor.getViewportScreenBounds()
		const key = `${w}x${h}`
		if (key !== this.lastScreen) {
			this.lastScreen = key
			this.show()
		}
	}

	// Change slide as the presenter (followers only move via followTo).
	go(i) {
		if (this.follower) return
		if (this.moveTo(i)) live.get()?.onPresent(presentIndex.get())
	}

	// Used by the live-room controller to keep a follower on the presenter's slide.
	followTo(i) {
		this.moveTo(i)
	}

	moveTo(i) {
		const count = getSlides(this.editor).length
		const next = Math.max(0, Math.min(i, count - 1))
		if (next === presentIndex.get()) return false
		presentIndex.set(next)
		this.show()
		return true
	}

	onKeyDown(info) {
		const key = info.key
		const i = presentIndex.get()
		if (key === 'Escape') return this.editor.setCurrentTool('select')
		if (NEXT.has(key)) return this.go(i + 1)
		if (PREV.has(key)) return this.go(i - 1)
		if (key === 'Home') return this.go(0)
		if (key === 'End') return this.go(Infinity)
	}

	// tldraw delivers Escape as a "cancel" event rather than a key press.
	onCancel() {
		this.editor.setCurrentTool('select')
	}

	// Click = next slide (presenter only). Press and drag = laser or highlighter.
	onPointerDown() {
		const p = this.editor.inputs.currentScreenPoint
		this.drag = { x: p.x, y: p.y, started: false, scribbleId: null, stroke: null }
	}

	onPointerMove() {
		const drag = this.drag
		if (!drag || !this.editor.inputs.isPointing) return
		const s = this.editor.inputs.currentScreenPoint
		if (!drag.started) {
			if (Math.hypot(s.x - drag.x, s.y - drag.y) < 6) return
			drag.started = true
			if (annotateMode.get() === 'highlight') this.startStroke()
			else drag.scribbleId = this.editor.scribbles.addScribble({ color: 'laser', opacity: 0.7, size: 12, delay: 1200, shrink: 0.05, taper: true }).id
		}
		const { x, y } = this.editor.inputs.currentPagePoint
		if (drag.stroke) this.extendStroke(x, y)
		else if (drag.scribbleId) this.editor.scribbles.addPoint(drag.scribbleId, x, y, 0.5)
	}

	onPointerUp() {
		const drag = this.drag
		this.drag = null
		if (!drag) return
		if (drag.scribbleId) this.editor.scribbles.stop(drag.scribbleId)
		else if (drag.stroke) this.editor.updateShape({ id: drag.stroke.id, type: 'highlight', props: { isComplete: true } })
		else if (!drag.started) this.go(presentIndex.get() + 1)
	}

	// Highlighter strokes are real shapes on the slide (so everyone in a live room sees them),
	// tagged meta.annotation so "Clear" can remove them.
	startStroke() {
		const editor = this.editor
		const slide = getSlides(editor)[presentIndex.get()]
		const p = editor.inputs.currentPagePoint
		const ox = slide ? slide.x : 0
		const oy = slide ? slide.y : 0
		const id = createShapeId()
		this.drag.stroke = { id, x: p.x - ox, y: p.y - oy, ox, oy, points: [{ x: 0, y: 0, z: 0.5 }] }
		editor.createShape({
			id,
			type: 'highlight',
			parentId: slide?.id,
			x: p.x - ox,
			y: p.y - oy,
			props: { color: 'yellow', size: 'l', scale: 2, segments: compressLegacySegments([{ type: 'free', points: this.drag.stroke.points }]) },
			meta: { annotation: true },
		})
	}

	extendStroke(x, y) {
		const s = this.drag.stroke
		s.points.push({ x: x - s.ox - s.x, y: y - s.oy - s.y, z: 0.5 })
		this.editor.updateShape({ id: s.id, type: 'highlight', props: { segments: compressLegacySegments([{ type: 'free', points: s.points }]) } })
	}
}

// Remove highlighter strokes from the slide being shown.
export function clearAnnotations(editor) {
	const slide = getSlides(editor)[presentIndex.get()]
	if (!slide) return
	const ids = editor.getSortedChildIdsForParent(slide.id).filter((id) => editor.getShape(id)?.meta?.annotation)
	if (ids.length) editor.deleteShapes(ids)
}
