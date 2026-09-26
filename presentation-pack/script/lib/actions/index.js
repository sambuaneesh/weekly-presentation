// Actions for interactive slides made of native shapes. While presenting (ui/presentTool.js):
//   a shape with meta.press = 'name'       → ACTIONS.name(editor, { shape, slide, find })   on click
//   a shape with meta.drag = true          → follows the pointer; on release, if it lies over a shape
//     with meta.slot = 'name'              → ACTIONS.name(editor, { shape, slot, slide, find })
//     else, if it has meta.loose = 'name'  → ACTIONS.name(editor, { shape, slide, find })
// `find(tag)` returns the shape on the same slide with meta.tag === tag. Actions write the document
// (inside editor.run with ignoreShapeLock), so everyone in a live room sees the result.
// Deck-specific actions come from deck extensions (decks/<slug>/ext/index.js → `actions`).
import { fromExtensions } from '../../extensions.js'

export const ACTIONS = {
	// Put every shape with meta.home back where it started, and restore meta.homeProps if present.
	reset(editor, { slide }) {
		const updates = []
		for (const id of editor.getShapeAndDescendantIds([slide.id])) {
			const s = editor.getShape(id)
			if (!s?.meta?.home) continue
			updates.push({ id, type: s.type, x: s.meta.home.x, y: s.meta.home.y, ...(s.meta.homeProps && { props: s.meta.homeProps }) })
		}
		if (updates.length) editor.updateShapes(updates)
	},
	...fromExtensions('actions'),
}

export function runAction(name, editor, ctx) {
	const fn = ACTIONS[name]
	if (!fn) return false
	const find = (tag) => {
		for (const id of editor.getShapeAndDescendantIds([ctx.slide.id])) {
			const s = editor.getShape(id)
			if (s?.meta?.tag === tag) return s
		}
		return null
	}
	editor.run(() => fn(editor, { ...ctx, find }), { ignoreShapeLock: true })
	return true
}
