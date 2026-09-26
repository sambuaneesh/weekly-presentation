// Seeing is Fixing: actions for its two interactive slides (26 drop to render, 32 two switches).
// The slides themselves are drawn from ../slides/ with the paper kit (bin/deck.mjs build).
import { dropRenderActions } from './dropRender.js'
import { ablationActions } from './ablation.js'

export default {
	actions: { ...dropRenderActions, ...ablationActions },
}
