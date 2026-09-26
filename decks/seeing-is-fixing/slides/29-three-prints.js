// Three prints of prism-1602 pinned side by side, coloured as in Fig. 7b; the red pencil picks patch 2.
const BUG = { hello: 'blue', colon: 'grey', d1: 'grey', w1: 'black', cmt: 'grey', d2: 'grey', w2: 'green' }
const COLORS = {
	bug: BUG,
	p1: Object.fromEntries(Object.keys(BUG).map((t) => [t, 'black'])),
	p2: { ...BUG, w1: 'green' },
}
// hello: / - "world" # test / - "world"   as [tag, column, line, text]
const PIECES = [['hello', 0, 0, 'hello'], ['colon', 5, 0, ':'], ['d1', 2, 1, '-'], ['w1', 4, 1, '"world"'], ['cmt', 12, 1, '# test'], ['d2', 2, 2, '-'], ['w2', 4, 2, '"world"']]
export default {
	name: 'Three prints',
	kicker: 'III · Code2Image · prism-1602',
	title: 'Three prints of one line',
	source: '§III-D2 · Fig. 7b (prints reconstructed)',
	notes: "COVER\n• The paper's own example: bug, patch 1, patch 2\n• Patch 1 changes pixels (passes the filter) but kills all highlighting\n• Patch 2 restores highlighting: the model keeps patch 2\nCLICKS\n1 · cross on patch 1 · 2 · box on patch 2\nREF · §III-D2 · Fig. 7 (prints reconstructed)",
	draw(k) {
		const W = 500, H = 280, Y = 370
		const prints = [['bug', 'bug', 130, -1.5], ['p1', 'patch 1', 710, 0.8], ['p2', 'patch 2', 1290, -0.6]]
		for (const [v, label, x] of prints) {
			k.box(x, Y, W, H, { fill: 'solid', color: 'white', dash: 'solid', size: 's' })
			k.box(x, Y, W, H, { fill: 'none', color: 'black', dash: 'draw', size: 's' })
			k.circle(x + W / 2, Y + 4, 12, { fill: 'fill', color: 'red', size: 's' })
			const CH = 21.6, X0 = x + 40, Y0 = Y + 50, LH = 64
			for (const [tag, col, line, s] of PIECES) k.text(X0 + col * CH, Y0 + line * LH, s, { font: 'mono', size: 'l', color: COLORS[v][tag] })
			k.text(x + 10, Y + H + 24, label, { size: 'l' })
		}
		// click 1: patch 1 changed pixels but lost all highlighting
		k.cross(710 + W / 2 - 120, Y + H / 2 - 120, 240, { beat: 1, anim: 'wipe' })
		k.text(710 + 10, Y + H + 90, 'pixels changed…\nbut no highlighting at all', { size: 'm', color: 'grey', beat: 1 })
		// click 2: the red box on patch 2
		k.box(1290 - 18, Y - 18, W + 36, H + 36, { color: 'red', size: 'l', dash: 'draw', beat: 2, anim: 'wipe' })
		k.text(1290 + 10, Y + H + 90, 'the model keeps patch 2', { size: 'l', color: 'red', rot: -2, beat: 2 })
	},
}
