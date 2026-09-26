---
name: presentations
description: Make, change, check and publish Aneesh's hand-drawn tldraw presentations in this repo (decks/<slug>/, bin/deck.mjs). Use when asked to create a new presentation or talk, turn a paper into slides, add/edit/rebuild slides, fix a slide, add an interactive slide or animated scene, update covers, or publish decks to the website.
---

# Presentations

Read `AGENTS.md` at the repo root first: it has the tool, the house style and the rules. The details
are in `docs/`.

## Workflow for a new presentation

1. **Source first.** Read the paper or material fully (PDF → text, look at the figures). Collect the
   facts you'll use with their locations (§, Fig., Table). Nothing on a slide may be invented.
2. **Make the deck.** `node bin/deck.mjs new "<Title>" --subtitle "…" --tags … --description "…"`
3. **Outline.** One idea per slide (more slides are fine): title → the problem → the idea → how it
   works → results → limits/questions → closing → thank you. Write the order into
   `decks/<slug>/slides/manifest.json`.
4. **Draw.** One file per slide in `decks/<slug>/slides/`, using the kit (`docs/drawing-slides.md`).
   Hand-made, minimal, ink on paper, one red accent, reveals on clicks (`beat` + `anim`), speaker notes
   in the checklist format, a `source` line on data slides. Learn from `decks/seeing-is-fixing/slides/`.
   For big decks, split the slide files across parallel helpers, each testing in its own deck copy.
5. **Build and look.** `node bin/deck.mjs build <slug>`, then screenshot every slide through the
   tldraw Desktop API and fix what you see (`--only` to rebuild one). Present through some clicks.
6. **Finish.** `node bin/deck.mjs cover <slug>` and `node bin/deck.mjs check <slug>`. Commit and push
   only when the user asks; the push publishes it to the website.

## Changing an existing deck

- Code slides: edit `decks/<slug>/slides/*.js` → `deck build <slug> --only <file>`.
- Its own code (scenes, actions, templates): `decks/<slug>/ext/` → `deck install <slug>`.
- Metadata (title, tags, hide, pin): `decks/<slug>/deck.json`.
- Every deck: `presentation-pack/` → `deck install` each deck.

Keep `docs/` and `AGENTS.md` in step with any change to commands or conventions.
