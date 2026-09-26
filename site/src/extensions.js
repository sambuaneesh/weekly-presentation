// The website's stand-in for the pack's extensions.js (see vite.config.js): every deck's extension
// (decks/<slug>/ext/index.js), so any deck's scenes, actions and templates work on the site.
const mods = import.meta.glob('../../decks/*/ext/index.js', { eager: true })

export const EXTENSIONS = Object.values(mods).map((m) => m.default).filter(Boolean)
export const fromExtensions = (key) => Object.assign({}, ...EXTENSIONS.map((e) => e?.[key] ?? {}))
