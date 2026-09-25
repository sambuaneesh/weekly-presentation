import { AutoRouter, error, IRequest } from 'itty-router'

export { TldrawDurableObject } from './TldrawDurableObject'

interface Env {
	TLDRAW_DURABLE_OBJECT: DurableObjectNamespace
	ALLOWED_ORIGINS: string
	// Set with `npx wrangler secret put ROOM_PASSWORD`. Without it, no new rooms can be opened.
	ROOM_PASSWORD?: string
}

const ROOM_ID = /^[a-zA-Z0-9_-]{1,64}$/

function allowedOrigin(request: IRequest, env: Env) {
	const origin = request.headers.get('origin') ?? ''
	return env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).includes(origin) ? origin : null
}

function cors(origin: string, response: Response) {
	const r = new Response(response.body, response)
	r.headers.set('access-control-allow-origin', origin)
	r.headers.set('access-control-allow-methods', 'GET, POST, OPTIONS')
	r.headers.set('access-control-allow-headers', 'content-type')
	r.headers.set('vary', 'origin')
	return r
}

// Compare via SHA-256 digests so the check takes the same time however much of it matches.
async function passwordMatches(given: unknown, expected: string | undefined) {
	if (!expected || typeof given !== 'string') return false
	const enc = new TextEncoder()
	const [a, b] = await Promise.all([given, expected].map((s) => crypto.subtle.digest('SHA-256', enc.encode(s))))
	return crypto.subtle.timingSafeEqual(a, b)
}

function roomStub(env: Env, roomId: string) {
	return env.TLDRAW_DURABLE_OBJECT.get(env.TLDRAW_DURABLE_OBJECT.idFromName(roomId))
}

const router = AutoRouter<IRequest, [env: Env, ctx: ExecutionContext]>({
	catch: (e) => {
		console.error(e)
		return error(e)
	},
})
	// Only the site itself may talk to the room API.
	.all('/api/*', (request, env) => {
		if (!allowedOrigin(request, env)) return error(403, 'origin not allowed')
	})
	.options('/api/*', (request, env) => cors(allowedOrigin(request, env)!, new Response(null, { status: 204 })))

	// Realtime websocket sync for one room; each room id maps to its own Durable Object.
	.get('/api/connect/:roomId', (request, env) => {
		if (!ROOM_ID.test(request.params.roomId)) return error(400, 'bad room id')
		return roomStub(env, request.params.roomId).fetch(request.url, { headers: request.headers })
	})

	// Does a room exist? (The site checks before connecting, to show "room not found".)
	.get('/api/rooms/:roomId', async (request, env) => {
		if (!ROOM_ID.test(request.params.roomId)) return error(400, 'bad room id')
		return cors(allowedOrigin(request, env)!, await roomStub(env, request.params.roomId).fetch(request.url))
	})

	// Open a room: needs the room password. Joining an open room needs only its link.
	.post('/api/rooms/:roomId/open', async (request, env) => {
		const origin = allowedOrigin(request, env)!
		if (!ROOM_ID.test(request.params.roomId)) return cors(origin, error(400, 'bad room id'))
		const body = (await request.json().catch(() => ({}))) as { password?: unknown }
		if (!(await passwordMatches(body.password, env.ROOM_PASSWORD))) return cors(origin, error(401, 'wrong password'))
		return cors(origin, await roomStub(env, request.params.roomId).fetch(request.url, { method: 'POST' }))
	})

	.get('/', () => new Response('weekly-presentation sync server'))
	.all('*', () => error(404))

export default { fetch: router.fetch }
