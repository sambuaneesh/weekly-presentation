// The judge: survivors of the pixel filter, looked at one by one; red crosses, then a red box on the first yes.
// Frame numbers follow the old contact sheet (schematic); stopping at frame 08 echoes next-4182 (Patch 8).
const BARS = [[0.7, 0.5, 0.6], [0.4, 0.65, 0.8], [0.55, 0.55, 0.55], [0.3, 0.3, 0.9], [0.8, 0.35, 0.5], [0.6, 0.7, 0.3], [0.45, 0.8, 0.4], [0.65, 0.4, 0.75]]
function print(k, x, y, w, h, bars, o = {}) {
	k.box(x, y, w, h, { fill: 'semi', color: o.color ?? 'black', size: 's', dash: o.dash ?? 'draw' })
	const bw = w * 0.16
	bars.forEach((v, i) => {
		const bh = (h - 34) * v
		k.box(x + w * 0.16 + i * bw * 1.45, y + h - 16 - bh, bw, bh, { fill: 'solid', color: 'grey', size: 's', dash: 'draw' })
	})
}
export default {
	name: 'The judge',
	kicker: 'III · Code2Image · step 7',
	title: 'Stops at the first yes',
	source: '§III-D2 · §IV-D · schematic (frame numbers illustrative)',
	notes: "COVER\n• Survivors go to the LLM one at a time, judged against the issue\n• First \"yes\" → stop; only that Top-1 patch is submitted\n• The rest are never looked at\nCLICKS\n1–3 · crosses · 4 · the box on frame 08 (echoes next-4182's Patch 8)\nREF · §III-D2 · §IV-D (frame numbers illustrative)",
	draw(k) {
		const nums = ['01', '03', '04', '07', '08', '09', '11', '12']
		const PW = 170, PH = 128, X0 = 150, PITCH = 212, Y = 470
		const beatOf = [1, 2, 2, 3]
		nums.forEach((n, i) => {
			const x = X0 + i * PITCH
			const after = i > 4
			print(k, x, Y, PW, PH, BARS[i], { color: after ? 'grey' : 'black', dash: after ? 'dashed' : 'draw' })
			k.text(x + 4, Y + PH + 12, n, { font: 'mono', size: 'm', color: i === 4 ? 'red' : 'grey' })
			if (i < 4) k.cross(x + PW / 2 - 34, Y + PH / 2 - 34, 68, { beat: beatOf[i], anim: 'wipe' })
		})
		// the first yes
		const px = X0 + 4 * PITCH
		k.box(px - 16, Y - 16, PW + 32, PH + 32, { color: 'red', size: 'l', dash: 'draw', beat: 4, anim: 'wipe' })
		k.text(px - 10, Y - 90, 'yes. stop.', { size: 'l', color: 'red', rot: -3, beat: 4 })
		k.text(X0 + 5 * PITCH, Y + PH + 60, 'never looked at', { size: 'm', color: 'grey', rot: 1 })

		// the judge: a doodled eye above the row, looking along it
		k.pen([[150, 330], [190, 300], [240, 294], [290, 305], [320, 330], [290, 356], [240, 364], [190, 358], [150, 330]], { wob: 2, size: 'm' })
		k.circle(236, 330, 17, { fill: 'solid', color: 'black', size: 's' })
		k.arrow([350, 330], [900, 330], { dash: 'dotted', color: 'grey', bend: -20 })
		k.text(370, 250, 'one at a time, with the issue in mind', { size: 'm', color: 'grey' })

		k.text(150, 800, 'only the Top-1 is submitted', { size: 'xl', beat: 4, anim: 'fade' })
		k.underline(150, 870, 560, { beat: 4, anim: 'wipe' })
	},
}
