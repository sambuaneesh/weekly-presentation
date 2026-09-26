# Drawing slides with code

Handmade decks draw their slides from small JavaScript files. Every slide becomes **real tldraw
shapes**: sketchy boxes, pen strokes, bound arrows, sticky notes and handwriting. They look drawn by
hand, and after building you can still move, restyle or delete any of them like any drawing.

```
decks/<slug>/slides/
  manifest.json        ["01-title", "02-the-problem", …]   the order of the slides
  01-title.js          one file per slide
  02-the-problem.js
```

`node bin/deck.mjs build <slug>` draws them all into the open deck. `--only 02-the-problem`
rebuilds just one. Each build replaces that slide's earlier build and leaves every other slide alone.

## The style (keep it)

- **One idea per slide.** If it needs two ideas, make two slides. More slides are fine.
- **Hand-made and minimal**: ink on paper, lots of empty space, a short handwritten title (or none),
  one drawing, maybe one line of text. No dense bullet lists on the slide; they go in the notes.
- **One accent colour**: red for emphasis and marks. Green only for "fixed/works". Grey for secondary.
- **Build it up** on clicks (`beat`), with small stepped entrances (`anim`), like indie animation.
- **Facts from the source only.** Mark anything illustrative or schematic as such (a `source` line or
  small grey handwriting).

## A slide file

```js
// 02-the-problem.js
export default {
	name: 'The problem',               // shown in the slide panel
	kicker: 'I · the problem',         // optional: small red line above the title
	title: 'Words are not enough',     // optional: short, handwritten
	source: 'Table II · §4',           // optional: small grey citation, bottom right
	notes: 'COVER\n• …\nCLICKS\n1 · …\nREF · …',   // speaker notes (format below)
	draw(k) {
		k.note(300, 380, 'a bug report\nin words', { color: 'yellow', id: 'words' })
		k.box(1100, 330, 520, 360, { dash: 'dotted', id: 'picture' })
		k.text(1300, 470, '?', { size: 'xl', scale: 3, color: 'red', beat: 1, anim: 'wiggle' })
		k.arrow('words', 'picture', { text: 'can you picture it?', color: 'red', bend: -30, beat: 1, anim: 'fade' })
	},
}
```

Coordinates are slide-local: 1920 × 1080, origin top left. The title area is y ≈ 50–200; keep
content between y ≈ 230 and 990 (the footer sits below).

## The kit (`k`)

The full source is `presentation-pack/paper/kit.exec.js`.

| Call | Draws |
|---|---|
| `k.text(x, y, str, o)` | handwriting (`font: 'mono'` for code). Give `w` to wrap or centre (`align: 'middle'`) |
| `k.box(x, y, w, h, o)` | a sketchy shape: `geo` rectangle, ellipse, cloud, star, diamond, oval, heart, … with an optional `text` label |
| `k.circle(cx, cy, r, o)` | an ellipse box around a centre |
| `k.note(x, y, str, o)` | a sticky note (`color`) |
| `k.pen([[x,y], …], o)` | a freehand stroke (`wob` adds wobble, `closed` + `fill` for shapes) |
| `k.loop(cx, cy, rx, ry, o)` | the red pen loop round something |
| `k.underline(x, y, w, o)` · `k.cross(x, y, s, o)` · `k.tick(x, y, s, o)` | marks |
| `k.arrow(from, to, o)` | an arrow; between two `id` tags it is a real **bound** arrow that follows its shapes; `[x, y]` points give a free arrow. `text`, `bend`, `dash`, `head`, `tail` |
| `k.grid(x, y, cols, count, pitch, size, o)` | many small shapes (dots, squares); `each(i)` returns per-item options |
| `k.tag(t)` | the shape id for tag `t` |

Common options on every call:

| Option | Meaning |
|---|---|
| `id` | a tag, so arrows and actions can find the shape; also keeps ids stable across rebuilds |
| `color` | black grey red green blue yellow orange violet light-red light-green light-blue light-violet white |
| `size` | s m l xl (with `scale` for bigger text) · `font` draw mono sans serif · `fill` none semi solid pattern · `dash` draw solid dashed dotted · `rot` degrees |
| `beat` | the click that reveals it (1, 2, …). Omit to show it with the slide |
| `anim` | its entrance: `pop` (default), `wipe` (looks drawn; good for pen strokes), `drop`, `wiggle`, `fade`, `zoom` (comes out of the screen), `none` |
| `origin` | `[x, y]`: a shared centre, so several shapes animate as one drawing (e.g. a hand that zooms in) |
| `meta` | extra shape meta: interactive controls, below |

Local helpers are welcome inside a slide file (functions that call `k.*`). Slides can't `import`
anything: the builder sends each file to tldraw as text, together with the kit.

## Build steps and animation

A slide's steps are its `beat` numbers. While presenting, each click reveals the next step, and the
next slide comes after the last one. Moving between slides is always an instant cut; only a slide's own
steps animate. While editing, **Steps ‹ n ›** in the top bar previews a slide at any step.

## Interactive slides

Real shapes can be controls while presenting (everyone in a live room sees the result):

| Shape meta | While presenting |
|---|---|
| `{ press: 'actionName' }` | a click runs the action (make controls `locked: true`) |
| `{ drag: true, home: { x, y } }` | it follows the pointer |
| `{ slot: 'actionName' }` | dropping a dragged shape on it runs the action |
| `{ loose: 'actionName' }` | on a dragged shape: runs when it is dropped anywhere else |

Actions live in the deck's `ext/` (see [extending.md](extending.md)). Each is
`(editor, { shape, slot, slide, find }) => void`, where `find(tag)` returns a shape on the same slide.
The built-in `reset` action puts every shape with `meta.home` back (and restores `meta.homeProps`).
Examples: `decks/seeing-is-fixing/slides/26-drop-to-render.js` and `32-two-switches.js`, with
their actions in `decks/seeing-is-fixing/ext/`.

## Speaker notes

Short checklists, not scripts:

```
COVER
• the point of this slide
• the one number that matters
CLICKS
1 · what appears · 2 · what appears
REF · §3.2 · Table I
```

Interactive slides use `DO` (what to press or drag) instead of `CLICKS`.

## Check your work

- `node bin/deck.mjs check <slug>` catches missing files, broken slide files and slides without notes.
- Look at every slide once at its final state and present through the clicks. Agents do this with
  screenshots through the tldraw Desktop API (see [AGENTS.md](../AGENTS.md)).
