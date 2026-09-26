#!/usr/bin/env node
// Studio: a local web app for organising the presentations: folders, decks, what the website shows,
// covers, previewing and committing. It works on the files in decks/ (through bin/deck.mjs), so it
// never needs tldraw Desktop: make a deck here, then open its .tldraw file in tldraw to draw it.
//
//   node studio/server.mjs [--port 4321] [--no-open]      (or: npm run studio)
//
// It listens on 127.0.0.1 only, and every write needs the `x-studio` header (which a page from
// another site can't send), so nothing outside this machine can drive it.
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { walk, newDeck, makeFolder, moveEntry, slugify, openDocs } from '../bin/deck.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const DECKS = path.join(ROOT, 'decks')
const PUBLIC = path.join(HERE, 'public')
const DECK_TOOL = path.join(ROOT, 'bin', 'deck.mjs')
const argv = process.argv.slice(2)
const PORT = Number(argv[argv.indexOf('--port') + 1]) || Number(process.env.STUDIO_PORT) || 4321
const SITE_PORT = 5173

// ---------- helpers ----------
function httpError(status, message) {
	return Object.assign(new Error(message), { status })
}
const readJson = (f) => {
	try {
		return JSON.parse(fs.readFileSync(f, 'utf8'))
	} catch {
		return null
	}
}
// A path inside decks/ that exists: "mono2micro/agentic-workflow".
function entry(p) {
	const rel = String(p ?? '').replace(/^\/+|\/+$/g, '')
	if (!rel || !rel.split('/').every((s) => /^[a-z0-9][a-z0-9-]*$/.test(s))) throw httpError(400, `bad path "${p}"`)
	const dir = path.join(DECKS, rel)
	if (!fs.existsSync(dir)) throw httpError(404, `nothing at decks/${rel}`)
	return { rel, dir, isDeck: fs.existsSync(path.join(dir, 'deck.json')) }
}
function sh(cmd, args, opts = {}) {
	return new Promise((resolve) => {
		execFile(cmd, args, { cwd: ROOT, maxBuffer: 8 << 20, ...opts }, (err, stdout, stderr) => resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr }))
	})
}
// Moving, renaming or deleting a deck tldraw has open would leave tldraw saving to the old place.
async function assertClosed(rel) {
	const docs = (await openDocs()) ?? []
	const root = path.resolve(DECKS, rel)
	const open = docs.filter((d) => d.filePath && (path.resolve(d.filePath) + path.sep).startsWith(root + path.sep))
	if (open.length) throw httpError(409, `close ${open.map((d) => d.name).join(', ')} in tldraw first`)
}
let exporting = null
function refreshExport() {
	if (exporting) return exporting
	exporting = sh(process.execPath, [DECK_TOOL, 'export']).finally(() => (exporting = null))
	return exporting
}
const changed = (value) => (refreshExport(), value ?? { ok: true })

// ---------- the tree ----------
async function tree() {
	const { folders, decks } = walk()
	const docs = (await openDocs()) ?? []
	const index = readJson(path.join(ROOT, 'site', 'public', 'decks', 'index.json')) ?? { decks: [] }
	return {
		folders,
		decks: decks.map((d) => ({
			path: d.path,
			name: d.name,
			folder: d.folder,
			title: d.meta.title ?? d.name,
			description: d.meta.description ?? '',
			listed: d.meta.listed !== false,
			file: path.relative(ROOT, d.file),
			slides: index.decks.find((x) => x.path === d.path)?.slides ?? null,
			cover: d.cover ? `/decks/${d.path}/${path.basename(d.cover)}?v=${fs.statSync(d.cover).mtimeMs | 0}` : null,
			open: docs.some((x) => x.filePath && path.resolve(x.filePath) === d.file),
		})),
	}
}

function editDeck(p, patch) {
	const { dir, isDeck } = entry(p)
	if (!isDeck) throw httpError(400, 'not a deck')
	const file = path.join(dir, 'deck.json')
	const meta = readJson(file) ?? {}
	if ('title' in patch) meta.title = String(patch.title ?? '').trim().slice(0, 200)
	if ('description' in patch) meta.description = String(patch.description ?? '').trim().slice(0, 1000)
	if ('listed' in patch) meta.listed = !!patch.listed
	if (!meta.title) throw httpError(400, 'a deck needs a title')
	fs.writeFileSync(file, JSON.stringify(meta, null, '\t') + '\n')
	return changed(meta)
}

