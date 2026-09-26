// Step 1b: names can miss content, so an embedding model reads the chunks, but only in the key directories.
// Pencil dots = 512-token chunks, dashed clouds = key directories, the star = the issue.
// Kit workaround: helpers.createArrowBetweenShapes drops color/dash/size, so restyle bound arrows after
// creation; optional precise anchors per arrow (normalized, on the start/end shapes) via helpers.__paperAnchors.
function styledArrows() {
	if (typeof helpers === 'undefined') return
	helpers.__paperAnchors = new Map()
	if (helpers.__paperStyled2) return
	const orig = helpers.createArrowBetweenShapes
	helpers.createArrowBetweenShapes = (a, b, p = {}) => {
		const id = orig(a, b, p)
		editor.updateShape({ id, type: 'arrow', props: { color: p.color ?? 'black', dash: p.dash ?? 'draw', size: p.size ?? 'm', font: p.font ?? 'draw' } })
		const an = helpers.__paperAnchors?.get(a + '>' + b)
		if (an)
			for (const bd of editor.getBindingsFromShape(id, 'arrow')) {
				const na = an[bd.props.terminal]
				if (na) editor.updateBinding({ ...bd, props: { ...bd.props, normalizedAnchor: na, isPrecise: true } })
			}
		return id
	}
	helpers.__paperStyled2 = true
}
function anchorArrow(k, from, to, start, end) {
	if (typeof helpers !== 'undefined') helpers.__paperAnchors?.set(k.tag(from) + '>' + k.tag(to), { start, end })
}
const CLOUDS = [
	{ dir: 'axes/', x: 170, y: 262 },
	{ dir: 'charts/', x: 770, y: 262 },
	{ dir: 'samples/line/', x: 170, y: 612 },
	{ dir: 'scripts/', x: 770, y: 612 },
]
const CW = 420
const CHH = 270
const STAR = { x: 695, y: 590 }
const MERGED = ['axes/_common_ticks.md', 'charts/line.md', 'configuration/locale.md', 'developers/api.md', 'samples/line/segments.md', 'scripts/helpers.js']

export default {
	name: 'Embedding',
	kicker: 'II · the method · ❶ knowledge mining',
	title: '…then read the pages',
	source: '§III-A1 · §IV-D · schematic: dots are not real chunks',
	notes: "COVER\n• Step 1, part 2: names can miss content, so also search the text (RAG-style)\n• text-embedding-3-small · 512-token chunks, no overlap · only in the key directories · Top-6\n• Both sets merged = Related Docs, injected as domain knowledge\nCLICKS\n1 · arrows to the six nearest chunks · 2 · the Related Docs note\nREF · §III-A1 · §IV-D · Fig. 5b (schematic dots)",
	draw(k) {
		styledArrows()
		const dots = []
		CLOUDS.forEach((c, ci) => {
			k.box(c.x, c.y, CW, CHH, { geo: 'cloud', dash: 'dashed', color: 'grey', size: 's', id: `cloud-${ci}` })
			k.text(c.x, c.y + 44, c.dir, { size: 's', scale: 1.2, color: 'grey', w: CW, align: 'middle' })
			// pencil dots: the 512-token chunks in this directory
			for (let i = 0; i < 9; i++) {
				const a = k.rand() * Math.PI * 2
				const r = Math.sqrt(k.rand())
				const x = c.x + CW / 2 + Math.cos(a) * r * 120
				const y = c.y + CHH / 2 + 30 + Math.sin(a) * r * 58
				dots.push({ x, y, i: dots.length })
			}
		})
		dots.forEach((d) => k.circle(d.x, d.y, 8, { fill: 'solid', color: 'grey', size: 's', id: `dot-${d.i}` }))
		const near = [...dots].sort((a, b) => Math.hypot(a.x - STAR.x, a.y - STAR.y) - Math.hypot(b.x - STAR.x, b.y - STAR.y)).slice(0, 6)

		// the issue, a star in the middle of it all
		k.box(STAR.x - 38, STAR.y - 38, 76, 76, { geo: 'star', fill: 'solid', color: 'red', size: 's', id: 'star' })
		k.text(STAR.x - 110, STAR.y - 96, 'the issue', { size: 's', scale: 1.3, color: 'red', w: 220, align: 'middle', rot: -3 })

		k.text(170, 925, 'text-embedding-3-small · 512-token chunks · only key directories · Top-6', { size: 's', scale: 1.3, color: 'grey' })

		// click 1: the six nearest chunks
		near.forEach((d, j) => {
			k.circle(d.x, d.y, 11, { fill: 'solid', color: 'red', size: 's', beat: 1, anim: 'pop', id: `hit-${j}` })
			k.arrow('star', `hit-${j}`, { dash: 'dotted', color: 'red', size: 's', beat: 1, id: `ray-${j}` })
		})

		// click 2: both sets merged, on a sticky note
		k.note(1400, 280, 'Related Docs', { color: 'yellow', size: 's', scale: 2.3, align: 'start', valign: 'start', beat: 2, anim: 'drop', id: 'docs' })
		k.text(1440, 400, MERGED.join('\n'), { size: 's', scale: 1.5, beat: 2, anim: 'drop', id: 'docs-list' })
		k.text(1400, 780, 'by name ∪ by similarity', { size: 's', scale: 1.3, color: 'grey', beat: 2, anim: 'fade', w: 460, align: 'middle' })
	},
}
