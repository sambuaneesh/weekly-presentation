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
	return Math.random().toString(36).slice(2, 8)
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
	if (presenting || !SYNC_URL) return null

	const bar = { ...css.panel, position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 2, padding: 3, zIndex: 300 }
	if (!roomId) {
		return h('div', { ...guard(editor), style: bar },
			h(Button, { label: '● Go live', title: 'Start a live room: share the link and everyone sees the same slides, laser and highlights', onClick: () => (location.href = roomUrl(newRoomId())) }))
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

export function slideCount(editor) {
	return getSlides(editor).length
}
