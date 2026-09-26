// Table I as a handwritten list with hatched bars; GUIRepair is drawn last and passes the dashed Globant line.
export default {
	name: 'Leaderboard',
	kicker: 'IV · results',
	title: 'Against the leaderboard',
	source: 'top of Table I · SWE-bench M test, resolved of 517 · May 2025',
	notes: "COVER\n• Top of Table I (SWE-bench M test, May 2025) + SWE-agent Multimodal for reference\n• GUIRepair (GPT-4o) 157 = 30.37%\n• +4 over Globant (153, best commercial), +17 over Zencoder, +26 over Agentless Lite (best open source)\n• Closed systems don't report model or cost: not like for like\nCLICKS\n1 · GUIRepair's bar · 2 · \"+4 over the best commercial system\"\nREF · Table I · §V-A",
	draw(k) {
		const ROWS = [
			['Globant Code Fixer Agent', 'closed source', 153],
			['Zencoder', 'closed source', 140],
			['Agentless Lite', 'Claude 3.5', 131],
			['Agentless Lite', 'GPT-4o', 127],
			['Computer-Use Agents', 'GPT-4o', 104],
			['SWE-agent Multimodal', 'GPT-4o', 63],
		]
		const X0 = 660, U = 6.3, BH = 46, TOP = 262, P = 88
		const row = (i, name, sub, n, o = {}) => {
			const y = TOP + i * P
			const c = o.color ?? 'black'
			k.text(120, y - 4, name, { size: 'm', scale: 1.3, color: c, beat: o.beat, anim: 'fade' })
			k.text(122, y + 36, sub, { size: 's', scale: 1.05, color: 'grey', beat: o.beat, anim: 'fade' })
			k.box(X0, y, Math.round(n * U), BH, { fill: 'pattern', color: c, size: o.bold ? 'l' : 'm', beat: o.beat, anim: o.beat ? 'wipe' : undefined, id: o.id })
			k.text(X0 + Math.round(n * U) + 18, y + 2, String(n), { size: 'l', scale: 1.05, color: c, beat: o.beat, anim: 'fade' })
		}
		ROWS.forEach(([name, sub, n], i) => row(i, name, sub, n))
		row(ROWS.length, 'GUIRepair', 'GPT-4o', 157, { color: 'red', beat: 1, bold: true, id: 'ours' })

		// Globant's 153, dashed, top to bottom.
		const gx = X0 + 153 * U
		k.arrow([gx, TOP - 44], [gx, TOP + (ROWS.length + 1) * P - 30], { dash: 'dashed', head: 'none', color: 'grey', size: 's', anim: 'none' })
		k.text(gx - 150, TOP - 86, 'best commercial · 153', { size: 's', scale: 1.1, color: 'grey', align: 'middle', w: 300 })

		// Click 2: the overtaking, circled.
		const oy = TOP + ROWS.length * P + BH / 2
		k.loop(gx + 6, oy, 34, 46, { beat: 2, anim: 'wipe' })
		k.text(gx - 620, oy + 58, '+4 over the best commercial system', { size: 'm', scale: 1.15, color: 'red', beat: 2, rot: -1.5, align: 'end', w: 660 })
	},
}
