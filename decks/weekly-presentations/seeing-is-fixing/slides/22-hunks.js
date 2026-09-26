// Step 4, hunk localization: suspect functions circled in red inside the key files (elements as drawn in Fig. 4).
const FILES = [
	{ id: 'a', x: 190, rot: -2, path: 'src/core/core.ticks.js', els: ['numeric', 'formatters'] },
	{ id: 'b', x: 1010, rot: 2, path: 'src/helpers/helpers.segment.js', els: ['getNumberFormat', 'formatNumber'] },
]

export default {
	name: 'Hunks',
	kicker: 'II · the method · step 4',
	title: 'Which functions?',
	source: '§III-B2 · §IV-D · elements as drawn in Fig. 4',
	notes: "COVER\n• Step 4, hunk localization: full contents of the key files now\n• Localize at class/function level; each suspect element is extracted whole\n• A bug outside any function gets a 500-line window\nCLICKS\n1 · suspect functions circled · 2 · the 500-line note\nREF · §III-B2 · §IV-D · elements from Fig. 4",
	draw(k) {
		for (const f of FILES) {
			const Y = 290
			k.box(f.x, Y, 720, 520, { fill: 'solid', color: 'white', size: 's', rot: f.rot })
			k.text(f.x + 30, Y + 26, f.path, { size: 's', scale: 1.15, font: 'mono', color: 'grey', rot: f.rot })
			f.els.forEach((e, j) => {
				const y = Y + 120 + j * 200
				const dy = (f.rot * Math.PI / 180) * 40
				k.text(f.x + 60, y + dy, e, { size: 'm', scale: 1.3, font: 'mono', rot: f.rot })
				for (let l = 0; l < 3; l++) {
					const ly = y + 60 + l * 30 + dy + f.rot * 2
					const w = 260 + ((l * 97 + j * 53) % 180)
					k.pen([[f.x + 110, ly], [f.x + 110 + w / 2, ly + f.rot * 3 + 2], [f.x + 110 + w, ly + f.rot * 6]], { size: 's', wob: 1.5, color: 'grey' })
				}
				const tw = e.length * 19
				k.loop(f.x + 60 + tw / 2, y + dy + 22, tw / 2 + 40, 38, { beat: 1, anim: 'wipe' })
			})
		}
		k.text(420, 880, 'outside a function?  take a 500-line window', { size: 'l', scale: 1.15, color: 'red', beat: 2, anim: 'wipe', rot: -1.5 })
	},
}
