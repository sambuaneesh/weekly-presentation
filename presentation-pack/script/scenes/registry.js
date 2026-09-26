// Every scene the `scene` shape can show: id → { name, beats, render, safelight? }.
// `beats` is how many clicks the scene animates through before the deck moves on (0 = none).
// Scenes come from deck extensions (decks/<slug>/ext/index.js → `scenes`), see ../extensions.js.
import { fromExtensions } from '../extensions.js'

export const SCENES = fromExtensions('scenes')
