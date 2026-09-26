// Interactive: drop a patch card into the hand-drawn browser and the YAML "re-renders" (prism-1602, Fig. 7b).
// The YAML is separate mono text shapes tagged y-*; actions in ../ext/dropRender.js recolour them.
export default {
	name: 'Drop to render',
	kicker: 'III · Code2Image · prism-1602',
	title: 'Drop a patch in, see what it does',
	titleScale: 1.3,
	source: '§III-D2 · Fig. 7 (render reconstructed)',
	notes: "COVER (interactive)\n• Empty browser = the bug image of prism-1602\n• Drag patch 1 in: the picture changes but ALL highlighting is gone\n• Drag patch 2 in: fixed, both worlds green, comment grey\n• \"put back\" resets; this is step 6 done by hand\nDO\n• drag patch 1 · then patch 2 · then press put back\nREF · §III-D · Fig. 7 (render reconstructed)",
	draw(k) {
		// the browser window (drop slot)
		const BX = 620, BY = 250, BW = 1180, BH = 600
		k.box(BX, BY, BW, BH, { fill: 'semi', color: 'black', dash: 'draw', size: 'm', id: 'browser', meta: { slot: 'dockPatch' } })
		k.pen([[BX + 8, BY + 70], [BX + BW * 0.5, BY + 72], [BX + BW - 8, BY + 69]], { size: 'm', wob: 1.5 })
		for (let i = 0; i < 3; i++) k.circle(BX + 40 + i * 36, BY + 36, 11, { size: 's', color: 'grey', dash: 'draw' })
		k.box(BX + 170, BY + 16, 560, 40, { geo: 'rectangle', size: 's', color: 'grey', dash: 'draw' })
		k.text(BX + 190, BY + 20, 'localhost · repro of prism-1602', { size: 's', color: 'grey' })

		// the YAML render, piece by piece (mono advance 26.4px × scale)
		const S = 1.25, CH = 26.4 * S, X0 = BX + 80, Y0 = BY + 120, LH = 92
		const bug = { 'y-hello': 'blue', 'y-colon': 'grey', 'y-d1': 'grey', 'y-w1': 'black', 'y-cmt': 'grey', 'y-d2': 'grey', 'y-w2': 'green' }
		const piece = (tag, col, line, s) => {
			const x = X0 + col * CH, y = Y0 + line * LH
			k.text(x, y, s, { font: 'mono', size: 'xl', scale: S, color: bug[tag], id: tag, meta: { home: { x, y }, homeProps: { color: bug[tag] } } })
		}
		piece('y-hello', 0, 0, 'hello')
		piece('y-colon', 5, 0, ':')
		piece('y-d1', 4, 1, '-')
		piece('y-w1', 6, 1, '"world"')
		piece('y-cmt', 14, 1, '# test')
		piece('y-d2', 4, 2, '-')
		piece('y-w2', 6, 2, '"world"')

		// the socket where a patch snaps in
		k.box(BX + BW - 400, BY + BH - 200, 340, 150, { dash: 'dashed', color: 'grey', size: 'm', text: 'empty = the bug', labelColor: 'grey', id: 'socket' })

		// the two patch cards (draggable)
		const card = (tag, x, y, label, rot) => k.box(x, y, 340, 150, {
			fill: 'solid', color: 'black', size: 'xl', text: label, font: 'draw', rot, id: tag,
			meta: { drag: true, home: { x, y }, loose: 'undockPatch', patch: tag },
		})
		card('patch1', 150, 320, 'patch 1\n+  |#', -3)
		card('patch2', 150, 560, "patch 2\n+  \\'   #|", 2)
		k.text(150, 760, 'drag one into\nthe browser →', { size: 'm', color: 'grey', rot: -2 })

		// put back
		k.box(1590, 885, 210, 70, { geo: 'rectangle', dash: 'draw', size: 's', color: 'red', text: '    put back', labelColor: 'red', id: 'putback', locked: true, meta: { press: 'reset' } })
		const arc = []
		for (let i = 0; i <= 14; i++) { const t = -0.4 + (i / 14) * 4.9; arc.push([1632 + 17 * Math.cos(t), 920 + 17 * Math.sin(t)]) }
		k.pen(arc, { color: 'red', size: 's', locked: true })
		k.pen([[1640, 896], [1649, 906], [1636, 911]], { color: 'red', size: 's', locked: true })
	},
}
