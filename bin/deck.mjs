#!/usr/bin/env node
// deck: manage the presentations in decks/. Made to be driven by people and by agents alike:
// every command takes a deck name (its folder, or any unique part of it), opens it in tldraw
// Desktop when it needs to, and prints short, plain results.
//
//   deck list [--json]                       every deck, newest first
//   deck new "<title>" [options]             make decks/<slug>/ and open it (see below)
//   deck open <deck>                         open it in tldraw Desktop
//   deck install <deck>                      put the presentation pack (+ the deck's ext/) into it
//   deck build <deck> [--only a,b]           draw the deck's code slides (slides/) into it
//   deck cover <deck>                        save its first slide as cover.jpg (the website card)
//   deck check [<deck>]                      validate deck folders (deck.json, files, slides)
//   deck export                              export every deck for the website (site/public/decks)
//
// deck new options:
//   --slug <slug>        folder / URL name (default: from the title)
//   --kind handmade      (default) slides drawn from code in slides/, starting from 3 starter slides
//   --kind canvas        an empty deck you draw by hand; --template <id> to start from a pack template
//   --subtitle, --presenter, --description, --tags a,b, --date YYYY-MM-DD, --theme <id> (default ink)
//
// Needs tldraw Desktop running for open/install/build/cover/new. list/check/export work offline.
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DECKS = path.join(ROOT, 'decks')
const PACK = path.join(ROOT, 'presentation-pack')
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
const die = (msg) => {
	console.error(msg)
	process.exit(1)
}

// ---------- decks on disk ----------
const slugify = (s) =>
	String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 48) || 'deck'

function allDecks() {
	if (!fs.existsSync(DECKS)) return []
	return fs
		.readdirSync(DECKS, { withFileTypes: true })
		.filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_'))
		.map((e) => deckInfo(e.name))
		.sort((a, b) => (b.meta.date ?? '').localeCompare(a.meta.date ?? '') || a.slug.localeCompare(b.slug))
}

function deckInfo(slug) {
	const dir = path.join(DECKS, slug)
	let meta = {}
	let metaError = null
	try {
		meta = JSON.parse(fs.readFileSync(path.join(dir, 'deck.json'), 'utf8'))
	} catch (e) {
		metaError = fs.existsSync(path.join(dir, 'deck.json')) ? `deck.json: ${e.message}` : 'deck.json missing'
	}
	const file = path.join(dir, `${slug}.tldraw`)
	const slides = path.join(dir, 'slides', 'manifest.json')
	return {
		slug,
		dir,
		file,
		meta,
		metaError,
		hasFile: fs.existsSync(file),
		hasSlides: fs.existsSync(slides),
		hasExt: fs.existsSync(path.join(dir, 'ext', 'index.js')),
		cover: ['cover.jpg', 'cover.png'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f)) ?? null,
	}
}

function findDeck(q) {
	if (!q) die('Which deck? (deck list shows them)')
	const decks = allDecks()
	const exact = decks.find((d) => d.slug === q)
	if (exact) return exact
	const hits = decks.filter((d) => d.slug.includes(q) || (d.meta.title ?? '').toLowerCase().includes(String(q).toLowerCase()))
	if (hits.length === 1) return hits[0]
	if (!hits.length) die(`No deck matches "${q}". Decks: ${decks.map((d) => d.slug).join(', ') || 'none'}`)
	die(`"${q}" matches several decks: ${hits.map((d) => d.slug).join(', ')}`)
}

// ---------- tldraw Desktop ----------
async function tl() {
	return import(path.join(PACK, 'bin', 'tl.mjs'))
}

async function openDocFor(deck, { wait = 40 } = {}) {
	const { search } = await tl()
	const docs = async () => {
		try {
			return await search('return await api.getDocs()')
		} catch {
			return null
		}
	}
	const match = (list) => list?.find((d) => d.filePath && path.resolve(d.filePath) === path.resolve(deck.file))
	let list = await docs()
	let doc = match(list)
	if (doc) return doc
	if (!deck.hasFile) die(`${deck.slug} has no ${path.basename(deck.file)} yet.`)
	// Launching the app while it runs hands the file to the running app, but the short-lived second
	// process can leave server.json pointing at itself. Keep the running app's details to put back.
	const { serverJsonPath } = await tl()
	const serverJson = serverJsonPath()
	const before = list && fs.existsSync(serverJson) ? fs.readFileSync(serverJson, 'utf8') : null
	const app = process.env.TLDRAW_APP ?? 'tldraw-offline'
	spawn(app, [deck.file], { detached: true, stdio: 'ignore' }).on('error', () => die(`Could not start "${app}". Open ${deck.file} in tldraw Desktop (or set TLDRAW_APP).`)).unref()
	for (let i = 0; i < wait * 2; i++) {
		await new Promise((r) => setTimeout(r, 500))
		list = await docs()
		if (!list && before && fs.existsSync(serverJson) && fs.readFileSync(serverJson, 'utf8') !== before) {
			fs.writeFileSync(serverJson, before, { mode: 0o600 })
			list = await docs()
		}
		doc = match(list)
		if (doc) return doc
	}
	die(`${deck.slug} did not open in tldraw Desktop within ${wait}s.`)
}

