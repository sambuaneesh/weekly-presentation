# The website

One static site on GitHub Pages holds every presentation:

| Address | Shows |
|---|---|
| `https://sambuaneesh.github.io/weekly-presentation/` | the top folder: folders and presentations (`?all` also shows hidden ones) |
| `…/#/mono2micro` | a folder |
| `…/#/mono2micro/agentic-workflow` | one presentation: browse it, press **▶ Present** |
| `…/?room=<name>#/<path>` | that presentation, live: everyone with the link follows the presenter |

(The address follows the GitHub repository's name. If you rename the repository, the site moves with it.)

The site runs the same presentation pack as tldraw Desktop, so decks look and behave the same,
including build steps, interactive slides and every deck's own `ext/` code. Visitors can scribble on a
deck; their changes stay in their own tab and are gone on reload. The published deck only changes
when you push.

## Publishing

Push to `main`. The workflow `.github/workflows/deploy.yml` runs `site`'s `npm run build`, which
exports the whole `decks/` tree (each `.tldraw` file, `deck.json`, `folder.json`, cover) with
`site/scripts/export-decks.mjs`, builds the site, and publishes it. It takes about a minute (see the
repository's **Actions** tab). Nothing needs registering: whatever is in `decks/` is on the site, in the same folders.

One-time repository setup (already done for this repo): Settings → Pages → Source: **GitHub Actions**;
the secret `TLDRAW_LICENSE_KEY`; for live rooms, the variable `VITE_SYNC_URL`.

## Live rooms (present to several devices)

Open a deck, click **● Go live**, enter the room password (and optionally a room name such as
`weekly`), then **Copy link** and share it.

- **Presenter**: whoever started the room with the password (or used **Presenter login** in it).
  Full editor: present, laser, highlight, edit, **Reset to deck**.
- **Viewers**: anyone else with the link, no password needed. Read-only (the server rejects their
  edits) and they follow the presenter: the presenter's screen while they edit, their slide *and
  build step* while they present, fitted to each viewer's screen. A viewer who pans away gets a
  **Follow presenter** button; Esc stops following.
- **A join slide comes first**: in a room, the deck gets an extra slide 0 with a big QR code of the
  room's link (and the link written out), so people in the room can scan it and follow along. It
  exists only in the room, never in the published deck, and doesn't change the deck's slide numbers.
- **Rooms belong to a deck**: `?room=weekly` on two different decks is two separate rooms.
- A room starts as a copy of the published deck, and closes 2 minutes after the last person leaves.
  Its link then shows "This room isn't live", with a password box to start it again.
- Interactive slides work in rooms: when the presenter drags or clicks, everyone sees it.

The room server (`sync-worker/`) runs on Cloudflare's free plan and serves every deck. One-time setup:

```bash
cd sync-worker
npm install
npx wrangler login
npx wrangler deploy                      # prints the URL, e.g. https://weekly-presentation-sync.<you>.workers.dev
npx wrangler secret put ROOM_PASSWORD    # the password for starting rooms
```

Add that URL as the repository **variable** `VITE_SYNC_URL` and re-run the deploy. The server only
accepts connections from the origins in `sync-worker/wrangler.toml` (`ALLOWED_ORIGINS`). **Redeploy the
worker** (`npx wrangler deploy`) after changing its schema, e.g. when a deck adds a new shape type
(see [extending.md](extending.md#new-shape-types)).

## Running it locally

```bash
cd site
npm install
npm run dev        # exports every deck, then serves at http://localhost:5173
npm run build      # the static site in site/dist/ (npx vite preview to look at it)
```

`node bin/deck.mjs export` runs just the export. It needs Node 22.13 or newer and works whether or not
tldraw Desktop is open, but it reads the **saved** `.tldraw` files, so save first.

For live rooms locally: put `ROOM_PASSWORD=<anything>` in `sync-worker/.dev.vars`, run
`npx wrangler dev --port 8799` in `sync-worker/`, and start the site with
`VITE_SYNC_URL=http://localhost:8799 npm run dev`.

## Licence key

The tldraw SDK needs a licence key on a public site. This project uses the free **hobby** licence
(non-commercial, shows a "made with tldraw" watermark), in the repository secret `TLDRAW_LICENSE_KEY`.
For local production builds, put it in `site/.env.local` (see `site/.env.example`).

## Changing the site

| Want | Where |
|---|---|
| the folder pages | `site/src/Gallery.jsx` (`VITE_SITE_OWNER` sets the name shown) |
| routes, the deck player, the back link | `site/src/App.jsx` |
| live rooms | `site/src/live.jsx` |
| what gets exported per deck | `site/scripts/export-decks.mjs` |
