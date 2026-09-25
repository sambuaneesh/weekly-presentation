// Live rooms: everyone who opens ?room=<name> shares one tldraw document through the sync server
// (../sync-worker). Cursors, laser pointers and highlighter strokes are shared by tldraw sync;
// this file adds the presentation parts: filling an empty room from the published deck, and
// making everyone follow whoever is presenting.
import { useEffect, useState } from 'react'
import { useEditor, useValue } from 'tldraw'
import { getDeck } from '@pack/lib/deck.js'
import { getSlides } from '@pack/lib/slides.js'
import { live, presentIndex } from '@pack/ui/state.js'
import { h, css, guard, Button } from '@pack/ui/kit.js'

export const SYNC_URL = import.meta.env.VITE_SYNC_URL
export const roomId = new URLSearchParams(location.search).get('room')?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || null

// Put the published deck's pages, shapes, bindings and assets into the room. Record ids come
// from the deck, so two people seeding an empty room at once write the same records.
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
			editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(deckDoc?.meta?.pp ?? {}), live: null } } })
		},
		{ ignoreShapeLock: true }
	)
}

function writeLive(editor, value) {
	const meta = editor.getDocumentSettings().meta ?? {}
	editor.run(() => editor.updateDocumentSettings({ meta: { ...meta, pp: { ...(meta.pp ?? {}), live: value } } }), { history: 'ignore' })
}

// Publishes this person's presenting, and keeps everyone else on the presenter's slide.
export function useLiveRoom(editor) {
	useEffect(() => {
		if (!editor) return
		// Presence records prefix user ids ("user:abc"); the local id comes without it.
		const me = editor.user.getId().replace(/^user:/, '')
		let skipAt = null // a presentation this person chose to stop following

		live.set({
			onPresent: (index) => writeLive(editor, index === null ? null : { presenter: me, index, at: getDeck(editor).live?.presenter === me ? getDeck(editor).live.at : Date.now() }),
			onStopFollowing: () => (skipAt = getDeck(editor).live?.at ?? null),
		})

		function follow() {
			const state = getDeck(editor).live
			const tool = editor.getCurrentToolId()
			const following = tool === 'present' && editor.getCurrentTool().follower
			// Only follow a presenter who is actually still in the room.
			const presenterHere = state && editor.getCollaborators().some((c) => c.userId.replace(/^user:/, '') === state.presenter)
			if (!state || state.presenter === me || !presenterHere || state.at === skipAt) {
				if (following) editor.setCurrentTool('select')
				return
			}
			if (tool === 'present' && !following) return // presenting yourself: don't hijack
			if (!following) editor.setCurrentTool('present', { startIndex: state.index, follower: true })
			else if (presentIndex.get() !== state.index) editor.getCurrentTool().followTo(state.index)
		}

		const stop = editor.store.listen(follow)
		follow()
		return () => {
			stop()
			live.set(null)
		}
	}, [editor])
}

function newRoomId() {
	return crypto.getRandomValues(new Uint32Array(2)).reduce((a, n) => a + n.toString(36), '').slice(0, 10)
}

// Rooms must be opened with the room password (checked by the sync server) before anyone can join.
export async function roomExists(id) {
	const r = await fetch(`${SYNC_URL}/api/rooms/${id}`)
	if (!r.ok) throw new Error(`sync server: ${r.status}`)
	return (await r.json()).exists
}

async function openRoom(id, password) {
	const r = await fetch(`${SYNC_URL}/api/rooms/${id}/open`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ password }),
	})
	if (r.status === 401) throw new Error('Wrong password')
	if (!r.ok) throw new Error(`Could not open the room (${r.status})`)
}

function GoLiveForm({ editor, onCancel }) {
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [status, setStatus] = useState(null) // null | 'busy' | error message
	const submit = async (e) => {
		e.preventDefault()
		const id = name.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || newRoomId()
		setStatus('busy')
		try {
			await openRoom(id, password)
			location.href = roomUrl(id)
		} catch (err) {
			setStatus(err.message)
		}
	}
	return h('form', { onSubmit: submit, style: { display: 'flex', flexDirection: 'column', gap: 8, padding: 10, width: 260 } },
		h('b', null, 'Start a live room'),
		h('input', { type: 'password', autoFocus: true, placeholder: 'Room password', value: password, onChange: (e) => setPassword(e.target.value), style: css.input }),
		h('input', { placeholder: 'Room name (optional, e.g. weekly)', value: name, onChange: (e) => setName(e.target.value), style: css.input }),
		status && status !== 'busy' && h('div', { style: { color: 'var(--tl-color-warn, #e03131)' } }, status),
		h('div', { style: { display: 'flex', gap: 4, justifyContent: 'flex-end' } },
			h(Button, { label: 'Cancel', onClick: (e) => (e.preventDefault(), onCancel()) }),
			h('button', { type: 'submit', disabled: !password || status === 'busy', style: { ...css.input, width: 'auto', cursor: 'pointer', background: 'var(--tl-color-selected)', color: 'var(--tl-color-selected-contrast)', border: 'none', fontWeight: 600 } },
				status === 'busy' ? 'Opening…' : 'Go live')))
}

function roomUrl(id) {
	const url = new URL(location.href)
	if (id) url.searchParams.set('room', id)
	else url.searchParams.delete('room')
	return url.toString()
}

// Small bar at the top: go live / room status, copy link, reset, leave.
export function LiveBar({ deck }) {
	const editor = useEditor()
	const presenting = useValue(presentIndex) >= 0
	const people = useValue('collaborators', () => editor.getCollaborators().length + 1, [editor])
	const [copied, setCopied] = useState(false)
	const [asking, setAsking] = useState(false)
	if (presenting || !SYNC_URL) return null

	const bar = { ...css.panel, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2, padding: 3, zIndex: 300 }
	if (!roomId) {
		return h('div', { ...guard(editor), style: bar },
			asking
				? h(GoLiveForm, { editor, onCancel: () => setAsking(false) })
				: h(Button, { label: '● Go live', title: 'Start a live room (needs the room password): share the link and everyone sees the same slides, laser and highlights', onClick: () => setAsking(true) }))
	}
	return h('div', { ...guard(editor), style: bar },
		h('span', { style: { padding: '0 8px', whiteSpace: 'nowrap' } },
			h('span', { style: { color: '#2f9e44' } }, '● '), `Live · ${roomId} · ${people} ${people === 1 ? 'person' : 'people'}`),
		h(Button, {
			label: copied ? 'Copied!' : 'Copy link',
			onClick: () => navigator.clipboard.writeText(roomUrl(roomId)).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500))),
		}),
		h(Button, {
			label: 'Reset to deck',
			title: 'Replace this room with the published deck (removes highlights and edits made here)',
			onClick: () => confirm('Reset this room to the published deck for everyone?') && seedFromDeck(editor, deck, { reset: true }),
		}),
		h(Button, { label: 'Leave', onClick: () => (location.href = roomUrl(null)) }))
}

// Shown for a room link that was never opened (or a typo in the link).
export function RoomNotFound() {
	return (
		<div style={{ height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#333', background: '#f8f9fa' }}>
			<div style={{ textAlign: 'center', maxWidth: 360, padding: 24 }}>
				<h2 style={{ margin: '0 0 8px' }}>Room not found</h2>
				<p style={{ margin: '0 0 16px', color: '#666' }}>This live room hasn't been started. Check the link with the presenter.</p>
				<a href={roomUrl(null)}>Open the presentation instead</a>
			</div>
		</div>
	)
}

export function slideCount(editor) {
	return getSlides(editor).length
}
