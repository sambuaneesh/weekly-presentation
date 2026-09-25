// Per-window UI state (never written to the document, so it is not shared or saved).
import { atom, EASINGS } from 'tldraw'

function stored(key, fallback) {
	try {
		const v = localStorage.getItem('pp:' + key)
		return v === null ? fallback : JSON.parse(v)
	} catch {
		return fallback
	}
}
function persisted(key, fallback) {
	const a = atom(key, stored(key, fallback))
	const set = a.set.bind(a)
	a.set = (v) => {
		try {
			localStorage.setItem('pp:' + key, JSON.stringify(v))
		} catch {}
		return set(v)
	}
	return a
}

export const panelOpen = persisted('panelOpen', true)
export const notesOpen = persisted('notesOpen', false)
export const presentIndex = atom('presentIndex', -1) // -1 when not presenting
export const openMenu = atom('openMenu', null) // 'theme' | 'deck' | 'layouts' | null
export const contextMenu = atom('contextMenu', null) // { index, x, y } | null

export const PANEL_W = 216
export const TOP_BAR = 96

// Screen-space area left for the slide once the pack's own UI is drawn.
export function editInsets() {
	return {
		left: panelOpen.get() ? PANEL_W + 32 : 24,
		top: TOP_BAR + 12,
		right: 24,
		bottom: notesOpen.get() ? 290 : 120,
	}
}

// Frame a slide inside the given screen insets (0 insets = fill the window, for presenting).
export function fitSlide(editor, slideId, { insets = editInsets(), animate = true } = {}) {
	const b = editor.getShapePageBounds(slideId)
	if (!b) return
	const screen = editor.getViewportScreenBounds()
	const availW = Math.max(100, screen.w - insets.left - insets.right)
	const availH = Math.max(100, screen.h - insets.top - insets.bottom)
	const z = Math.min(availW / b.w, availH / b.h)
	const x = (insets.left + availW / 2) / z - (b.x + b.w / 2)
	const y = (insets.top + availH / 2) / z - (b.y + b.h / 2)
	editor.stopCameraAnimation()
	editor.setCamera(
		{ x, y, z },
		{ force: true, animation: animate ? { duration: 320, easing: EASINGS.easeInOutCubic } : undefined }
	)
}

export const NO_INSETS = { left: 0, top: 0, right: 0, bottom: 0 }
