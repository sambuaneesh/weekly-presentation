# Presentations

My personal space for presentations: hand-drawn decks made in [tldraw Desktop](https://tldraw.dev),
kept in one repository, published together on one website.

- **One template.** Every deck uses the same presentation pack (`presentation-pack/`): slide panel,
  build steps, presenting, speaker notes, the hand-drawn "ink & safelight" look.
- **Folders.** `decks/` is a tree of folders; each presentation is a folder in it holding the deck, a
  title and optional description, and (optionally) the code that draws its slides.
- **One website.** The same folders on GitHub Pages; each presentation has its own link
  (`…/#/folder/name`), and any of them can be presented live to other devices.
- **Agent-first.** One command line tool, `bin/deck.mjs`, does everything; an agent can make, build,
  check and publish a deck with it. See [AGENTS.md](AGENTS.md).

## Quick start

The easiest way in is the **studio**, a local web app for managing everything:

```bash
npm run studio          # opens http://localhost:4321/
```

Browse the folders, make presentations and folders, edit titles and descriptions, set covers, move
things around, preview the website, and commit and push. A new presentation is a `.tldraw` file: open
it in tldraw Desktop to draw it. The same things from the command line:

```bash
node bin/deck.mjs list                                   # the tree
node bin/deck.mjs new "My next talk" --in talks          # make decks/talks/my-next-talk/
node bin/deck.mjs open my-next-talk                      # draw it in tldraw
git add decks && git commit -m "Add my next talk" && git push   # it's on the website
```

(`npm run deck -- <command>` works too.) tldraw Desktop must be installed; the tool opens it when needed.

## Where things are

| Path | What it is |
|---|---|
| `decks/…/<name>/` | One presentation: `<name>.tldraw`, `deck.json`, optional `slides/`, `ext/`, `cover.jpg`, in folders (`folder.json`) |
| `bin/deck.mjs` | The tool: `list · new · folder · move · open · install · build · cover · check · export` |
| `studio/` | The local studio (`npm run studio`): the same operations in a web page, plus git |
| `presentation-pack/` | The shared template (a tldraw board script) and its builders. [README](presentation-pack/README.md) |
| `site/` | The website: the gallery and a player for every deck |
| `sync-worker/` | The live-room server (Cloudflare Worker), shared by all decks |
| `docs/` | The guides below |
| `AGENTS.md` | How an AI agent should work in this repo |

## Guides

- [Making and organising presentations](docs/presentations.md): the studio, folders, new decks, editing, moving, deleting
- [Drawing slides with code](docs/drawing-slides.md): the hand-drawn kit, build steps, interactive slides, speaker notes
- [Extending](docs/extending.md): a deck's own scenes and actions, templates, themes, the pack
- [The website](docs/website.md): links, publishing on GitHub Pages, live rooms, running it locally

## Decks

| Deck | What |
|---|---|
| [`weekly-presentations/seeing-is-fixing`](decks/weekly-presentations/seeing-is-fixing) | Huang et al., *Seeing is Fixing* (arXiv 2506.16136), 43 hand-drawn slides, two interactive |
| [`mono2micro/agentic-workflow`](decks/mono2micro/agentic-workflow) | An agentic monolith-to-microservice workflow, traced live on one real run |
