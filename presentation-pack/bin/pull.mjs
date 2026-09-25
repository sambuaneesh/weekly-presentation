#!/usr/bin/env node
// Pull reusable work out of a deck back into the pack.
//   node bin/pull.mjs <doc name | path.tldraw>            → copy layouts saved in the deck
//                                                          ("Save as layout…") to script/layouts/custom
//   node bin/pull.mjs <doc> --script                       → also copy the deck's board script back
//                                                          into script/ (after editing it in place)
// Re-run bin/install.mjs on other decks to give them the new layouts.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { request, exec, findDoc, parseArgs } from './tl.mjs'

const PACK_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../script')
const CUSTOM = path.join(PACK_SCRIPT, 'layouts/custom')

const args = parseArgs(process.argv.slice(2))
if (!args._[0]) {
	console.error('usage: node bin/pull.mjs <doc name | path.tldraw> [--script]')
	process.exit(1)
}

try {
	const doc = await findDoc(args._[0])
	const layouts = await exec(doc.id, 'return editor.getDocumentSettings().meta?.pp?.customLayouts ?? []')
	fs.mkdirSync(CUSTOM, { recursive: true })
	const indexPath = path.join(CUSTOM, 'index.json')
	const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : []
	for (const l of layouts) {
		const slug = l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || l.id
		const file = `${slug}.json`
		fs.writeFileSync(path.join(CUSTOM, file), JSON.stringify({ id: `pack-${slug}`, name: l.name, content: l.content }))
		const entry = { id: `pack-${slug}`, name: l.name, file }
		const at = index.findIndex((e) => e.file === file)
		if (at >= 0) index[at] = entry
		else index.push(entry)
		console.log(`layout: ${l.name} → script/layouts/custom/${file}`)
	}
	fs.writeFileSync(indexPath, JSON.stringify(index, null, '\t') + '\n')
	if (!layouts.length) console.log('No saved layouts in this deck (right-click a slide → "Save as layout…").')

	if (args.script) {
		const ws = await request('POST', `/api/doc/${doc.id}/script-workspace`)
		for (const rel of walk(ws.scriptDir)) {
			if (rel.startsWith('layouts/custom/')) continue // layouts handled above
			const to = path.join(PACK_SCRIPT, rel)
			fs.mkdirSync(path.dirname(to), { recursive: true })
			fs.copyFileSync(path.join(ws.scriptDir, rel), to)
			console.log(`script: ${rel}`)
		}
	}
} catch (e) {
	console.error(e.message)
	process.exit(1)
}

function walk(dir, base = dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name)
		return e.isDirectory() ? walk(p, base) : [path.relative(base, p)]
	})
}
