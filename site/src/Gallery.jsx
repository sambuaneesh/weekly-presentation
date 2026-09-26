// The home page: a folder of presentations. Shows the folders and decks in one folder of decks/
// (from decks/index.json, written by scripts/export-decks.mjs), with a trail back up.
// Hidden decks ("listed": false) aren't shown but still open by their link; ?all shows them.
import { useEffect, useState } from 'react'

const OWNER = import.meta.env.VITE_SITE_OWNER || 'Aneesh S'
const showAll = new URLSearchParams(location.search).has('all')

const CSS = `
.g-page { height: 100vh; overflow-y: auto; box-sizing: border-box; background: #f9f0e6; color: #2b2621; font-family: 'Shantell Sans', 'Comic Neue', system-ui, sans-serif;
	background-image: radial-gradient(ellipse at 50% 0%, rgba(214,69,51,.07), rgba(214,69,51,0) 55%); }
.g-wrap { max-width: 1120px; margin: 0 auto; padding: 56px 28px 90px; }
.g-trail { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.g-trail a, .g-trail span { font-size: clamp(34px, 5vw, 58px); font-weight: 700; color: #2b2621; text-decoration: none; line-height: 1.1; }
.g-trail a { color: #9b958a; }
.g-trail a:hover { color: #d64533; }
.g-trail .g-slash { color: #d64533; font-weight: 400; }
.g-line { height: 7px; width: min(420px, 70%); margin: 6px 0 12px; display: block; }
.g-by { margin: 0; color: #6f675c; font-size: 18px; }
.g-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 40px 30px; margin-top: 44px; }
.g-card { position: relative; display: block; text-decoration: none; color: inherit; background: #fffdf8; border: 2px solid #2b2621; border-radius: 6px 9px 7px 10px;
	padding: 14px 14px 16px; box-shadow: 3px 4px 0 rgba(43,38,33,.12); transition: transform .12s steps(3, end); }
.g-card:hover { transform: rotate(0deg) translateY(-4px) !important; box-shadow: 5px 7px 0 rgba(43,38,33,.16); }
.g-cover { aspect-ratio: 16 / 9; border: 1.5px solid #b3a898; border-radius: 3px; overflow: hidden; background: #f9f0e6; display: flex; align-items: center; justify-content: center; }
.g-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.g-cover .g-ph { font-size: 28px; padding: 0 20px; text-align: center; line-height: 1.15; }
.g-title { font-size: 24px; font-weight: 700; margin: 12px 2px 4px; line-height: 1.15; }
.g-desc { font-size: 15.5px; line-height: 1.4; margin: 0 2px 4px; color: #4d4841; }
.g-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; font-size: 14px; color: #9b958a; }
.g-btn { font: inherit; font-size: 14px; padding: 4px 12px; border: 1.5px solid #2b2621; border-radius: 11px 14px 10px 13px; background: #f9f0e6; color: #2b2621; cursor: pointer; }
.g-btn:hover { background: #fff; }
.g-folder { background: transparent; border: none; box-shadow: none; padding: 0; }
.g-folder svg { display: block; width: 100%; height: auto; overflow: visible; }
.g-folder .g-ftitle { position: absolute; left: 26px; right: 26px; top: 42%; font-size: 26px; font-weight: 700; line-height: 1.15; }
.g-folder .g-fcount { position: absolute; left: 26px; bottom: 22px; font-size: 15px; color: #6f675c; }
.g-empty { margin-top: 60px; font-size: 22px; color: #6f675c; }
.g-center { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #f9f0e6; color: #2b2621;
	font-family: 'Shantell Sans', system-ui, sans-serif; font-size: 22px; }
.g-center a { color: #d64533; }
@keyframes g-develop { 0% { opacity: .15 } 50% { opacity: .6 } 100% { opacity: .15 } }
.g-loading { animation: g-develop 1.6s steps(6, end) infinite; }
`

function PenLine() {
	return (
		<svg className="g-line" viewBox="0 0 420 8" preserveAspectRatio="none">
			<path d="M0 4 Q 105 1 210 5 T 420 3" stroke="#d64533" strokeWidth="4" fill="none" strokeLinecap="round" />
		</svg>
	)
}

