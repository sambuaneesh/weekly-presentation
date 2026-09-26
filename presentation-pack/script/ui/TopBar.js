// Top bar: slide navigation, theme and deck settings, notes toggle, and presenting.
import { useEditor, useValue } from 'tldraw'
import { h, css, guard, Button, MenuItem, Popover } from './kit.js'
import { panelOpen, notesOpen, openMenu, presentIndex, previewBeat, PANEL_W } from './state.js'
import { slideBeats } from '../lib/beats.js'
import { goTo } from './SlidePanel.js'
import { getSlides, getCurrentIndex, applyTheme, tidySlides, syncDeck, slideOf } from '../lib/slides.js'
import { getDeck, updateDeck } from '../lib/deck.js'
import { THEMES } from '../lib/themes.js'

function ThemeMenu({ editor }) {
	const theme = useValue('deckTheme', () => getDeck(editor).theme, [editor])
	return h(Popover, { editor, style: { top: 40, left: '50%', transform: 'translateX(-50%)', width: 200 } },
		...Object.entries(THEMES).map(([id, t]) =>
			h(MenuItem, { key: id, label: t.name, hint: `${t.font} · ${t.accent}`, checked: id === theme, onClick: () => applyTheme(editor, id) })
		))
}

function DeckMenu({ editor }) {
	const deck = useValue('deck', () => getDeck(editor), [editor])
	const set = (patch) => editor.run(() => {
		updateDeck(editor, patch)
		syncDeck(editor)
	})
	const field = (label, key, placeholder) =>
		h('label', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
			h('span', { style: css.muted }, label),
			h('input', { value: deck[key], placeholder, onChange: (e) => set({ [key]: e.target.value }), style: css.input }))
	const toggle = (label, key) =>
		h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' } },
			h('input', { type: 'checkbox', checked: !!deck[key], onChange: (e) => set({ [key]: e.target.checked }) }), label)
	return h(Popover, { editor, style: { top: 40, left: '50%', transform: 'translateX(-50%)', width: 260, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 } },
		field('Deck title', 'title'),
		field('Footer text', 'footer', 'Defaults to the deck title'),
		toggle('Show footer', 'showFooter'),
		toggle('Show slide numbers', 'showNumbers'),
		h('div', { style: css.hsep }),
		h(Button, { label: 'Tidy slides into one row', onClick: () => tidySlides(editor) }))
}

// Preview a slide's build steps while editing: pins the current slide to one step ("all" = none).
function StepPreview({ editor, slide }) {
	const beats = useValue('slideBeatsTop', () => (slide ? slideBeats(editor, slide.id) : 0), [editor, slide?.id])
	const p = useValue(previewBeat)
	if (!slide || !beats) return null
	const shown = p?.slideId === slide.id ? p.beat : beats
	const set = (b) => previewBeat.set(b >= beats ? null : { slideId: slide.id, beat: Math.max(0, b) })
	return [
		h('div', { key: 'sep', style: css.sep }),
		h(Button, { key: 'p', label: '‹', title: 'Preview the previous build step', disabled: shown <= 0, onClick: () => set(shown - 1) }),
		h('span', { key: 'n', title: 'Build steps on this slide (a click while presenting reveals the next one)', style: { minWidth: 64, textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } },
			shown >= beats ? `Steps ${beats}` : `Step ${shown}/${beats}`),
		h(Button, { key: 'x', label: '›', title: 'Preview the next build step', disabled: shown >= beats, onClick: () => set(shown + 1) }),
	]
}

