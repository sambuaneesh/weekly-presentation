// One number: 80% of visual symptoms can't be fully put into words.
export default {
	name: '80%',
	kicker: 'I · the problem',
	source: 'SWE-bench M study [22], cited in §II-A',
	notes: "COVER\n• 80% of visual symptoms can't be fully described in text\n• That's the previous two slides in general\nCLICKS\n1 · underline \"in text\"\nREF · SWE-bench M study [22], cited in §II-A",
	draw(k) {
		k.text(240, 250, '80%', { size: 'xl', scale: 7.5, rot: -2 })
		k.text(260, 700, 'of visual symptoms can\'t be fully described', { size: 'xl', scale: 1.25 })
		k.text(260, 800, 'in text', { size: 'xl', scale: 1.25, color: 'red' })
		k.underline(262, 890, 200, { beat: 1, anim: 'wipe' })
	},
}
