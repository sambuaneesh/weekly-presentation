#!/usr/bin/env node
// Build hand-drawn slides (one JS file per slide, drawn with paper/kit.exec.js) into an open deck.
// Usually run through the repo's `bin/deck.mjs build <deck>`, which passes --slides decks/<slug>/slides.
//   node bin/paper.mjs <deck> --slides <dir>                 build every slide in <dir>/manifest.json
//   node bin/paper.mjs <deck> --slides <dir> --only a,b      rebuild just these (file names without .js)
//   node bin/paper.mjs <deck> --slides <dir> --clear-scenes  first delete animated-scene slides
// Slides are placed by their position in the manifest and replace earlier builds of themselves.
// Your own slides (not from paper/) are left alone.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec, findDoc, parseArgs } from './tl.mjs'

const KIT_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../paper/kit.exec.js')
const args = parseArgs(process.argv.slice(2))
if (!args._[0] || !args.slides) {
	console.error('usage: node bin/paper.mjs <deck> --slides <folder with manifest.json + slide files> [--only a,b] [--clear-scenes]')
	process.exit(1)
}
const SLIDES = path.resolve(String(args.slides))
const manifest = JSON.parse(fs.readFileSync(path.join(SLIDES, 'manifest.json'), 'utf8'))
const only = args.only ? String(args.only).split(',').map((s) => s.trim().replace(/\.js$/, '')) : null
const KIT = fs.readFileSync(KIT_FILE, 'utf8')

const doc = await findDoc(args._[0])
if (args['clear-scenes']) {
	const n = await exec(doc.id, `const fr = editor.getCurrentPageShapes().filter(s => s.type === 'frame' && s.meta?.layout === 'scene'); editor.run(() => editor.deleteShapes(fr.map(f => f.id)), { ignoreShapeLock: true }); return fr.length`)
	console.log(`removed ${n} scene slides`)
}

let failed = 0
for (let i = 0; i < manifest.length; i++) {
	const key = manifest[i]
	if (only && !only.includes(key)) continue
	const file = path.join(SLIDES, key + '.js')
	if (!fs.existsSync(file)) {
		console.log(`· ${key}: no file yet`)
		continue
	}
	const src = fs.readFileSync(file, 'utf8').replace(/^\s*export\s+default\s+/m, 'return ')
	const code = `${KIT}\nconst SLIDE = (() => {\n${src}\n})();\nreturn await buildSlide(SLIDE, ${JSON.stringify(key)}, ${i})`
	try {
		const r = await exec(doc.id, code)
		console.log(`✓ ${key}: ${r.shapes} shapes, ${r.arrows} arrows`)
	} catch (e) {
		failed++
		console.log(`✗ ${key}: ${e.message}`)
	}
}
await exec(doc.id, 'await helpers.saveDoc(); return true').catch(() => {})
process.exit(failed ? 1 : 0)
