// Step 2's output as a handwritten sum: description + screenshot + repro code = Issue Report+.
const Y = 320 // top of the doodles
const H = 250

export default {
	name: 'Issue Report+',
	kicker: 'II · the method · ❷ repro generation',
	title: 'the report, plus',
	source: '§III-A2 · §III (Fig. 4)',
	notes: "COVER\n• Output of Image2Code: description + image + repro code = Issue Report+\n• Every later step reads Issue Report+\n• Only the JS is generated; the HTML/CSS around it is static\n• Small mismatches (button sizes, colours) are fine: what matters is the code behaviour\nCLICKS\n1 · + repro code · 2 · = Issue Report+ · 3 · the mismatch note\nREF · §III-A2 · Fig. 4",
	draw(k) {
		// description: a page of scribbled lines
		k.box(160, Y, 220, H, { fill: 'solid', color: 'white', size: 's', rot: -3 })
		for (let i = 0; i < 6; i++) {
			const y = Y + 46 + i * 32
			const w = i === 5 ? 90 : 150 + (i % 2) * 20
			const pts = []
			for (let j = 0; j <= 10; j++) pts.push([190 + (w * j) / 10, y + Math.sin(j * 1.7 + i) * 4 - (190 + (w * j) / 10 - 160) * 0.05])
			k.pen(pts, { size: 's', color: 'grey', wob: 1 })
		}
		k.text(140, Y + H + 30, 'description', { size: 'm', scale: 1.1, w: 260, align: 'middle' })

		k.text(425, Y + 80, '+', { size: 'xl', scale: 1.6 })

		// screenshot: a little window with the dialog over the calendar
		k.box(520, Y, 300, H, { fill: 'solid', color: 'white', size: 's', rot: 2 })
		k.pen([[522, Y + 36], [818, Y + 44]], { size: 's', color: 'grey' })
		;[0, 1, 2].forEach((i) => k.circle(542 + i * 18, Y + 20 + i * 0.6, 5, { fill: 'solid', color: 'grey', size: 's' }))
		k.box(650, Y + 120, 130, 110, { fill: 'semi', color: 'grey', size: 's', rot: 2 })
		k.box(560, Y + 70, 190, 100, { fill: 'solid', color: 'white', size: 's', rot: 2 })
		k.box(690, Y + 136, 44, 20, { fill: 'semi', size: 's', rot: 2 })
		k.text(505, Y + H + 30, 'screenshot', { size: 'm', scale: 1.1, w: 330, align: 'middle' })

		// click 1: + repro code
		k.text(865, Y + 80, '+', { size: 'xl', scale: 1.6, beat: 1, anim: 'pop' })
		k.box(960, Y, 260, H, { fill: 'solid', color: 'white', size: 's', rot: -2, beat: 1, anim: 'drop' })
		k.text(990, Y + 30, '{ Button,\n  Dialog,\n  DatePicker }', { font: 'mono', size: 's', scale: 1.05, color: 'blue', rot: -2, beat: 1, anim: 'drop' })
		k.text(990, Y + 150, '</>', { font: 'mono', size: 'l', color: 'grey', rot: -2, beat: 1, anim: 'drop' })
		k.text(930, Y + H + 30, 'repro code', { size: 'm', scale: 1.1, color: 'red', w: 320, align: 'middle', beat: 1, anim: 'fade' })
		k.text(930, Y + H + 76, '(JS only)', { size: 's', scale: 1.1, color: 'grey', w: 320, align: 'middle', beat: 1, anim: 'fade' })

		// click 2: = Issue Report+
		k.text(1270, Y + 80, '=', { size: 'xl', scale: 1.6, beat: 2, anim: 'pop' })
		k.text(1370, Y + 70, 'Issue\nReport+', { size: 'xl', scale: 1.6, beat: 2, anim: 'pop', id: 'plus' })
		k.underline(1370, Y + 240, 400, { beat: 2, anim: 'wipe' })

		// click 3: it needn't be pixel-perfect
		k.text(160, 790, 'small mismatches are fine (button sizes, highlight colours):\nit’s the code behaviour that matters', { size: 'm', scale: 1.2, color: 'grey', beat: 3, anim: 'fade', rot: -1 })
	},
}
