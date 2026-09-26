// Cost per issue as two stacks of coins: GUIRepair vs SWE-agent Multimodal, same base model (Table I).
export default {
	name: 'Cost',
	kicker: 'IV · results · cost',
	title: 'What a fix costs',
	source: 'Table I · average cost per issue, GPT-4o · one coin ≈ 10¢ (rounded)',
	notes: "COVER\n• GUIRepair: $0.29 per issue, agentless cost advantage\n• SWE-agent Multimodal (same GPT-4o): $2.94 for 63 resolved\n• SWE-agent rows range $0.99–$3.11; closed systems report no cost\nCLICKS\n1 · the SWE-agent stack\nREF · Table I · §V-A (coins rounded to 10¢)",
	draw(k) {
		const BASE = 880, CW = 190, CH = 44, PITCH = 17
		const stack = (cx, n, o = {}) => {
			for (let i = 0; i < n; i++) {
				const x = cx - CW / 2 + (k.rand() - 0.5) * 10
				k.box(x, BASE - CH - i * PITCH, CW, CH, { geo: 'ellipse', fill: 'solid', color: o.color ?? 'black', size: 's', beat: o.beat, anim: o.beat ? 'drop' : undefined })
			}
		}
		k.pen([[160, BASE + 4], [900, BASE + 6], [1760, BASE + 3]], { color: 'grey', size: 's', wob: 1 })

		// GUIRepair: 3 coins.
		const gx = 520
		stack(gx, 3, { color: 'red' })
		k.text(gx - 300, BASE - 250, '$0.29', { size: 'xl', scale: 2.2, color: 'red', align: 'middle', w: 600, rot: -3 })
		k.text(gx - 300, BASE - 120, 'per issue', { size: 'm', scale: 1.3, color: 'red', align: 'middle', w: 600 })
		k.text(gx - 250, BASE + 20, 'GUIRepair · 157 fixed', { size: 'm', scale: 1.2, align: 'middle', w: 500 })

		// SWE-agent Multimodal: 29 coins.
		const sx = 1300
		stack(sx, 29, { beat: 1 })
		k.text(sx + 120, BASE - 29 * PITCH - 100, '$2.94', { size: 'xl', scale: 1.5, beat: 1, anim: 'fade' })
		k.text(sx - 300, BASE + 20, 'SWE-agent Multimodal · 63 fixed', { size: 'm', scale: 1.2, align: 'middle', w: 600, beat: 1, anim: 'fade' })
		k.text(sx - 300, BASE + 62, 'same model, GPT-4o', { size: 's', scale: 1.1, color: 'grey', align: 'middle', w: 600, beat: 1, anim: 'fade' })
	},
}
