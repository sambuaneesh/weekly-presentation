// Closing: three prints of prism-1602 pinned on a clothesline; the fixed one boxed in red.
export default {
	name: 'Closing',
	kicker: 'Seeing is Fixing',
	title: 'To see a fix is to trust it',
	source: 'prints after Fig. 7b · Tables I, III, V',
	notes: "COVER\n• Back to the darkroom: an image is kept once fixed; a patch once it's seen to work\n• Read the picture as code (Image2Code) · read the code as a picture (Code2Image)\n• 157/517 with GPT-4o at $0.29/issue · +21 over its own core · 175 with o4-mini\nCLICKS\n1 · the fixed print boxed · 2 · the two halves · 3 · the numbers\nREF · Fig. 7b · Tables I, III, V",
	draw(k) {
		const sag = (x) => 290 + 50 * (1 - ((x - 960) / 900) ** 2)
		const line = []
		for (let x = 40; x <= 1880; x += 80) line.push([x, sag(x)])
		k.pen(line, { color: 'grey', size: 'm', wob: 1 })
		const V = [['bug', 'the bug'], ['p1', 'a wrong fix'], ['p2', 'fixed']]
		const W = 420, Hh = 230, S = 1.05, cw = 24 * S * 0.6
		V.forEach(([v, cap], i) => {
			const cx = 440 + i * 520, x = cx - W / 2, y = sag(cx) + 20
			k.box(x, y, W, Hh, { color: 'white', fill: 'solid', size: 's', id: 'print-' + v })
			k.box(cx - 10, y - 38, 20, 58, { color: 'grey', fill: 'solid', dash: 'solid', size: 's' })
			const hl = v !== 'p1'
			const col = (c) => (hl ? c : 'black')
			const tx = x + 40, ty = y + 40, lh = 50
			const t = (col0, row, s, c) => k.text(tx + col0 * cw, ty + row * lh, s, { font: 'mono', size: 'm', scale: S, color: c })
			t(0, 0, 'hello', col('blue')); t(5, 0, ':', col('grey'))
			t(2, 1, '-', col('grey')); t(4, 1, '"world"', v === 'bug' ? 'black' : col('green')); t(12, 1, '# test', col('grey'))
			t(2, 2, '-', col('grey')); t(4, 2, '"world"', col('green'))
			k.text(x, y + Hh + 16, cap, { size: 'm', scale: 1.2, color: v === 'p2' ? 'green' : 'grey', w: W, align: 'middle' })
			if (v === 'p2') k.box(x - 22, y - 20, W + 44, Hh + 100, { color: 'red', size: 'l', rot: -1, beat: 1, anim: 'wipe' })
		})
		k.text(120, 740, 'read the picture as code  ·  read the code as a picture', { size: 'xl', scale: 1.0, w: 1680, align: 'middle', beat: 2 })
		k.text(120, 860, '157/517 (GPT-4o, $0.29/issue)   ·   +21 over its own agentless core   ·   175 with o4-mini', { size: 'm', scale: 1.2, color: 'grey', w: 1680, align: 'middle', beat: 3, anim: 'fade' })
	},
}
