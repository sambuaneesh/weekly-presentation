// The presentation pack running on the web: the same board script the desktop app runs
// (config.js for UI + present tool, main.js for deck sync), fed by a snapshot of the deck.
// With ?room=<name> (and a sync server configured) the deck is shared live; see live.jsx:
// presenters get the full editor, viewers a read-only view that follows the presenter.
import { useEffect, useState } from 'react'
import { Tldraw, inlineBase64AssetStore } from 'tldraw'
import { useSync } from '@tldraw/sync'
import 'tldraw/tldraw.css'
import packConfig, { DECK_CSS } from '@pack/config.js'
import runPackMain from '@pack/main.js'
import { PresentOverlay } from '@pack/ui/Overlays.js'
import deck from './deck.json'
import { SYNC_URL, roomId, seedFromDeck, useLiveRoom, LiveBar, slideCount, roomStatus, connectUri, RoomClosed } from './live.jsx'

const pack = packConfig({
	config: { shapeUtils: [], bindingUtils: [], assetUtils: [], overlayUtils: [], tools: [], components: {}, options: {} },
})
const PackInFront = pack.components.InFrontOfTheCanvas
// Editors (solo visitors and live-room presenters): the full pack UI.
const editorComponents = { ...pack.components, InFrontOfTheCanvas: () => (<><PackInFront /><LiveBar deck={deck} isPresenter /></>) }
// Live-room viewers: no editing UI, just the presenting overlay and the room bar.
const viewerComponents = {
	InFrontOfTheCanvas: () => (<><style>{DECK_CSS}</style><PresentOverlay /><LiveBar deck={deck} isPresenter={false} /></>),
}
const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY

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

function Solo() {
	return <Tldraw snapshot={deck} tools={pack.tools} components={editorComponents} licenseKey={licenseKey} onMount={mountPack} />
}

function Live({ isPresenter }) {
	const store = useSync({ uri: connectUri(isPresenter), assets: inlineBase64AssetStore })
	const [editor, setEditor] = useState(null)
	useLiveRoom(editor, isPresenter)
	return (
		<Tldraw
			store={store}
			tools={pack.tools}
			components={isPresenter ? editorComponents : viewerComponents}
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
function LiveGate() {
	const [status, setStatus] = useState(null)
	useEffect(() => {
		roomStatus(roomId).then(setStatus, () => setStatus({ exists: false }))
	}, [])
	if (!status) return null
	return status.exists ? <Live isPresenter={status.presenter} /> : <RoomClosed />
}

export default function App() {
	return <div style={{ position: 'fixed', inset: 0 }}>{roomId && SYNC_URL ? <LiveGate /> : <Solo />}</div>
}
