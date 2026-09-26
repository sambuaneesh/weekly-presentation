// Scene kit: the hand-drawn "ink & safelight" look, and the small vocabulary every scene uses.
//
// The feel is indie animation: ink on warm paper, wobbly doubled strokes, one red accent (the
// darkroom's safelight), lots of empty paper, and motion "on twos" (stepped, ~12 fps) with a gentle
// line boil on drawn strokes. Minimal: one idea per beat; say it with a drawing before words.
//
// A scene renders at a fixed 1920×1080 design size (the slide), scaled to its shape. It receives
//   b      the beat being shown (0, 1, 2… while presenting; Infinity = every beat, while editing)
//   still  true when there is nothing to animate in (editing, or exporting a thumbnail)
//   frozen true only while exporting: no ambient motion (no boil) either
// and reveals things with `at(b, k)`: true once beat k has been reached.
import { createElement, useEffect, useRef, useState } from 'react'
import htm from './vendor/htm.js'

export const html = htm.bind(createElement)
export const DESIGN_W = 1920
export const DESIGN_H = 1080

// Ink on paper. `paper` equals the tldraw "yellow / semi" fill the theme paints behind every slide.
export const C = {
	paper: '#f9f0e6',
	paper2: '#f1e6d6', // a shade darker: cards, washes
	ink: '#2b2621',
	text: '#2b2621',
	dim: '#6f675c',
	faint: '#b3a898',
	line: 'rgba(43,38,33,0.22)',
	red: '#d64533', // the safelight: the one accent
	redGlow: 'rgba(214,69,51,0.18)',
	amber: '#d99a2b',
	fix: '#2e8b7e', // the fixer bath: "resolved"
	blue: '#3f6fc4',
	violet: '#8a5fc0',
	deep: '#2b2621',
}

export const F = {
	hand: "var(--tl-font-draw, 'tldraw_draw'), 'Shantell Sans', 'Comic Neue', cursive",
	serif: "var(--tl-font-serif, 'tldraw_serif'), 'IBM Plex Serif', Georgia, serif",
	sans: "var(--tl-font-sans, 'tldraw_sans'), 'IBM Plex Sans', system-ui, sans-serif",
	mono: "var(--tl-font-mono, 'tldraw_mono'), 'IBM Plex Mono', ui-monospace, monospace",
}

export const EASE = 'cubic-bezier(.2,.7,.2,1)'
// Stepped timing: animation "on twos" (12 drawings a second), the indie-animation cadence.
export const twos = (ms) => `steps(${Math.max(2, Math.round(ms / 83))}, end)`

export const at = (b, k) => b >= k

// Absolute box in design pixels.
export const box = (x, y, w, h, extra) => ({ position: 'absolute', left: x, top: y, width: w, height: h, ...extra })

// Something that appears on a beat: pops in on twos (or glides, with `smooth`).
export function rv(on, still, { delay = 0, dur = 500, dx = 0, dy = 14, scale = 1, off = 0, smooth = false } = {}) {
	const ease = smooth ? EASE : twos(dur)
	return {
		opacity: on ? 1 : off,
		transform: on ? 'none' : `translate(${dx}px, ${dy}px) scale(${scale})`,
		transition: still ? 'none' : `opacity ${dur}ms ${ease} ${delay}ms, transform ${dur}ms ${ease} ${delay}ms`,
	}
}

// A transition string that is dropped when there's nothing to animate.
export const tr = (still, s) => (still ? 'none' : s)

// An infinite ambient animation (dropped while exporting).
export const amb = (frozen, s) => (frozen ? 'none' : s)

// Deterministic pseudo-random numbers, so "hand-drawn" wobble is the same on every screen.
export function rng(seed = 1) {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

// Pick exactly `k` of `n` indices, deterministically.
export function pickSet(n, k, seed) {
	const r = rng(seed)
	const idx = Array.from({ length: n }, (_, i) => i)
	for (let i = n - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1))
		;[idx[i], idx[j]] = [idx[j], idx[i]]
	}
	return new Set(idx.slice(0, k))
}