function editFolder(p, patch) {
	const { dir, isDeck } = entry(p)
	if (isDeck) throw httpError(400, 'not a folder')
	const file = path.join(dir, 'folder.json')
	const meta = readJson(file) ?? {}
	if ('title' in patch) meta.title = String(patch.title ?? '').trim().slice(0, 200) || meta.title
	if ('description' in patch) meta.description = String(patch.description ?? '').trim().slice(0, 1000)
	fs.writeFileSync(file, JSON.stringify(meta, null, '\t') + '\n')
	return changed(meta)
}

async function rename(p, name) {
	const { rel, dir, isDeck } = entry(p)
	name = slugify(name)
	await assertClosed(rel)
	const target = path.join(path.dirname(dir), name)
	if (target === dir) return { path: rel }
	if (fs.existsSync(target)) throw httpError(409, `${name} already exists here`)
	fs.renameSync(dir, target)
	const oldFile = path.join(target, `${path.basename(rel)}.tldraw`)
	if (isDeck && fs.existsSync(oldFile)) fs.renameSync(oldFile, path.join(target, `${name}.tldraw`))
	return changed({ path: path.relative(DECKS, target).split(path.sep).join('/') })
}

async function move(p, to) {
	const { rel } = entry(p)
	await assertClosed(rel)
	try {
		return changed({ path: moveEntry(rel, to ?? '') })
	} catch (e) {
		throw httpError(400, e.message)
	}
}

async function remove(p, confirm) {
	const { rel, dir } = entry(p)
	if (confirm !== path.basename(rel)) throw httpError(400, `type ${path.basename(rel)} to confirm`)
	await assertClosed(rel)
	fs.rmSync(dir, { recursive: true, force: true })
	return changed()
}

function saveCover(p, dataUrl) {
	const { dir, isDeck } = entry(p)
	if (!isDeck) throw httpError(400, 'not a deck')
	const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(String(dataUrl))
	if (!m) throw httpError(400, 'use a PNG or JPEG')
	const buf = Buffer.from(m[2], 'base64')
	if (buf.length > 5 << 20) throw httpError(400, 'cover is over 5 MB')
	for (const f of ['cover.jpg', 'cover.png']) fs.rmSync(path.join(dir, f), { force: true })
	fs.writeFileSync(path.join(dir, m[1] === 'png' ? 'cover.png' : 'cover.jpg'), buf)
	return changed()
}

// ---------- git ----------
async function gitStatus() {
	const s = await sh('git', ['status', '--porcelain=v1', '-b', '--untracked-files=all'])
	if (s.code) return { error: s.stderr.trim() || 'not a git repository' }
	const lines = s.stdout.split('\n').filter(Boolean)
	const head = lines.shift() ?? ''
	return {
		branch: /^## ([^.\s]+)/.exec(head)?.[1] ?? '?',
		ahead: Number(/ahead (\d+)/.exec(head)?.[1] ?? 0),
		behind: Number(/behind (\d+)/.exec(head)?.[1] ?? 0),
		last: (await sh('git', ['log', '-1', '--pretty=%h %s'])).stdout.trim(),
		changes: lines.map((l) => ({ code: l.slice(0, 2).trim(), path: l.slice(3) })),
	}
}
async function gitCommit(message) {
	message = String(message ?? '').trim()
	if (!message) throw httpError(400, 'write a commit message')
	await sh('git', ['add', '-A'])
	const r = await sh('git', ['commit', '-m', message])
	if (r.code) throw httpError(400, (r.stdout + r.stderr).trim() || 'nothing to commit')
	return { output: (r.stdout + r.stderr).trim() }
}
async function gitPush() {
	const r = await sh('git', ['push'], { timeout: 120000 })
	if (r.code) throw httpError(400, (r.stdout + r.stderr).trim() || 'push failed')
	return { output: (r.stdout + r.stderr).trim() || 'pushed' }
}

