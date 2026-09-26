// Step 3, the key-file pick: each suspect file is read as a skeleton.
const LINES = [
	['imp', 0, 0.55], ['imp', 0, 0.45], null, ['cmt', 0, 0.7], ['hdr', 0, 0.5], ['var', 1, 0.45], ['body', 1, 0.8], ['body', 1, 0.6], ['body', 2, 0.7],
	null, ['cmt', 0, 0.6], ['hdr', 0, 0.55], ['var', 1, 0.5], ['body', 1, 0.75], ['body', 2, 0.55],
]
const LABEL = { imp: 'imports', cmt: 'comments', hdr: 'headers', var: 'variables', body: 'bodies' }

export default {
	name: 'Skeleton',
	kicker: 'II · the method · step 3',
	title: 'Read it as a skeleton',
	source: '§III-B1 · schematic file',
	notes: "COVER\n• To choose the Top-4 without overflowing the context, each file is read as a skeleton\n• Kept: imports (GUIRepair's addition), class/function headers, comments\n• Dropped: variable declarations; bodies folded away\nCLICKS\n1 · bodies scribbled out, variables struck · 2 · what's left\nREF · §III-B1 (schematic file)",
	draw(k) {
		const X = 560, Y = 260, W = 720, P = 44
		k.box(X, Y - 20, W, 700 + 20, { fill: 'solid', color: 'white', size: 's' })
		k.text(X + 20, Y - 70, 'core.ticks.js', { size: 's', scale: 1.2, font: 'mono', color: 'grey' })
		const seen = new Set()
		const bodies = []
		LINES.forEach((l, i) => {
			if (!l) return
			const [kind, ind, len] = l
			const y = Y + 30 + i * P
			const x0 = X + 40 + ind * 44
			const w = len * (W - 120)
			const pts = []
			for (let j = 0; j <= 10; j++) pts.push([x0 + (w * j) / 10, y + Math.sin(j * 1.3 + i) * 2.5])
			k.pen(pts, { color: kind === 'cmt' ? 'grey' : 'black', size: kind === 'hdr' ? 'l' : 's', wob: 1.2 })
						if (kind === 'cmt') k.text(x0 - 30, y - 16, '//', { size: 's', font: 'mono', color: 'grey', scale: 0.9 })
			if (kind === 'var') k.pen([[x0 - 10, y + 2], [x0 + w + 14, y - 3]], { color: 'red', size: 'm', wob: 1.5, beat: 1, anim: 'wipe' })
			if (kind === 'body') bodies.push([x0, y, w])
			if (!seen.has(kind)) {
				seen.add(kind)
				k.text(X + W + 40, y - 18, LABEL[kind], { size: 's', scale: 1.3, color: 'grey' })
			}
		})
		// scribble each run of body lines
		const runs = []
		for (const b of bodies) {
			const r = runs[runs.length - 1]
			if (r && b[1] - r[r.length - 1][1] <= P) r.push(b)
			else runs.push([b])
		}
		for (const r of runs) {
			const x0 = Math.min(...r.map((b) => b[0])) - 10
			const x1 = Math.max(...r.map((b) => b[0] + b[2])) + 10
			const y0 = r[0][1] - 12
			const y1 = r[r.length - 1][1] + 12
			const pts = []
			const n = Math.round((x1 - x0) / 26)
			for (let j = 0; j < n; j++) {
				const xa = x0 + ((x1 - x0) * j) / n, xb = x0 + ((x1 - x0) * (j + 1)) / n
				const ya = j % 2 ? y0 : y1, yb = j % 2 ? y1 : y0
				for (let t = 0; t < 1; t += 0.25) pts.push([xa + (xb - xa) * t, ya + (yb - ya) * t])
			}
			k.pen(pts, { color: 'red', size: 'm', wob: 4, beat: 1, anim: 'wipe' })
		}
				k.text(1380, 700, 'keeps imports,\nheaders, comments\n\ndrops variable\ndeclarations', { size: 'l', scale: 1.05, beat: 2, anim: 'wipe', rot: -2 })
	},
}
