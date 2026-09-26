# Making and managing presentations

Every presentation is a folder in `decks/`. The folder name is the deck's **slug**: its id for the
tool, its web address (`…/#/<slug>`) and its file name. Use lowercase letters, digits and dashes.

```
decks/my-next-talk/
  my-next-talk.tldraw     the deck (open it in tldraw Desktop)
  deck.json               title, date, tags… (what the website shows)
  cover.jpg               the gallery picture (made by `deck cover`)
  slides/                 optional: slides drawn from code (manifest.json + one .js per slide)
  ext/                    optional: this deck's own scenes/actions/templates (docs/extending.md)
```

All commands below are `node bin/deck.mjs …` (or `npm run deck -- …`). A deck can be named by its
slug or any unique part of it (`deck build seeing` works).

## Make a new presentation

```bash
node bin/deck.mjs new "Title of the talk" --subtitle "one line" --tags paper,agents
```

This makes `decks/title-of-the-talk/`, writes `deck.json`, creates the `.tldraw` file with the pack
installed, and opens it in tldraw Desktop. Two kinds:

- `--kind handmade` (default): the slides are drawn from code in `slides/`, starting from three starter
  slides (title, one idea, thank you). Edit the files, then `deck build <slug>`. This is the house
  style: see [drawing-slides.md](drawing-slides.md).
- `--kind canvas`: an empty deck you draw by hand in tldraw (slide panel, **+ New slide**, layouts).
  `--template <id>` starts from a pack template, e.g. `weekly-update`.

Other options: `--slug`, `--date YYYY-MM-DD` (default today), `--presenter` (default Aneesh S),
`--description`, `--theme` (default `ink`).

You can mix both kinds: in a handmade deck, draw extra slides by hand anywhere; `deck build` only
replaces the slides that come from `slides/`.

## Edit a presentation

- **Open it**: `deck open <slug>` (or open the `.tldraw` file in tldraw Desktop).
- **Change code-drawn slides**: edit `decks/<slug>/slides/*.js`, then `deck build <slug>` (all) or
  `deck build <slug> --only 05-results` (one). Rebuilding replaces just those slides, in place.
- **Add a code-drawn slide**: add `slides/NN-name.js` and put `"NN-name"` in `slides/manifest.json`
  where it belongs; the manifest order is the slide order.
- **Draw by hand**: anything you draw in tldraw is kept. To make it appear on a click while
  presenting, select it and use **Appears: …** in the top bar.
- **Speaker notes**: **Notes** in the top bar, or the `notes` field of a slide file.
- **After changing the pack or `ext/`**: `deck install <slug>` updates the deck's copy of the template.
- Save in tldraw (the tool saves after building). Then commit.

## Present

In tldraw Desktop or on the website: **▶ Present** (or **From here**). → / Space / click go forward
through each slide's build steps, then to the next slide; ← goes back; Esc exits. Drag for a laser
pointer. On interactive slides, click the controls and drag the pieces.

## Manage

| To… | Do this |
|---|---|
| see everything | `deck list` (add `--json` for scripts) |
| check that all decks are well-formed | `deck check` (or `deck check <slug>`) |
| refresh the gallery picture | `deck cover <slug>` (uses the first slide) |
| hide a deck from the gallery (link still works) | `"listed": false` in `deck.json` |
| keep a deck at the top | `"pinned": true` in `deck.json` |
| change the title, date, tags, description | edit `deck.json` |
| rename a deck | close it in tldraw, rename the folder **and** its `.tldraw` file to the new slug, `deck install <new>`, commit. Old links stop working. |
| delete a deck | close it in tldraw, `git rm -r decks/<slug>`, commit |
| retire a deck but keep it | `"listed": false`, or move it to `decks/_archive/` (folders starting with `_` are ignored) |

## deck.json

```json
{
	"title": "Seeing is Fixing",
	"subtitle": "Cross-modal reasoning with multimodal LLMs for visual software issue fixing",
	"date": "2026-09-24",
	"presenter": "Aneesh S",
	"description": "One or two sentences for the gallery card.",
	"tags": ["paper", "program repair"],
	"source": "arXiv 2506.16136",
	"listed": true,
	"pinned": false
}
```

Only `title` is required. The gallery sorts pinned decks first, then newest `date` first.

## Publish

Commit the deck folder and push to `main`. GitHub Actions exports every deck and rebuilds the site
(about a minute). See [website.md](website.md).
