// Presentation mode as a tool. While active: UI hidden, camera locked to the slide, keys and
// clicks step through slides (instant cut, no transition), and dragging draws a fading laser trail.
// Leaving restores all.
import { StateNode } from 'tldraw'
import { getSlides, getCurrentIndex } from '../lib/slides.js'
import { presentIndex, fitSlide, NO_INSETS } from './state.js'

const NEXT = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'])
const PREV = new Set(['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'])

export class PresentTool extends StateNode {
	static id = 'present'

	onEnter(info) {
		const editor = this.editor
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

		this.onFullscreenChange = () => {
			if (!document.fullscreenElement && editor.getCurrentToolId() === 'present') editor.setCurrentTool('select')
		}
		document.addEventListener('fullscreenchange', this.onFullscreenChange)
		document.documentElement.requestFullscreen?.().catch(() => {})
	}

	onExit() {
		const editor = this.editor
		document.removeEventListener('fullscreenchange', this.onFullscreenChange)
		if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
		const slide = getSlides(editor)[presentIndex.get()]
		presentIndex.set(-1)
		editor.setCameraOptions(this.saved.cameraOptions)
		editor.updateInstanceState({ isFocusMode: this.saved.focusMode })
		if (slide) {
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

	go(i) {
		const count = getSlides(this.editor).length
		const next = Math.max(0, Math.min(i, count - 1))
		const current = presentIndex.get()
		if (next === current) return
		presentIndex.set(next)
		this.show()
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

	// Click = next slide. Press and drag = laser pointer.
	onPointerDown() {
		const p = this.editor.inputs.currentScreenPoint
		this.drag = { x: p.x, y: p.y, scribbleId: null }
	}

	onPointerMove() {
		if (!this.drag || !this.editor.inputs.isPointing) return
		const s = this.editor.inputs.currentScreenPoint
		if (!this.drag.scribbleId) {
			if (Math.hypot(s.x - this.drag.x, s.y - this.drag.y) < 6) return
			const item = this.editor.scribbles.addScribble({ color: 'laser', opacity: 0.7, size: 12, delay: 1200, shrink: 0.05, taper: true })
			this.drag.scribbleId = item.id
		}
		const { x, y } = this.editor.inputs.currentPagePoint
		this.editor.scribbles.addPoint(this.drag.scribbleId, x, y, 0.5)
	}

	onPointerUp() {
		if (!this.drag) return
		if (this.drag.scribbleId) this.editor.scribbles.stop(this.drag.scribbleId)
		else this.go(presentIndex.get() + 1)
		this.drag = null
	}
}
