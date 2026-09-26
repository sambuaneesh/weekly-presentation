// From tldraw's MIT-licensed sync template (https://github.com/tldraw/tldraw-sync-cloudflare):
// hosts one room's document and websocket sessions. Changes from the template: the env type, and
// rooms must be opened (POST /open, which the worker only forwards after checking the room
// password) before anyone can connect. Opening returns a presenter token: sessions that connect
// with it can edit, everyone else is read-only. An open room closes again (and its tokens are
// forgotten) once it has been empty for the grace period, so an old link can't be used to get
// back into an abandoned room.
import {
	DurableObjectSqliteSyncWrapper,
	type SessionStateSnapshot,
	SQLiteSyncStorage,
	TLSocketRoom,
} from '@tldraw/sync-core'
import {
	createTLSchema,
	defaultBindingSchemas,
	defaultShapeSchemas,
	TLRecord,
} from '@tldraw/tlschema'
import { T } from '@tldraw/validate'
import { DurableObject } from 'cloudflare:workers'
import { AutoRouter, error, IRequest } from 'itty-router'

// add custom shapes and bindings here if needed:
const schema = createTLSchema({
	// `scene`: the presentation pack's animated scenes (presentation-pack/script/scenes/SceneShapeUtil.js).
	shapes: { ...defaultShapeSchemas, scene: { props: { w: T.number, h: T.number, scene: T.string } } },
	bindings: { ...defaultBindingSchemas },
})

// How long a room stays open with nobody in it (covers page reloads and brief network drops).
// EMPTY_GRACE_SECONDS in the worker's vars overrides it (the local test uses a few seconds).
const DEFAULT_EMPTY_GRACE_SECONDS = 120

interface SocketAttachment {
	sessionId: string
	snapshot: SessionStateSnapshot | null
}

function getAttachment(ws: WebSocket): SocketAttachment | null {
	const attachment = ws.deserializeAttachment() as SocketAttachment | null
	return attachment?.sessionId ? attachment : null
}

