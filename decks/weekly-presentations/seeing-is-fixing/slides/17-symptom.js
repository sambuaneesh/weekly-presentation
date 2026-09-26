// Step 2's example: next-1509, redrawn by hand from Fig. 6a. The date picker's calendar opens under the dialog.
const WIN = { x: 250, y: 250, w: 1110, h: 580 }
const CAL = { x: 900, y: 452, w: 392, h: 358 }
const DLG = { x: 380, y: 322, w: 760, h: 238 }
const DAYS = [
	[27, 28, 29, 30, 1, 2, 3],
	[4, 5, 6, 7, 8, 9, 10],
	[11, 12, 13, 14, 15, 16, 17],
	[18, 19, 20, 21, 22, 23, 24],
	[25, 26, 27, 28, 29, 30, 31],
	[1, 2, 3, 4, 5, 6, 7],
]

export default {
	name: 'Symptom',
	kicker: 'II · the method · ❷ repro generation',
	title: 'next-1509, as the reporter saw it',
	source: 'next-1509 · redrawn from Fig. 6a · §III-A2',
	notes: "COVER\n• Step 2, repro generation, shown on next-1509\n• Issue: \"The popupContainer configuration on ConfigProvider does not take effect on Dialog\"\n• Symptom: the calendar opens beneath the dialog, so it can't be used\nCLICKS\n1 · the hidden calendar outlined\nREF · §III-A2 · Fig. 6a · [43]",
	draw(k) {
		// the browser window
		k.box(WIN.x, WIN.y, WIN.w, WIN.h, { fill: 'solid', color: 'white', size: 's' })
		k.box(WIN.x, WIN.y, WIN.w, 50, { fill: 'semi', color: 'grey', size: 's' })
		;[0, 1, 2].forEach((i) => k.circle(WIN.x + 34 + i * 30, WIN.y + 25, 8, { fill: 'solid', color: ['red', 'yellow', 'green'][i], size: 's' }))
		// the dimmed page behind the modal
		k.box(WIN.x + 4, WIN.y + 54, WIN.w - 8, WIN.h - 58, { fill: 'fill', color: 'grey', size: 's', dash: 'dotted', opacity: 0.45 })

		// the calendar (drawn first: it ends up underneath)
		k.box(CAL.x, CAL.y, CAL.w, CAL.h, { fill: 'solid', color: 'white', size: 's' })
		k.box(CAL.x + 6, CAL.y + 6, CAL.w - 12, 42, { size: 's', color: 'grey' })
		k.box(CAL.x, CAL.y + 58, CAL.w, 42, { fill: 'semi', color: 'grey', size: 's' })
		k.text(CAL.x + 262, CAL.y + 66, 'Fri    Sat', { size: 's', scale: 1, color: 'grey' })
		k.text(CAL.x + CAL.w - 40, CAL.y + 64, '≡', { size: 's', scale: 1.2, color: 'grey' })
		DAYS.forEach((row, r) =>
			row.forEach((d, c) => {
				const dim = (r === 0 && c < 4) || r === 5 || (r === 4 && c === 6)
				k.text(CAL.x + 22 + c * 52, CAL.y + 116 + r * 38, String(d), { size: 's', scale: 0.95, color: dim ? 'grey' : 'black', w: 34, align: 'middle' })
			}),
		)

		// the dialog, on top of it
		k.box(DLG.x, DLG.y, DLG.w, DLG.h, { fill: 'solid', color: 'white', size: 'm', id: 'dialog' })
		k.text(DLG.x + 30, DLG.y + 22, 'Welcome to Alibaba.com', { size: 's', scale: 1.15 })
		k.text(DLG.x + DLG.w - 50, DLG.y + 16, '×', { size: 'm', color: 'grey' })
		k.text(DLG.x + 30, DLG.y + 100, 'Start your business here by searching a popular product', { size: 's', scale: 0.8, color: 'grey', w: 340 })
		k.box(DLG.x + 400, DLG.y + 92, 330, 44, { size: 's', color: 'grey', text: 'Please select the data', labelColor: 'grey', align: 'start', scale: 0.85 })
		k.box(DLG.x + DLG.w - 200, DLG.y + 172, 76, 40, { fill: 'semi', size: 's', text: 'YES', scale: 0.9 })
		k.box(DLG.x + DLG.w - 108, DLG.y + 172, 76, 40, { size: 's', text: 'NO', scale: 0.9 })

		// click: where the calendar really is
		k.box(CAL.x - 6, CAL.y - 6, CAL.w + 12, CAL.h + 12, { dash: 'dashed', color: 'red', size: 'm', beat: 1, anim: 'wipe', id: 'ghost' })
		k.text(1440, 360, 'the calendar opens\nbeneath the dialog', { size: 'l', scale: 1.05, color: 'red', rot: -3, beat: 1, anim: 'fade', id: 'says' })
		k.arrow([1520, 480], [1300, 560], { color: 'red', bend: -30, size: 'm', beat: 1 })
		k.text(1440, 640, '…so it can’t be used', { size: 's', scale: 1.2, color: 'grey', rot: -3, beat: 1, anim: 'fade' })
	},
}
