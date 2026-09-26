// The pixel filter as a sieve: prints that differ from the bug stay on the mesh; identical ones fall through.
// Each print is a tiny bar doodle; identical = the bug's bars exactly (schematic).
const BUGBARS = [0.55, 0.3, 0.8]
const VARIANTS = [[0.55, 0.3, 0.8], [0.7, 0.5, 0.6], [0.4, 0.65, 0.8], [0.55, 0.55, 0.55], [0.3, 0.3, 0.9], [0.8, 0.35, 0.5], [0.6, 0.7, 0.3]]
// resample a polyline densely so the pen follows it (instead of smoothing across corners)
function dense(pts, step = 24) {
	const out = []
	for (let i = 0; i < pts.length - 1; i++) {
		const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
		const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step))
		for (let j = 0; j < n; j++) out.push([x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n])
	}
	out.push(pts[pts.length - 1])
	return out
}
function print(k, x, y, w, h, bars, o = {}) {
	k.box(x, y, w, h, { fill: 'semi', color: o.color ?? 'black', size: 's', rot: o.rot, beat: o.beat, anim: o.anim })
	const bw = w * 0.16
	const a = ((o.rot ?? 0) * Math.PI) / 180
	bars.forEach((v, i) => {
		const bh = (h - 30) * v
		const dx = w * 0.16 + i * bw * 1.45, dy = h - 14 - bh
		// rotate the bar's corner about the print's corner, so the doodle turns with its print
		k.box(x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a), bw, bh, { fill: 'solid', color: o.barColor ?? 'grey', size: 's', dash: 'draw', rot: o.rot, beat: o.beat, anim: o.anim })
	})
}
export default {
	name: 'Pixel filter',
	kicker: 'III · Code2Image · step 7',
	title: 'Same pixels? Out.',
	source: '§III-D2 · schematic (which prints fall is illustrative)',
	notes: "COVER\n• Step 7 starts with a pixel comparison against the bug image\n• No visual change → the patch is ineffective → filtered out\n• The filter can't tell good changes from bad ones (next slide)\nCLICKS\n1 · changed prints stay on the sieve · 2 · identical ones fall through\nREF · §III-D2 (schematic)",
	draw(k) {
		// the bug image, pinned on the left
		print(k, 150, 330, 260, 190, BUGBARS, { rot: -2 })
		k.circle(278, 330, 11, { fill: 'fill', color: 'red', size: 's' })
		k.text(150, 545, 'the bug image', { size: 'l', rot: -2 })
		k.text(150, 600, 'every print is compared\nto it, pixel by pixel', { size: 'm', color: 'grey' })

		// the sieve: a wobbly mesh line with little holes, and a hatch below it
		const SY = 610, SX0 = 560, SX1 = 1800
		for (let x = SX0; x < SX1; x += 60) k.pen([[x, SY], [x + 30, SY + 1], [x + 46, SY]], { size: 'l', wob: 1 })
		for (let x = SX0 + 10; x < SX1; x += 40) k.pen([[x, SY + 6], [x + 14, SY + 26]], { size: 's', color: 'grey', wob: 1 })
		k.text(SX1 - 70, SY + 36, 'sieve', { size: 's', color: 'grey' })

		// the candidates: 1 = same pixels as the bug (falls), 0 = changed (stays)
		const same = [0, 1, 0, 0, 1, 0, 1, 0, 0]
		const PW = 118, PH = 90, PITCH = 136
		let v = 1
		same.forEach((s, i) => {
			const x = SX0 + 10 + i * PITCH
			if (!s) print(k, x, SY - PH - 4, PW, PH, VARIANTS[v++ % VARIANTS.length], { beat: 1, anim: 'drop' })
			else {
				// fallen through: tumbled below the sieve, grey, with an = sign
				const rot = [14, -11, 8][(i * 7) % 3]
				print(k, x + 4, SY + 165, PW, PH, BUGBARS, { beat: 2, anim: 'drop', rot, color: 'grey', barColor: 'grey' })
				k.text(x + 44, SY + 70, '=', { size: 'xl', color: 'red', beat: 2, anim: 'pop' })
			}
		})
		// the tray
		k.pen(dense([[SX0 - 10, SY + 140], [SX0 - 2, SY + 270], [SX0 + 30, SY + 300], [SX1 - 30, SY + 300], [SX1 - 4, SY + 270], [SX1, SY + 140]]), { size: 'm', color: 'grey', wob: 1, beat: 2, anim: 'wipe' })
		k.text(SX0 + 20, SY + 318, 'no pixel change → out', { size: 'l', color: 'red', beat: 2, rot: -1 })
	},
}
