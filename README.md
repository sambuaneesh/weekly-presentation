# Weekly presentation

Slide decks built in tldraw Desktop with a reusable presentation pack, and published as a website
on GitHub Pages.

| Path | What it is |
|---|---|
| `weekly-presentation.tldraw` | The deck. Edit it in tldraw Desktop. |
| `presentation-pack/` | The slide builder: panel, layouts, themes, notes, present mode, plus CLI tools. See its [README](presentation-pack/README.md). |
| `site/` | The website: the same pack running on the tldraw SDK, loading the deck. |
| `sync-worker/` | Live-room server (Cloudflare Worker + Durable Objects) for shared presenting. |
| `.github/workflows/deploy.yml` | Builds `site/` and publishes it to GitHub Pages on every push to `main`. |

## Updating the website

1. Edit the deck in tldraw Desktop and save.
2. `git add weekly-presentation.tldraw && git commit -m "Update deck" && git push`
3. GitHub rebuilds and republishes the site in about a minute (see the repo's **Actions** tab).

Changes made by visitors on the website stay in their own browser tab and are gone on reload.
The published deck only changes when you push.

## Live rooms (present to several devices)

Click **● Go live** on the site, enter the room password (and optionally a room name such as
`weekly`), then **Copy link** and share it. Only starting a room needs the password; anyone with
the link can join. A link to a room that was never started shows "Room not found". Everyone in
the room sees the same deck, each other's cursors, the presenter's laser and highlights. When
someone presses **▶ Present**, everyone else follows their slides automatically (Esc stops
following). A new room starts as a copy of the published deck; **Reset to deck** reloads it.

The room server runs on Cloudflare's free plan. One-time setup:

```bash
cd sync-worker
npm install
npx wrangler login      # opens the browser to sign in to Cloudflare
npx wrangler deploy     # prints the URL, e.g. https://weekly-presentation-sync.<you>.workers.dev
npx wrangler secret put ROOM_PASSWORD   # the password for starting rooms (prompts for it)
```

Change the password any time by running `npx wrangler secret put ROOM_PASSWORD` again. Rooms that
are already open stay open. Until the secret is set, no new rooms can be started.

Then add that URL as the repository **variable** `VITE_SYNC_URL` (Settings → Secrets and
variables → Actions → Variables) and re-run the deploy. The server only accepts connections from
the origins in `sync-worker/wrangler.toml` (`ALLOWED_ORIGINS`). Redeploy the worker after changing
it. Images pasted inside a room are stored inline in the room, since there is no upload storage.

## Running the site locally

```bash
cd site
npm install
npm run dev        # exports the deck, then serves at http://localhost:5173
```

For live rooms locally, put `ROOM_PASSWORD=<anything>` in `sync-worker/.dev.vars` (gitignored),
run `npx wrangler dev --port 8799` in `sync-worker/`, and start the site
with `VITE_SYNC_URL=http://localhost:8799 npm run dev`.

`npm run build` writes the static site to `site/dist/`. The export needs Node 22.13 or newer.

## Licence key

The tldraw SDK needs a licence key on a public site. This project uses the free **hobby** licence
(non-commercial, shows a "made with tldraw" watermark). The key goes in the repository secret
`TLDRAW_LICENSE_KEY`. For local production builds, put it in `site/.env.local` (see
`site/.env.example`).