// Make the selected shapes appear on a build step of their slide ("always" = no step).
function RevealControl({ editor }) {
	const sel = useValue('revealSel', () => {
		const shapes = editor.getSelectedShapes().filter((s) => s.type !== 'frame' && s.type !== 'scene')
		const slide = shapes.length ? slideOf(editor, shapes[0].id) : null
		if (!slide || shapes.some((s) => slideOf(editor, s.id)?.id !== slide.id)) return null
		const beats = new Set(shapes.map((s) => (typeof s.meta?.beat === 'number' ? s.meta.beat : null)))
		return { ids: shapes.map((s) => s.id), slideId: slide.id, beat: beats.size === 1 ? [...beats][0] : 'mixed' }
	}, [editor])
	if (!sel) return null
	const max = slideBeats(editor, sel.slideId)
	const next = sel.beat === null || sel.beat === 'mixed' ? 1 : sel.beat >= max + 1 ? null : sel.beat + 1
	const set = () =>
		editor.run(() => {
			editor.updateShapes(sel.ids.map((id) => {
				const s = editor.getShape(id)
				const { beat, ...meta } = s.meta ?? {}
				return { id, type: s.type, meta: next === null ? meta : { ...meta, beat: next } }
			}))
		}, { ignoreShapeLock: true })
	const label = sel.beat === 'mixed' ? 'Appears: mixed' : sel.beat === null ? 'Appears: always' : `Appears: step ${sel.beat}`
	return [
		h('div', { key: 'rsep', style: css.sep }),
		h(Button, { key: 'rev', label, title: 'Click to cycle: which build step (click while presenting) reveals the selection', active: sel.beat !== null, onClick: set }),
	]
}

export function TopBar() {
	const editor = useEditor()
	const presenting = useValue(presentIndex) >= 0
	const panel = useValue(panelOpen)
	const notes = useValue(notesOpen)
	const menu = useValue(openMenu)
	const count = useValue('slideCount', () => getSlides(editor).length, [editor])
	const index = useValue('slideIndex', () => getCurrentIndex(editor), [editor])
	const slide = useValue('topSlide', () => getSlides(editor)[getCurrentIndex(editor)] ?? null, [editor])
	if (presenting) return null

	const go = (i) => {
		const s = getSlides(editor)[i]
		if (s) goTo(editor, s.id)
	}
	const toggleMenu = (name) => openMenu.set(menu === name ? null : name)

	return h('div', {
			style: {
				position: 'absolute', top: 48, left: panel ? PANEL_W + 20 : 150, right: 190,
				display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 300,
			},
		},
		h('div', { ...guard(editor), style: { ...css.panel, position: 'relative', display: 'flex', alignItems: 'center', gap: 1, padding: 3 } },
			h(Button, { label: '‹', title: 'Previous slide', disabled: index <= 0, onClick: () => go(index - 1) }),
			h('span', { style: { minWidth: 58, textAlign: 'center', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }, count ? `${index + 1} / ${count}` : '0 / 0'),
			h(Button, { label: '›', title: 'Next slide', disabled: index >= count - 1, onClick: () => go(index + 1) }),
			h(StepPreview, { editor, slide }),
			h(RevealControl, { editor }),
			h('div', { style: css.sep }),
			h(Button, { label: 'Theme ▾', active: menu === 'theme', onClick: () => toggleMenu('theme') }),
			h(Button, { label: 'Deck ▾', active: menu === 'deck', onClick: () => toggleMenu('deck') }),
			h(Button, { label: 'Notes', title: 'Speaker notes for the current slide', active: notes, onClick: () => notesOpen.set(!notes) }),
			h(Button, { label: 'Overview', title: 'Zoom out to all slides', disabled: !count, onClick: () => editor.zoomToFit({ animation: { duration: 300 } }) }),
			h('div', { style: css.sep }),
			h(Button, { label: 'From here', title: 'Present from the current slide', disabled: !count, onClick: () => editor.setCurrentTool('present', { startIndex: index }) }),
			h(Button, { label: '▶ Present', title: 'Present from the first slide — Esc exits', primary: true, disabled: !count, onClick: () => editor.setCurrentTool('present', { startIndex: 0 }) }),
			menu === 'theme' && h(ThemeMenu, { editor }),
			menu === 'deck' && h(DeckMenu, { editor })
		)
	)
}
