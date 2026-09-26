// The seven steps as a row of circles; a doodled hand reaches into step 6.
export default {
	name: 'By hand',
	kicker: 'V · honest light',
	title: 'The hand in the darkroom',
	source: '§III-D1',
	notes: "COVER\n• What's still manual: step 6's environments\n• Automating dependency setup is error-prone for LLMs, so the authors did it by hand (following SWE-bench M)\n• Install deps per contributor guide · build and import the package into the repro HTML · small path fixes\nCLICKS\n1 · the hand · 2 · the list · 3 · \"a practical compromise\"\nREF · §III-D1",
	draw(k) {
		const cy = 560, r = 52
		for (let i = 1; i <= 7; i++) {
			const cx = 300 + (i - 1) * 200
			k.circle(cx, cy, r, { text: String(i), size: 'm', color: i === 6 ? 'red' : 'black', fill: i === 6 ? 'semi' : 'none', scale: 1.3, id: 's' + i })
			if (i < 7) k.pen([[cx + r + 14, cy], [cx + 200 - r - 14, cy]], { color: 'grey', size: 's', wob: 1.5 })
		}
		k.text(1300 - 110, cy + 66, 'GUI rendering', { size: 'm', color: 'red', w: 220, align: 'middle' })
		// a hand pointing down into circle 6
		const hx = 1300
		const H = [
			[-50, 0], [-52, 50], [-55, 100], [-48, 130], [-36, 142], [-22, 136], [-14, 138], [-12, 175], [-10, 205], [-5, 214], [3, 215], [9, 208], [10, 175], [11, 140],
			[20, 148], [32, 146], [40, 140], [50, 136], [58, 124], [60, 90], [58, 50], [52, 0],
		]
		const base = 290
		k.pen(H.map(([x, y]) => [hx + x, base + y]), { size: 'm', wob: 1.2, beat: 1, anim: 'wipe', id: 'hand' })
		k.pen([[hx - 52, base + 14], [hx + 54, base + 14]], { size: 's', wob: 1, beat: 1, anim: 'wipe' })
		k.pen([[hx + 12, base + 140], [hx + 14, base + 118]], { size: 's', wob: 0.5, beat: 1, anim: 'wipe' })
		k.pen([[hx + 32, base + 144], [hx + 34, base + 120]], { size: 's', wob: 0.5, beat: 1, anim: 'wipe' })
		k.pen([[hx - 90, base + 150], [hx - 70, base + 160]], { size: 's', color: 'red', beat: 1, anim: 'wipe' })
		k.pen([[hx + 80, base + 160], [hx + 100, base + 150]], { size: 's', color: 'red', beat: 1, anim: 'wipe' })
		k.text(300, 720, 'set up by hand, for every repository:', { size: 'l', scale: 1.05, beat: 2 })
		k.text(330, 790, '· install its dependencies, following its contributor guide\n· build it, import the package into the repro\'s HTML\n· small path fixes where the repro won\'t run', { size: 'm', scale: 1.15, color: 'grey', beat: 2, anim: 'fade' })
		k.text(1290, 820, '"a practical\n compromise"', { size: 'l', scale: 1.3, color: 'red', rot: -4, beat: 3 })
	},
}
