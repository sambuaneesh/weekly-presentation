// Build steps ("beats") inside a slide. A click while presenting reveals the next beat before it
// moves on to the next slide.
//
// A slide's beat count is the largest of:
//   • any shape on it with a numeric `meta.beat` (that shape stays hidden until beat n), and
//   • any scene shape on it (its scene declares how many beats it animates through).
//
// Beat 0 is the slide as it first appears. While editing, every slide shows all of its beats,
// unless the top bar's step preview is pinning one slide to a particular beat.
import { getSlides, slideOf } from './slides.js'
import { presentIndex, presentBeat, previewBeat } from '../ui/state.js'
import { SCENES } from '../scenes/registry.js'

export function slideBeats(editor, slideId) {
	let n = 0
	for (const id of editor.getShapeAndDescendantIds([slideId])) {
		const s = editor.getShape(id)
		if (!s || s.id === slideId) continue
		if (s.type === 'scene') n = Math.max(n, SCENES[s.props.scene]?.beats ?? 0)
		if (typeof s.meta?.beat === 'number') n = Math.max(n, s.meta.beat)
	}
	return n
}

// The beat a slide is showing right now in this window (Infinity = everything).
export function shownBeat(editor, slideId) {
	const i = presentIndex.get()
	if (i >= 0) return getSlides(editor)[i]?.id === slideId ? presentBeat.get() : Infinity
	const p = previewBeat.get()
	return p && p.slideId === slideId ? p.beat : Infinity
}

// For config.getShapeVisibility: hide shapes whose beat hasn't come yet.
export function beatVisibility(shape, editor) {
	const beat = shape.meta?.beat
	if (typeof beat !== 'number') return 'inherit'
	const slide = slideOf(editor, shape.id)
	if (!slide) return 'inherit'
	return shownBeat(editor, slide.id) >= beat ? 'inherit' : 'hidden'
}
