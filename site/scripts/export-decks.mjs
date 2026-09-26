#!/usr/bin/env node
// Export everything in ../decks for the website:
//   public/decks/index.json          folders and decks (from folder.json / deck.json), for the gallery
//   public/decks/<path>.json         each deck, a tldraw store snapshot the site loads on demand
//   public/decks/<path>.jpg|.png     its cover, if the deck folder has one
// <path> is the deck's place in the tree, e.g. mono2micro/agentic-workflow. Needs Node 22.13+
// (node:sqlite). Reads the saved .tldraw files; works whether or not tldraw Desktop is open.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { walk } from '../../bin/deck.mjs'
import { readRecords } from '../../bin/lib/tldraw-file.mjs'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(SITE, 'public', 'decks')
const KEEP = new Set(['document', 'page', 'shape', 'binding', 'asset'])

function exportDeck(file) {
	const { schema, records } = readRecords(file)
	const store = {}
	for (const r of records) if (KEEP.has(r.typeName)) store[r.id] = r
	const local = Object.values(store).filter((r) => r.typeName === 'asset' && r.props?.src && !/^(https?:|data:)/.test(r.props.src))
	if (local.length) console.warn(`  warning: ${local.length} image/video asset(s) in ${path.basename(file)} reference local files and won't show on the site`)
	const pages = Object.values(store).filter((r) => r.typeName === 'page').map((p) => p.id)
	const slides = Object.values(store).filter((r) => r.type === 'frame' && pages.includes(r.parentId)).length
	return { snapshot: { store, schema }, slides }
}

const { folders, decks } = walk()
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const index = { generated: new Date().toISOString(), folders: folders.map(({ path: p, folder, title, description }) => ({ path: p, folder, title, description })), decks: [] }
for (const d of decks) {
	if (!d.hasFile) {
		console.warn(`skip ${d.path}: no ${d.name}.tldraw`)
		continue
	}
	const { snapshot, slides } = exportDeck(d.file)
	const out = path.join(OUT, `${d.path}.json`)
	fs.mkdirSync(path.dirname(out), { recursive: true })
	fs.writeFileSync(out, JSON.stringify(snapshot))
	let cover = null
	if (d.cover) {
		cover = `decks/${d.path}${path.extname(d.cover)}`
		fs.copyFileSync(d.cover, path.join(SITE, 'public', cover))
	}
	index.decks.push({ path: d.path, folder: d.folder, title: d.meta.title ?? d.name, description: d.meta.description ?? '', date: d.meta.date ?? '', listed: d.meta.listed !== false, slides, cover })
	console.log(`exported ${d.path}: ${slides} slides${cover ? ' + cover' : ''}`)
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1))
console.log(`${index.folders.length} folder(s), ${index.decks.length} deck(s) → ${path.relative(process.cwd(), OUT)}`)
