// Read and write .tldraw files without tldraw Desktop. A .tldraw file is a zip: db.sqlite (one JSON
// record per row), metadata.json, preview.png, session.json and the board script under script/.
// Used to make new decks from presentation-pack/paper/starter.tldraw, and to read decks for export.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { DatabaseSync } from 'node:sqlite'

// ---------- zip ----------
export function readZip(buf) {
	const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
	if (eocd < 0) throw new Error('not a zip file')
	let p = buf.readUInt32LE(eocd + 16)
	const count = buf.readUInt16LE(eocd + 10)
	const entries = []
	for (let i = 0; i < count; i++) {
		const method = buf.readUInt16LE(p + 10)
		const size = buf.readUInt32LE(p + 20)
		const nameLen = buf.readUInt16LE(p + 28)
		const extraLen = buf.readUInt16LE(p + 30)
		const commentLen = buf.readUInt16LE(p + 32)
		const local = buf.readUInt32LE(p + 42)
		const name = buf.toString('utf8', p + 46, p + 46 + nameLen)
		const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
		const raw = buf.subarray(start, start + size)
		if (method !== 0 && method !== 8) throw new Error(`unsupported zip compression method ${method}`)
		entries.push({ name, data: method === 8 ? zlib.inflateRawSync(raw) : Buffer.from(raw) })
		p += 46 + nameLen + extraLen + commentLen
	}
	return entries
}

export function writeZip(entries) {
	const locals = []
	const centrals = []
	let offset = 0
	for (const { name, data } of entries) {
		const nameBuf = Buffer.from(name, 'utf8')
		const isDir = name.endsWith('/')
		// Store the database and images as-is (like tldraw does); deflate text.
		const deflate = !isDir && /\.(js|json|txt|md)$/.test(name)
		const body = deflate ? zlib.deflateRawSync(data) : data
		const crc = isDir ? 0 : zlib.crc32(data)
		const method = deflate ? 8 : 0
		const local = Buffer.alloc(30)
		local.writeUInt32LE(0x04034b50, 0)
		local.writeUInt16LE(20, 4)
		local.writeUInt16LE(0x0800, 6) // UTF-8 names
		local.writeUInt16LE(method, 8)
		local.writeUInt32LE(crc, 14)
		local.writeUInt32LE(body.length, 18)
		local.writeUInt32LE(data.length, 22)
		local.writeUInt16LE(nameBuf.length, 26)
		const central = Buffer.alloc(46)
		central.writeUInt32LE(0x02014b50, 0)
		central.writeUInt16LE(20, 4)
		central.writeUInt16LE(20, 6)
		central.writeUInt16LE(0x0800, 8)
		central.writeUInt16LE(method, 10)
		central.writeUInt32LE(crc, 16)
		central.writeUInt32LE(body.length, 20)
		central.writeUInt32LE(data.length, 24)
		central.writeUInt16LE(nameBuf.length, 28)
		central.writeUInt32LE(isDir ? 0x10 : 0, 38)
		central.writeUInt32LE(offset, 42)
		locals.push(local, nameBuf, body)
		centrals.push(central, nameBuf)
		offset += local.length + nameBuf.length + body.length
	}
	const cd = Buffer.concat(centrals)
	const end = Buffer.alloc(22)
	end.writeUInt32LE(0x06054b50, 0)
	end.writeUInt16LE(entries.length, 8)
	end.writeUInt16LE(entries.length, 10)
	end.writeUInt32LE(cd.length, 12)
	end.writeUInt32LE(offset, 16)
	return Buffer.concat([...locals, cd, end])
}

// ---------- records ----------
function withDb(dbBuf, fn) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tldraw-'))
	try {
		const file = path.join(tmp, 'db.sqlite')
		fs.writeFileSync(file, dbBuf)
		const db = new DatabaseSync(file)
		try {
			fn(db)
		} finally {
			db.close()
		}
		return fs.readFileSync(file)
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true })
	}
}

// All records of a .tldraw file (and its schema), without touching the file.
export function readRecords(file) {
	const entries = readZip(fs.readFileSync(file))
	const dbEntry = entries.find((e) => e.name === 'db.sqlite')
	if (!dbEntry) throw new Error(`${file}: no db.sqlite`)
	let out
	withDb(dbEntry.data, (db) => {
		const schema = JSON.parse(db.prepare('select schema from metadata').get().schema)
		const records = db.prepare('select state from documents').all().map((r) => JSON.parse(Buffer.from(r.state).toString('utf8')))
		out = { schema, records }
	})
	return out
}

// Copy a template .tldraw to `out`, replacing {{KEY}} placeholders inside every record (and the
// display name). Values are inserted as JSON string content, so any text is safe.
export function stampFile(template, out, values, displayName) {
	const entries = readZip(fs.readFileSync(template))
	const esc = (v) => JSON.stringify(String(v)).slice(1, -1)
	const replace = (s) => s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in values ? esc(values[k]) : m))
	for (const e of entries) {
		if (e.name === 'db.sqlite') {
			e.data = withDb(e.data, (db) => {
				const update = db.prepare('update documents set state = ? where id = ?')
				for (const row of db.prepare('select id, state from documents').all()) {
					const text = Buffer.from(row.state).toString('utf8')
					const next = replace(text)
					if (next !== text) update.run(Buffer.from(next, 'utf8'), row.id)
				}
			})
		} else if (e.name === 'metadata.json') {
			const meta = JSON.parse(e.data.toString('utf8'))
			if (displayName) meta.displayName = displayName
			e.data = Buffer.from(JSON.stringify(meta, null, '\t'), 'utf8')
		} else if (e.name === 'session.json') {
			// Open a new deck on its first slide, not wherever the template was last viewed.
			const s = JSON.parse(e.data.toString('utf8'))
			for (const ps of s.pageStates ?? []) ps.selectedShapeIds = []
			e.data = Buffer.from(JSON.stringify(s), 'utf8')
		}
	}
	fs.mkdirSync(path.dirname(out), { recursive: true })
	fs.writeFileSync(out, writeZip(entries))
}
