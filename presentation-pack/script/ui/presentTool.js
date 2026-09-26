// Presentation mode as a tool. While active: UI hidden, camera locked to the slide, keys and
// clicks step through each slide's build steps and then the slides (instant cut between slides,
// no transition; only a slide's own build steps animate), and dragging annotates: a fading
// laser trail, or a highlighter stroke on the slide. Leaving restores all.
//
// In a live room (see `live` in state.js) the presenter's slide changes are published, and other
// people's editors run this tool as followers: they show whatever slide the presenter is on and
// can still point and highlight, but can't change slides.
import { StateNode, createShapeId, compressLegacySegments } from 'tldraw'
import { getSlides, getCurrentIndex } from '../lib/slides.js'
import { presentIndex, presentBeat, previewBeat, fitSlide, NO_INSETS, live, annotateMode } from './state.js'
import { slideBeats } from '../lib/beats.js'
import { runAction } from '../lib/actions/index.js'
import { slideOf } from '../lib/slides.js'

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
		previewBeat.set(null)
		presentBeat.set(Math.max(0, info?.startBeat ?? 0))
		presentIndex.set(Math.max(0, start))
		this.lastScreen = null
		this.drag = null
		this.focusCanvas()
		if (!this.follower) live.get()?.onPresent(presentIndex.get(), presentBeat.get())

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
		presentBeat.set(0)
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

	// Change slide as the presenter (followers only move via followTo). `beat` is where to land on
	// that slide: 0 (default) or 'end' (all steps shown, used when stepping backwards).
	go(i, beat = 0) {
		if (this.follower) return
		if (this.moveTo(i, beat)) live.get()?.onPresent(presentIndex.get(), presentBeat.get())
	}

	// One step forward: the slide's next build step, else the next slide.
	next() {
		const i = presentIndex.get()
		const slide = getSlides(this.editor)[i]
		if (slide && presentBeat.get() < slideBeats(this.editor, slide.id)) return this.go(i, presentBeat.get() + 1)
		if (i < getSlides(this.editor).length - 1) this.go(i + 1)
	}

	// One step back: the previous build step, else the previous slide with all its steps shown.
	prev() {
		const i = presentIndex.get()
		if (presentBeat.get() > 0) return this.go(i, presentBeat.get() - 1)
		if (i > 0) this.go(i - 1, 'end')
	}

	// Used by the live-room controller to keep a follower on the presenter's slide and step.
	followTo(i, beat = 0) {
		this.moveTo(i, beat)
	}

	moveTo(i, beat = 0) {
		const slides = getSlides(this.editor)
		const next = Math.max(0, Math.min(i, slides.length - 1))
		const slide = slides[next]
		const max = slide ? slideBeats(this.editor, slide.id) : 0
		const b = beat === 'end' ? max : Math.max(0, Math.min(beat, max))
		const same = next === presentIndex.get()
		if (same && b === presentBeat.get()) return false
		presentBeat.set(b)
		presentIndex.set(next)
		if (!same) this.show()
		return true
	}

	onKeyDown(info) {
		const key = info.key
		if (key === 'Escape') return this.editor.setCurrentTool('select')
		if (NEXT.has(key)) return this.next()
		if (PREV.has(key)) return this.prev()
		if (key === 'Home') return this.go(0)
		if (key === 'End') return this.go(Infinity, 'end')
	}

	// tldraw delivers Escape as a "cancel" event rather than a key press.
	onCancel() {
		this.editor.setCurrentTool('select')
	}

	// Shapes whose util opts in can be handled while presenting (see "Interactive shapes" below).
	interactiveAt(point) {
		const editor = this.editor
		const hits = editor.getShapesAtPoint(point, { hitInside: true, margin: 4 }).filter((s) => !editor.isShapeHidden(s))
		for (const s of hits) {
			const util = editor.getShapeUtil(s)
			if (util.onPresentPress || util.onPresentDrop || s.meta?.press || s.meta?.drag) return s
		}
		return null
	}

	// Click = next slide (presenter only). Press and drag = laser or highlighter, or, on an
	// interactive shape, press it / drag it.
	onPointerDown() {
		const editor = this.editor
		const p = editor.inputs.currentScreenPoint
		this.drag = { x: p.x, y: p.y, started: false, scribbleId: null, stroke: null }
		const target = !this.follower && !editor.getIsReadonly() ? this.interactiveAt(editor.inputs.currentPagePoint) : null
		if (target) {
			const page = editor.inputs.currentPagePoint
			this.drag.target = { id: target.id, start: { x: page.x, y: page.y }, origin: { x: target.x, y: target.y } }
		}
	}

	onPointerMove() {
		const drag = this.drag
		if (!drag || !this.editor.inputs.isPointing) return
		if (drag.target) return this.moveTarget(drag)
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
		if (drag.target) return this.releaseTarget(drag)
		if (drag.scribbleId) this.editor.scribbles.stop(drag.scribbleId)
		else if (drag.stroke) this.editor.updateShape({ id: drag.stroke.id, type: 'highlight', props: { isComplete: true } })
		else if (!drag.started) this.next()
	}

	// ---------- Interactive shapes ----------
	// A ShapeUtil can define, to work while presenting (document writes: everyone in a live room sees them):
	//   onPresentPress(shape, editor)     a click on it (instead of "next slide")
	//   onPresentDrop(shape, editor)      it was dragged and let go (it moves with the pointer while dragged)
	// Draggable shapes follow the pointer; the move is a normal document edit.
	moveTarget(drag) {
		const editor = this.editor
		const shape = editor.getShape(drag.target.id)
		if (!shape || !(editor.getShapeUtil(shape).onPresentDrop || shape.meta?.drag)) return
		const s = editor.inputs.currentScreenPoint
		if (!drag.started && Math.hypot(s.x - drag.x, s.y - drag.y) < 4) return
		drag.started = true
		const p = editor.inputs.currentPagePoint
		// Page-space delta, converted into the parent's space (slides are unrotated frames, so a translate).
		const dx = p.x - drag.target.start.x
		const dy = p.y - drag.target.start.y
		editor.run(() => editor.updateShape({ id: shape.id, type: shape.type, x: drag.target.origin.x + dx, y: drag.target.origin.y + dy }), { ignoreShapeLock: true })
	}

	releaseTarget(drag) {
		const editor = this.editor
		const shape = editor.getShape(drag.target.id)
		if (!shape) return
		const util = editor.getShapeUtil(shape)
		const slide = slideOf(editor, shape.id)
		if (drag.started) {
			if (util.onPresentDrop) return util.onPresentDrop(shape, editor)
			if (!slide) return
			// Native draggable: find a slot under its centre.
			const b = editor.getShapePageBounds(shape.id)
			const slot = b && editor
				.getShapesAtPoint(b.center, { hitInside: true })
				.find((s) => s.id !== shape.id && s.meta?.slot && slideOf(editor, s.id)?.id === slide.id)
			if (slot) runAction(slot.meta.slot, editor, { shape: editor.getShape(shape.id), slot, slide })
			else if (shape.meta?.loose) runAction(shape.meta.loose, editor, { shape: editor.getShape(shape.id), slide })
		} else if (util.onPresentPress) util.onPresentPress(shape, editor)
		else if (shape.meta?.press && slide) runAction(shape.meta.press, editor, { shape, slide })
		else this.next()
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
