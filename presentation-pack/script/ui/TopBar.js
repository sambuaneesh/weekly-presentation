// Top bar: slide navigation, theme and deck settings, notes toggle, and presenting.
import { useEditor, useValue } from 'tldraw'
import { h, css, guard, Button, MenuItem, Popover } from './kit.js'
import { panelOpen, notesOpen, openMenu, presentIndex, PANEL_W } from './state.js'
import { goTo } from './SlidePanel.js'
import { getSlides, getCurrentIndex, applyTheme, tidySlides, syncDeck } from '../lib/slides.js'
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

export function TopBar() {
	const editor = useEditor()
	const presenting = useValue(presentIndex) >= 0
	const panel = useValue(panelOpen)
	const notes = useValue(notesOpen)
	const menu = useValue(openMenu)
	const count = useValue('slideCount', () => getSlides(editor).length, [editor])
	const index = useValue('slideIndex', () => getCurrentIndex(editor), [editor])
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
