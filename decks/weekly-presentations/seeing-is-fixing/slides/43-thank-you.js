// Thank you: the darkroom session is over. Pull the cord, the lights come on; then questions.
export default {
	name: 'Thank you',
	notes: "COVER\n• Thank the room\n• Lights on: the darkroom session is over\n• Invite questions; point to the paper (arXiv 2506.16136)\nCLICKS\n1 · the bulb lights up · 2 · \"questions?\"",
	draw(k) {
		k.text(160, 360, 'Thank you', { size: 'xl', scale: 3 })
		k.underline(170, 590, 760, { color: 'red' })
		k.text(166, 650, 'presented by Aneesh S', { size: 'l', scale: 1.05 })
		k.text(166, 715, 'paper: Seeing is Fixing · Huang, Zhang, Xie, Chen · arXiv 2506.16136', { size: 'm', scale: 1, color: 'grey' })
		k.text(166, 850, 'questions?', { size: 'xl', scale: 1.4, color: 'red', beat: 2, anim: 'wiggle', rot: -3 })

		// a pull-cord bulb hanging from the top: off, then on
		const BX = 1460, BY = 520
		k.pen([[BX, 0], [BX + 4, 180], [BX - 2, 330]], { size: 's', color: 'grey', wob: 1 })
		k.box(BX - 34, 330, 68, 70, { color: 'grey', fill: 'pattern', size: 's' })
		k.circle(BX, BY, 125, { color: 'black', size: 'm', id: 'bulb' })
		k.circle(BX, BY, 125, { color: 'yellow', fill: 'solid', size: 's', beat: 1, anim: 'fade', id: 'bulb-on' })
		k.pen([[BX - 40, BY + 30], [BX - 20, BY - 20], [BX, BY + 20], [BX + 20, BY - 20], [BX + 40, BY + 30]], { size: 'm', wob: 1, id: 'filament' })
		// the cord you pull
		k.pen([[BX + 250, 0], [BX + 254, 380], [BX + 250, 640]], { size: 's', color: 'grey', wob: 1 })
		k.circle(BX + 250, 652, 14, { color: 'red', fill: 'solid', size: 's' })
		// rays when it comes on
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * Math.PI * 2 + 0.3
			k.pen([[BX + 160 * Math.cos(a), BY + 160 * Math.sin(a)], [BX + 215 * Math.cos(a), BY + 215 * Math.sin(a)]], { size: 'm', color: 'yellow', beat: 1, anim: 'pop', origin: [BX, BY], id: 'ray-' + i })
		}
		k.text(BX - 120, BY + 250, 'lights on.', { size: 'l', scale: 1.1, color: 'grey', beat: 1, anim: 'fade', w: 240, align: 'middle' })
	},
}
