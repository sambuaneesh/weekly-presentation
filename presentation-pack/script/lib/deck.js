// Deck-wide settings, stored in the document record's meta under `pp` (presentation pack), so they
// travel with the .tldraw file: theme, footer text, toggles, and layouts saved from this deck.

export const SLIDE_W = 1920
export const SLIDE_H = 1080
export const SLIDE_GAP = 240
export const MARGIN = 120

const DEFAULTS = {
	theme: 'clean',
	title: 'Presentation title',
	footer: '',
	showFooter: true,
	showNumbers: true,
	customLayouts: [],
	pendingTemplate: null,
}

export function getDeck(editor) {
	const meta = editor.getDocumentSettings().meta ?? {}
	return { ...DEFAULTS, ...(meta.pp ?? {}) }
}

export function updateDeck(editor, patch) {
	const doc = editor.getDocumentSettings()
	const meta = doc.meta ?? {}
	editor.updateDocumentSettings({ meta: { ...meta, pp: { ...getDeck(editor), ...patch } } })
}

export function footerText(deck) {
	return deck.footer || deck.title
}
