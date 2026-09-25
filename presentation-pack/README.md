# tldraw presentation pack

Turns a tldraw Desktop canvas into a slide deck: a PowerPoint-style slide panel, layouts,
themes, speaker notes, and a presentation mode. The pack is a tldraw **board script**, so it
travels inside each `.tldraw` file. This folder is the source of truth: edit it here, then
reinstall it into your decks.

Built on the ideas in tldraw's official slide examples
([free camera](https://tldraw.dev/examples/slides), [fixed camera](https://tldraw.dev/examples/use-cases/slideshow)):
a slides panel, "+" buttons between slides on the canvas, and renumbering that leaves renamed
slides alone. Slides are plain **frames**, so a deck still opens and exports correctly without the pack.

## Start a new presentation

The template isn't a file you open. It's stored in this pack (`script/lib/templates.js`).
Every presentation, including `weekly-presentation.tldraw`, is an ordinary deck that was
filled from the template, so edit presentations freely.

1. Keep tldraw Desktop open.
2. From the folder that holds `presentation-pack/`, run:
   ```bash
   node presentation-pack/bin/new-deck.mjs "My new presentation"
   ```
3. A new window opens with `My new presentation.tldraw`, filled with the 8 *Weekly update*
   slides plus the slide panel, toolbar and Present button. The file is saved in the folder
   you ran the command from.
4. Edit it. Nothing else changes.

Options: `--dir <folder>` saves it elsewhere, `--template all-layouts|blank|none` picks another
starting point, and `--theme midnight` (or any theme below) sets the look. Or ask Claude:
"make a new presentation called X".

tldraw's own File → New makes a blank canvas **without** the slide tools. Save it once, then run
`node presentation-pack/bin/install.mjs <name>` on it to add them. In an empty deck, the
slide panel then offers the templates as buttons.

## Commands

Each command needs tldraw Desktop running. Run them from this folder.

```bash
node bin/new-deck.mjs "Week 40 update" --dir ~/Work/decks --template weekly-update --theme clean
node bin/install.mjs weekly-presentation      # install or update the pack in an open deck (name or path)
node bin/pull.mjs weekly-presentation         # copy the deck's "Save as layout…" layouts into the pack
node bin/pull.mjs weekly-presentation --script   # also copy a deck's edited script back into the pack
```

Templates: `weekly-update` (8 slides), `all-layouts` (a 13-slide gallery), `blank`, `none`.
Themes: `clean`, `midnight`, `editorial`, `sketch`, `violet`, `terminal`.

## In the app

| Where | What |
|---|---|
| Slide panel (left) | Live thumbnails. Click to go to a slide, drag to reorder, double-click to present from it, right-click or **⋯** for New / Duplicate / Move / Present from here / Save as layout / Delete. **« / ☰** hides or shows the panel. |
| **+ New slide**, **Layouts ▾** | Adds a slide after the current one. The layout picker lists the built-in layouts, layouts saved in this deck, pack layouts, and whole templates. |
| **+** on the canvas | Inserts a slide at that spot. |
| Top bar | **‹ n/N ›** navigation. **Theme ▾** restyles every layout shape. **Deck ▾** sets the title, footer text and footer/number toggles, and has *Tidy slides*. **Notes** opens speaker notes. **Overview** zooms out. **From here**, **▶ Present**. |
| Presenting | Starts fullscreen with the slide letterboxed and a progress bar. → / Space / Enter / click go forward, ← / Backspace go back, Home / End jump to the ends. **Press and drag for a laser pointer.** Esc (or ✕) exits. |

Slide numbers, footers, and numbered slide names (`03 · Status`) update automatically. Give a
slide your own name (not starting with a number) and it keeps that name.

## Building your own templates

1. Design a slide on the canvas. Anything goes: layout shapes, your own drawings, images.
2. Right-click its thumbnail → **Save as layout…**. It shows up under *Saved in this deck*.
3. To reuse it in every deck: `node bin/pull.mjs <deck>`, then `node bin/install.mjs <other deck>`.
   Pack layouts live in `script/layouts/custom/`.

To add a built-in layout, theme, or deck template in code, edit `script/lib/layouts.js`,
`script/lib/themes.js`, or `script/lib/templates.js`.

## How it works

```
script/
  config.js        editor setup: registers the UI components and the present tool
  main.js          runs when the deck opens: seeds a requested template, keeps numbers and footers in sync
  lib/deck.js      deck settings, stored in the document's meta.pp (theme, title, footer, saved layouts)
  lib/slides.js    slide model and operations (insert, duplicate, delete, move, theme, sync)
  lib/layouts.js   built-in layouts; every shape carries meta.role so themes can restyle it
  lib/themes.js    role → tldraw colour and font, per theme
  lib/templates.js deck templates
  ui/*.js          slide panel, top bar, notes, presentation overlay, "+" buttons, present tool
  layouts/custom/  pack layouts (index.json + one JSON file per layout)
```

Themes only restyle shapes a layout created (they have `meta.role`); shapes you draw keep
their own style. Only the host's editor makes writes, so the pack behaves correctly on a
shared board.

**Limits:** the pack can't add a keyboard shortcut to start presenting (use the button), and it
turns off tldraw's text outline across the whole deck.
