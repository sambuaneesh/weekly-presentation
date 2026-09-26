// Two blindnesses (§I, §II): two doodled eyes, each with the thing it cannot do.
export default {
	name: 'Two blindnesses',
	kicker: 'I · the problem',
	title: 'Two blindnesses',
	source: '§I · §II-A · §II-B',
	notes: "COVER\n• The paper's two limitations of existing systems\n• Left: can't read the picture → fault understanding (no project knowledge linking symptom to code)\n• Right: can't check the fix → patch validation (no tests; visual tests need pixels)\n• Next two slides: one each\nCLICKS\n1 · left eye · 2 · right eye\nREF · §I · §II-A · §II-B",
	draw(k) {
		const eye = (cx, cy, beat, id) => {
			const w = 420, h = 130
			const up = [], lo = []
			for (let i = 0; i <= 24; i++) {
				const t = i / 24
				up.push([cx - w / 2 + w * t, cy - h * Math.sin(Math.PI * t)])
				lo.push([cx - w / 2 + w * t, cy + h * 0.8 * Math.sin(Math.PI * t)])
			}
			k.pen([...up, [cx + w / 2 + 14, cy - 4]], { size: 'l', wob: 2, beat, anim: 'wipe', id: id + '-up' })
			k.pen([[cx - w / 2 - 10, cy + 3], ...lo], { size: 'l', wob: 2, beat, anim: 'wipe', id: id + '-lo' })
			// lashes
			for (let i = 1; i <= 5; i++) {
				const t = i / 6
				const x = cx - w / 2 + w * t, y = cy - h * Math.sin(Math.PI * t)
				const dx = (t - 0.5) * 40
				k.pen([[x, y - 6], [x + dx, y - 42]], { size: 'm', wob: 1.5, beat, anim: 'wipe', id: `${id}-lash${i}` })
			}
			k.circle(cx, cy - 4, 70, { color: 'grey', fill: 'semi', size: 'm', beat, anim: 'pop', id: id + '-iris' })
			k.circle(cx, cy - 4, 28, { color: 'black', fill: 'fill', size: 's', beat, anim: 'pop', id: id + '-pupil' })
		}
		eye(560, 500, 1, 'l')
		eye(1360, 500, 2, 'r')
		// what each cannot do
		k.text(210, 700, "can't read the picture", { size: 'xl', align: 'middle', w: 700, id: 'l-say', beat: 1 })
		k.text(210, 790, 'fault understanding', { size: 'l', color: 'grey', align: 'middle', w: 700, id: 'l-sub', beat: 1 })
		k.underline(400, 776, 320, { beat: 1, anim: 'wipe', id: 'l-ul' })
		k.text(1010, 700, "can't check the fix", { size: 'xl', align: 'middle', w: 700, id: 'r-say', beat: 2 })
		k.text(1010, 790, 'patch validation', { size: 'l', color: 'grey', align: 'middle', w: 700, id: 'r-sub', beat: 2 })
		k.underline(1210, 776, 300, { beat: 2, anim: 'wipe', id: 'r-ul' })
		// the red "?" of the safelight over each eye
		k.text(800, 300, '?', { size: 'xl', scale: 2, color: 'red', rot: 10, beat: 1, anim: 'fade', id: 'l-q' })
		k.text(1600, 300, '?', { size: 'xl', scale: 2, color: 'red', rot: -8, beat: 2, anim: 'fade', id: 'r-q' })
	},
}
