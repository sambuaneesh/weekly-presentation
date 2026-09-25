// Presentation pack — runs against the live editor when the deck opens.
//  • seeds a template if bin/new-deck.mjs asked for one (deck meta `pendingTemplate`)
//  • keeps slide numbers, numbered slide names and footers in step with the slide order
import { getDeck, updateDeck } from './lib/deck.js'
import { syncDeck, seedTemplate, getSlides } from './lib/slides.js'

/** @param {import('../.script-workspace/script-context').MainScriptContext} ctx */
export default function ({ editor, signal, app }) {
	// Writes happen once, in the editor that owns the file.
	if (app && !app.board.isHost) return

	// A template can be requested at any time by writing deck meta (bin/new-deck.mjs does this).
	function seedPending() {
		const pending = getDeck(editor).pendingTemplate
		if (!pending) return
		editor.run(() => {
			updateDeck(editor, { pendingTemplate: null })
			if (getSlides(editor).length === 0) seedTemplate(editor, pending)
		})
		editor.zoomToFit()
	}

	let timer = null
	const sync = () => {
		seedPending()
		editor.run(() => syncDeck(editor), { history: 'ignore' })
	}
	const stop = editor.store.listen(
		() => {
			clearTimeout(timer)
			timer = setTimeout(sync, 250)
		},
		{ source: 'user', scope: 'document' }
	)
	signal.addEventListener('abort', () => {
		stop()
		clearTimeout(timer)
	})
	sync()
}