// ---------- website preview ----------
let site = null
function probe(host) {
	return new Promise((resolve) => {
		const req = http.get({ host, port: SITE_PORT, path: '/', timeout: 800 }, (res) => (res.resume(), resolve(true)))
		req.on('error', () => resolve(false))
		req.on('timeout', () => (req.destroy(), resolve(false)))
	})
}
// Vite may be on IPv4 or IPv6 localhost, depending on how it was started.
const siteUp = async () => (await probe('127.0.0.1')) || (await probe('::1'))
async function startSite() {
	if (!(await siteUp()) && !site) {
		await refreshExport()
		site = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(SITE_PORT), '--strictPort'], { cwd: path.join(ROOT, 'site'), stdio: 'ignore' })
		site.on('exit', () => (site = null))
	}
	for (let i = 0; i < 60 && !(await siteUp()); i++) await new Promise((r) => setTimeout(r, 250))
	return { url: `http://localhost:${SITE_PORT}/`, running: await siteUp() }
}
process.on('exit', () => site?.kill())
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }
function send(res, status, body, type = 'application/json; charset=utf-8') {
	res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
	res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
}
function readBody(req) {
	return new Promise((resolve, reject) => {
		let data = ''
		req.on('data', (d) => {
			data += d
			if (data.length > 8 << 20) reject(httpError(413, 'too large'))
		})
		req.on('end', () => {
			try {
				resolve(data ? JSON.parse(data) : {})
			} catch {
				reject(httpError(400, 'bad JSON'))
			}
		})
	})
}
function serveFile(res, file) {
	if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, { error: 'not found' })
	send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] ?? 'application/octet-stream')
}
// deck.mjs throws plain errors for bad input: send those back as 400s.
const wrap = (fn) => (b) => {
	try {
		return fn(b)
	} catch (e) {
		throw e.status ? e : httpError(400, e.message)
	}
}

const routes = {
	'GET /api/state': async () => ({ ...(await tree()), git: await gitStatus(), site: await siteUp() }),
	'POST /api/new': wrap((b) => changed({ path: newDeck({ title: b.title, folder: b.folder ?? '', description: b.description }) })),
	'POST /api/folder': wrap((b) => changed({ path: makeFolder([b.parent, slugify(b.title ?? '')].filter(Boolean).join('/'), String(b.title ?? '').trim()) })),
	'POST /api/edit': async (b) => (entry(b.path).isDeck ? editDeck(b.path, b) : editFolder(b.path, b)),
	'POST /api/rename': async (b) => rename(b.path, b.name),
	'POST /api/move': async (b) => move(b.path, b.to),
	'POST /api/delete': async (b) => remove(b.path, b.confirm),
	'POST /api/cover': async (b) => saveCover(b.path, b.dataUrl),
	'POST /api/git/commit': async (b) => gitCommit(b.message),
	'POST /api/git/push': async () => gitPush(),
	'POST /api/site': async () => startSite(),
}

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://localhost')
	try {
		if (url.pathname.startsWith('/api/')) {
			// Writes must come from this page: a custom header other sites can't set without CORS.
			if (req.method !== 'GET' && req.headers['x-studio'] !== '1') throw httpError(403, 'missing x-studio header')
			const route = routes[`${req.method} ${url.pathname}`]
			if (!route) throw httpError(404, 'no such endpoint')
			return send(res, 200, await route(req.method === 'GET' ? {} : await readBody(req)))
		}
		const cover = /^\/decks\/((?:[a-z0-9-]+\/)*[a-z0-9-]+)\/(cover\.(?:jpg|png))$/.exec(url.pathname)
		if (cover) return serveFile(res, path.join(DECKS, cover[1], cover[2]))
		const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
		const file = path.join(PUBLIC, path.normalize(rel))
		if (!file.startsWith(PUBLIC)) throw httpError(403, 'no')
		return serveFile(res, file)
	} catch (e) {
		send(res, e.status ?? 500, { error: e.message })
	}
})

server.listen(PORT, '127.0.0.1', () => {
	const url = `http://localhost:${PORT}/`
	console.log(`studio: ${url}  (Ctrl+C to stop)`)
	refreshExport()
	if (!argv.includes('--no-open')) spawn(process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open', [url], { stdio: 'ignore', detached: true }).on('error', () => {}).unref()
})