async function installInto(deck, doc) {
	const { install } = await import(path.join(PACK, 'bin', 'install.mjs'))
	const r = await install(doc, { ext: deck.hasExt ? path.join(deck.dir, 'ext') : undefined })
	console.log(`installed the pack${deck.hasExt ? ' + ext/' : ''} into ${deck.slug} (${r.files} files)`)
}

async function saveCover(deck, doc) {
	const { search } = await tl()
	const shot = await search(`
		const frames = (await api.getShapes(${JSON.stringify(doc.id)})).shapes.filter(s => s.type === 'frame').sort((a, b) => a.x - b.x || a.y - b.y)
		const f = frames[0]
		if (!f) return null
		return (await api.getScreenshot(${JSON.stringify(doc.id)}, { size: 'medium', bounds: { x: f.x, y: f.y, w: f.props.w, h: f.props.h } })).filePath`)
	if (!shot) return console.log(`${deck.slug} has no slides yet; no cover saved`)
	for (const f of ['cover.png', 'cover.jpg']) fs.rmSync(path.join(deck.dir, f), { force: true })
	fs.copyFileSync(shot, path.join(deck.dir, 'cover.jpg'))
	console.log(`saved ${path.relative(ROOT, path.join(deck.dir, 'cover.jpg'))}`)
}

