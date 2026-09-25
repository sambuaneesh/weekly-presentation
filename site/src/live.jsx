// Live rooms: everyone who opens ?room=<name> shares one tldraw document through the sync server
// (../sync-worker). Two roles:
//   presenter – opened the room with the room password (the server hands back a presenter token);
//               can edit, present, laser and highlight, like the normal editor.
//   viewer    – anyone else with the link; read-only (enforced by the server) and follows the
//               presenter: their screen while they edit, their slides while they present.
// Cursors, laser pointers and highlighter strokes travel through tldraw sync; this file adds
// filling a new room from the published deck, and the following.
import { useEffect, useState } from 'react'
import { useEditor, useValue } from 'tldraw'
import { getDeck } from '@pack/lib/deck.js'
import { getSlides } from '@pack/lib/slides.js'
import { live, presentIndex } from '@pack/ui/state.js'
import { h, css, guard, Button } from '@pack/ui/kit.js'

export const SYNC_URL = import.meta.env.VITE_SYNC_URL
export const roomId = new URLSearchParams(location.search).get('room')?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || null

// ---------- presenter token (kept per room in this browser) ----------

const tokenKey = (id) => `pp-presenter:${id}`
export function presenterToken(id = roomId) {
	try {
		return localStorage.getItem(tokenKey(id))
	} catch {
		return null
	}
}
function savePresenterToken(id, token) {
	try {
		localStorage.setItem(tokenKey(id), token)
	} catch {}
}

// ---------- sync server API ----------

// { exists, presenter }: is the room open, and is this browser's token a presenter token for it?
export async function roomStatus(id) {
	const token = presenterToken(id)
	const r = await fetch(`${SYNC_URL}/api/rooms/${id}${token ? `?presenter=${encodeURIComponent(token)}` : ''}`)
	if (!r.ok) throw new Error(`sync server: ${r.status}`)
	return r.json()
}

// Open (or re-open) a room with the room password; makes this browser its presenter.
async function openRoom(id, password) {
	const r = await fetch(`${SYNC_URL}/api/rooms/${id}/open`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ password }),
	})
	if (r.status === 401) throw new Error('Wrong password')
	if (!r.ok) throw new Error(`Could not open the room (${r.status})`)
	savePresenterToken(id, (await r.json()).token)
}

export function connectUri(isPresenter) {
	const token = isPresenter && presenterToken()
	return `${SYNC_URL}/api/connect/${roomId}${token ? `?presenter=${encodeURIComponent(token)}` : ''}`
}

function newRoomId() {
	return crypto.getRandomValues(new Uint32Array(2)).reduce((a, n) => a + n.toString(36), '').slice(0, 10)
}

function roomUrl(id) {
	const url = new URL(location.href)
	if (id) url.searchParams.set('room', id)
	else url.searchParams.delete('room')
	return url.toString()
}

// ---------- room content ----------

// Put the published deck's pages, shapes, bindings and assets into the room. Record ids come
// from the deck, so seeding twice writes the same records.
export function seedFromDeck(editor, deck, { reset = false } = {}) {
	const migrated = editor.store.schema.migrateStoreSnapshot(deck)
	if (migrated.type !== 'success') throw new Error('Could not load the deck: ' + migrated.reason)
	const records = Object.values(migrated.value)
	const deckPage = records.find((r) => r.typeName === 'page')
	const pageId = editor.getCurrentPageId()
	const content = records
		.filter((r) => r.typeName === 'shape' || r.typeName === 'binding' || r.typeName === 'asset')
		.map((r) => (r.typeName === 'shape' && r.parentId === deckPage?.id ? { ...r, parentId: pageId } : r))
	const deckDoc = records.find((r) => r.typeName === 'document')
	editor.run(
		() => {
			if (reset) editor.deleteShapes([...editor.getCurrentPageShapeIds()])
			editor.store.put(content)
			const meta = editor.getDocumentSettings().meta ?? {}
			editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(deckDoc?.meta?.pp ?? {}), live: null, host: meta.pp?.host ?? null } } })
		},
		{ ignoreShapeLock: true }
	)
}

export function slideCount(editor) {
	return getSlides(editor).length
}

// ---------- presenting and following ----------

// Presence records prefix user ids ("user:abc"); the local id comes without it.
const bare = (id) => id.replace(/^user:/, '')

