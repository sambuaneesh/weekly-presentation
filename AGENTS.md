# AGENTS.md: working in this repository

This is Aneesh S's personal space for presentations: hand-drawn tldraw decks, one per folder in
`decks/`, published together on one GitHub Pages site. You will mostly be asked to **make a new
presentation**, **change slides**, or **publish**. Read this first; the guides in `docs/` have the
details.

## The one tool

Everything goes through `node bin/deck.mjs` (run from the repo root):

```
deck list [--json]                 decks, newest first (slug, title, flags)
deck new "<title>" [options]       make decks/<slug>/, create + open the .tldraw, build starter slides, save a cover
deck open <deck>                   open in tldraw Desktop (launches it if needed)
deck install <deck>                copy the pack (+ the deck's ext/) into the deck's board script
deck build <deck> [--only a,b]     draw code slides (decks/<slug>/slides) into the deck, save
deck cover <deck>                  save slide 1 as decks/<slug>/cover.jpg
deck check [<deck>]                validate deck folders and slide files (run before committing)
deck export                        export all decks for the website (site/public/decks)
```

`<deck>` is a slug or any unique part of one. tldraw Desktop must be installed. The tool talks to it
through its local API (`~/.config/tldraw/server.json`); see the tldraw-offline skill for that API when
you need screenshots or `/exec`.

## House style (the user's standing preferences; don't drift from them)

- **Hand-made with tldraw's own tools**: real shapes drawn by code with the paper kit (sketchy geo,
  pen strokes, bound arrows, sticky notes, handwriting). Not polished HTML infographics.
- **One idea per slide**; more slides are fine. Minimal: lots of empty paper, few words, a doodle.
- **Build up on clicks** with small stepped entrances (`beat`, `anim`). **Slide changes are instant
  cuts**: never add slide transitions unless asked.
- Ink on paper, **one accent (red)**; green only for "fixed/works"; grey for secondary.
- Creative visual metaphors per deck, but legible from the back of a room.

## Facts

Presentations are usually about papers or research. **Every number, name, quote and claim must come
from the source material.** Read the source (extract PDF text, look at figures), cite it in each
slide's `source` line and notes (§, Fig., Table), and label anything illustrative or schematic.
If unsure, leave it out.

## Making a new presentation

1. `node bin/deck.mjs new "<Title>" --subtitle "…" --tags a,b --description "…"` (kind `handmade`).
2. Plan the arc: one idea per slide, a title slide, a thank-you slide. Write the outline as the
   manifest (`decks/<slug>/slides/manifest.json`), then one file per slide
   (`docs/drawing-slides.md` has the kit API and a full example; `decks/seeing-is-fixing/slides/`
   has 43 real ones to learn from).
3. Every slide gets speaker notes in the checklist format (`COVER` / `CLICKS` or `DO` / `REF`).
4. `node bin/deck.mjs build <slug>`, then **look**: screenshot each slide
   (`api.getScreenshot(docId, { bounds: frame bounds })` via the tldraw API), fix overlaps and
   clipping, rebuild with `--only`. Check at least a few click steps by presenting
   (`editor.setCurrentTool('present', { startIndex, startBeat })`).
5. `node bin/deck.mjs cover <slug>`, `node bin/deck.mjs check <slug>`.
6. Commit the deck folder when the user asks, then push. That publishes it.

Large decks parallelise well: slide files are independent. Give each helper its own range of files
and its own copy of the repo or deck to test in; never let two agents build into the same deck.

## Changing things

- A deck's slides: edit `decks/<slug>/slides/*.js`, `deck build <slug> --only <files>`.
- Hand-drawn (non-code) slides live only in the `.tldraw` file: edit them in tldraw (via `/exec` if
  asked). `deck build` never touches them.
- Deck-specific code (animated scenes, interactive-slide actions, templates): `decks/<slug>/ext/`,
  then `deck install <slug>`. See `docs/extending.md`.
- Something every deck should have: the pack (`presentation-pack/`), then `deck install` each deck.
- A new shape type needs the live-room schema too (`sync-worker/src/TldrawDurableObject.ts`) and a
  worker redeploy (ask first: it's outward-facing).

## Rules

- Never edit a `.tldraw` file directly (it's a zip with a database); go through tldraw Desktop.
- Before moving, renaming or deleting a deck's files, make sure it has no unsaved changes, and close
  it (or quit tldraw) first.
- Launching `tldraw-offline <file>` while the app is running rewrites `server.json` with a dead
  address. `deck open` repairs this; if you launch the app yourself, restore the file or restart the app.
- Don't `pkill -f` with a pattern that also appears in your own command line: it kills your shell.
  Kill by PID.
- Commit, push, deploy the worker, or rename the GitHub repo only when the user asks.
- Keep docs in step: if you change a command, a folder convention or the kit, update `docs/` and
  this file in the same change.

## Map

| Path | Purpose |
|---|---|
| `bin/deck.mjs` | the tool |
| `decks/<slug>/` | `<slug>.tldraw`, `deck.json`, `slides/`, `ext/`, `cover.jpg` |
| `presentation-pack/script/` | the template's board script (UI, presenting, themes, layouts, scenes kit, actions) |
| `presentation-pack/paper/kit.exec.js` | the kit code-drawn slides use |
| `presentation-pack/paper/starter/` | starter slides for `deck new` |
| `presentation-pack/bin/` | low-level builders (`install.mjs`, `paper.mjs`, `tl.mjs`) used by `deck` |
| `site/` | the website (gallery + player); `site/scripts/export-decks.mjs` |
| `sync-worker/` | the live-room server |
| `docs/` | presentations.md · drawing-slides.md · extending.md · website.md |
