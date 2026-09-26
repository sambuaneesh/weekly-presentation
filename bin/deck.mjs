#!/usr/bin/env node
// deck: manage the presentations in decks/. Made to be driven by people and by agents alike.
//
// decks/ is a tree of folders. A folder holding a deck.json (or a <name>.tldraw) is a deck; any other
// folder is just a folder (it may have a folder.json with a title). A deck's path, e.g.
// `mono2micro/agentic-workflow`, is its id here and its link on the website (…/#/mono2micro/agentic-workflow).
//
//   deck list [--json]                        every folder and deck, as a tree
//   deck new "<title>" [--in <folder>] [--name <name>] [--description "…"]
//                                             make a deck from the starter (tldraw not needed)
//   deck folder <path> [--title "…"]          make a folder
//   deck move <deck|folder> <to-folder>       move it (use "." for the top)
//   deck open <deck>                          open it in tldraw Desktop
//   deck install <deck>                       put the presentation pack (+ the deck's ext/) into it
//   deck build <deck> [--only a,b]            draw the deck's code slides (slides/) into it
//   deck cover <deck>                         save its first slide as cover.jpg (the website card)
//   deck check [<deck>]                       validate decks (deck.json, files, slides)
//   deck export                               export everything for the website (site/public/decks)
//
// A deck can be named by its path or by any unique part of it. open/install/build/cover need tldraw
// Desktop; everything else works without it.
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { stampFile } from './lib/tldraw-file.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DECKS = path.join(ROOT, 'decks')
const PACK = path.join(ROOT, 'presentation-pack')
const STARTER = path.join(PACK, 'paper', 'starter.tldraw')
const STARTER_SLIDES = path.join(PACK, 'paper', 'starter')
const PRESENTER = process.env.DECK_PRESENTER || 'Aneesh S'
const run = (script, args) =>
	new Promise((resolve) => {
		const p = spawn(process.execPath, [script, ...args], { stdio: 'inherit' })
		p.on('exit', (code) => resolve(code ?? 1))
	})

// ---------- args ----------
function parseArgs(argv) {
	const out = { _: [] }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a.startsWith('--')) {
			const key = a.slice(2)
			const next = argv[i + 1]
			if (next === undefined || next.startsWith('--')) out[key] = true
			else out[key] = argv[++i]
		} else out._.push(a)
	}
	return out
}
// As a command, a problem prints and exits; imported (by the studio), it throws.
const AS_CLI = !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
const die = (msg) => {
	if (!AS_CLI) throw new Error(msg)
	console.error(msg)
	process.exit(1)
}

// ---------- the tree ----------
export const slugify = (s) =>
	String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'untitled'
const NAME = /^[a-z0-9][a-z0-9-]*$/
const skip = (name) => name.startsWith('.') || name.startsWith('_')
const titleFromName = (name) => name.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())
const readJson = (f) => {
	try {
		return JSON.parse(fs.readFileSync(f, 'utf8'))
	} catch {
		return null
	}
}
const isDeckDir = (dir) => fs.existsSync(path.join(dir, 'deck.json')) || fs.existsSync(path.join(dir, `${path.basename(dir)}.tldraw`))

function deckInfo(rel) {
	const dir = path.join(DECKS, rel)
	const name = path.basename(rel)
	const jsonFile = path.join(dir, 'deck.json')
	const meta = readJson(jsonFile)
	const file = path.join(dir, `${name}.tldraw`)
	return {
		kind: 'deck',
		path: rel,
		name,
		folder: path.dirname(rel) === '.' ? '' : path.dirname(rel),
		dir,
		file,
		meta: meta ?? {},
		metaError: meta ? null : fs.existsSync(jsonFile) ? 'deck.json is not valid JSON' : 'deck.json missing',
		hasFile: fs.existsSync(file),
		hasSlides: fs.existsSync(path.join(dir, 'slides', 'manifest.json')),
		hasExt: fs.existsSync(path.join(dir, 'ext', 'index.js')),
		cover: ['cover.jpg', 'cover.png'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f)) ?? null,
	}
}

function folderInfo(rel) {
	const meta = readJson(path.join(DECKS, rel, 'folder.json')) ?? {}
	return { kind: 'folder', path: rel, name: path.basename(rel), folder: path.dirname(rel) === '.' ? '' : path.dirname(rel), title: meta.title || titleFromName(path.basename(rel)), description: meta.description ?? '' }
}