function writeDeckMeta(editor, patch) {
	const meta = editor.getDocumentSettings().meta ?? {}
	editor.run(() => editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(meta.pp ?? {}), ...patch } } }), { history: 'ignore' })
}

// Presenters announce themselves (host) and publish their presenting (live); viewers follow.
export function useLiveRoom(editor, isPresenter) {
	useEffect(() => {
		if (!editor) return
		const me = bare(editor.user.getId())

		if (isPresenter) {
			writeDeckMeta(editor, { host: me })
			live.set({
				onPresent: (index) => {
					const current = getDeck(editor).live
					writeDeckMeta(editor, { live: index === null ? null : { presenter: me, index, at: current?.presenter === me ? current.at : Date.now() } })
				},
			})
			return () => live.set(null)
		}

		let skipAt = null // a presentation this viewer chose to stop following
		live.set({ onStopFollowing: () => (skipAt = getDeck(editor).live?.at ?? null) })

		function follow() {
			const deck = getDeck(editor)
			const collaborators = editor.getCollaborators()
			const here = (id) => id && collaborators.find((c) => bare(c.userId) === id)
			const tool = editor.getCurrentToolId()
			const followingSlides = tool === 'present' && editor.getCurrentTool().follower

			// Presenting: show the presenter's slide, fitted to this screen.
			const state = deck.live
			if (state && here(state.presenter) && state.at !== skipAt) {
				if (!followingSlides) {
					// Our own switch from viewport-follow to slide-follow, not the viewer opting out.
					ownChange = true
					editor.stopFollowingUser()
					editor.setCurrentTool('present', { startIndex: state.index, follower: true })
					ownChange = false
				}
				else if (presentIndex.get() !== state.index) editor.getCurrentTool().followTo(state.index)
				return
			}
			if (followingSlides) editor.setCurrentTool('select')

			// Not presenting: follow the host's viewport (tldraw's "follow user").
			const host = here(deck.host)
			const followingId = editor.getInstanceState().followingUserId
			if (host && followingId === null && !viewerStoppedFollowing) editor.startFollowingUser(host.userId)
		}

		// Panning or zooming yourself stops tldraw's follow; the bar offers "Follow presenter".
		let viewerStoppedFollowing = false
		let ownChange = false
		const stopWatchingFollow = editor.sideEffects.registerAfterChangeHandler('instance', (prev, next) => {
			if (prev.followingUserId && !next.followingUserId && !ownChange && editor.getCurrentToolId() !== 'present') viewerStoppedFollowing = true
		})
		followAgain = () => {
			viewerStoppedFollowing = false
			skipAt = null
			follow()
		}

		const stop = editor.store.listen(follow)
		follow()
		return () => {
			stop()
			stopWatchingFollow()
			live.set(null)
			followAgain = null
		}
	}, [editor, isPresenter])
}

let followAgain = null

// ---------- UI ----------

function PasswordForm({ title, submitLabel, onDone, onCancel, withName }) {
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [status, setStatus] = useState(null) // null | 'busy' | error message
	const submit = async (e) => {
		e.preventDefault()
		const id = withName ? name.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || newRoomId() : roomId
		setStatus('busy')
		try {
			await openRoom(id, password)
			onDone(id)
		} catch (err) {
			setStatus(err.message)
		}
	}
	return h('form', { onSubmit: submit, style: { display: 'flex', flexDirection: 'column', gap: 8, padding: 10, width: 260 } },
		h('b', null, title),
		h('input', { type: 'password', autoFocus: true, placeholder: 'Room password', value: password, onChange: (e) => setPassword(e.target.value), style: css.input }),
		withName && h('input', { placeholder: 'Room name (optional, e.g. weekly)', value: name, onChange: (e) => setName(e.target.value), style: css.input }),
		status && status !== 'busy' && h('div', { style: { color: 'var(--tl-color-warn, #e03131)' } }, status),
		h('div', { style: { display: 'flex', gap: 4, justifyContent: 'flex-end' } },
			h(Button, { label: 'Cancel', onClick: (e) => (e.preventDefault(), onCancel()) }),
			h('button', { type: 'submit', disabled: !password || status === 'busy', style: { ...css.input, width: 'auto', cursor: 'pointer', background: 'var(--tl-color-selected)', color: 'var(--tl-color-selected-contrast)', border: 'none', fontWeight: 600 } },
				status === 'busy' ? '…' : submitLabel)))
}