// A number that counts to `value` whenever `value` changes (on twos).
export function Counter({ value, still, dur = 1000, fmt = (v) => String(Math.round(v)) }) {
	const cur = useRef(still ? value : 0)
	const [v, setV] = useState(cur.current)
	useEffect(() => {
		if (still) {
			cur.current = value
			setV(value)
			return
		}
		const from = cur.current
		const t0 = performance.now()
		let raf = 0
		let last = 0
		const step = (t) => {
			const k = Math.min(1, (t - t0) / dur)
			if (t - last > 80 || k === 1) {
				last = t
				const next = from + (value - from) * (1 - Math.pow(1 - k, 3))
				cur.current = next
				setV(next)
			}
			if (k < 1) raf = requestAnimationFrame(step)
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [value, still])
	return fmt(v)
}

// ---------- hand-drawn geometry ----------
// All return SVG path data in the caller's coordinates. `seed` keeps the wobble stable.

const f1 = (n) => n.toFixed(1)

// A wobbly polyline through `pts` ([[x,y], …]): each segment bows slightly, ends overshoot a little.
export function wobble(pts, { seed = 1, amp = 2.2, closed = false } = {}) {
	const r = rng(seed)
	const j = () => (r() - 0.5) * 2 * amp
	const P = closed ? [...pts, pts[0]] : pts
	let d = `M ${f1(P[0][0] + j())} ${f1(P[0][1] + j())}`
	for (let i = 1; i < P.length; i++) {
		const [x0, y0] = P[i - 1]
		const [x1, y1] = P[i]
		const mx = (x0 + x1) / 2 + j() * 1.4
		const my = (y0 + y1) / 2 + j() * 1.4
		d += ` Q ${f1(mx)} ${f1(my)} ${f1(x1 + j())} ${f1(y1 + j())}`
	}
	return d
}

// Rectangle drawn twice with different wobble, like a quick pen sketch.
export function sketchRect(x, y, w, h, seed = 1, amp = 2.4) {
	const o = 3
	const a = wobble([[x - o, y + 1], [x + w + o, y - 1], [x + w, y + h + o], [x - 1, y + h], [x + 1, y - o]], { seed, amp })
	const b = wobble([[x + 1, y - 1], [x + w, y + 1], [x + w + 1, y + h - 1], [x, y + h + 1], [x - 1, y + 2]], { seed: seed + 7, amp })
	return a + ' ' + b
}

// Ellipse drawn as one looping stroke that overshoots where it closes.
export function sketchEllipse(cx, cy, rx, ry, seed = 1, amp = 0.035) {
	const r = rng(seed)
	const start = r() * Math.PI * 2
	const pts = []
	const n = 40
	for (let i = 0; i <= n + 5; i++) {
		const t = start + (i / n) * Math.PI * 2
		const k = 1 + (r() - 0.5) * amp * 2 + (i > n ? 0.05 : 0)
		pts.push([cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t)])
	}
	return 'M ' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L ')
}

// A slightly curved hand-drawn line from a to b, with an optional arrowhead.
export function sketchArrow(x0, y0, x1, y1, { seed = 1, bend = 0.12, head = true, amp = 1.6 } = {}) {
	const r = rng(seed)
	const dx = x1 - x0
	const dy = y1 - y0
	const mx = (x0 + x1) / 2 - dy * bend + (r() - 0.5) * amp * 4
	const my = (y0 + y1) / 2 + dx * bend + (r() - 0.5) * amp * 4
	let d = `M ${f1(x0)} ${f1(y0)} Q ${f1(mx)} ${f1(my)} ${f1(x1)} ${f1(y1)}`
	if (head) {
		const a = Math.atan2(y1 - my, x1 - mx)
		const L = 18
		const s = 0.45
		d += ` M ${f1(x1 - L * Math.cos(a - s))} ${f1(y1 - L * Math.sin(a - s))} L ${f1(x1)} ${f1(y1)} L ${f1(x1 - L * Math.cos(a + s))} ${f1(y1 - L * Math.sin(a + s))}`
	}
	return d
}

// Diagonal hatching inside a box: a pen's idea of "fill".
export function hatch(x, y, w, h, { gap = 12, seed = 1 } = {}) {
	const r = rng(seed)
	let d = ''
	for (let t = -h; t < w; t += gap) {
		const x0 = x + Math.max(0, t)
		const y0 = y + Math.max(0, -t)
		const x1 = x + Math.min(w, t + h)
		const y1 = y + (Math.min(w, t + h) - t)
		d += ` M ${f1(x0 + (r() - 0.5) * 2)} ${f1(y0)} L ${f1(x1 + (r() - 0.5) * 2)} ${f1(y1)}`
	}
	return d
}

// Style for a stroke that draws itself on (strokeDasharray), on twos.
export function drawOn(on, still, { len = 2000, dur = 700, delay = 0 } = {}) {
	return {
		strokeDasharray: len,
		strokeDashoffset: on ? 0 : len,
		transition: still ? 'none' : `stroke-dashoffset ${dur}ms ${twos(dur)} ${delay}ms`,
	}
}

// Wrap strokes in this group to make them "boil" (the jitter of redrawn frames).
// Use on drawings, not on text you need to read.
export function Boil({ frozen, children, style }) {
	return html`<g style=${{ animation: frozen ? 'none' : 'gr-boil 0.5s steps(1, end) infinite', ...style }}>${children}</g>`
}

// A full-slide SVG layer to draw on, in design pixels.
export function Sheet({ children, style }) {
	return html`<svg style=${{ ...box(0, 0, 1920, 1080), overflow: 'visible', pointerEvents: 'none', ...style }} viewBox="0 0 1920 1080">${children}</svg>`
}

// Ink stroke defaults for <path>.
export const INK = { fill: 'none', stroke: C.ink, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }

// ---------- recurring pieces ----------

// A handwritten label.
export function Label({ children, color = C.dim, size = 24, style }) {
	return html`<div style=${{ fontFamily: F.hand, fontSize: size, color, ...style }}>${children}</div>`
}

// The narrating voice: handwriting, a little larger.
export function Verse({ children, size = 34, color = C.ink, style }) {
	return html`<div style=${{ fontFamily: F.hand, fontSize: size, lineHeight: 1.35, color, ...style }}>${children}</div>`
}

// Where a claim comes from. Every data scene carries one, pencilled small at the bottom.
export function Source({ children, style }) {
	return html`<div style=${{ ...box(860, 1014, 800, 30), textAlign: 'right', fontFamily: F.hand, fontSize: 17, color: C.faint, ...style }}>${children}</div>`
}

// A word in a hand-drawn loop.
export function Chip({ children, color = C.dim, fill = 'transparent', style }) {
	return html`<span style=${{ display: 'inline-block', padding: '4px 14px', borderRadius: '14px 18px 12px 20px / 18px 12px 20px 14px', border: `2px solid ${color}`, color, background: fill, fontFamily: F.mono, fontSize: 18, whiteSpace: 'nowrap', ...style }}>${children}</span>`
}

// A sketched window: a box with three little circles, not a screenshot of an OS.
export function Win({ x, y, w, h, title, dark = false, children, style, seed = 3 }) {
	return html`<div style=${{ ...box(x, y, w, h), ...style }}>
		<div style=${{ position: 'absolute', inset: 0, background: dark ? '#2b2621' : '#fffaf2', borderRadius: 6 }} />
		<div style=${{ position: 'absolute', left: 0, right: 0, top: 40, bottom: 0, overflow: 'hidden', borderRadius: '0 0 6px 6px' }}>${children}</div>
		<svg style=${{ ...box(-8, -8, w + 16, h + 16), overflow: 'visible', pointerEvents: 'none' }} viewBox=${`-8 -8 ${w + 16} ${h + 16}`}>
			<path d=${sketchRect(0, 0, w, h, seed)} ...${INK} />
			<path d=${wobble([[0, 38], [w, 38]], { seed: seed + 1 })} ...${INK} strokeWidth="2" />
			${[0, 1, 2].map((i) => html`<path key=${i} d=${sketchEllipse(22 + i * 22, 19, 6, 6, seed + i)} ...${INK} strokeWidth="2" />`)}
		</svg>
		<span style=${{ position: 'absolute', left: 100, top: 7, fontFamily: F.hand, fontSize: 19, color: dark ? '#b3a898' : C.dim }}>${title}</span>
	</div>`
}

// A print: white card with a pencilled caption, slightly askew.
export function Print({ x, y, w, h, tilt = 0, caption, children, style, seed = 5 }) {
	return html`<div style=${{ ...box(x, y, w, h), transform: `rotate(${tilt}deg)`, ...style }}>
		<div style=${{ position: 'absolute', inset: 0, background: '#fffdf8', boxShadow: '2px 3px 0 rgba(43,38,33,0.12)' }} />
		<div style=${{ position: 'absolute', left: 14, top: 14, right: 14, bottom: caption ? 46 : 14, overflow: 'hidden', background: '#f7f2ea' }}>${children}</div>
		<svg style=${{ ...box(-6, -6, w + 12, h + 12), overflow: 'visible', pointerEvents: 'none' }} viewBox=${`-6 -6 ${w + 12} ${h + 12}`}>
			<path d=${sketchRect(0, 0, w, h, seed, 1.6)} ...${INK} strokeWidth="2" />
		</svg>
		${caption && html`<div style=${{ position: 'absolute', left: 16, right: 14, bottom: 10, fontFamily: F.hand, fontSize: 20, color: C.dim }}>${caption}</div>`}
	</div>`
}

// Numbered step: a number in a hand-drawn circle.
export function Step({ n, on = true, size = 44, color = C.red }) {
	return html`<span style=${{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, flex: 'none', fontFamily: F.hand, fontWeight: 700, fontSize: size * 0.55, color: on ? color : C.faint }}>
		<svg style=${{ position: 'absolute', inset: -4, overflow: 'visible' }} viewBox=${`-4 -4 ${size + 8} ${size + 8}`}>
			<path d=${sketchEllipse(size / 2, size / 2, size / 2 - 2, size / 2 - 2, typeof n === 'number' ? n : 9)} fill="none" stroke=${on ? color : C.faint} strokeWidth="2.5" strokeLinecap="round" />
		</svg>
		${n}
	</span>`
}

// The red grease-pencil mark round the frame worth printing. shape: 'ellipse' | 'box'.
export function Ring({ x, y, w, h, on, still, delay = 0, color = C.red, width = 5, shape = 'ellipse', seed = 4 }) {
	const d = shape === 'box' ? sketchRect(12, 12, w + 16, h + 16, seed, 3) : sketchEllipse(w / 2 + 20, h / 2 + 20, w / 2 + 12, h / 2 + 12, seed)
	const len = shape === 'box' ? 4 * (w + h) + 300 : 2 * Math.PI * Math.sqrt(((w + 24) ** 2 + (h + 24) ** 2) / 8) * 1.2 + 60
	return html`<svg style=${{ ...box(x - 20, y - 20, w + 40, h + 40), overflow: 'visible', pointerEvents: 'none' }} viewBox=${`0 0 ${w + 40} ${h + 40}`}>
		<path d=${d} fill="none" stroke=${color} strokeWidth=${width} strokeLinecap="round" strokeLinejoin="round" style=${drawOn(on, still, { len, dur: 800, delay })} />
	</svg>`
}

// A hand-drawn cross (rejected).
export function Cross({ x, y, s = 60, on, still, delay = 0, color = C.red }) {
	const len = s * 1.6
	const line = (d, dl) => html`<path d=${d} stroke=${color} strokeWidth="6" strokeLinecap="round" fill="none" style=${drawOn(on, still, { len, dur: 300, delay: delay + dl })} />`
	return html`<svg style=${{ ...box(x, y, s, s), overflow: 'visible' }} viewBox=${`0 0 ${s} ${s}`}>
		${line(wobble([[4, 6], [s - 4, s - 2]], { seed: 2 }), 0)}${line(wobble([[s - 6, 4], [6, s - 4]], { seed: 3 }), 160)}
	</svg>`
}

// Paper grain, and the filters that make strokes boil. Painted under every scene.
const GRAIN =
	"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.25 0 0 0 0 0.2 0 0 0 0 0.15 0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

export function Backdrop({ frozen, safelight = true }) {
	return html`<div style=${{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
		<div style=${{ position: 'absolute', inset: 0, background: C.paper }} />
		${safelight && html`<div style=${{ position: 'absolute', right: -200, top: -260, width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle, rgba(214,69,51,0.10) 0%, rgba(214,69,51,0) 65%)' }} />`}
		<div style=${{ position: 'absolute', inset: 0, backgroundImage: GRAIN }} />
		<div style=${{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(80,60,40,0.10) 100%)' }} />
		${!frozen && html`<svg width="0" height="0" style=${{ position: 'absolute' }}>
			<defs>
				${[1, 2, 3].map((s) => html`<filter key=${s} id=${'gr-boil-' + s} x="-5%" y="-5%" width="110%" height="110%">
					<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed=${s * 11} />
					<feDisplacementMap in="SourceGraphic" scale="3.2" />
				</filter>`)}
			</defs>
		</svg>`}
	</div>`
}

// Keyframes scenes use. Injected once by config.js (and by the website).
export const SCENE_CSS = `
@keyframes gr-boil { 0% { filter: url(#gr-boil-1) } 33% { filter: url(#gr-boil-2) } 66% { filter: url(#gr-boil-3) } }
@keyframes gr-bob { 0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)) } 50% { transform: translateY(-5px) rotate(var(--tilt, 0deg)) } }
@keyframes gr-breathe { 0%, 100% { opacity: 0.65 } 50% { opacity: 1 } }
@keyframes gr-develop {
	0% { opacity: 0; filter: blur(10px) contrast(0.3) }
	50% { opacity: 0.7; filter: blur(3px) contrast(0.7) }
	100% { opacity: 1; filter: none }
}
@keyframes gr-flow { to { stroke-dashoffset: -48 } }
@keyframes gr-pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
@keyframes gr-ripple { 0% { transform: scale(0.4); opacity: 0.9 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes gr-sweep { 0% { transform: translateY(-80px); opacity: 0 } 15% { opacity: 1 } 85% { opacity: 1 } 100% { transform: translateY(var(--sweep, 400px)); opacity: 0 } }
@keyframes gr-look { 0% { box-shadow: 0 0 0 0 rgba(214,69,51,0) } 30% { box-shadow: 0 0 0 5px rgba(214,69,51,0.9) } 100% { box-shadow: 0 0 0 0 rgba(214,69,51,0) } }
@keyframes gr-drift { 0%, 100% { transform: translate(0, 0) rotate(var(--tilt, 0deg)) } 50% { transform: translate(4px, -5px) rotate(var(--tilt, 0deg)) } }
@keyframes gr-ripple-tray { 0%, 100% { transform: translateX(0) } 50% { transform: translateX(-30px) } }
`
