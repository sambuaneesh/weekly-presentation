// Epigraph: one handwritten line, and a tiny developing tray doodled in the corner.
export default {
	name: 'Epigraph',
	notes: "COVER\n• The metaphor, not a claim from the paper\n• A print develops (appears), but only the fixer makes it stay\n• In the paper's terms: a patch isn't done when it's generated, only when it's seen to work\nCLICKS\n1 · \"It's done when it's fixed.\"\nREF · §III-D (render each candidate and look)",
	draw(k) {
		k.text(240, 380, 'In a darkroom, a picture isn\'t done when it appears.', { size: 'xl', scale: 1.3 })
		k.text(240, 520, 'It\'s done when it\'s', { size: 'xl', scale: 1.3, beat: 1, anim: 'fade' })
		k.text(830, 520, 'fixed.', { size: 'xl', scale: 1.3, color: 'red', beat: 1, anim: 'fade' })
		k.underline(834, 610, 170, { beat: 1, anim: 'wipe' })

		// a developing tray: a print half under the liquid, tongs, and the red safelight overhead
		const x = 1330, y = 840
		k.box(x + 90, y - 80, 120, 90, { rot: -16, size: 's', fill: 'solid', color: 'grey' })
		k.box(x, y, 300, 70, { size: 'm', fill: 'solid', color: 'grey' })
		k.pen([[x + 12, y + 22], [x + 60, y + 16], [x + 110, y + 26], [x + 160, y + 16], [x + 210, y + 26], [x + 288, y + 20]], { wob: 1, size: 's', color: 'black' })
		k.pen([[x + 250, y - 150], [x + 175, y - 50]], { size: 's' })
		k.pen([[x + 272, y - 142], [x + 190, y - 42]], { size: 's' })
		k.pen([[x + 360, y - 300], [x + 360, y - 190]], { size: 's', color: 'grey' })
		k.box(x + 335, y - 195, 50, 30, { geo: 'oval', color: 'red', fill: 'fill', size: 's' })
		k.text(x + 400, y - 196, 'safelight', { size: 's', color: 'grey' })
	},
}
