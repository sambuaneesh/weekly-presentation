// Step 5, sampling: one greedy patch, then 39 sampled ones fanned out like a hand of cards.
export default {
	name: 'Forty',
	kicker: 'II · the method · step 5',
	title: 'Not one patch: a handful',
	source: '§III-C · §IV-D',
	notes: "COVER\n• 1 greedy patch (temperature 0) + 39 sampled (temperature 1)\n• At most 40 candidates\n• Validation has to pick one: only the Top-1 is submitted\nCLICKS\n1 · the 39 fan out · 2 · \"= at most 40\"\nREF · §IV-D",
	draw(k) {
		// the greedy card
		k.box(230, 400, 190, 260, { fill: 'solid', color: 'black', size: 's', rot: -3 })
		k.text(275, 460, '1', { size: 'xl', scale: 2, rot: -3 })
		k.text(200, 690, '1 greedy (T = 0)', { size: 'l', scale: 1.05 })
		// the hand of 39
		const P = [1300, 900], R = 300, W = 130, H = 230, N = 39
		for (let i = 0; i < N; i++) {
			const deg = -60 + (120 * i) / (N - 1) + (k.rand() - 0.5) * 2
			const a = (deg * Math.PI) / 180
			const cx = P[0] + R * Math.sin(a)
			const cy = P[1] - R * Math.cos(a)
			const x = cx - (W / 2) * Math.cos(a) + (H / 2) * Math.sin(a)
			const y = cy - (W / 2) * Math.sin(a) - (H / 2) * Math.cos(a)
			k.box(x, y, W, H, { fill: 'solid', color: 'black', size: 's', rot: deg, beat: 1, anim: 'drop' })
		}
		k.text(1110, 860, '+ 39 sampled (T = 1)', { size: 'l', scale: 1.05, beat: 1, anim: 'wipe' })
		k.text(640, 900, '= at most 40', { size: 'xl', scale: 1.2, color: 'red', beat: 2, anim: 'wipe', rot: -2 })
	},
}
