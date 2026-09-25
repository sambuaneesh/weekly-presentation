# Weekly presentation

Slide decks built in tldraw Desktop with a reusable presentation pack, and published as a website
on GitHub Pages.

| Path | What it is |
|---|---|
| `weekly-presentation.tldraw` | The deck. Edit it in tldraw Desktop. |
| `presentation-pack/` | The slide builder: panel, layouts, themes, notes, present mode, plus CLI tools. See its [README](presentation-pack/README.md). |
| `site/` | The website: the same pack running on the tldraw SDK, loading the deck. |
| `.github/workflows/deploy.yml` | Builds `site/` and publishes it to GitHub Pages on every push to `main`. |

## Updating the website

1. Edit the deck in tldraw Desktop and save.
2. `git add weekly-presentation.tldraw && git commit -m "Update deck" && git push`
3. GitHub rebuilds and republishes the site in about a minute (see the repo's **Actions** tab).

Changes made by visitors on the website stay in their own browser tab and are gone on reload.
The published deck only changes when you push.

## Running the site locally

```bash
cd site
npm install
npm run dev        # exports the deck, then serves at http://localhost:5173
```

`npm run build` writes the static site to `site/dist/`. The export needs Node 22.13 or newer.

## Licence key

The tldraw SDK needs a licence key on a public site. This project uses the free **hobby** licence
(non-commercial, shows a "made with tldraw" watermark). The key goes in the repository secret
`TLDRAW_LICENSE_KEY`. For local production builds, put it in `site/.env.local` (see
`site/.env.example`).
