// Themes map slide "roles" to tldraw's built-in palette and fonts. Only shapes a layout created
// (they carry meta.role) are restyled; anything you draw yourself keeps its own style.
//
// Palette names: black grey light-violet violet blue light-blue yellow orange green light-green
// light-red red white. Fonts: draw sans serif mono.

export const THEMES = {
	clean: { name: 'Clean', bg: 'white', text: 'black', muted: 'grey', accent: 'blue', font: 'sans', titleFont: 'sans' },
	midnight: { name: 'Midnight', bg: 'black', text: 'white', muted: 'grey', accent: 'light-blue', font: 'sans', titleFont: 'sans' },
	editorial: { name: 'Editorial', bg: 'white', text: 'black', muted: 'grey', accent: 'red', font: 'serif', titleFont: 'serif' },
	sketch: { name: 'Sketch', bg: 'white', text: 'black', muted: 'grey', accent: 'orange', font: 'draw', titleFont: 'draw' },
	violet: { name: 'Violet', bg: 'white', text: 'black', muted: 'grey', accent: 'violet', font: 'sans', titleFont: 'serif' },
	terminal: { name: 'Terminal', bg: 'black', text: 'light-green', muted: 'grey', accent: 'green', font: 'mono', titleFont: 'mono' },
}

// Semantic tones for cards, independent of theme accent.
const TONES = { good: 'green', warn: 'orange', bad: 'red', info: 'light-blue' }

export function getTheme(id) {
	return THEMES[id] ?? THEMES.clean
}

// Props a role should have under theme `t`. `shape` lets roles depend on meta (e.g. card tone).
export function roleProps(role, t, shape) {
	const tone = shape?.meta?.tone
	switch (role) {
		case 'bg':
			return { color: t.bg, fill: 'fill', dash: 'solid' }
		case 'title':
		case 'quote':
			return { color: t.text, font: t.titleFont }
		case 'body':
			return { color: t.text, font: t.font }
		case 'subtitle':
		case 'footer':
		case 'number':
		case 'caption':
			return { color: t.muted, font: t.font }
		case 'kicker':
			return { color: t.accent, font: t.font }
		case 'bignum':
			return { color: t.accent, font: t.titleFont }
		case 'accent':
		case 'dot':
			return { color: t.accent, fill: 'fill', dash: 'solid' }
		// Cards use a light tint of their colour, so their text stays dark on every theme.
		case 'card':
			return { color: TONES[tone] ?? t.accent, fill: 'solid', dash: 'solid', labelColor: 'black', font: t.font }
		case 'cardnum':
			return { color: 'black', font: t.titleFont }
		case 'cardtext':
			return { color: 'grey', font: t.font }
		case 'placeholder':
			return { color: t.muted, fill: 'none', dash: 'dashed', labelColor: t.muted, font: t.font }
		default:
			return null
	}
}
