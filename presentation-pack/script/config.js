// Presentation pack — editor construction: slide panel, top bar, notes, present tool and overlays.
// Source of truth lives in the pack folder; bin/install.mjs copies this bundle into a deck.
import { createElement as h, Fragment } from 'react'
import { PresentTool } from './ui/presentTool.js'
import { SlidePanel } from './ui/SlidePanel.js'
import { TopBar } from './ui/TopBar.js'
import { NotesPanel, PresentOverlay, InsertButtons } from './ui/Overlays.js'

// tldraw outlines text in the canvas colour so it reads over lines; on slides (and especially dark
// themes) that shows up as a halo, so decks turn it off.
export const DECK_CSS = `.tl-container { --tl-text-outline: none; } .tl-text__outline { text-shadow: none !important; }`

/** @param {import('../.script-workspace/script-context').ConfigScriptContext} ctx */
export default function ({ config }) {
	const { InFrontOfTheCanvas: AppInFront, OnTheCanvas: AppOnCanvas } = config.components ?? {}
	config.tools.push(PresentTool)
	return {
		...config,
		components: {
			...config.components,
			InFrontOfTheCanvas: () =>
				h(Fragment, null,
					AppInFront ? h(AppInFront) : null,
					h('style', null, DECK_CSS),
					h(SlidePanel), h(TopBar), h(NotesPanel), h(PresentOverlay)),
			OnTheCanvas: () => h(Fragment, null, AppOnCanvas ? h(AppOnCanvas) : null, h(InsertButtons)),
		},
	}
}
