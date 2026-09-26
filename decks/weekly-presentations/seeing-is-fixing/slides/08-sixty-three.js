// The same 517 circles; 63 fill in red, in three strokes of the grease pencil.
function pick(n, m, seed) {
	let a = seed >>> 0
	const r = () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const idx = Array.from({ length: n }, (_, i) => i)
	for (let i = n - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1))
		;[idx[i], idx[j]] = [idx[j], idx[i]]
	}
	return idx.slice(0, m)
}
export default {
	name: '63',
	kicker: 'I · the problem',
	title: 'A strong agent, handed the pictures',
	source: 'Table I · dot positions illustrative',
	notes: "COVER\n• A strong agent (SWE-agent Multimodal, GPT-4o) resolves 63 of 517 = 12.19%\n• SWE-agent is strong on text-only SWE-bench, yet ~12% here\n• Dot positions are illustrative; only the count is data\nCLICKS\n1–3 · the 63 fill in, 21 at a time; count on 3\nREF · Table I · §I",
	draw(k) {
		const X = 165, Y = 300, P = 34, S = 22, C = 47
		k.grid(X, Y, C, 517, P, S, { color: 'grey', each: () => ({ rot: (k.rand() - 0.5) * 20 }) })
		const lit = pick(517, 63, 1602)
		lit.forEach((i, j) => {
			k.box(X + (i % C) * P, Y + Math.floor(i / C) * P, S, S, { geo: 'ellipse', size: 's', color: 'red', fill: 'fill', beat: 1 + Math.floor(j / 21), anim: 'pop' })
		})
		k.text(170, 760, 'resolves 63', { size: 'xl', scale: 1.5, color: 'red', beat: 3 })
		k.text(620, 790, 'SWE-agent Multimodal · GPT-4o · 12.19%', { size: 'l', scale: 1.1, beat: 3, anim: 'fade' })
	},
}
