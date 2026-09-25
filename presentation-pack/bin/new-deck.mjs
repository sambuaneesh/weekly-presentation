#!/usr/bin/env node
// Create a new deck with the presentation pack installed and a template seeded.
//   node bin/new-deck.mjs <name> [--dir <folder>] [--template weekly-update|all-layouts|blank|none]
//                                [--theme clean|midnight|editorial|sketch|violet|terminal]
// --dir defaults to the current folder. The deck opens in a new tldraw window.
import path from 'node:path'
import { request, exec, sleep, parseArgs } from './tl.mjs'
import { install } from './install.mjs'

const args = parseArgs(process.argv.slice(2))
const name = args._[0]
if (!name) {
	console.error('usage: node bin/new-deck.mjs <name> [--dir <folder>] [--template weekly-update] [--theme clean]')
	process.exit(1)
}
const template = args.template ?? 'weekly-update'
const theme = args.theme ?? 'clean'

try {
	const doc = await request('POST', '/api/docs/create', { name, directory: path.resolve(args.dir ?? process.cwd()) })
	const full = { ...doc, ownership: 'local' }
	await sleep(500)
	// Deck settings go in first; the pack's main.js seeds the template when it first runs.
	await exec(doc.id, `
		const meta = editor.getDocumentSettings().meta ?? {}
		editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(meta.pp ?? {}), theme: ${JSON.stringify(theme)}, pendingTemplate: ${template === 'none' ? 'null' : JSON.stringify(template)} } } })
		return true`)
	await install(full)
	await sleep(500)
	const count = await exec(doc.id, `
		await helpers.saveDoc()
		return editor.getCurrentPageShapes().filter(s => s.type === 'frame' && s.parentId === editor.getCurrentPageId()).length`)
	console.log(`Created ${doc.filePath} with ${count} slides (template: ${template}, theme: ${theme}).`)
} catch (e) {
	console.error(e.message)
	process.exit(1)
}
