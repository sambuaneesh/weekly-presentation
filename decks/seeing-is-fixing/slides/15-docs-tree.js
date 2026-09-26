// Step 1a: the chat model skims the docs tree by name only, like a flashlight over the spines.
// Tree = the Chart.js docs names drawn in Fig. 4; which files it picks is illustrative.
const TREE = [
	[
		['axes/', true, ['_common.md', '_common_ticks.md', 'index.md', 'labelling.md', 'styling.md']],
		['charts/', true, ['area.md', 'bar.md', 'bubble.md', 'doughnut.md', 'line.md']],
		['configuration/', false, ['locale.md']],
	],
	[
		['developers/', false, ['api.md', 'charts.md', 'plugins.md', 'updates.md']],
		['general/', false, ['accessibility.md', 'colors.md', 'fonts.md', 'padding.md']],
		['samples/line/', true, ['segments.md']],
		['scripts/', true, ['helpers.js']],
	],
]
const PICKED = ['charts/line.md', 'axes/_common_ticks.md', 'developers/api.md', 'configuration/locale.md']
// many points along a polyline, so the smoothed pen keeps its corners
function dense(pts, step = 30) {
	const out = []
	for (let i = 0; i < pts.length - 1; i++) {
		const [a, b] = [pts[i], pts[i + 1]]
		const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step))
		for (let j = 0; j < n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n])
	}
	out.push(pts[pts.length - 1])
	return out
}
const COLX = [250, 720]
const Y0 = 300
const LH = 43
const CH = 13.6 // approx. width of one handwritten character at size s × 1.25

export default {
	name: 'Docs tree',
	kicker: 'II · the method · ❶ knowledge mining',
	title: 'first, only the names',
	source: '§III-A1 · §IV-D · names as drawn in Fig. 4 · picks illustrative',
	notes: "COVER\n• Step 1, knowledge mining, part 1\n• Docs say which components exist and how they're used\n• The whole docs folder won't fit, so the chat model sees only the directory tree (filenames)\n• It picks the Top-6 by name and names the key directories\nCLICKS\n1 · picks circled · 2 · key directories underlined\nREF · §III-A1 · §IV-D · names from Fig. 4 (picks illustrative)",
	draw(k) {
		// the flashlight's beam, sweeping over the names (drawn first so the names sit on top)
		k.pen(dense([[1440, 472], [760, 262], [715, 420], [700, 570], [715, 730], [760, 880], [1440, 600], [1440, 472]]), { closed: true, fill: 'solid', color: 'yellow', size: 's', opacity: 0.3 })
		k.pen([[1440, 472], [1100, 367], [760, 262]], { size: 's', color: 'grey', wob: 1.5 })
		k.pen([[1440, 600], [1100, 740], [760, 880]], { size: 's', color: 'grey', wob: 1.5 })
		// the root folder, a little doodled folder tab
		k.pen([[150, 266], [150, 232], [174, 232], [182, 240], [212, 240], [212, 266], [150, 266]], { closed: true, fill: 'semi', size: 's', wob: 1 })
		k.text(226, 232, 'docs/', { size: 's', scale: 1.35 })
		const pos = new Map()
		TREE.forEach((col, ci) => {
			const x = COLX[ci]
			let row = 0
			const yFirst = Y0
			let yLastDir = Y0
			col.forEach(([dir, key, files]) => {
				const yd = Y0 + row * LH
				yLastDir = yd
				// branch into the directory
				k.pen([[x - 44, yd + 18], [x - 8, yd + 19]], { size: 's', color: 'grey', wob: 0.8 })
				k.text(x, yd, dir, { size: 's', scale: 1.25 })
				pos.set(dir, { x, y: yd, len: dir.length })
				row++
				files.forEach((f, fi) => {
					const yf = Y0 + row * LH
					k.pen([[x + 14, yf - 14], [x + 14, yf + 18], [x + 36, yf + 19]], { size: 's', color: 'grey', wob: 0.8 })
					k.text(x + 44, yf, f, { size: 's', scale: 1.25, color: 'grey' })
					pos.set(dir + f, { x: x + 44, y: yf, len: f.length })
					row++
				})
			})
			// the trunk of this column
			k.pen([[x - 44, yFirst - 30], [x - 45, (yFirst + yLastDir) / 2], [x - 44, yLastDir + 19]], { size: 's', color: 'grey', wob: 0.8 })
		})
		k.pen([[182, 266], [182, 280], [COLX[0] - 44, 280], [COLX[1] - 44, 280], [COLX[1] - 44, 290]], { size: 's', color: 'grey', wob: 0.8 })

		k.pen([[1440, 468], [1500, 500], [1500, 572], [1440, 604]], { closed: true, fill: 'semi', size: 'm', wob: 1 })
		k.box(1500, 498, 250, 76, { fill: 'semi', size: 'm' })
		k.box(1596, 514, 40, 20, { fill: 'solid', color: 'red', size: 's' })
		k.text(1250, 720, 'the chat model sees\nonly filenames', { size: 'l', scale: 1.05, w: 580, align: 'middle', rot: -2 })
		k.text(1250, 850, 'no file contents', { size: 's', scale: 1.2, color: 'grey', w: 580, align: 'middle', rot: -2 })

		// click 1: its picks, circled in red grease pencil
		PICKED.forEach((p, i) => {
			const q = pos.get(p)
			const w = q.len * CH
			k.loop(q.x + w / 2, q.y + 17, w / 2 + 22, 24, { beat: 1, anim: 'wipe', size: 'm', id: `pick-${i}` })
		})
		// click 2: …and the key directories it names
		let i = 0
		for (const [dir, key] of TREE.flat()) {
			if (!key) continue
			const q = pos.get(dir)
			k.underline(q.x - 4, q.y + 40, q.len * CH + 8, { beat: 2, anim: 'wipe', size: 'm', id: `key-${i++}` })
		}
		k.text(COLX[1] - 40, 910, 'underlined: the key directories it names', { size: 's', scale: 1.2, color: 'red', beat: 2, anim: 'fade' })
	},
}
