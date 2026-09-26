# tldraw presentation pack

The shared template every presentation in this repository uses: a tldraw **board script** that
turns a tldraw Desktop canvas into a slide deck (slide panel, layouts, themes, speaker notes, build
steps, presenting, interactive slides), plus the builders that draw hand-made slides from code.
Slides are plain **frames**, so a deck still opens and exports correctly without the pack.

You normally use it through the repo's `bin/deck.mjs` (see the [root README](../README.md) and
[docs/](../docs/)). This folder is the source of truth: change it here, then `deck install <deck>`
to update a deck's copy (the website always uses this folder directly).

## In the app

| Where | What |
|---|---|
| Slide panel (left) | Live thumbnails. Click to go to a slide, drag to reorder, double-click to present from it, right-click or **⋯** for New / Duplicate / Move / Present from here / Save as layout / Delete. **« / ☰** hides or shows the panel. |
| **+ New slide**, **Layouts ▾** | Adds a slide after the current one. The layout picker lists the built-in layouts, layouts saved in this deck, pack layouts, and whole templates. |
| **+** on the canvas | Inserts a slide at that spot. |
| Top bar | **‹ n/N ›** navigation. **Theme ▾** restyles every layout shape. **Deck ▾** sets the title, footer text and footer/number toggles, and has *Tidy slides*. **Notes** opens speaker notes. **Overview** zooms out. **From here**, **▶ Present**. |
| Presenting | Starts fullscreen with the slide letterboxed and a progress bar. → / Space / Enter / click go forward (through a slide's build steps first, then to the next slide), ← / Backspace go back, Home / End jump to the ends. The counter shows `slide · step`. **Press and drag for a laser pointer.** Esc (or ✕) exits. |
| **Steps ‹ n ›** (top bar) | On a slide with build steps: preview it at any step while editing. |
| **Appears: …** (top bar) | With shapes selected on a slide: click to cycle which build step reveals them (*always*, step 1, 2, …). Works on anything you draw. |

Slide numbers, footers, and numbered slide names (`03 · Status`) update automatically. Give a
slide your own name (not starting with a number) and it keeps that name.

## Build steps

A slide builds up over clicks. Any shape with `meta.beat = n` stays hidden until step *n* (set it
with **Appears:** in the top bar, or `beat` in a code-drawn slide); `meta.anim` picks its stepped
entrance (pop, wipe, drop, wiggle, fade, zoom). A `scene` shape (an animated drawing from a deck
extension) declares how many steps it animates through. Slide changes stay instant cuts; steps are view
state, so stepping never marks the deck unsaved, and in a live room viewers see the presenter's step.

## Code-drawn slides (`paper/`)

`paper/kit.exec.js` is the kit that draws slides out of real tldraw shapes; `bin/paper.mjs` runs a
deck's `slides/` through it (`deck build <deck>` calls it). `paper/starter/` holds the slides a new
deck starts from. Guide: [docs/drawing-slides.md](../docs/drawing-slides.md).

## Deck extensions

`script/extensions.js` is where a deck's own code (`decks/<slug>/ext/`: scenes, actions, templates,
shape types) joins the pack. In the repo it's an empty placeholder; `bin/install.mjs --ext` puts the
deck's extension into that deck's board script, and the website loads every deck's extension. Guide:
[docs/extending.md](../docs/extending.md).

## Building your own templates

1. Design a slide on the canvas. Anything goes: layout shapes, your own drawings, images.
2. Right-click its thumbnail → **Save as layout…**. It shows up under *Saved in this deck*.
3. To reuse it in every deck: `node bin/pull.mjs <deck>`, then `node ../bin/deck.mjs install <other deck>`.
   Pack layouts live in `script/layouts/custom/`.

To add a built-in layout, theme, or deck template in code, edit `script/lib/layouts.js`,
`script/lib/themes.js`, or `script/lib/templates.js`.

## How it works

```
script/
  config.js          editor setup: UI components, the present tool, the scene shape, beat visibility
  main.js            runs when the deck opens: seeds a requested template, keeps numbers and footers in sync
  extensions.js      placeholder for a deck's extension (replaced at install time / on the website)
  lib/deck.js        deck settings, stored in the document's meta.pp (theme, title, footer, saved layouts)
  lib/slides.js      slide model and operations (insert, duplicate, delete, move, theme, sync)
  lib/layouts.js     built-in layouts; every shape carries meta.role so themes can restyle it
  lib/themes.js      role → tldraw colour and font, per theme (ink is the house theme)
  lib/templates.js   deck templates (+ templates from extensions)
  lib/beats.js       build steps: how many a slide has, and which one is showing
  lib/actions/       interactive-slide actions (built-in `reset` + actions from extensions)
  ui/*.js            slide panel, top bar, notes, presentation overlay + entrance animations, "+" buttons, present tool
  scenes/            the `scene` shape, its kit (palette, reveal helpers), the registry (scenes from extensions)
  scenes/vendor/     htm (Apache-2.0), so scenes can be written as tagged templates without a build step
  layouts/custom/    pack layouts (index.json + one JSON file per layout)
paper/
  kit.exec.js        the kit code-drawn slides are drawn with (runs inside tldraw)
  starter/           the slides `deck new` starts from
bin/
  install.mjs        put this script/ (+ a deck's ext/) into an open deck
  paper.mjs          draw a slides/ folder into an open deck
  new-deck.mjs       (low level) create a deck file from a pack template
  pull.mjs           copy a deck's saved layouts (or script) back into the pack
  tl.mjs             minimal client for the tldraw Desktop API
```

Themes only restyle shapes a layout created (they have `meta.role`); shapes you draw keep their own
style. Only the host's editor makes writes, so the pack behaves correctly on a shared board.

**Limits:** the pack can't add a keyboard shortcut to start presenting (use the button), and it turns
off tldraw's text outline across the whole deck.