// Each whiteboard room is hosted in a Durable Object with WebSocket Hibernation.
// https://developers.cloudflare.com/durable-objects/
//
// There's only ever one durable object instance per room. Room state is
// persisted automatically to SQLite via ctx.storage. When all clients are
// idle, the DO hibernates (freeing memory) while WebSocket connections
// stay alive at the Cloudflare layer.
export class TldrawDurableObject extends DurableObject {
	private room: TLSocketRoom<TLRecord, void> | null = null
	/** Map sessionId → ws so onSessionSnapshot can serialize to the right socket. */
	private readonly sessionIdToWs = new Map<string, WebSocket>()

	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env)
		// Respond to ping messages at the platform level without waking the DO.
		// The TLSyncClient sends {"type":"ping"} every 5s; without this, each
		// ping would wake the DO from hibernation.
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}')
		)
	}

	private getOrCreateRoom(): TLSocketRoom<TLRecord, void> {
		if (!this.room) {
			const sql = new DurableObjectSqliteSyncWrapper(this.ctx.storage)
			const storage = new SQLiteSyncStorage<TLRecord>({ sql })

			this.room = new TLSocketRoom<TLRecord, void>({
				schema,
				storage,
				// Disable idle timeout since Cloudflare handles keep-alive via auto-response.
				// Without this, sessions would be pruned after 20s of no "real" messages
				// even though the client is still connected and being auto-ponged.
				clientTimeout: Infinity,
				onSessionSnapshot: (sessionId, snapshot) => {
					const ws = this.sessionIdToWs.get(sessionId)
					if (ws) ws.serializeAttachment({ sessionId, snapshot })
				},
			})

			// Resume any sessions that survived hibernation
			for (const ws of this.ctx.getWebSockets()) {
				const attachment = getAttachment(ws)
				if (!attachment?.snapshot) continue
				this.room.handleSocketResume({
					sessionId: attachment.sessionId,
					socket: ws,
					snapshot: attachment.snapshot,
				})
			}
		}
		return this.room
	}

	private readonly router = AutoRouter({ catch: (e) => error(e) })
		.get('/api/connect/:roomId', (request) => this.handleConnect(request))
		.get('/api/rooms/:roomId', async (request) =>
			Response.json({ exists: await this.isOpen(), presenter: await this.isPresenterToken(request.query.presenter) })
		)
		.post('/api/rooms/:roomId/open', async () => {
			const token = crypto.randomUUID()
			const tokens = ((await this.ctx.storage.get<string[]>('presenterTokens')) ?? []).slice(-19)
			await this.ctx.storage.put({ opened: true, presenterTokens: [...tokens, token] })
			// Close again if the person who opened it never actually joins.
			await this.scheduleCloseIfEmpty()
			return Response.json({ exists: true, token })
		})

	private isOpen() {
		return this.ctx.storage.get('opened').then(Boolean)
	}

	private async isPresenterToken(token: unknown) {
		if (typeof token !== 'string' || !token) return false
		return ((await this.ctx.storage.get<string[]>('presenterTokens')) ?? []).includes(token)
	}

	private async scheduleCloseIfEmpty(leaving?: WebSocket) {
		const others = this.ctx.getWebSockets().filter((ws) => ws !== leaving)
		if (others.length > 0) return
		const seconds = Number((this.env as { EMPTY_GRACE_SECONDS?: string }).EMPTY_GRACE_SECONDS) || DEFAULT_EMPTY_GRACE_SECONDS
		await this.ctx.storage.setAlarm(Date.now() + seconds * 1000)
	}

	// Runs a grace period after the room last emptied: close it unless someone came back.
	override async alarm() {
		if (this.ctx.getWebSockets().length === 0) await this.ctx.storage.delete(['opened', 'presenterTokens'])
	}

	// Entry point for all requests to the Durable Object
	fetch(request: Request): Response | Promise<Response> {
		return this.router.fetch(request)
	}

	// Handle new WebSocket connection requests
	async handleConnect(request: IRequest) {
		const sessionId = request.query.sessionId as string
		if (!sessionId) return error(400, 'Missing sessionId')
		if (!(await this.isOpen())) return error(404, 'Room not found')
		await this.ctx.storage.deleteAlarm()

		// Create the websocket pair for the client
		const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair()
		// Use hibernation API instead of serverWebSocket.accept()
		this.ctx.acceptWebSocket(serverWebSocket)

		// Store sessionId in attachment immediately so we can identify this socket
		// after hibernation, before the connect handshake completes.
		const attachment: SocketAttachment = { sessionId, snapshot: null }
		serverWebSocket.serializeAttachment(attachment)

		// Connect to the room. The first webSocketMessage from the client will
		// complete the handshake and trigger debounced snapshot storage.
		// Only presenters (who opened the room with the password) can change the document.
		const isReadonly = !(await this.isPresenterToken(request.query.presenter))
		this.getOrCreateRoom().handleSocketConnect({ sessionId, socket: serverWebSocket, isReadonly })

		return new Response(null, { status: 101, webSocket: clientWebSocket })
	}

	// --- WebSocket Hibernation API handlers ---

	override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		const attachment = getAttachment(ws)
		if (!attachment) return

		this.sessionIdToWs.set(attachment.sessionId, ws)
		this.getOrCreateRoom().handleSocketMessage(attachment.sessionId, message)
	}

	override async webSocketClose(ws: WebSocket) {
		this.handleWebSocketEnd(ws, 'handleSocketClose')
		await this.scheduleCloseIfEmpty(ws)
	}

	override async webSocketError(ws: WebSocket) {
		this.handleWebSocketEnd(ws, 'handleSocketError')
		await this.scheduleCloseIfEmpty(ws)
	}

	private handleWebSocketEnd(ws: WebSocket, method: 'handleSocketClose' | 'handleSocketError') {
		const attachment = getAttachment(ws)
		if (!attachment) return

		this.sessionIdToWs.delete(attachment.sessionId)

		const room = this.getOrCreateRoom()

		// If the DO was hibernating, this session was never re-added to the room
		// (ctx.getWebSockets() doesn't include the disconnecting socket). Resume it
		// briefly so the room can broadcast presence removal to other clients.
		if (attachment.snapshot && !room.getSessionSnapshot(attachment.sessionId)) {
			room.handleSocketResume({
				sessionId: attachment.sessionId,
				socket: ws,
				snapshot: attachment.snapshot,
			})
		}

		room[method](attachment.sessionId)
	}
}