// A folder, drawn: a tab and a slightly wobbly body.
function FolderShape() {
	return (
		<svg viewBox="0 0 320 200" aria-hidden="true">
			<path d="M8 34 Q 8 22 20 22 L 104 21 Q 114 21 120 32 L 128 44 L 300 43 Q 312 43 312 56 L 313 184 Q 313 194 302 194 L 18 195 Q 7 195 7 184 Z" fill="#fffdf8" stroke="#2b2621" strokeWidth="2.5" strokeLinejoin="round" />
			<path d="M8 60 L 312 58" stroke="#b3a898" strokeWidth="1.5" strokeDasharray="4 6" />
		</svg>
	)
}

const tilt = (i) => [-1.2, 0.9, -0.6, 1.1, -0.9, 0.5][i % 6]
const urlFor = (p) => `${location.origin}${location.pathname}#/${p}`

function DeckCard({ d, i }) {
	const [copied, setCopied] = useState(false)
	const copy = (e) => {
		e.preventDefault()
		navigator.clipboard?.writeText(urlFor(d.path)).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1400)))
	}
	return (
		<a className="g-card" href={`#/${d.path}`} style={{ transform: `rotate(${tilt(i)}deg)` }}>
			<div className="g-cover">{d.cover ? <img src={d.cover} alt="" loading="lazy" /> : <div className="g-ph">{d.title}</div>}</div>
			<div className="g-title">{d.title}</div>
			{d.description && <p className="g-desc">{d.description}</p>}
			<div className="g-foot">
				<span>{d.slides} slides{d.listed ? '' : ' · hidden'}</span>
				<button className="g-btn" onClick={copy}>{copied ? 'copied!' : 'copy link'}</button>
			</div>
		</a>
	)
}

function FolderCard({ f, count, i }) {
	return (
		<a className="g-card g-folder" href={`#/${f.path}`} style={{ transform: `rotate(${tilt(i + 3) / 2}deg)` }}>
			<FolderShape />
			<div className="g-ftitle">{f.title}</div>
			<div className="g-fcount">{count} presentation{count === 1 ? '' : 's'}</div>
		</a>
	)
}

export function Gallery({ index, folder = '' }) {
	const visible = (d) => showAll || d.listed
	const here = index.folders.find((f) => f.path === folder)
	useEffect(() => {
		document.title = here ? `${here.title} · presentations` : `Presentations · ${OWNER}`
	}, [folder])
	const subfolders = index.folders.filter((f) => f.folder === folder)
	const decks = index.decks.filter((d) => d.folder === folder && visible(d))
	const countIn = (p) => index.decks.filter((d) => visible(d) && (d.folder === p || d.folder.startsWith(p + '/'))).length
	// The trail: Presentations / mono2micro / …
	const trail = [{ path: '', title: 'Presentations' }]
	if (folder) folder.split('/').forEach((_, i, parts) => trail.push(index.folders.find((f) => f.path === parts.slice(0, i + 1).join('/')) ?? { path: parts.slice(0, i + 1).join('/'), title: parts[i] }))
	return (
		<div className="g-page">
			<style>{CSS}</style>
			<div className="g-wrap">
				<header>
					<div className="g-trail">
						{trail.map((t, i) => (
							<span key={t.path} style={{ display: 'contents' }}>
								{i > 0 && <span className="g-slash">/</span>}
								{i < trail.length - 1 ? <a href={`#/${t.path}`}>{t.title}</a> : <span>{t.title}</span>}
							</span>
						))}
					</div>
					<PenLine />
					<p className="g-by">{here?.description || `by ${OWNER} · drawn by hand in tldraw`}</p>
				</header>
				{subfolders.length + decks.length === 0 ? (
					<div className="g-empty">nothing here yet.</div>
				) : (
					<div className="g-grid">
						{subfolders.map((f, i) => <FolderCard key={f.path} f={f} count={countIn(f.path)} i={i} />)}
						{decks.map((d, i) => <DeckCard key={d.path} d={d} i={i + subfolders.length} />)}
					</div>
				)}
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

export function NotFound({ path }) {
	return (
		<div className="g-center">
			<style>{CSS}</style>
			<div>There's nothing at “{path}”.</div>
			<a href="#/">see all presentations</a>
		</div>
	)
}
