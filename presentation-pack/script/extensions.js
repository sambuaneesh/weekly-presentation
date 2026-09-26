// Deck extensions: code one deck brings along (decks/<slug>/ext/index.js), merged into the pack.
//
// An extension's default export is an object with any of:
//   scenes     { id: { name, beats, render, safelight? } }  animated `scene` shapes (scenes/registry.js)
//   actions    { name: (editor, ctx) => void }              interactive-slide actions (lib/actions/index.js)
//   templates  { id: { name, theme?, slides } }             deck templates (lib/templates.js)
//   shapeUtils [ShapeUtil, …]                               extra shape types (config.js)
//
// This file is a placeholder. `bin/deck.mjs install <deck>` replaces it, inside that deck's board
// script, with one that imports the deck's ext/. The website swaps it for every deck's extensions
// (site/src/extensions.js, via a Vite alias). Keep the name: both rely on it.
export const EXTENSIONS = []

export const fromExtensions = (key) => Object.assign({}, ...EXTENSIONS.map((e) => e?.[key] ?? {}))
