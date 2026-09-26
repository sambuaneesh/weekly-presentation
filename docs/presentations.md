# Making and organising presentations

`decks/` is a tree of folders, like a file browser. Any folder can hold presentations and more
folders. The website shows the same tree: `…/#/mono2micro` is a folder, and
`…/#/mono2micro/agentic-workflow` is a presentation in it.

```
decks/
  mono2micro/                      a folder (folder.json: its title)
    folder.json
    agentic-workflow/              a presentation
      agentic-workflow.tldraw      the deck: open it in tldraw Desktop
      deck.json                    { "title", "description", "listed" }
      cover.jpg                    the picture on its card (optional)
      slides/                      optional: slides drawn from code
      ext/                         optional: its own scenes/actions (docs/extending.md)
  weekly-presentations/
    folder.json
    seeing-is-fixing/
      …
```

Names in paths (folders and presentations) are lowercase letters, digits and dashes; titles can be
anything.

## The studio (the easy way)

```bash
npm run studio          # http://localhost:4321/ (only this machine can reach it)
```

Browse the folders; the trail at the top goes back up.

| To… | In the studio |
|---|---|
| make a presentation | **+ presentation**: a title (and a description if you like). It is made in the folder you're in, already drawn with three hand-drawn starter slides. tldraw doesn't need to be open. |
| draw it | open the `.tldraw` file shown on its card in tldraw Desktop (**copy** gives the path) |
| make a folder | **+ folder** |
| change the title or description, hide it from the website, or rename its link | **edit** |
| set the card picture | **cover**, or drop an image onto the card |
| see it as the website will | **view** (starts the website preview on :5173) |
| move it into another folder | **move** |
| delete it | **delete** (type its name to confirm) |
| rename, move or delete a folder | the buttons on the folder |
| publish | **Save to GitHub**: commit, then push |

Moving, renaming or deleting refuses while that presentation is open in tldraw: close it first
(tldraw would keep saving to the old place).

## The command line

Everything the studio does is also a command (`node bin/deck.mjs …` or `npm run deck -- …`):

```bash
deck list                                   # the tree
deck new "Title" --in mono2micro            # make a presentation in a folder (tldraw not needed)
deck new "Title" --in talks --description "one line" --name short-name
deck folder weekly-presentations --title "Weekly presentations"
deck move weekly-presentations/seeing-is-fixing talks     # "." is the top
deck open seeing-is-fixing                  # open it in tldraw
deck build seeing-is-fixing                 # redraw its code slides (slides/)
deck cover seeing-is-fixing                 # save slide 1 as its cover (needs tldraw)
deck check                                  # validate everything
```

A presentation can be named by its path or any unique part of it (`deck build seeing` works).

## Editing a presentation

- **Draw by hand**: open its `.tldraw` in tldraw Desktop and draw. The slide panel, **+ New slide**
  and layouts all work; **Appears: …** in the top bar makes a selection appear on a click.
- **Draw with code** (the hand-drawn house style, or when an agent builds the slides): edit
  `slides/*.js`, list them in `slides/manifest.json`, run `deck build <deck>` (tldraw opens it).
  Rebuilding replaces only the code-drawn slides. See [drawing-slides.md](drawing-slides.md).
- **Speaker notes**: **Notes** in tldraw's top bar, or the `notes` of a slide file.
- Save in tldraw before you commit: the website is built from the saved file.

## Present

In tldraw Desktop or on the website: **▶ Present**. → / Space / click step through each slide's
reveals, then the next slide; ← goes back; Esc exits; drag for a laser pointer.

## The files

`deck.json`:

```json
{ "title": "Seeing is Fixing", "description": "One line for the card (optional).", "listed": true }
```

`"listed": false` hides it from the website's folders (its link still works; `?all` shows it).
`deck new` also records a `date`, used only to sort newest first.

`folder.json`: `{ "title": "Weekly presentations", "description": "" }`. It also keeps an empty
folder in git.

## Publish

Commit and push to `main` (the studio's **Save to GitHub**, or git). GitHub Actions exports the whole
tree and rebuilds the site in about a minute. See [website.md](website.md).
