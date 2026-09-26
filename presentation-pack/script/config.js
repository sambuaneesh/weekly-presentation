// Presentation pack — editor construction: slide panel, top bar, notes, present tool and overlays.
// Source of truth lives in the pack folder; bin/install.mjs copies this bundle into a deck.
import { createElement as h, Fragment } from 'react'
import { PresentTool } from './ui/presentTool.js'
import { SlidePanel } from './ui/SlidePanel.js'
import { TopBar } from './ui/TopBar.js'
import { NotesPanel, PresentOverlay, InsertButtons, BeatStyles, BEAT_CSS } from './ui/Overlays.js'
import { SceneShapeUtil } from './scenes/SceneShapeUtil.js'
import { EXTENSIONS } from './extensions.js'
import { SCENE_CSS } from './scenes/kit.js'
import { beatVisibility } from './lib/beats.js'

// tldraw outlines text in the canvas colour so it reads over lines; on slides (and especially dark
// themes) that shows up as a halo, so decks turn it off.
export const DECK_CSS = `.tl-container { --tl-text-outline: none; } .tl-text__outline { text-shadow: none !important; }` + SCENE_CSS + BEAT_CSS

// Shapes waiting for a later build step are hidden (see lib/beats.js).
export function getShapeVisibility(shape, editor) {
	return beatVisibility(shape, editor)
}

/** @param {import('../.script-workspace/script-context').ConfigScriptContext} ctx */
export default function ({ config }) {
	const { InFrontOfTheCanvas: AppInFront, OnTheCanvas: AppOnCanvas } = config.components ?? {}
	config.tools.push(PresentTool)
	// Extra shape types from deck extensions (they also need adding to the sync server's schema).
	config.shapeUtils.push(SceneShapeUtil, ...EXTENSIONS.flatMap((e) => e?.shapeUtils ?? []))
	const appVisibility = config.getShapeVisibility
	return {
		...config,
		getShapeVisibility: (shape, editor) => {
			const own = getShapeVisibility(shape, editor)
			return own === 'hidden' ? own : (appVisibility?.(shape, editor) ?? own)
		},
		components: {
			...config.components,
			InFrontOfTheCanvas: () =>
				h(Fragment, null,
					AppInFront ? h(AppInFront) : null,
					h('style', null, DECK_CSS),
					h(BeatStyles), h(SlidePanel), h(TopBar), h(NotesPanel), h(PresentOverlay)),
			OnTheCanvas: () => h(Fragment, null, AppOnCanvas ? h(AppOnCanvas) : null, h(InsertButtons)),
		},
	}
}
