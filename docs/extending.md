# Extending

Two places to put new things:

- **A deck's `ext/` folder**: code only that deck needs (an animated scene, actions for its
  interactive slides, a template). It travels with the deck and never touches the others.
- **The pack (`presentation-pack/`)**: things every deck should get (a new kit call, a new entrance
  animation, a theme, a UI feature). Change it once; run `deck install <deck>` on each deck to update
  its copy.

## A deck's extension (`decks/…/<deck>/ext/`)

`ext/index.js` default-exports any of:

```js
import { MyScene } from './my-scene.js'
import { myActions } from './actions.js'

export default {
	scenes: { 'my-scene': { name: 'My scene', beats: 4, render: MyScene } },   // animated `scene` shapes
	actions: myActions,                                                       // { name: (editor, ctx) => void }
	templates: { 'my-template': { name: 'My template', theme: 'ink', slides: [/* layout entries */] } },
	shapeUtils: [],                                                           // extra shape types (see below)
}
```

- **Import the pack as `@pack/…`**, e.g. `import { html, C, F, box } from '@pack/scenes/kit.js'`.
  The desktop installer rewrites these to relative paths inside the deck's board script, and the
  website resolves them with a Vite alias.
- **Other imports**: `tldraw` and `react` work everywhere. Files are plain ES modules (no JSX, no
  npm packages beyond those two).
- **Put it into the deck**: `node bin/deck.mjs install <deck>`. The website picks up every deck's
  `ext/` automatically at build time.

### Scenes

A scene is an animated drawing written as a React component (with `htm`), rendered inside one
`scene` shape. It gets `{ b, still, frozen }`: the build step being shown (Infinity while editing),
whether to skip entrance animation, and whether to skip ambient motion (thumbnails). Its `beats` count
is how many clicks it animates through. The kit is `presentation-pack/script/scenes/kit.js`. Example:
`decks/mono2micro/agentic-workflow/ext/agentic.js`, laid out by the `agentic-workflow` template in its
`agenticDeck.js`.

Prefer native, code-drawn slides ([drawing-slides.md](drawing-slides.md)) for the hand-made look.
Use a scene when a slide needs motion native shapes can't do, such as elements travelling between
places across many steps.

### Actions

The functions interactive slides call (see [drawing-slides.md](drawing-slides.md#interactive-slides)).
They run inside one `editor.run` with shape locks ignored. They change shapes (props, x/y, meta), so
live-room viewers see the result. Example: `decks/weekly-presentations/seeing-is-fixing/ext/ablation.js`.

### Templates

A template seeds slides from layouts: in an empty deck the slide panel offers every template, and
**Layouts ▾** lists them too. Slides are `{ layout, overrides }`; the `scene` layout places a scene under an editable kicker and
title (see `presentation-pack/script/lib/layouts.js`).

### New shape types

`shapeUtils` register extra tldraw shape types. Live rooms validate every record against the sync
server's schema, so also add the type's props to `sync-worker/src/TldrawDurableObject.ts` (like
`scene`) and redeploy the worker.

## The pack (`presentation-pack/`)

| Want | Where |
|---|---|
| a new kit call for code-drawn slides | `paper/kit.exec.js` (runs inside tldraw; no imports) |
| a new entrance animation | `ANIMS` + `BEAT_CSS` in `script/ui/Overlays.js` |
| a theme | `script/lib/themes.js` (roles → tldraw colours and fonts) |
| a canvas layout | `script/lib/layouts.js` |
| presenting behaviour (steps, interactions) | `script/ui/presentTool.js` |
| built-in actions | `script/lib/actions/index.js` |
| starter slides for `deck new` | `paper/starter/` (`{{TITLE_JSON}}` etc. are filled in) |

After changing the pack: `deck install <deck>` for each deck you want updated. The website always
uses the current pack. The [pack README](../presentation-pack/README.md) describes its internals.