// Bar at the top: go live / room status, copy link, and role-specific actions.
export function LiveBar({ deck, isPresenter }) {
	const editor = useEditor()
	const presenting = useValue(presentIndex) >= 0
	const people = useValue('collaborators', () => editor.getCollaborators().length + 1, [editor])
	const following = useValue('following', () => !!editor.getInstanceState().followingUserId, [editor])
	const [copied, setCopied] = useState(false)
	const [asking, setAsking] = useState(false)
	if (presenting || !SYNC_URL) return null

	const bar = { ...css.panel, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2, padding: 3, zIndex: 300 }
	if (!roomId) {
		return h('div', { ...guard(editor), style: bar },
			asking
				? h(PasswordForm, { title: 'Start a live room', submitLabel: 'Go live', withName: true, onDone: (id) => (location.href = roomUrl(id)), onCancel: () => setAsking(false) })
				: h(Button, { label: '● Go live', title: 'Start a live room (needs the room password). Viewers follow you and cannot edit.', onClick: () => setAsking(true) }))
	}
	if (asking) {
		return h('div', { ...guard(editor), style: bar },
			h(PasswordForm, { title: 'Presenter login', submitLabel: 'Log in', onDone: () => location.reload(), onCancel: () => setAsking(false) }))
	}
	const copy = h(Button, {
		label: copied ? 'Copied!' : 'Copy link',
		onClick: () => navigator.clipboard.writeText(roomUrl(roomId)).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500))),
	})
	const status = h('span', { style: { padding: '0 8px', whiteSpace: 'nowrap' } },
		h('span', { style: { color: '#2f9e44' } }, '● '),
		`Live · ${roomId} · ${people} ${people === 1 ? 'person' : 'people'} · ${isPresenter ? 'Presenter' : 'Viewing'}`)

	if (isPresenter) {
		return h('div', { ...guard(editor), style: bar },
			status,
			copy,
			h(Button, {
				label: 'Reset to deck',
				title: 'Replace this room with the published deck (removes highlights and edits made here)',
				onClick: () => confirm('Reset this room to the published deck for everyone?') && seedFromDeck(editor, deck, { reset: true }),
			}),
			h(Button, { label: 'Leave', onClick: () => (location.href = roomUrl(null)) }))
	}
	return h('div', { ...guard(editor), style: bar },
		status,
		!following && h(Button, { label: 'Follow presenter', onClick: () => followAgain?.() }),
		copy,
		h(Button, { label: 'Presenter login', title: 'Enter the room password to present and edit', onClick: () => setAsking(true) }),
		h(Button, { label: 'Leave', onClick: () => (location.href = roomUrl(null)) }))
}

// Shown when a room link isn't live: it was never started, or everyone left and it closed.
// The presenter can start it again here with the room password; others wait for them.
export function RoomClosed() {
	const [password, setPassword] = useState('')
	const [status, setStatus] = useState(null) // null | 'busy' | error message
	const submit = async (e) => {
		e.preventDefault()
		setStatus('busy')
		try {
			await openRoom(roomId, password)
			location.reload()
		} catch (err) {
			setStatus(err.message)
		}
	}
	const input = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, font: 'inherit' }
	return (
		<div style={{ height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#333', background: '#f8f9fa' }}>
			<div style={{ textAlign: 'center', maxWidth: 380, padding: 24 }}>
				<h2 style={{ margin: '0 0 8px' }}>This room isn't live</h2>
				<p style={{ margin: '0 0 16px', color: '#666' }}>
					Room <b>{roomId}</b> hasn't been started, or everyone has left. Ask the presenter to start it, then reload.
				</p>
				<form onSubmit={submit} style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
					<input type="password" placeholder="Room password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
					<button type="submit" disabled={!password || status === 'busy'} style={{ ...input, background: '#4465e9', color: '#fff', border: 'none', cursor: 'pointer' }}>
						{status === 'busy' ? 'Starting…' : 'Start room'}
					</button>
				</form>
				{status && status !== 'busy' && <div style={{ color: '#e03131', marginBottom: 8 }}>{status}</div>}
				<a href={roomUrl(null)}>Open the presentation instead</a>
			</div>
		</div>
	)
}