// Walk decks/: every folder and deck, parents before children.
export function walk() {
	const folders = []
	const decks = []
	const visit = (rel) => {
		const dir = path.join(DECKS, rel)
		for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			if (!e.isDirectory() || skip(e.name)) continue
			const child = rel ? `${rel}/${e.name}` : e.name
			if (isDeckDir(path.join(DECKS, child))) decks.push(deckInfo(child))
			else {
				folders.push(folderInfo(child))
				visit(child)
			}
		}
	}
	if (fs.existsSync(DECKS)) visit('')
	decks.sort((a, b) => (b.meta.date ?? '').localeCompare(a.meta.date ?? '') || a.path.localeCompare(b.path))
	return { folders, decks }
}

function findDeck(q) {
	if (!q) die('Which deck? (deck list shows them)')
	const { decks } = walk()
	const exact = decks.find((d) => d.path === q || d.name === q)
	if (exact && decks.filter((d) => d.name === q).length <= 1) return exact
	const s = String(q).toLowerCase()
	const hits = decks.filter((d) => d.path.includes(s) || (d.meta.title ?? '').toLowerCase().includes(s))
	if (hits.length === 1) return hits[0]
	if (!hits.length) die(`No deck matches "${q}". Decks: ${decks.map((d) => d.path).join(', ') || 'none'}`)
	die(`"${q}" matches several decks: ${hits.map((d) => d.path).join(', ')}`)
}

function checkFolderPath(p) {
	const clean = String(p ?? '').replace(/^\/+|\/+$/g, '')
	if (clean === '' || clean === '.') return ''
	for (const part of clean.split('/')) if (!NAME.test(part)) die(`"${part}": folder names are lowercase letters, digits and dashes`)
	if (isDeckDir(path.join(DECKS, clean))) die(`${clean} is a deck, not a folder`)
	return clean
}

// ---------- operations (also used by the studio) ----------
export function makeFolder(rel, title) {
	rel = checkFolderPath(rel)
	if (!rel) die('give the folder a name')
	const dir = path.join(DECKS, rel)
	fs.mkdirSync(dir, { recursive: true })
	// folder.json keeps the folder in git even while it's empty, and holds its title.
	const file = path.join(dir, 'folder.json')
	const meta = readJson(file) ?? {}
	fs.writeFileSync(file, JSON.stringify({ ...meta, title: title || meta.title || titleFromName(path.basename(rel)) }, null, '\t') + '\n')
	return rel
}

export function newDeck({ title, folder = '', name, description = '' }) {
	title = String(title ?? '').trim()
	if (!title) die('a new deck needs a title')
	folder = checkFolderPath(folder)
	name = name ? String(name) : slugify(title)
	if (!NAME.test(name)) die(`"${name}": deck names are lowercase letters, digits and dashes`)
	const rel = folder ? `${folder}/${name}` : name
	const dir = path.join(DECKS, rel)
	if (fs.existsSync(dir)) die(`decks/${rel} already exists`)
	if (folder && !fs.existsSync(path.join(DECKS, folder))) makeFolder(folder)
	fs.mkdirSync(path.join(dir, 'slides'), { recursive: true })
	const meta = { title, description: String(description ?? '').trim(), date: new Date().toISOString().slice(0, 10), listed: true }
	fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(meta, null, '\t') + '\n')
	// The slides as code (so they can be rebuilt or extended with `deck build`)…
	const files = fs.readdirSync(STARTER_SLIDES).filter((f) => f.endsWith('.js')).sort()
	for (const f of files) {
		const src = fs.readFileSync(path.join(STARTER_SLIDES, f), 'utf8').replaceAll('{{TITLE_JSON}}', JSON.stringify(title)).replaceAll('{{PRESENTER_JSON}}', JSON.stringify(PRESENTER))
		fs.writeFileSync(path.join(dir, 'slides', f), src)
	}
	fs.writeFileSync(path.join(dir, 'slides', 'manifest.json'), JSON.stringify(files.map((f) => f.replace(/\.js$/, '')), null, '\t') + '\n')
	// …and the deck itself, already drawn: the starter with this title filled in.
	stampFile(STARTER, path.join(dir, `${name}.tldraw`), { TITLE: title, PRESENTER }, name)
	return rel
}

export function moveEntry(from, toFolder) {
	const src = path.join(DECKS, from)
	if (!from || !fs.existsSync(src)) die(`no "${from}" in decks/`)
	const to = checkFolderPath(toFolder)
	const dest = path.join(DECKS, to, path.basename(from))
	if (path.resolve(dest) === path.resolve(src)) return from
	if (path.resolve(dest).startsWith(path.resolve(src) + path.sep)) die("can't move a folder into itself")
	if (fs.existsSync(dest)) die(`decks/${path.relative(DECKS, dest)} already exists`)
	if (to && !fs.existsSync(path.join(DECKS, to))) makeFolder(to)
	fs.renameSync(src, dest)
	return path.relative(DECKS, dest).split(path.sep).join('/')
}

