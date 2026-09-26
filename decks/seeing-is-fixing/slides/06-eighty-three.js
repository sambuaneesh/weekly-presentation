// One number: in 83.5% of cases the image is essential to solving the issue.
export default {
	name: '83.5%',
	kicker: 'I · the problem',
	source: 'SWE-bench M study [22], cited in §II-A',
	notes: "COVER\n• In 83.5% of cases the image is essential to solving the issue\n• The picture carries information the fix depends on; it isn't decoration\nCLICKS\n1 · the print gets circled\nREF · [22], cited in §II-A",
	draw(k) {
		k.text(240, 250, '83.5%', { size: 'xl', scale: 7.5, rot: -2 })
		k.text(260, 700, 'of cases: the image is essential to solving it', { size: 'xl', scale: 1.25 })
		// a little print, doodled: mountains and a sun
		const x = 1440, y = 330
		k.box(x, y, 300, 220, { fill: 'solid', color: 'grey', size: 's', rot: 5, id: 'print' })
		k.pen([[x + 20, y + 190], [x + 100, y + 90], [x + 150, y + 150], [x + 200, y + 100], [x + 270, y + 200]], { wob: 1.5, size: 's' })
		k.circle(x + 220, y + 60, 22, { size: 's' })
		k.loop(x + 150, y + 125, 210, 160, { beat: 1, anim: 'wipe' })
	},
}
