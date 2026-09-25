// Minimal client for the tldraw Desktop agent API (reads port + token from server.json per call).
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

function serverJsonPath() {
	const home = os.homedir()
	if (process.platform === 'darwin') return path.join(home, 'Library/Application Support/tldraw/server.json')
	if (process.platform === 'win32') return path.join(process.env.APPDATA ?? home, 'tldraw/server.json')
	return path.join(process.env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'tldraw/server.json')
}

function server() {
	try {
		const s = JSON.parse(fs.readFileSync(serverJsonPath(), 'utf8'))
		if (s.port && s.token) return s
	} catch {}
	throw new Error('tldraw Desktop is not running (no server.json). Open the app first.')
}

export function request(method, urlPath, body) {
	const { port, token } = server()
	const headers = { authorization: `Bearer ${token}` }
	let payload
	if (body !== undefined) {
		payload = typeof body === 'string' ? body : JSON.stringify(body)
		headers['content-type'] = typeof body === 'string' ? 'text/plain' : 'application/json'
	}
	return new Promise((resolve, reject) => {
		const req = http.request({ host: '127.0.0.1', port, path: urlPath, method, headers }, (res) => {
			let data = ''
			res.on('data', (d) => (data += d))
			res.on('end', () => {
				let json
				try {
					json = JSON.parse(data)
				} catch {
					return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`))
				}
				if (json.success === false || res.statusCode >= 400) return reject(new Error(json.error ?? `HTTP ${res.statusCode}`))
				resolve(json.result ?? json)
			})
		})
		req.on('error', reject)
		req.end(payload)
	})
}

export const search = (code) => request('POST', '/api/search', code)
export const exec = (docId, code) => request('POST', `/api/doc/${docId}/exec`, code)

// Find an open, locally owned doc by file path or (case-insensitive) name substring.
export async function findDoc(query) {
	const docs = await search('return await api.getDocs()')
	const abs = path.resolve(query)
	const q = query.replace(/\.tldraw$/i, '').toLowerCase()
	const hits = docs.filter((d) => d.filePath === abs || d.name.toLowerCase() === q)
	const loose = hits.length ? hits : docs.filter((d) => d.name.toLowerCase().includes(q))
	if (loose.length === 1) return loose[0]
	if (!loose.length) throw new Error(`No open document matches "${query}". Open: ${docs.map((d) => d.name).join(', ') || 'none'}`)
	throw new Error(`"${query}" matches several open documents: ${loose.map((d) => d.name).join(', ')}`)
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function parseArgs(argv) {
	const args = { _: [] }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a.startsWith('--')) {
			const [k, v] = a.slice(2).split('=')
			args[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
		} else args._.push(a)
	}
	return args
}
