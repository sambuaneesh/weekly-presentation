// Thank you: lights on, questions.
export default {
	name: 'Thank you',
	notes: 'COVER\n• Thank the room\n• Invite questions\nCLICKS\n1 · "questions?"',
	draw(k) {
		k.text(160, 380, 'Thank you', { size: 'xl', scale: 3 })
		k.underline(170, 610, 760, { color: 'red' })
		k.text(166, 670, {{PRESENTER_JSON}}, { size: 'l', scale: 1.05 })
		k.text(166, 830, 'questions?', { size: 'xl', scale: 1.4, color: 'red', rot: -3, beat: 1, anim: 'wiggle' })
	},
}
