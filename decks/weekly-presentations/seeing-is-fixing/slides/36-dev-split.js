// Table IV: SWE-bench M dev (102 tasks, five other repositories) as a pencil tally.
export default {
	name: 'Dev split',
	kicker: 'IV · results · generalization',
	title: 'Five new repos, 102 tasks',
	source: 'Table IV · §V-C · SWE-bench M dev, all GPT-4o',
	notes: "COVER\n• SWE-bench M dev: 102 tasks from five other repositories, all GPT-4o\n• GUIRepair full 14 · RAG 11 · base 10 · SWE-agent M 10 · Agentless JS 1\n• Evidence it carries over to other projects (small numbers: 102 tasks)\nCLICKS\n1 · GUIRepair full's 14\nREF · Table IV · §V-C",
	draw(k) {
		const ROWS = [
			['GUIRepair full', 14, { color: 'red', beat: 1 }],
			['RAG', 11, {}],
			['GUIRepair base', 10, {}],
			['SWE-agent Multimodal', 10, {}],
			['Agentless JS', 1, {}],
		]
		const X = 720, TOP = 270, P = 136, H = 84, DX = 26, GROUP = 60
		ROWS.forEach(([name, n, o], r) => {
			const y = TOP + r * P
			const c = o.color ?? 'black'
			const vis = o.beat ? { beat: o.beat, anim: 'fade' } : {}
			k.text(120, y + 18, name, { size: 'm', scale: 1.35, color: c, ...vis })
			let x = X
			for (let i = 0; i < n; i++) {
				const g = Math.floor(i / 5), j = i % 5
				const sx = X + g * (4 * DX + GROUP) + (j < 4 ? j * DX : 0)
				const tilt = (k.rand() - 0.5) * 8
				const pen = o.beat ? { beat: o.beat, anim: 'wipe' } : {}
				if (j < 4) k.pen([[sx + tilt, y], [sx + tilt / 2, y + H / 2], [sx, y + H]], { color: c, size: 'm', wob: 2, ...pen })
				else k.pen([[sx - 16, y + H - 10], [sx + 2 * DX, y + H / 2 + 4], [sx + 4 * DX, y + 10]], { color: c, size: 'm', wob: 2, ...pen })
				x = Math.max(x, sx + (j < 4 ? 0 : 3 * DX))
			}
			k.text(x + 50, y + 8, String(n), { size: 'xl', scale: 1.1, color: c, ...vis })
		})
		k.text(1300, 720, 'one stroke = one task resolved, of 102', { size: 's', scale: 1.25, color: 'grey', rot: -3 })
	},
}
