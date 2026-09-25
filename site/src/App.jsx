// The presentation pack running on the web: the same board script the desktop app runs
// (config.js for UI + present tool, main.js for deck sync), fed by a snapshot of the deck.
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import packConfig from '@pack/config.js'
import runPackMain from '@pack/main.js'
import deck from './deck.json'

const { tools, components } = packConfig({
	config: { shapeUtils: [], bindingUtils: [], assetUtils: [], overlayUtils: [], tools: [], components: {}, options: {} },
})

export default function App() {
	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				snapshot={deck}
				tools={tools}
				components={components}
				licenseKey={import.meta.env.VITE_TLDRAW_LICENSE_KEY}
				onMount={(editor) => {
					const controller = new AbortController()
					// A visitor's browser is the only editor on its copy, so it acts as host.
					runPackMain({ editor, signal: controller.signal, app: { board: { isHost: true } } })
					// Open on the first (leftmost) slide.
					const first = editor
						.getCurrentPageShapes()
						.filter((s) => s.type === 'frame' && s.parentId === editor.getCurrentPageId())
						.sort((a, b) => a.x - b.x || a.y - b.y)[0]
					if (first) editor.zoomToBounds(editor.getShapePageBounds(first.id), { inset: 120 })
					return () => controller.abort()
				}}
			/>
		</div>
	)
}
