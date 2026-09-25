import { AutoRouter, error, IRequest } from 'itty-router'

export { TldrawDurableObject } from './TldrawDurableObject'

interface Env {
	TLDRAW_DURABLE_OBJECT: DurableObjectNamespace
	ALLOWED_ORIGINS: string
}

const ROOM_ID = /^[a-zA-Z0-9_-]{1,64}$/

const router = AutoRouter<IRequest, [env: Env, ctx: ExecutionContext]>({
	catch: (e) => {
		console.error(e)
		return error(e)
	},
})
	// Realtime websocket sync for one room; each room id maps to its own Durable Object.
	.get('/api/connect/:roomId', (request, env) => {
		const origin = request.headers.get('origin') ?? ''
		const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
		if (!allowed.includes(origin)) return error(403, 'origin not allowed')
		if (!ROOM_ID.test(request.params.roomId)) return error(400, 'bad room id')
		const id = env.TLDRAW_DURABLE_OBJECT.idFromName(request.params.roomId)
		return env.TLDRAW_DURABLE_OBJECT.get(id).fetch(request.url, { headers: request.headers })
	})
	.get('/', () => new Response('weekly-presentation sync server'))
	.all('*', () => error(404))

export default { fetch: router.fetch }