// ---------- commands ----------
const commands = {
	async list(args) {
		const decks = allDecks()
		if (args.json) return console.log(JSON.stringify(decks.map(({ slug, meta, hasFile, hasSlides, hasExt, cover }) => ({ slug, ...meta, hasFile, hasSlides, hasExt, hasCover: !!cover })), null, 2))
		if (!decks.length) return console.log('No decks yet. Make one: deck new "My talk"')
		for (const d of decks) {
			const flags = [d.hasSlides && 'code slides', d.hasExt && 'ext', !d.cover && 'no cover', d.meta.listed === false && 'unlisted', d.metaError].filter(Boolean)
			console.log(`${(d.meta.date ?? '----------').padEnd(10)}  ${d.slug.padEnd(28)}  ${d.meta.title ?? '(untitled)'}${flags.length ? `  [${flags.join(', ')}]` : ''}`)
		}
	},

	async new(args) {
		const title = args._[0]
		if (!title) die('usage: deck new "<title>" [--slug s] [--kind handmade|canvas] [--subtitle …] [--presenter …] [--tags a,b]')
		const slug = slugify(args.slug ?? title)
		const dir = path.join(DECKS, slug)
		if (fs.existsSync(dir)) die(`decks/${slug} already exists.`)
		const kind = args.kind ?? 'handmade'
		if (!['handmade', 'canvas'].includes(kind)) die('--kind is handmade or canvas')
		const meta = {
			title,
			subtitle: args.subtitle ?? '',
			date: args.date ?? new Date().toISOString().slice(0, 10),
			presenter: args.presenter ?? 'Aneesh S',
			description: args.description ?? '',
			tags: args.tags ? String(args.tags).split(',').map((t) => t.trim()).filter(Boolean) : [],
			listed: true,
		}
		fs.mkdirSync(dir, { recursive: true })
		fs.writeFileSync(path.join(dir, 'deck.json'), JSON.stringify(meta, null, '\t') + '\n')
		if (kind === 'handmade') {
			const starter = path.join(PACK, 'paper', 'starter')
			const out = path.join(dir, 'slides')
			fs.mkdirSync(out)
			const files = fs.readdirSync(starter).filter((f) => f.endsWith('.js')).sort()
			for (const f of files) {
				const src = fs
					.readFileSync(path.join(starter, f), 'utf8')
					.replaceAll('{{TITLE_JSON}}', JSON.stringify(meta.title))
					.replaceAll('{{SUBTITLE_JSON}}', JSON.stringify(meta.subtitle || ' '))
					.replaceAll('{{PRESENTER_JSON}}', JSON.stringify(meta.presenter))
				fs.writeFileSync(path.join(out, f), src)
			}
			fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(files.map((f) => f.replace(/\.js$/, '')), null, '\t') + '\n')
		}
		console.log(`made decks/${slug}/ (${kind})`)

		// The .tldraw file: created by the app, so it is a real, saved deck from the start.
		const { request, exec, sleep } = await tl()
		const created = await request('POST', '/api/docs/create', { name: slug, directory: dir })
		const doc = { ...created, ownership: 'local' }
		await sleep(500)
		const template = kind === 'canvas' ? (args.template ?? 'blank') : null
		await exec(doc.id, `
			const meta = editor.getDocumentSettings().meta ?? {}
			editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(meta.pp ?? {}), theme: ${JSON.stringify(args.theme ?? 'ink')}, title: ${JSON.stringify(title)}, footer: ${JSON.stringify(`${title} · ${meta.presenter}`)}, pendingTemplate: ${JSON.stringify(template)} } } })
			return true`)
		const deck = deckInfo(slug)
		await installInto(deck, doc)
		if (kind === 'handmade') await run(path.join(PACK, 'bin', 'paper.mjs'), [deck.file, '--slides', path.join(dir, 'slides')])
		await sleep(800)
		await exec(doc.id, 'await helpers.saveDoc(); return true')
		await saveCover(deck, doc)
		console.log(`\n${slug} is open in tldraw. Next: edit decks/${slug}/slides/*.js and run  deck build ${slug}`)
	},

	async open(args) {
		const deck = findDeck(args._[0])
		const doc = await openDocFor(deck)
		console.log(`${deck.slug} is open (${doc.name})`)
	},

	async install(args) {
		const deck = findDeck(args._[0])
		await installInto(deck, await openDocFor(deck))
	},

	async build(args) {
		const deck = findDeck(args._[0])
		if (!deck.hasSlides) die(`${deck.slug} has no slides/manifest.json (it is drawn by hand, not from code).`)
		await openDocFor(deck)
		const extra = [args.only && ['--only', String(args.only)], args['clear-scenes'] && ['--clear-scenes']].filter(Boolean).flat()
		process.exit(await run(path.join(PACK, 'bin', 'paper.mjs'), [deck.file, '--slides', path.join(deck.dir, 'slides'), ...extra]))
	},

	async cover(args) {
		const deck = findDeck(args._[0])
		await saveCover(deck, await openDocFor(deck))
	},

	async check(args) {
		const decks = args._[0] ? [findDeck(args._[0])] : allDecks()
		let problems = 0
		const bad = (d, msg) => (problems++, console.log(`✗ ${d.slug}: ${msg}`))
		const seen = new Set()
		for (const d of decks) {
			if (d.metaError) bad(d, d.metaError)
			else {
				if (!d.meta.title) bad(d, 'deck.json has no title')
				if (d.meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(d.meta.date)) bad(d, `date "${d.meta.date}" is not YYYY-MM-DD`)
				if (d.meta.tags && !Array.isArray(d.meta.tags)) bad(d, 'tags must be a list')
			}
			if (!/^[a-z0-9][a-z0-9-]*$/.test(d.slug)) bad(d, 'folder name should be lowercase letters, digits and dashes')
			if (!d.hasFile) bad(d, `missing ${d.slug}.tldraw`)
			if (seen.has(d.slug)) bad(d, 'duplicate')
			seen.add(d.slug)
			if (d.hasSlides) {
				const dir = path.join(d.dir, 'slides')
				let manifest = []
				try {
					manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
				} catch (e) {
					bad(d, `slides/manifest.json: ${e.message}`)
				}
				for (const key of manifest) {
					const f = path.join(dir, key + '.js')
					if (!fs.existsSync(f)) {
						bad(d, `slides/${key}.js listed in the manifest but missing`)
						continue
					}
					try {
						const mod = await import(`file://${f}?t=${Date.now()}`)
						const s = mod.default
						if (!s || typeof s.draw !== 'function') bad(d, `slides/${key}.js must export default { name, draw(k) }`)
						else if (!s.notes) bad(d, `slides/${key}.js has no speaker notes`)
					} catch (e) {
						bad(d, `slides/${key}.js: ${e.message}`)
					}
				}
				for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) if (!manifest.includes(f.replace(/\.js$/, ''))) console.log(`· ${d.slug}: slides/${f} is not in the manifest (not built)`)
			}
			if (!d.cover) console.log(`· ${d.slug}: no cover yet (deck cover ${d.slug})`)
		}
		console.log(problems ? `${problems} problem(s)` : `${decks.length} deck(s) OK`)
		process.exit(problems ? 1 : 0)
	},

	async export() {
		process.exit(await run(path.join(ROOT, 'site', 'scripts', 'export-decks.mjs'), []))
	},
}

const [cmd, ...rest] = process.argv.slice(2)
if (!cmd || !commands[cmd]) {
	console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'))
	process.exit(cmd ? 1 : 0)
}
try {
	await commands[cmd](parseArgs(rest))
} catch (e) {
	die(e.message)
}
