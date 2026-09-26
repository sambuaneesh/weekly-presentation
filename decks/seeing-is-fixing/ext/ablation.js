// Actions for the "two switches" ablation slide (../slides/32-two-switches.js; contract in presentation-pack/script/lib/actions/index.js).
// Two hand-drawn switches (pill `sw-i2c` / `sw-c2i` + knob `knob-i2c` / `knob-c2i`) hold their state in the
// pill's meta.on. Flipping one re-draws the readout: `count`, `delta`, `cost`, `note`, `bar`, `onoff-*`.
// Numbers: Table III (SWE-bench M test, GPT-4o, of 517).
import { toRichText } from 'tldraw'

const VARIANTS = {
	'00': { n: 136, cost: '$0.08', note: 'the agentless core alone: localize, then write the patch' },
	'10': { n: 146, cost: '$0.10', note: 'Image2Code: mine the docs, write code that reproduces the bug' },
	'01': { n: 148, cost: '$0.27', note: 'Code2Image: render the candidates and look (about 3× the cost)' },
	'11': { n: 157, cost: '$0.29', note: 'both: Image2Code writes the repro that Code2Image replays' },
}
// Geometry: keep in step with the slide file.
const ABLATION = { pillW: 220, pillH: 100, knobR: 36, barW: 1500, barMax: 160 }

function render(editor, find, state) {
	const v = VARIANTS[(state.i2c ? '1' : '0') + (state.c2i ? '1' : '0')]
	const full = state.i2c && state.c2i
	const ups = []
	for (const which of ['i2c', 'c2i']) {
		const on = !!state[which]
		const pill = find('sw-' + which)
		const knob = find('knob-' + which)
		const lab = find('onoff-' + which)
		if (pill) ups.push({ id: pill.id, type: 'geo', meta: { ...pill.meta, on }, props: { fill: on ? 'solid' : 'none', color: on ? 'red' : 'black' } })
		if (pill && knob) {
			const { pillW, pillH, knobR } = ABLATION
			const pad = (pillH - 2 * knobR) / 2
			ups.push({ id: knob.id, type: 'geo', x: on ? pill.x + pillW - pad - 2 * knobR : pill.x + pad, y: pill.y + pad })
		}
		if (lab) ups.push({ id: lab.id, type: 'text', props: { richText: toRichText(on ? 'on' : 'off'), color: on ? 'red' : 'grey' } })
	}
	const set = (tag, type, props) => {
		const s = find(tag)
		if (s) ups.push({ id: s.id, type, props })
	}
	set('count', 'text', { richText: toRichText(String(v.n)), color: full ? 'green' : 'black' })
	set('delta', 'text', { richText: toRichText('+' + (v.n - 136)), color: v.n === 136 ? 'grey' : 'red' })
	set('cost', 'text', { richText: toRichText(v.cost + ' per issue') })
	set('note', 'text', { richText: toRichText(v.note) })
	set('bar', 'geo', { w: Math.round((v.n / ABLATION.barMax) * ABLATION.barW), color: full ? 'green' : 'black' })
	const bl = find('barlabel')
	const bar = find('bar')
	if (bl && bar) ups.push({ id: bl.id, type: 'text', x: bar.x + Math.round((v.n / ABLATION.barMax) * ABLATION.barW) + 24, props: { richText: toRichText(String(v.n)) } })
	editor.updateShapes(ups)
}

function stateOf(find) {
	return { i2c: !!find('sw-i2c')?.meta?.on, c2i: !!find('sw-c2i')?.meta?.on }
}

export const ablationActions = {
	// Click a switch (pill, knob or its label: all carry meta.press 'toggleAblation' + meta.which).
	toggleAblation(editor, { shape, find }) {
		const which = shape.meta?.which
		if (which !== 'i2c' && which !== 'c2i') return
		const state = stateOf(find)
		state[which] = !state[which]
		render(editor, find, state)
	},
	// Both switches off again.
	resetAblation(editor, { find }) {
		render(editor, find, { i2c: false, c2i: false })
	},
}
