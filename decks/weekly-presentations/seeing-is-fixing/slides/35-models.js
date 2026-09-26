// Table V: the same pipeline on three base models, base → full, against Globant's 153.
export default {
	name: 'Other models',
	kicker: 'IV · results · generalization',
	title: 'Better eyes, same darkroom',
	source: 'Table V · §V-C · SWE-bench M test, resolved of 517',
	notes: "COVER\n• Same pipeline, three base models (base → full)\n• GPT-4o 136 → 157 · GPT-4.1 148 → 161 · o4-mini 160 → 175\n• 175 with o4-mini = 22 more than Globant; benefits from stronger reasoning\nCLICKS\n1 · GPT-4.1 · 2 · o4-mini · 3 · the 175 circled\nREF · Table V · §V-C",
	draw(k) {
		const Y0 = 860, S = 3.0, BW = 120, GAP = 22
		const M = [
			['GPT-4o', 136, 157, 0],
			['GPT-4.1', 148, 161, 1],
			['o4-mini', 160, 175, 2],
		]
		k.pen([[170, Y0 + 3], [800, Y0 + 5], [1420, Y0 + 2]], { color: 'grey', size: 's', wob: 1 })
		M.forEach(([name, base, full, beat], i) => {
			const x = 250 + i * 400
			const o = beat ? { beat, anim: 'fade' } : {}
			const bar = (dx, v, color, id) => k.box(x + dx, Y0 - v * S, BW, v * S, { fill: 'pattern', color, size: 'm', id, ...(beat ? { beat, anim: 'wipe' } : {}) })
			bar(0, base, 'grey', `b${i}`)
			bar(BW + GAP, full, 'black', `f${i}`)
			k.text(x - 10, Y0 - base * S - 58, String(base), { size: 'l', scale: 1.05, color: 'grey', align: 'middle', w: BW + 20, ...o })
			k.text(x + BW + GAP - 10, Y0 - full * S - 58, String(full), { size: 'l', scale: 1.05, align: 'middle', w: BW + 20, ...o })
			k.text(x, Y0 + 14, 'base', { size: 's', scale: 1.05, color: 'grey', align: 'middle', w: BW, ...o })
			k.text(x + BW + GAP, Y0 + 14, 'full', { size: 's', scale: 1.05, color: 'grey', align: 'middle', w: BW, ...o })
			k.text(x - 40, Y0 + 52, name, { size: 'm', scale: 1.3, align: 'middle', w: 2 * BW + GAP + 80, ...o })
		})

		// Globant's 153.
		const gy = Y0 - 153 * S
		k.arrow([180, gy], [1400, gy], { dash: 'dashed', head: 'none', color: 'grey', size: 's', anim: 'none' })
		k.text(1420, gy - 22, 'Globant · 153', { size: 's', scale: 1.2, color: 'grey' })

		// Click 3: the o4-mini bar, circled, and one line.
		const fx = 250 + 2 * 400 + BW + GAP + BW / 2
		k.loop(fx, Y0 - 175 * S - 26, 70, 46, { beat: 3, anim: 'wipe' })
		k.text(1460, 540, '175 with o4-mini:', { size: 'l', scale: 1.1, color: 'red', beat: 3, rot: -2 })
		k.text(1460, 610, '22 more than the best commercial system', { size: 'm', scale: 1.2, color: 'red', beat: 3, rot: -2, w: 400 })
	},
}
