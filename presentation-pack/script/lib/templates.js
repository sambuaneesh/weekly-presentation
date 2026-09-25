// Deck templates: an ordered list of layouts (with optional starter text) to seed a new deck.

export const TEMPLATES = {
	'weekly-update': {
		name: 'Weekly update',
		slides: [
			{ layout: 'title', overrides: { title: 'Weekly update', subtitle: 'Week of · Your name' } },
			{ layout: 'agenda', overrides: { items: ['Status', 'Metrics', 'Highlights', 'Next week & asks'] } },
			{ layout: 'status' },
			{ layout: 'metrics' },
			{ layout: 'content', overrides: { title: 'Highlights', bullets: ['Biggest win this week', 'Something learned', 'Shout-out'] } },
			{ layout: 'timeline', overrides: { title: 'Next week' } },
			{ layout: 'content', overrides: { title: 'Asks & decisions needed', bullets: ['Decision needed from…', 'Help wanted with…'] } },
			{ layout: 'closing' },
		],
	},
	'all-layouts': {
		name: 'Layout gallery',
		slides: [
			'title', 'agenda', 'section', 'content', 'two-column', 'image-text',
			'big-number', 'quote', 'status', 'metrics', 'timeline', 'blank', 'closing',
		].map((layout) => ({ layout })),
	},
	blank: {
		name: 'Blank deck',
		slides: [{ layout: 'title' }, { layout: 'content' }, { layout: 'closing' }],
	},
}
