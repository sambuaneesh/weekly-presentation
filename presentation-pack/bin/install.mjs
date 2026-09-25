#!/usr/bin/env node
// Install (or update) the presentation pack into an open tldraw deck.
//   node bin/install.mjs <doc name | path.tldraw>
// Replaces the deck's board script with this pack's script/ folder, waits for the app to apply
// it, and saves the deck. Slides and deck settings are untouched.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { request, exec, findDoc, sleep, parseArgs } from './tl.mjs'

const PACK_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../script')

export async function install(doc) {
	if (doc.ownership !== 'local') throw new Error(`${doc.name} is not a local document; the host must install the pack.`)
	const ws = await request('POST', `/api/doc/${doc.id}/script-workspace`)
	const dest = ws.scriptDir

	// Mirror the pack into the deck's script dir: remove files the pack no longer has, copy the rest.
	const packFiles = new Set(listFiles(PACK_SCRIPT))
	for (const rel of listFiles(dest)) if (!packFiles.has(rel)) fs.rmSync(path.join(dest, rel))
	for (const rel of packFiles) {
		const to = path.join(dest, rel)
		fs.mkdirSync(path.dirname(to), { recursive: true })
		fs.copyFileSync(path.join(PACK_SCRIPT, rel), to)
	}

	let status
	for (let i = 0; i < 40; i++) {
		await sleep(500)
		status = await request('GET', `/api/doc/${doc.id}/script-status`)
		if (status.state === 'applied' || status.state === 'error') break
	}
	if (status.state !== 'applied') {
		const log = fs.existsSync(ws.errorLogPath) ? fs.readFileSync(ws.errorLogPath, 'utf8') : ''
		throw new Error(`Script not applied (state: ${status.state}). ${status.lastApplyError ?? ''}\n${log}`)
	}
	await sleep(800)
	const runs = await request('GET', `/api/doc/${doc.id}/scripts`)
	if (runs.boardScript?.status === 'error') throw new Error(`Board script failed: ${JSON.stringify(runs.boardScript.lastError)}`)
	await exec(doc.id, 'await helpers.saveDoc(); return true')
	return { scriptDir: dest, files: packFiles.size }
}

function listFiles(dir, base = dir) {
	if (!fs.existsSync(dir)) return []
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = path.join(dir, e.name)
		return e.isDirectory() ? listFiles(p, base) : [path.relative(base, p)]
	})
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const args = parseArgs(process.argv.slice(2))
	if (!args._[0]) {
		console.error('usage: node bin/install.mjs <doc name | path.tldraw>')
		process.exit(1)
	}
	try {
		const doc = await findDoc(args._[0])
		const r = await install(doc)
		console.log(`Installed presentation pack (${r.files} files) into "${doc.name}" and saved.`)
	} catch (e) {
		console.error(e.message)
		process.exit(1)
	}
}
