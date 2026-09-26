// Step 6, GUI rendering: each candidate patch goes through a browser and comes out as a print.
export default {
	name: 'Render each',
	kicker: 'III · Code2Image · step 6',
	title: 'Now look at every one',
	source: '§III-D1 · §IV-D',
	notes: "COVER\n• Step 6, GUI rendering: the repro code becomes a runnable front-end project\n• For each patch: apply → rebuild → run the repro in a browser (Playwright) → capture\n• Result: one bug image + one image per patch\n• Honest footnote: environments were set up by hand\nCLICKS\n1 · the browser · 2 · the print · 3 · \"set up by hand\"\nREF · §III-D1 · §IV-D",
	draw(k) {
		// the patch card
		k.box(150, 400, 260, 320, { fill: 'solid', color: 'black', size: 's', rot: -3, id: 'card' })
		k.text(190, 430, 'patch', { size: 'm', scale: 1.2, rot: -3 })
		k.text(195, 500, '− ─────\n+ ─────\n+ ───', { size: 'm', font: 'mono', color: 'grey', rot: -3 })
		// the browser doodle
		const B = [650, 360, 600, 420]
		k.box(B[0], B[1], B[2], B[3], { fill: 'solid', color: 'black', size: 's', beat: 1, id: 'browser' })
		k.pen([[B[0], B[1] + 60], [B[0] + B[2], B[1] + 58]], { size: 'm', wob: 1.5, beat: 1, anim: 'wipe' })
		for (let i = 0; i < 3; i++) k.circle(B[0] + 30 + i * 32, B[1] + 30, 9, { size: 's', beat: 1, color: i === 0 ? 'red' : 'grey' })
		k.box(B[0] + 140, B[1] + 14, 420, 34, { size: 's', color: 'grey', beat: 1, text: 'localhost · repro', font: 'mono', labelColor: 'grey' })
		k.text(B[0] + 60, B[1] + 110, 'the repro code,\nrunning on the\npatched build', { size: 'm', scale: 1.2, color: 'grey', beat: 1, anim: 'fade' })
		k.text(B[0] + 330, B[1] + 330, 'Playwright', { size: 'm', scale: 1.1, beat: 1, anim: 'fade', rot: -3 })
		k.arrow('card', 'browser', { text: 'apply · rebuild', beat: 1, bend: -30, anim: 'fade' })
		// the print
		k.box(1450, 380, 320, 380, { fill: 'solid', color: 'black', size: 's', rot: 4, id: 'print', beat: 2, anim: 'drop' })
		k.box(1482, 410, 256, 250, { fill: 'semi', color: 'grey', rot: 4, beat: 2, anim: 'drop' })
		k.circle(1650, 470, 26, { color: 'grey', size: 's', beat: 2, anim: 'drop' })
		k.pen([[1500, 620], [1560, 540], [1610, 600], [1660, 520], [1730, 630]], { size: 'm', wob: 2, beat: 2, anim: 'wipe' })
		k.text(1500, 680, 'screenshot', { size: 'm', scale: 1.1, rot: 4, beat: 2, anim: 'fade' })
		k.arrow('browser', 'print', { text: 'capture', beat: 2, bend: -30, anim: 'fade' })
		k.text(500, 850, 'apply patch · rebuild · run the repro in a browser · capture', { size: 'm', scale: 1.25, beat: 2, anim: 'wipe' })
		k.text(150, 930, 'the environments were set up by hand (§III-D1)', { size: 's', scale: 1.2, color: 'grey', beat: 3, anim: 'fade', rot: -1 })
	},
}
