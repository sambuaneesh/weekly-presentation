// Step 3, file localization: the repository goes in the top of a funnel, suspicious file paths come out.
const FOLDERS = [['.github/', 420, 250, -8], ['src/', 560, 232, 5], ['helpers/', 690, 262, -4], ['test/', 820, 238, 9], ['scripts/', 470, 320, 6], ['types/', 760, 322, -7], ['tools/', 620, 300, 3]]
const PATHS = [
	'src/helpers/helpers.segment.js',
	'src/scales/scale.linear.js',
	'src/core/core.controller.js',
	'src/core/core.ticks.js',
	'src/core/core.scale.js',
	'src/core/core.scale.defaults.js',
]

export default {
	name: 'File funnel',
	kicker: 'II · the method · step 3',
	title: 'Which files?',
	source: '§III-B1 · §IV-D · paths as drawn in Fig. 4',
	notes: "COVER\n• Step 3, file localization\n• Chat model reads the repo structure (Agentless format) + embedding Top-4 in the key directories; merged\n• Too many files? The model keeps the Top-4 key bug files\nCLICKS\n1 · suspicious paths come out · 2 · keep the Top-4\nREF · §III-B1 · §IV-D · paths from Fig. 4",
	draw(k) {
		// folders falling into the funnel
		for (const [name, x, y, rot] of FOLDERS) k.box(x, y, 130, 58, { text: name, size: 's', font: 'mono', fill: 'solid', color: 'grey', labelColor: 'black', rot })
		// funnel: rim, sides, spout
		k.loop(660, 420, 330, 46, { color: 'black', size: 'm' })
		k.pen([[330, 420], [470, 560], [620, 700]], { size: 'm', wob: 3 })
		k.pen([[990, 420], [850, 560], [700, 700]], { size: 'm', wob: 3 })
		k.pen([[620, 700], [622, 790]], { size: 'm', wob: 2 })
		k.pen([[700, 700], [698, 790]], { size: 'm', wob: 2 })
		// what feeds it
		k.text(90, 300, 'chat model\nreads the\nrepo structure', { size: 's', scale: 1.3, color: 'grey', rot: -4 })
		k.text(1010, 300, 'embedding:\nTop-4 in the\nkey directories', { size: 's', scale: 1.3, color: 'grey', rot: 4 })
		// what comes out
		k.arrow([660, 810], [1180, 640], { bend: 120, beat: 1, anim: 'fade' })
		PATHS.forEach((p, i) => k.text(1240, 330 + i * 72, p, { size: 'm', scale: 1.15, font: 'mono', beat: 1, anim: 'fade', rot: (i % 2 ? 1 : -1) * 0.8 }))
		k.pen([[1790, 320], [1812, 330], [1815, 580], [1832, 596], [1815, 612], [1812, 750], [1790, 760]], { color: 'red', size: 'm', beat: 2, anim: 'wipe' })
		k.text(1100, 830, 'more than four? keep the Top-4', { size: 'l', scale: 1.2, color: 'red', beat: 2, anim: 'wipe', rot: -2 })
	},
}
