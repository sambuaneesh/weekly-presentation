// The presentation pack running on the web: the same board script the desktop app runs
// (config.js for UI + present tool, main.js for deck sync), fed by a snapshot of the deck.
// With ?room=<name> (and a sync server configured) the deck is shared live; see live.jsx.
import { useState } from 'react'
import { Tldraw, inlineBase64AssetStore } from 'tldraw'
import { useSync } from '@tldraw/sync'
import 'tldraw/tldraw.css'
import packConfig from '@pack/config.js'
import runPackMain from '@pack/main.js'
import deck from './deck.json'
import { SYNC_URL, roomId, seedFromDeck, useLiveRoom, LiveBar, slideCount } from './live.jsx'

const pack = packConfig({
	config: { shapeUtils: [], bindingUtils: [], assetUtils: [], overlayUtils: [], tools: [], components: {}, options: {} },
})
const PackInFront = pack.components.InFrontOfTheCanvas
const components = { ...pack.components, InFrontOfTheCanvas: () => (<><PackInFront /><LiveBar deck={deck} /></>) }
const licenseKey = import.meta.env.VITE_TLDRAW_LICENSE_KEY

function mountPack(editor) {
	const controller = new AbortController()
	// Each browser runs the pack's deck sync; it only rewrites derived text, so it is safe in a room.
	runPackMain({ editor, signal: controller.signal, app: { board: { isHost: true } } })
	// Open on the first (leftmost) slide.
	const first = editor
		.getCurrentPageShapes()
		.filter((s) => s.type === 'frame' && s.parentId === editor.getCurrentPageId())
		.sort((a, b) => a.x - b.x || a.y - b.y)[0]
	if (first) editor.zoomToBounds(editor.getShapePageBounds(first.id), { inset: 120 })
	if (import.meta.env.DEV) window.editor = editor
	return () => controller.abort()
}

function Solo() {
	return <Tldraw snapshot={deck} tools={pack.tools} components={components} licenseKey={licenseKey} onMount={mountPack} />
}

function Live() {
	const store = useSync({ uri: `${SYNC_URL}/api/connect/${roomId}`, assets: inlineBase64AssetStore })
	const [editor, setEditor] = useState(null)
	useLiveRoom(editor)
	return (
		<Tldraw
			store={store}
			tools={pack.tools}
			components={components}
			licenseKey={licenseKey}
			onMount={(editor) => {
				// A new room starts empty: fill it from the published deck.
				if (slideCount(editor) === 0) seedFromDeck(editor, deck)
				setEditor(editor)
				return mountPack(editor)
			}}
		/>
	)
}

export default function App() {
	return <div style={{ position: 'fixed', inset: 0 }}>{roomId && SYNC_URL ? <Live /> : <Solo />}</div>
}