// ---------- tldraw Desktop ----------
async function tl() {
	return import(path.join(PACK, 'bin', 'tl.mjs'))
}

export async function openDocs() {
	try {
		return await (await tl()).search('return await api.getDocs()')
	} catch {
		return null
	}
}

async function openDocFor(deck, { wait = 40 } = {}) {
	const match = (list) => list?.find((d) => d.filePath && path.resolve(d.filePath) === path.resolve(deck.file))
	let list = await openDocs()
	let doc = match(list)
	if (doc) return doc
	if (!deck.hasFile) die(`${deck.path} has no ${path.basename(deck.file)} yet.`)
	// Launching the app while it runs hands the file to the running app, but the short-lived second
	// process can leave server.json pointing at itself. Keep the running app's details to put back.
	const { serverJsonPath } = await tl()
	const serverJson = serverJsonPath()
	const before = list && fs.existsSync(serverJson) ? fs.readFileSync(serverJson, 'utf8') : null
	const app = process.env.TLDRAW_APP ?? 'tldraw-offline'
	spawn(app, [deck.file], { detached: true, stdio: 'ignore' }).on('error', () => die(`Could not start "${app}". Open ${deck.file} in tldraw Desktop (or set TLDRAW_APP).`)).unref()
	for (let i = 0; i < wait * 2; i++) {
		await new Promise((r) => setTimeout(r, 500))
		list = await openDocs()
		if (!list && before && fs.existsSync(serverJson) && fs.readFileSync(serverJson, 'utf8') !== before) {
			fs.writeFileSync(serverJson, before, { mode: 0o600 })
			list = await openDocs()
		}
		doc = match(list)
		if (doc) return doc
	}
	die(`${deck.path} did not open in tldraw Desktop within ${wait}s.`)
}

async function installInto(deck, doc) {
	const { install } = await import(path.join(PACK, 'bin', 'install.mjs'))
	const r = await install(doc, { ext: deck.hasExt ? path.join(deck.dir, 'ext') : undefined })
	console.log(`installed the pack${deck.hasExt ? ' + ext/' : ''} into ${deck.path} (${r.files} files)`)
}

async function saveCover(deck, doc) {
	const shot = await (await tl()).search(`
		const frames = (await api.getShapes(${JSON.stringify(doc.id)})).shapes.filter(s => s.type === 'frame').sort((a, b) => a.x - b.x || a.y - b.y)
		const f = frames[0]
		if (!f) return null
		return (await api.getScreenshot(${JSON.stringify(doc.id)}, { size: 'medium', bounds: { x: f.x, y: f.y, w: f.props.w, h: f.props.h } })).filePath`)
	if (!shot) return console.log(`${deck.path} has no slides yet; no cover saved`)
	for (const f of ['cover.png', 'cover.jpg']) fs.rmSync(path.join(deck.dir, f), { force: true })
	fs.copyFileSync(shot, path.join(deck.dir, 'cover.jpg'))
	console.log(`saved ${path.relative(ROOT, path.join(deck.dir, 'cover.jpg'))}`)
}

