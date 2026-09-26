// Agentic workflow: one animated scene (the live trace) and the template that lays out the deck.
import { AgenticTrace, AGENTIC_BEATS } from './agentic.js'
import { AGENTIC_SLIDES } from './agenticDeck.js'

export default {
	scenes: {
		agentic: { name: 'Agentic workflow · live trace', beats: AGENTIC_BEATS, render: AgenticTrace, safelight: false },
	},
	templates: {
		'agentic-workflow': { name: 'Agentic workflow (live trace)', theme: 'ink', slides: AGENTIC_SLIDES },
	},
}
