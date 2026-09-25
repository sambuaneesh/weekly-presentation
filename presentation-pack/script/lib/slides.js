// Slide model and deck operations. A slide is a top-level frame on the current page; order is
// left→right, then top→bottom. Structural operations re-lay the slides out in one row.
import { SLIDE_W, SLIDE_GAP, getDeck, updateDeck, footerText } from './deck.js'
import { getTheme, roleProps } from './themes.js'
import { buildSlide, LAYOUTS } from './layouts.js'
import { TEMPLATES } from './templates.js'

const UNLOCKED = { ignoreShapeLock: true }

export function getSlides(editor) {
	const pageId = editor.getCurrentPageId()
	return editor
		.getSortedChildIdsForParent(pageId)
		.map((id) => editor.getShape(id))
		.filter((s) => s?.type === 'frame')
		.sort((a, b) => a.x - b.x || a.y - b.y)
}

// The slide containing `shapeId`, if any.
export function slideOf(editor, shapeId) {
	const pageId = editor.getCurrentPageId()
	let shape = editor.getShape(shapeId)
	while (shape && shape.parentId !== pageId) shape = editor.getShape(shape.parentId)
	return shape?.type === 'frame' ? shape : null
}

// The slide the user is on: the one holding the selection, else the one under the viewport
// centre, else the nearest one to it.
export function getCurrentIndex(editor) {
	const slides = getSlides(editor)
	if (!slides.length) return -1
	for (const id of editor.getSelectedShapeIds()) {
		const s = slideOf(editor, id)
		if (s) return slides.findIndex((x) => x.id === s.id)
	}
	const c = editor.getViewportPageBounds().center
	let best = 0
	let bestDist = Infinity
	slides.forEach((s, i) => {
		const b = editor.getShapePageBounds(s.id)
		if (!b) return
		const d = b.containsPoint(c) ? -1 : Math.hypot(b.center.x - c.x, b.center.y - c.y)
		if (d < bestDist) (bestDist = d), (best = i)
	})
	return best
}

// Place slides left→right in the given order.
function relayout(editor, ordered) {
	const y = ordered[0]?.y ?? 0
	let x = 0
	const updates = []
	for (const s of ordered) {
		const shape = editor.getShape(s.id ?? s)
		if (!shape) continue
		if (shape.x !== x || shape.y !== y) updates.push({ id: shape.id, type: 'frame', x, y })
		x += shape.props.w + SLIDE_GAP
	}
	if (updates.length) editor.updateShapes(updates)
}

const NUMBERED = /^\d+(\s·\s.*)?$/

// Keep derived text in step with the deck: numbered slide names, slide-number shapes and footers.
// Only writes what differs, so it is cheap to call after any change.
export function syncDeck(editor) {
	const deck = getDeck(editor)
	const footer = footerText(deck)
	const slides = getSlides(editor)
	const updates = []
	slides.forEach((slide, i) => {
		const n = String(i + 1).padStart(2, '0')
		const name = slide.props.name ?? ''
		if (NUMBERED.test(name)) {
			const next = name.replace(/^\d+/, n)
			if (next !== name) updates.push({ id: slide.id, type: 'frame', props: { name: next } })
		}
		for (const id of editor.getSortedChildIdsForParent(slide.id)) {
			const s = editor.getShape(id)
			const role = s?.meta?.role
			if (role !== 'number' && role !== 'footer') continue
			const want = role === 'number' ? String(i + 1) : footer
			const visible = role === 'number' ? deck.showNumbers : deck.showFooter
			const opacity = visible ? 1 : 0
			const have = s.props.richText?.content?.[0]?.content?.[0]?.text ?? ''
			if (have === want && s.opacity === opacity) continue
			updates.push({
				id: s.id,
				type: 'text',
				opacity,
				props: { richText: { type: 'doc', content: [{ type: 'paragraph', content: want ? [{ type: 'text', text: want }] : [] }] } },
			})
		}
	})
	if (updates.length) editor.run(() => editor.updateShapes(updates), UNLOCKED)
	return updates.length
}

function finish(editor, ordered) {
	editor.run(() => {
		relayout(editor, ordered)
		syncDeck(editor)
	}, UNLOCKED)
}

