// The same bug, now as the picture the reporter saw (reconstructed from Fig. 7b).
export default {
	name: 'In pixels',
	kicker: 'I · the problem',
	title: '…and here is what they saw',
	source: 'prism-1602 · reconstructed from Fig. 7b',
	notes: "COVER\n• The same bug as the reporter saw it (Fig. 7b, reconstructed)\n• \"hello\" and the second \"world\" are highlighted; the first \"world\" (before # test) isn't\n• The picture says in a second what the words didn't\nCLICKS\n1 · red loop on the plain \"world\"\nREF · §III-D2 · Fig. 7b",
	draw(k) {
		k.box(460, 290, 1000, 520, { fill: 'solid', color: 'white', dash: 'draw', size: 's', id: 'frame' })
		// three window dots, like the browser chrome in Fig. 7b
		k.circle(505, 330, 10, { color: 'red', fill: 'semi', size: 's' })
		k.circle(537, 330, 10, { color: 'yellow', fill: 'semi', size: 's' })
		k.circle(569, 330, 10, { color: 'green', fill: 'semi', size: 's' })
		// mono xl ≈ 25.5px per character; tokens placed on a character grid so spacing stays true
		const cw = 25.6, lx = 540, ly = 390, lh = 120
		const tok = (row, col, s, color, o = {}) => k.text(lx + col * cw, ly + row * lh, s, { font: 'mono', size: 'xl', color, ...o })
		tok(0, 0, 'hello', 'blue'); tok(0, 5, ':', 'grey')
		tok(1, 4, '-', 'grey'); tok(1, 6, '"world"', 'black', { id: 'plain' }); tok(1, 14, '# test', 'grey')
		tok(2, 4, '-', 'grey'); tok(2, 6, '"world"', 'green')
		k.loop(lx + 9.5 * cw, ly + lh + 30, 112, 50, { beat: 1, anim: 'wipe' })
		k.text(lx + 19 * cw, ly + lh + 80, 'this one never lights up', { size: 'm', color: 'red', beat: 1, rot: -3 })
	},
}
