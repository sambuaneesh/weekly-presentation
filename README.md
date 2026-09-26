# Presentations

My personal space for presentations: hand-drawn decks made in [tldraw Desktop](https://tldraw.dev),
kept in one repository, published together on one website.

- **One template.** Every deck uses the same presentation pack (`presentation-pack/`): slide panel,
  build steps, presenting, speaker notes, the hand-drawn "ink & safelight" look.
- **One folder per deck.** `decks/<slug>/` holds the deck, its metadata, and (optionally) the code
  that draws its slides or adds its own animations.
- **One website.** A gallery of every deck on GitHub Pages; each deck has its own link, and any deck
  can be presented live to other devices.
- **Agent-first.** One command line tool, `bin/deck.mjs`, does everything; an agent can make, build,
  check and publish a deck with it. See [AGENTS.md](AGENTS.md).

## Quick start

```bash
node bin/deck.mjs list                                   # what's here
node bin/deck.mjs new "My next talk" --tags research     # make decks/my-next-talk/ and open it
node bin/deck.mjs build my-next-talk                     # after editing its slides/*.js
node bin/deck.mjs cover my-next-talk                     # the gallery picture
git add decks/my-next-talk && git commit -m "Add my next talk" && git push   # it's on the website
```

(`npm run deck -- <command>` works too.) tldraw Desktop must be installed; the tool opens it when needed.

## Where things are

| Path | What it is |
|---|---|
| `decks/<slug>/` | One presentation: `<slug>.tldraw`, `deck.json`, optional `slides/`, `ext/`, `cover.jpg` |
| `bin/deck.mjs` | The tool: `new · list · open · install · build · cover · check · export` |
| `presentation-pack/` | The shared template (a tldraw board script) and its builders. [README](presentation-pack/README.md) |
| `site/` | The website: the gallery and a player for every deck |
| `sync-worker/` | The live-room server (Cloudflare Worker), shared by all decks |
| `docs/` | The guides below |
| `AGENTS.md` | How an AI agent should work in this repo |

## Guides

- [Making and managing presentations](docs/presentations.md): new decks, editing, hiding, pinning, renaming, deleting
- [Drawing slides with code](docs/drawing-slides.md): the hand-drawn kit, build steps, interactive slides, speaker notes
- [Extending](docs/extending.md): a deck's own scenes and actions, templates, themes, the pack
- [The website](docs/website.md): links, publishing on GitHub Pages, live rooms, running it locally

## Decks

| Deck | What |
|---|---|
| [`seeing-is-fixing`](decks/seeing-is-fixing) | Huang et al., *Seeing is Fixing* (arXiv 2506.16136), 43 hand-drawn slides, two interactive |
| [`agentic-workflow`](decks/agentic-workflow) | An agentic monolith-to-microservice workflow, traced live on one real run |
