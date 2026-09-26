#!/usr/bin/env node
// Export every deck in ../decks for the website:
//   public/decks/index.json        the gallery: one entry per deck (deck.json + slug, slide count, cover)
//   public/decks/<slug>.json       the deck itself: a tldraw store snapshot the site loads on demand
//   public/decks/<slug>.jpg        its cover, if the deck folder has cover.jpg / cover.png
// A .tldraw file is a zip holding db.sqlite (one JSON record per row) plus the board script; only
// document records are kept. Needs Node 22.13+ (node:sqlite). Works whether or not tldraw is open.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DECKS = path.resolve(SITE, '../decks')
const OUT = path.join(SITE, 'public', 'decks')

// Read one entry out of a zip via its central directory (stored or deflated entries).
function readZipEntry(buf, name, input) {
	const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
	if (eocd < 0) throw new Error('not a zip file')
	let p = buf.readUInt32LE(eocd + 16)
	const count = buf.readUInt16LE(eocd + 10)
	for (let i = 0; i < count; i++) {
		const method = buf.readUInt16LE(p + 10)
		const size = buf.readUInt32LE(p + 20)
		const nameLen = buf.readUInt16LE(p + 28)
		const extraLen = buf.readUInt16LE(p + 30)
		const commentLen = buf.readUInt16LE(p + 32)
		const local = buf.readUInt32LE(p + 42)
		const entryName = buf.toString('utf8', p + 46, p + 46 + nameLen)
		if (entryName === name) {
			const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
			const data = buf.subarray(start, start + size)
			if (method === 0) return data
			if (method === 8) return zlib.inflateRawSync(data)
			throw new Error(`unsupported zip compression method ${method}`)
		}
		p += 46 + nameLen + extraLen + commentLen
	}
	throw new Error(`${name} not found in ${input}`)
}

const KEEP = new Set(['document', 'page', 'shape', 'binding', 'asset'])

function exportDeck(input) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-'))
	try {
		const dbPath = path.join(tmp, 'db.sqlite')
		fs.writeFileSync(dbPath, readZipEntry(fs.readFileSync(input), 'db.sqlite', input))
		const db = new DatabaseSync(dbPath, { readOnly: true })
		const schema = JSON.parse(db.prepare('select schema from metadata').get().schema)
		const store = {}
		for (const row of db.prepare('select state from documents').all()) {
			const record = JSON.parse(Buffer.from(row.state).toString('utf8'))
			if (KEEP.has(record.typeName)) store[record.id] = record
		}
		db.close()
		const local = Object.values(store).filter((r) => r.typeName === 'asset' && r.props?.src && !/^(https?:|data:)/.test(r.props.src))
		if (local.length) console.warn(`  warning: ${local.length} image/video asset(s) in ${path.basename(input)} reference local files and won't show on the site`)
		const pages = Object.values(store).filter((r) => r.typeName === 'page').map((p) => p.id)
		const slides = Object.values(store).filter((r) => r.type === 'frame' && pages.includes(r.parentId)).length
		return { snapshot: { store, schema }, slides }
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true })
	}
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
const index = []
for (const entry of fs.readdirSync(DECKS, { withFileTypes: true })) {
	if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) continue
	const slug = entry.name
	const dir = path.join(DECKS, slug)
	const file = path.join(dir, `${slug}.tldraw`)
	if (!fs.existsSync(file)) {
		console.warn(`skip ${slug}: no ${slug}.tldraw`)
		continue
	}
	let meta = {}
	try {
		meta = JSON.parse(fs.readFileSync(path.join(dir, 'deck.json'), 'utf8'))
	} catch {
		console.warn(`  ${slug}: no readable deck.json; using the folder name`)
	}
	const { snapshot, slides } = exportDeck(file)
	fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(snapshot))
	const coverSrc = ['cover.jpg', 'cover.png'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f))
	let cover = null
	if (coverSrc) {
		cover = `decks/${slug}${path.extname(coverSrc)}`
		fs.copyFileSync(coverSrc, path.join(SITE, 'public', cover))
	}
	index.push({ slug, title: meta.title ?? slug, subtitle: meta.subtitle ?? '', date: meta.date ?? '', presenter: meta.presenter ?? '', description: meta.description ?? '', tags: meta.tags ?? [], listed: meta.listed !== false, pinned: !!meta.pinned, slides, cover })
	console.log(`exported ${slug}: ${slides} slides${cover ? ' + cover' : ''}`)
}
index.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ generated: new Date().toISOString(), decks: index }, null, 1))
console.log(`${index.length} deck(s) → ${path.relative(process.cwd(), OUT)}`)
