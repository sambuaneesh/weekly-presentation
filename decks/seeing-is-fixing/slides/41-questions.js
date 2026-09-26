// Our questions for the room, as three sticky notes.
export default {
	name: 'Questions',
	kicker: 'V · for discussion',
	title: 'Questions for the room',
	notes: "COVER (ours, not the paper's)\n• 83% of reports have no repro code: how faithful is a generated one, and how would we know?\n• eslint-15243 isn't visual: what does Code2Image see?\n• Carbon 12/134: why is a design system hard to fix by eye?\nCLICKS\n1–3 · one question each\nREF · §I · Fig. 9 · Table II",
	draw(k) {
		k.text(1330, 110, 'ours, not the paper\'s', { size: 'l', scale: 1.1, color: 'red', rot: -3 })
		k.underline(1335, 172, 390, { size: 'm' })
		const Q = [
			'83% of reports carry no repro code.\nHow faithful is a generated one?',
			'eslint-15243 isn\'t visual.\nWhat does Code2Image see?',
			'Carbon: 12 of 134.\nWhy is a design system hard to fix by eye?',
		]
		const rot = [-3, 2, -1.5]
		Q.forEach((q, i) => k.note(170 + i * 560, 360 + (i % 2) * 40, q, { scale: 2.2, size: 's', rot: rot[i], beat: i + 1, anim: 'drop', color: i === 1 ? 'light-violet' : 'yellow' }))
	},
}
