// The home page: every presentation, pinned up like prints on a line. Reads decks/index.json
// (written by scripts/export-decks.mjs from each decks/<slug>/deck.json). Unlisted decks
// ("listed": false) are hidden here but still open by their link; add ?all to see them too.
import { useEffect, useMemo, useState } from 'react'

const OWNER = import.meta.env.VITE_SITE_OWNER || 'Aneesh S'
const showAll = new URLSearchParams(location.search).has('all')

const CSS = `
.g-page { min-height: 100vh; background: #f9f0e6; color: #2b2621; font-family: 'Shantell Sans', 'Comic Neue', system-ui, sans-serif; overflow-y: auto; height: 100vh; box-sizing: border-box;
	background-image: radial-gradient(ellipse at 50% 0%, rgba(214,69,51,.07), rgba(214,69,51,0) 55%); }
.g-wrap { max-width: 1180px; margin: 0 auto; padding: 56px 28px 90px; }
.g-head h1 { font-size: clamp(40px, 6vw, 68px); margin: 0; font-weight: 700; letter-spacing: -.5px; }
.g-head .g-line { height: 7px; width: min(460px, 70%); margin: 4px 0 14px; }
.g-head p { margin: 0; color: #6f675c; font-size: 19px; }
.g-tools { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 34px 0 8px; }
.g-search { font: inherit; font-size: 17px; padding: 8px 14px; border: 2px solid #2b2621; border-radius: 14px 18px 12px 16px; background: #fffdf8; min-width: 240px; outline: none; }
.g-search:focus { box-shadow: 3px 3px 0 rgba(214,69,51,.35); }
.g-tag { font: inherit; font-size: 15px; padding: 4px 12px; border: 1.5px solid #9b958a; color: #6f675c; border-radius: 12px 16px 10px 14px; background: transparent; cursor: pointer; }
.g-tag.on { border-color: #d64533; color: #d64533; background: rgba(214,69,51,.06); }
.g-string { position: relative; height: 26px; margin-top: 30px; }
.g-string svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.g-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 46px 34px; margin-top: 4px; }
.g-card { position: relative; display: block; text-decoration: none; color: inherit; background: #fffdf8; border: 2px solid #2b2621; border-radius: 6px 9px 7px 10px;
	padding: 14px 14px 16px; box-shadow: 3px 4px 0 rgba(43,38,33,.12); transition: transform .12s steps(3, end); }
.g-card:hover { transform: rotate(0deg) translateY(-4px) !important; box-shadow: 5px 7px 0 rgba(43,38,33,.16); }
.g-peg { position: absolute; top: -22px; left: 50%; width: 16px; height: 40px; margin-left: -8px; background: #e9c9a8; border: 2px solid #2b2621; border-radius: 4px; }
.g-cover { aspect-ratio: 16 / 9; border: 1.5px solid #b3a898; border-radius: 3px; overflow: hidden; background: #f9f0e6; display: flex; align-items: center; justify-content: center; }
.g-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.g-cover .g-ph { font-size: 30px; padding: 0 20px; text-align: center; line-height: 1.15; }
.g-title { font-size: 25px; font-weight: 700; margin: 14px 2px 2px; line-height: 1.15; }
.g-sub { color: #6f675c; font-size: 15px; margin: 2px 2px 8px; }
.g-desc { font-size: 15.5px; line-height: 1.4; margin: 0 2px 10px; }
.g-meta { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; font-size: 14px; color: #9b958a; margin: 0 2px; }
.g-meta .g-chip { border: 1.5px solid #b3a898; border-radius: 10px 13px 9px 12px; padding: 1px 9px; color: #6f675c; }
.g-actions { display: flex; gap: 8px; margin-top: 14px; }
.g-btn { font: inherit; font-size: 15px; padding: 5px 14px; border: 2px solid #2b2621; border-radius: 12px 15px 10px 14px; background: #f9f0e6; color: #2b2621; cursor: pointer; text-decoration: none; }
.g-btn.red { border-color: #d64533; color: #d64533; }
.g-btn:hover { background: #fff; }
.g-empty { margin-top: 60px; font-size: 22px; color: #6f675c; }
.g-foot { margin-top: 70px; color: #9b958a; font-size: 14px; }
.g-center { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #f9f0e6; color: #2b2621;
	font-family: 'Shantell Sans', system-ui, sans-serif; font-size: 22px; }
.g-center a { color: #d64533; }
@keyframes g-develop { 0% { opacity: .15 } 50% { opacity: .6 } 100% { opacity: .15 } }
.g-loading { animation: g-develop 1.6s steps(6, end) infinite; }
`

