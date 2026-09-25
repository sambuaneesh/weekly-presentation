#!/usr/bin/env node
// Export a tldraw Desktop .tldraw file to a tldraw store snapshot the website can load.
//   node scripts/export-deck.mjs <deck.tldraw> <out.json>
// A .tldraw file is a zip holding db.sqlite (one JSON record per row) plus the board script.
// Only document records are kept: pages, shapes, bindings, assets and the document itself.
// Needs Node 22.13+ (built-in node:sqlite). Works whether or not tldraw Desktop is open.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { DatabaseSync } from 'node:sqlite'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
	console.error('usage: node scripts/export-deck.mjs <deck.tldraw> <out.json>')
	process.exit(1)
}

// Read one entry out of a zip via its central directory (stored or deflated entries).
function readZipEntry(buf, name) {
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deck-'))
try {
	const dbPath = path.join(tmp, 'db.sqlite')
	fs.writeFileSync(dbPath, readZipEntry(fs.readFileSync(input), 'db.sqlite'))
	const db = new DatabaseSync(dbPath, { readOnly: true })
	const schema = JSON.parse(db.prepare('select schema from metadata').get().schema)
	const store = {}
	const skipped = {}
	for (const row of db.prepare('select state from documents').all()) {
		const record = JSON.parse(Buffer.from(row.state).toString('utf8'))
		if (KEEP.has(record.typeName)) store[record.id] = record
		else skipped[record.typeName] = (skipped[record.typeName] ?? 0) + 1
	}
	db.close()

	// Assets that point at files inside the desktop archive can't load on the web.
	const local = Object.values(store).filter((r) => r.typeName === 'asset' && r.props?.src && !/^(https?:|data:)/.test(r.props.src))
	if (local.length) console.warn(`warning: ${local.length} image/video asset(s) reference local files and won't show on the site`)

	fs.mkdirSync(path.dirname(output), { recursive: true })
	fs.writeFileSync(output, JSON.stringify({ store, schema }))
	const frames = Object.values(store).filter((r) => r.type === 'frame').length
	console.log(`exported ${Object.keys(store).length} records (${frames} slides) → ${output}` + (Object.keys(skipped).length ? `; skipped ${JSON.stringify(skipped)}` : ''))
} finally {
	fs.rmSync(tmp, { recursive: true, force: true })
}
