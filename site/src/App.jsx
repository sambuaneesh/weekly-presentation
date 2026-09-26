// The presentations website. Routes (hash-based, so it works on GitHub Pages without a server):
//   #/                  the gallery of every deck (Gallery.jsx, from decks/index.json)
//   #/<slug>            one deck, running the same presentation pack the desktop app runs
//   ?room=<name>#/<slug>  that deck, shared live through the sync server (live.jsx)
// Decks are exported at build time (scripts/export-decks.mjs) to public/decks/<slug>.json and
// loaded on demand, so adding a deck never makes the others slower.
import { useEffect, useMemo, useState } from 'react'
import { Tldraw, inlineBase64AssetStore, defaultShapeUtils, useValue } from 'tldraw'
import { useSync } from '@tldraw/sync'
import 'tldraw/tldraw.css'
import packConfig, { DECK_CSS, getShapeVisibility } from '@pack/config.js'
import runPackMain from '@pack/main.js'
import { PresentOverlay, BeatStyles } from '@pack/ui/Overlays.js'
import { presentIndex } from '@pack/ui/state.js'
import { SYNC_URL, roomId, deckSlug, seedFromDeck, useLiveRoom, LiveBar, slideCount, roomStatus, connectUri, RoomClosed } from './live.jsx'
import { Gallery, NotFound, Loading } from './Gallery.jsx'

const pack = packConfig({
	config: { shapeUtils: [], bindingUtils: [], assetUtils: [], overlayUtils: [], tools: [], components: {}, options: {} },
})
const PackInFront = pack.components.InFrontOfTheCanvas
// A live room's store needs every shape type up front, including the pack's scenes.
const syncShapeUtils = [...defaultShapeUtils, ...pack.shapeUtils]
const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY

// "← all presentations", out of the way while presenting.
function BackLink() {
	const presenting = useValue(presentIndex) >= 0
	if (presenting) return null
	return (
		<a href="#/" className="pp-back" onPointerDown={(e) => e.stopPropagation()}>
			← all presentations
		</a>
	)
}
const BACK_CSS = `.pp-back { position: absolute; left: 104px; bottom: 10px; z-index: 400; pointer-events: all; font: 13px 'Shantell Sans', system-ui, sans-serif;
	color: #2b2621; background: #f9f0e6; border: 1.5px solid #2b2621; border-radius: 10px 14px 9px 12px; padding: 5px 11px; text-decoration: none; box-shadow: 2px 2px 0 rgba(43,38,33,.15); }
	.pp-back:hover { background: #fff; }`

function zoomToFirstSlide(editor) {
	const first = editor
		.getCurrentPageShapes()
		.filter((s) => s.type === 'frame' && s.parentId === editor.getCurrentPageId())
		.sort((a, b) => a.x - b.x || a.y - b.y)[0]
	if (first) editor.zoomToBounds(editor.getShapePageBounds(first.id), { inset: 120 })
	if (import.meta.env.DEV) window.editor = editor
}

function mountPack(editor) {
	const controller = new AbortController()
	// Keeps slide numbers and footers in step; only run by someone who can edit.
	runPackMain({ editor, signal: controller.signal, app: { board: { isHost: true } } })
	zoomToFirstSlide(editor)
	return () => controller.abort()
}

function useComponents(deck) {
	return useMemo(() => {
		// Editors (solo visitors and live-room presenters): the full pack UI.
		const editor = { ...pack.components, InFrontOfTheCanvas: () => (<><PackInFront /><style>{BACK_CSS}</style><BackLink /><LiveBar deck={deck} isPresenter /></>) }
		// Live-room viewers: no editing UI, just the presenting overlay and the room bar.
		const viewer = { InFrontOfTheCanvas: () => (<><style>{DECK_CSS + BACK_CSS}</style><BeatStyles /><PresentOverlay /><BackLink /><LiveBar deck={deck} isPresenter={false} /></>) }
		return { editor, viewer }
	}, [deck])
}

function Solo({ deck }) {
	const { editor } = useComponents(deck)
	return <Tldraw snapshot={deck} tools={pack.tools} shapeUtils={pack.shapeUtils} getShapeVisibility={getShapeVisibility} components={editor} licenseKey={licenseKey} onMount={mountPack} />
}

function Live({ deck, isPresenter }) {
	const store = useSync({ uri: connectUri(isPresenter), assets: inlineBase64AssetStore, shapeUtils: syncShapeUtils })
	const [editor, setEditor] = useState(null)
	const components = useComponents(deck)
	useLiveRoom(editor, isPresenter)
	return (
		<Tldraw
			store={store}
			tools={pack.tools}
			shapeUtils={pack.shapeUtils}
			getShapeVisibility={getShapeVisibility}
			components={isPresenter ? components.editor : components.viewer}
			licenseKey={licenseKey}
			onMount={(editor) => {
				setEditor(editor)
				if (!isPresenter) return zoomToFirstSlide(editor)
				// A new room starts empty: the presenter fills it from the published deck.
				if (slideCount(editor) === 0) seedFromDeck(editor, deck)
				return mountPack(editor)
			}}
		/>
	)
}

// Only connect to rooms that are open (started with the room password and not yet abandoned).
function LiveGate({ deck }) {
	const [status, setStatus] = useState(null)
	useEffect(() => {
		roomStatus(roomId).then(setStatus, () => setStatus({ exists: false }))
	}, [])
	if (!status) return <Loading />
	return status.exists ? <Live deck={deck} isPresenter={status.presenter} /> : <RoomClosed />
}

function DeckView({ slug }) {
	const [state, setState] = useState({ deck: null, error: null })
	useEffect(() => {
		let gone = false
		fetch(`decks/${slug}.json`)
			.then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'not found' : `HTTP ${r.status}`))))
			.then((deck) => !gone && setState({ deck, error: null }), (error) => !gone && setState({ deck: null, error }))
		fetch('decks/index.json')
			.then((r) => r.json())
			.then((ix) => {
				const d = ix.decks.find((d) => d.slug === slug)
				if (d && !gone) document.title = `${d.title} · presentations`
			})
			.catch(() => {})
		return () => void (gone = true)
	}, [slug])
	if (state.error) return <NotFound slug={slug} />
	if (!state.deck) return <Loading />
	return roomId && SYNC_URL ? <LiveGate deck={state.deck} /> : <Solo deck={state.deck} />
}

export default function App() {
	// Moving between the gallery and a deck reloads: each deck (and live room) starts clean.
	useEffect(() => {
		const onHash = () => location.reload()
		window.addEventListener('hashchange', onHash)
		return () => window.removeEventListener('hashchange', onHash)
	}, [])
	if (!deckSlug) return <Gallery />
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<DeckView slug={deckSlug} />
		</div>
	)
}