// A wobbly pen line, the same idea as the slides' underline.
function PenLine({ color = '#d64533', width = 460, seed = 3, sw = 4 }) {
	let a = seed
	const r = () => ((a = (a * 9301 + 49297) % 233280) / 233280 - 0.5) * 2
	const pts = Array.from({ length: 13 }, (_, i) => [(width * i) / 12, 4 + Math.sin(i * 0.9) * 1.6 + r() * 1.2])
	const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')
	return (
		<svg className="g-line" viewBox={`0 0 ${width} 8`} preserveAspectRatio="none">
			<path d={d} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
		</svg>
	)
}

const tilt = (i) => [-1.4, 0.9, -0.6, 1.3, -1, 0.5][i % 6]
const deckUrl = (slug) => `${location.origin}${location.pathname}#/${slug}`

function Card({ d, i }) {
	const [copied, setCopied] = useState(false)
	const copy = (e) => {
		e.preventDefault()
		navigator.clipboard?.writeText(deckUrl(d.slug)).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1400)))
	}
	return (
		<a className="g-card" href={`#/${d.slug}`} style={{ transform: `rotate(${tilt(i)}deg)` }}>
			<span className="g-peg" />
			<div className="g-cover">{d.cover ? <img src={d.cover} alt="" loading="lazy" /> : <div className="g-ph">{d.title}</div>}</div>
			<div className="g-title">{d.title}</div>
			{d.subtitle && <div className="g-sub">{d.subtitle}</div>}
			{d.description && <p className="g-desc">{d.description}</p>}
			<div className="g-meta">
				{d.date && <span>{d.date}</span>}
				<span>{d.slides} slides</span>
				{!d.listed && <span className="g-chip">unlisted</span>}
				{d.tags.map((t) => <span className="g-chip" key={t}>{t}</span>)}
			</div>
			<div className="g-actions">
				<span className="g-btn red">open →</span>
				<button className="g-btn" onClick={copy}>{copied ? 'copied!' : 'copy link'}</button>
			</div>
		</a>
	)
}

export function Gallery() {
	const [decks, setDecks] = useState(null)
	const [q, setQ] = useState('')
	const [tag, setTag] = useState(null)
	useEffect(() => {
		document.title = `Presentations · ${OWNER}`
		fetch('decks/index.json').then((r) => r.json()).then((ix) => setDecks(ix.decks), () => setDecks([]))
	}, [])
	const visible = useMemo(() => (decks ?? []).filter((d) => showAll || d.listed), [decks])
	const tags = useMemo(() => [...new Set(visible.flatMap((d) => d.tags))].sort(), [visible])
	const shown = visible.filter((d) => {
		if (tag && !d.tags.includes(tag)) return false
		const s = q.trim().toLowerCase()
		return !s || [d.title, d.subtitle, d.description, d.tags.join(' ')].join(' ').toLowerCase().includes(s)
	})
	return (
		<div className="g-page">
			<style>{CSS}</style>
			<div className="g-wrap">
				<header className="g-head">
					<h1>Presentations</h1>
					<PenLine />
					<p>by {OWNER} · drawn by hand in tldraw · click one to open it, press ▶ Present inside</p>
				</header>
				{decks && visible.length > 0 && (
					<div className="g-tools">
						<input className="g-search" placeholder="search…" value={q} onChange={(e) => setQ(e.target.value)} />
						{tags.map((t) => (
							<button key={t} className={`g-tag${tag === t ? ' on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>
								{t}
							</button>
						))}
					</div>
				)}
				{!decks ? (
					<div className="g-empty g-loading">developing…</div>
				) : shown.length === 0 ? (
					<div className="g-empty">{visible.length ? 'nothing matches that.' : 'no presentations yet.'}</div>
				) : (
					<>
						<div className="g-string">
							<svg viewBox="0 0 1000 26" preserveAspectRatio="none">
								<path d="M0 6 Q 500 24 1000 6" stroke="#9b958a" strokeWidth="2" fill="none" />
							</svg>
						</div>
						<div className="g-grid">
							{shown.map((d, i) => <Card key={d.slug} d={d} i={i} />)}
						</div>
					</>
				)}
				<div className="g-foot">{decks ? `${visible.length} presentation${visible.length === 1 ? '' : 's'}` : ''}</div>
			</div>
		</div>
	)
}

export function Loading() {
	return (
		<div className="g-center">
			<style>{CSS}</style>
			<span className="g-loading">developing…</span>
		</div>
	)
}

export function NotFound({ slug }) {
	return (
		<div className="g-center">
			<style>{CSS}</style>
			<div>There's no presentation called “{slug}”.</div>
			<a href="#/">see all presentations</a>
		</div>
	)
}
