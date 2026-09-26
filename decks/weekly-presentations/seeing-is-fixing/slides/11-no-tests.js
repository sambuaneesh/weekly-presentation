// SWE-bench M ships no tests (§I); visual fixes differ in tiny pixel details (Chart.js-10157, Fig. 3).
export default {
	name: 'No tests',
	kicker: 'I · the problem · patch validation',
	title: 'No tests in the box',
	source: 'Chart.js-10157 · Fig. 3, illustrative redraw · §I · §II-B',
	notes: "COVER\n• SWE-bench M ships no test cases (to prevent data leakage)\n• Chart.js-10157: candidate PRs differ only in subtle pixels (bar corners)\n• A visual test needs the expected picture, pixel-accurate; LLMs can't draw it in advance\nCLICKS\n1 · three PR charts (illustrative redraw of Fig. 3) · 2 · the empty \"expected\" frame\nREF · §I · §II-B · Fig. 3",
	draw(k) {
		// the empty test box, crossed out
		k.box(170, 270, 250, 150, { geo: 'rectangle', text: 'tests/', font: 'mono', size: 'l', id: 'tests' })
		k.cross(200, 280, 190, { id: 'x' })
		k.text(470, 290, 'SWE-bench M ships no tests', { size: 'xl', id: 'say' })
		k.text(470, 370, 'to prevent data leakage', { size: 'l', color: 'grey', id: 'why' })

		// a rounded (or not) bar, as a closed pen path
		const bar = (x, base, w, h, rt, rb, o) => {
			const p = []
			const arc = (cx, cy, r, a0, a1) => { for (let i = 0; i <= 4; i++) { const a = a0 + ((a1 - a0) * i) / 4; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) } }
			const top = base - h
			if (rb) arc(x + rb, base - rb, rb, Math.PI / 2, Math.PI); else p.push([x, base])
			if (rt) arc(x + rt, top + rt, rt, Math.PI, 1.5 * Math.PI); else p.push([x, top])
			if (rt) arc(x + w - rt, top + rt, rt, 1.5 * Math.PI, 2 * Math.PI); else p.push([x + w, top])
			if (rb) arc(x + w - rb, base - rb, rb, 0, Math.PI / 2); else p.push([x + w, base])
			p.push(p[0])
			const q = []
			for (let i = 0; i < p.length - 1; i++) { const [a, b] = [p[i], p[i + 1]]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6)); for (let t = 0; t < n; t++) q.push([a[0] + ((b[0] - a[0]) * t) / n, a[1] + ((b[1] - a[1]) * t) / n]) }
			q.push(p[0])
			return k.pen(q, { closed: true, size: 'm', ...o })
		}
		const vals = [0.75, 0, 0.9, 0]
		// PR variants: corners of the 0-value bars [top radius, bottom radius]
		const variants = [['PR 1', 24, 0], ['PR 2', 24, 24], ['PR n', 0, 24]]
		const cw = 320, ch = 250, cy = 500
		const xs = [140, 510, 950, 1440]
		variants.forEach(([lbl, rt, rb], j) => {
			const cx = xs[j]
			const beat = 1
			k.box(cx, cy, cw, ch, { fill: 'solid', color: 'white', size: 's', beat, anim: 'drop', id: `c${j}` })
			const base = cy + ch - 30
			k.pen([[cx + 20, base], [cx + cw - 20, base]], { color: 'grey', size: 's', beat, id: `c${j}-axis` })
			vals.forEach((v, i) => {
				const bx = cx + 28 + i * 72
				if (v > 0) k.box(bx, base - v * (ch - 70), 60, v * (ch - 70), { color: 'grey', fill: 'semi', size: 's', beat, anim: 'wipe', id: `c${j}-bar${i}` })
				else bar(bx - 2, base, 64, 50, rt, rb, { color: 'red', fill: 'solid', beat, anim: 'wipe', id: `c${j}-bar${i}` })
			})
			k.text(cx, cy + ch + 16, lbl, { size: 'l', align: 'middle', w: cw, beat, id: `c${j}-lbl` })
		})
		k.text(862, 590, '…', { size: 'xl', color: 'grey', beat: 1, id: 'dots' })

		// the expected picture: nobody can draw it
		k.box(xs[3], cy, cw, ch, { dash: 'dashed', color: 'grey', size: 'm', beat: 2, anim: 'fade', id: 'exp' })
		k.text(xs[3] + cw / 2 - 45, cy + 30, '?', { size: 'xl', scale: 3.5, color: 'red', rot: 6, beat: 2, anim: 'fade', id: 'exp-q2' })
		k.text(xs[3], cy + ch + 16, 'expected', { size: 'l', color: 'grey', align: 'middle', w: cw, beat: 2, id: 'exp-lbl' })
		k.text(170, 880, 'nobody can draw the expected picture in advance', { size: 'xl', align: 'middle', w: 1580, beat: 2, id: 'line' })
	},
}