export function insertSlide(editor, index, layoutId = 'content', overrides = {}) {
	const slides = getSlides(editor)
	const deck = getDeck(editor)
	const { frameId, shapes } = buildSlide(layoutId, {
		x: -100000, // placed properly by relayout
		y: slides[0]?.y ?? 0,
		overrides,
		theme: getTheme(deck.theme),
	})
	editor.run(() => {
		editor.createShapes(shapes)
		const ordered = [...slides]
		ordered.splice(Math.max(0, Math.min(index, slides.length)), 0, editor.getShape(frameId))
		finish(editor, ordered)
	})
	return frameId
}

// Insert a slide from a saved layout (tldraw clipboard content of one frame).
export function insertFromContent(editor, index, content) {
	const slides = getSlides(editor)
	const before = new Set(slides.map((s) => s.id))
	let frameId = null
	editor.run(() => {
		editor.putContentOntoCurrentPage(structuredClone(content), { select: true, point: { x: -100000, y: 0 } })
		const created = getSlides(editor).find((s) => !before.has(s.id))
		if (!created) return
		frameId = created.id
		const ordered = [...slides]
		ordered.splice(Math.max(0, Math.min(index, slides.length)), 0, created)
		finish(editor, ordered)
	})
	return frameId
}

export function duplicateSlide(editor, index) {
	const slides = getSlides(editor)
	const slide = slides[index]
	if (!slide) return null
	return insertFromContent(editor, index + 1, editor.getContentFromCurrentPage([slide.id]))
}

export function deleteSlide(editor, index) {
	const slides = getSlides(editor)
	const slide = slides[index]
	if (!slide) return
	editor.run(() => {
		editor.deleteShapes([slide.id])
		finish(editor, slides.filter((s) => s.id !== slide.id))
	}, UNLOCKED)
}

export function moveSlide(editor, from, to) {
	const slides = getSlides(editor)
	if (from === to || !slides[from]) return
	const ordered = [...slides]
	const [s] = ordered.splice(from, 1)
	ordered.splice(Math.max(0, Math.min(to, ordered.length)), 0, s)
	finish(editor, ordered)
}

// Tidy: put every slide back in one evenly spaced row, in current order.
export function tidySlides(editor) {
	finish(editor, getSlides(editor))
}

export function applyTheme(editor, themeId) {
	const t = getTheme(themeId)
	const updates = []
	for (const slide of getSlides(editor)) {
		for (const id of editor.getShapeAndDescendantIds([slide.id])) {
			const s = editor.getShape(id)
			const style = s?.meta?.role && roleProps(s.meta.role, t, s)
			if (!style) continue
			const props = {}
			for (const [k, v] of Object.entries(style)) if (k in s.props && s.props[k] !== v) props[k] = v
			if (Object.keys(props).length) updates.push({ id: s.id, type: s.type, props })
		}
	}
	editor.run(() => {
		updateDeck(editor, { theme: themeId })
		if (updates.length) editor.updateShapes(updates)
	}, UNLOCKED)
}

export function saveAsLayout(editor, index, name) {
	const slide = getSlides(editor)[index]
	if (!slide) return
	const content = editor.getContentFromCurrentPage([slide.id])
	const deck = getDeck(editor)
	const id = `custom-${Date.now().toString(36)}`
	updateDeck(editor, { customLayouts: [...deck.customLayouts, { id, name, content }] })
	return id
}

export function deleteCustomLayout(editor, id) {
	const deck = getDeck(editor)
	updateDeck(editor, { customLayouts: deck.customLayouts.filter((l) => l.id !== id) })
}

export function seedTemplate(editor, templateId) {
	const template = TEMPLATES[templateId]
	if (!template) return
	const start = getSlides(editor).length
	editor.run(() => {
		template.slides.forEach((s, i) => insertSlide(editor, start + i, s.layout, s.overrides ?? {}))
		const title = template.slides[0]?.overrides?.title
		if (title && start === 0) updateDeck(editor, { title })
		syncDeck(editor)
	})
}

export { LAYOUTS, TEMPLATES }