// ---------- commands ----------
const commands = {
	async list(args) {
		const { folders, decks } = walk()
		if (args.json) return console.log(JSON.stringify({ folders, decks: decks.map(({ dir, file, cover, ...d }) => ({ ...d, hasCover: !!cover })) }, null, 2))
		if (!folders.length && !decks.length) return console.log('No decks yet. Make one: deck new "My talk"')
		const print = (parent, depth) => {
			for (const f of folders.filter((f) => f.folder === parent)) {
				console.log(`${'  '.repeat(depth)}${f.name}/  ${f.title !== titleFromName(f.name) ? `(${f.title})` : ''}`)
				print(f.path, depth + 1)
			}
			for (const d of decks.filter((d) => d.folder === parent)) {
				const flags = [d.hasSlides && 'code slides', d.hasExt && 'ext', !d.cover && 'no cover', d.meta.listed === false && 'hidden', d.metaError].filter(Boolean)
				console.log(`${'  '.repeat(depth)}· ${d.name}  ${d.meta.title ?? '(untitled)'}${flags.length ? `  [${flags.join(', ')}]` : ''}`)
			}
		}
		print('', 0)
	},

	async new(args) {
		const title = args._[0]
		if (!title) die('usage: deck new "<title>" [--in <folder>] [--name <name>] [--description "…"]')
		const rel = newDeck({ title, folder: args.in ?? '', name: args.name ?? args.slug, description: args.description })
		console.log(`made decks/${rel}/ — open decks/${rel}/${path.basename(rel)}.tldraw in tldraw to draw it`)
		if (args.open) {
			const deck = deckInfo(rel)
			await openDocFor(deck)
			console.log(`${rel} is open`)
		}
	},

	async folder(args) {
		const rel = makeFolder(args._[0], args.title)
		console.log(`folder decks/${rel}/`)
	},

	async move(args) {
		const [from, to] = args._
		if (!from || to === undefined) die('usage: deck move <deck|folder> <to-folder>   ("." is the top)')
		const src = fs.existsSync(path.join(DECKS, from)) ? from : findDeck(from).path
		const docs = (await openDocs()) ?? []
		const inside = docs.filter((d) => d.filePath && path.resolve(d.filePath).startsWith(path.resolve(DECKS, src) + path.sep))
		if (inside.length) die(`close ${inside.map((d) => d.name).join(', ')} in tldraw first`)
		console.log(`moved to decks/${moveEntry(src, to)}`)
	},

	async open(args) {
		const deck = findDeck(args._[0])
		const doc = await openDocFor(deck)
		console.log(`${deck.path} is open (${doc.name})`)
	},

	async install(args) {
		const deck = findDeck(args._[0])
		await installInto(deck, await openDocFor(deck))
	},

	async build(args) {
		const deck = findDeck(args._[0])
		if (!deck.hasSlides) die(`${deck.path} has no slides/manifest.json (it is drawn by hand, not from code).`)
		await openDocFor(deck)
		const extra = [args.only && ['--only', String(args.only)], args['clear-scenes'] && ['--clear-scenes']].filter(Boolean).flat()
		process.exit(await run(path.join(PACK, 'bin', 'paper.mjs'), [deck.file, '--slides', path.join(deck.dir, 'slides'), ...extra]))
	},

	async cover(args) {
		const deck = findDeck(args._[0])
		await saveCover(deck, await openDocFor(deck))
	},

	async check(args) {
		const decks = args._[0] ? [findDeck(args._[0])] : walk().decks
		let problems = 0
		const bad = (d, msg) => (problems++, console.log(`✗ ${d.path}: ${msg}`))
		const names = new Map()
		for (const d of decks) {
			if (d.metaError) bad(d, d.metaError)
			else if (!d.meta.title) bad(d, 'deck.json has no title')
			if (!NAME.test(d.name)) bad(d, 'deck names are lowercase letters, digits and dashes')
			if (!d.hasFile) bad(d, `missing ${d.name}.tldraw`)
			if (names.has(d.name)) console.log(`· ${d.path}: shares its name with ${names.get(d.name)} (use the full path to name it)`)
			names.set(d.name, d.path)
			if (d.hasSlides) {
				const dir = path.join(d.dir, 'slides')
				const manifest = readJson(path.join(dir, 'manifest.json'))
				if (!Array.isArray(manifest)) bad(d, 'slides/manifest.json should be a list of slide names')
				for (const key of manifest ?? []) {
					const f = path.join(dir, key + '.js')
					if (!fs.existsSync(f)) {
						bad(d, `slides/${key}.js listed in the manifest but missing`)
						continue
					}
					try {
						const s = (await import(`file://${f}?t=${Date.now()}`)).default
						if (!s || typeof s.draw !== 'function') bad(d, `slides/${key}.js must export default { name, draw(k) }`)
						else if (!s.notes) bad(d, `slides/${key}.js has no speaker notes`)
					} catch (e) {
						bad(d, `slides/${key}.js: ${e.message}`)
					}
				}
				for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) if (!(manifest ?? []).includes(f.replace(/\.js$/, ''))) console.log(`· ${d.path}: slides/${f} is not in the manifest (not built)`)
			}
		}
		console.log(problems ? `${problems} problem(s)` : `${decks.length} deck(s) OK`)
		process.exit(problems ? 1 : 0)
	},

	async export() {
		process.exit(await run(path.join(ROOT, 'site', 'scripts', 'export-decks.mjs'), []))
	},
}

// Run as a command (not when the studio imports this file).
if (AS_CLI) {
	const [cmd, ...rest] = process.argv.slice(2)
	if (!cmd || !commands[cmd]) {
		console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 24).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'))
		process.exit(cmd ? 1 : 0)
	}
	try {
		await commands[cmd](parseArgs(rest))
	} catch (e) {
		die(e.message)
	}
}
