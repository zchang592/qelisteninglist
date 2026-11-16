# DMus QE Listening List

A static listening library for 160 works, hosted on GitHub Pages. Each work has a personal favorite button, curated Medieval YouTube recordings, and YouTube/NetEase search links. The Medieval pilot also offers Apple Music sample previews. Supabase stores private administrator progress, individual favorites, email accounts, avatars, nicknames, and threaded comments.

## Local development

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. No frontend build or runtime package install is required. Use HTTP rather than opening `index.html` as a file, because the app uses JavaScript modules. Use the existing checkout; cloud tasks are already isolated and do not need an additional Git worktree unless requested.

## Enable registration and comments

See [the Supabase setup steps](docs/supabase-setup.md). A frontend deployment alone does not create the database table or enable Auth signup. The browser uses only a publishable key; RLS and column grants enforce database access.

## Edit the library

- `assets/data.js`: all 160 numbered works. IDs are shared with the database; preserve them.
- `assets/media.js`: the five Medieval lookup queries, recording matching, player, and external links. Add a numbered catalog entry to extend the pilot.
- `assets/library.js`: period navigation, global search, work rows, and favorite grouping.
- `assets/favorites.js`: account-scoped favorite loading and updates.
- `assets/admin.js`: private administrator progress dialog and its original three-state controls.
- `assets/app.js`: private progress synchronization, account flows, and application startup.
- `assets/account.js` and `assets/avatars.js`: profile menu, nickname updates, and the ten locally drawn note avatars.
- `assets/comments.js`: separate per-work discussion dialog, threaded replies, and authenticated comment requests.
- `assets/style.css`: responsive visual system; fonts and icons are served locally.
- `supabase/migrations/`: versioned database changes.

The five Medieval sample recordings are looked up on demand through Apple's public iTunes Search API. Only matching work metadata and HTTPS `*.mzstatic.com` previews are accepted. Previews may be unavailable by recording or region. The YouTube and NetEase buttons are explicitly **search links**. Only available recordings are displayed; add a recording to `youtubeRecordings` in `assets/media.js` as `{title, url}`. A valid YouTube video link then supplies an inline player and an external link. No recording is invented or played automatically.

Favorites require sign-in and are private to each user. The administrator's existing status data is protected by RLS and appears only in the avatar menu's private progress dialog. The notes interface has been removed. Historic notes and any unsent legacy note edits are preserved in the database or pending queue; changing a status does not overwrite an existing note.

## Checks

```sh
npm ci --cache /tmp/qelisteninglist-npm-cache
npm test
```

Browser tests use `CHROME_PATH` if set, then a system Chromium, then Playwright's installed browser. With no system browser, run `npx playwright install chromium`. The tests start their own temporary HTTP server, mock external API responses, exercise account/comment/media flows, and check responsive layouts. PostgreSQL tests execute the actual migration and test RLS and column privileges using PGlite. They do not prove the live Supabase project is configured or that external media plays in your region.

## Deployment

Push static files to `main`. In GitHub **Settings → Pages**, select **Deploy from a branch → main → /(root)**. The expected production URL is <https://zchang592.github.io/qelisteninglist/>. Run the database migrations separately in Supabase before expecting comments and replies to persist.

## Design and assets

The redesign follows [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)'s `design-taste-frontend` guidance for typography, spacing, restrained motion, real platform icons, keyboard access, and browser verification. This is a working catalog app: period navigation and readable work rows take precedence over the skill's company-landing-page sections and full-screen effects.

Plus Jakarta Sans is distributed under the SIL Open Font License; its license is in `assets/fonts/`. Platform SVGs come from [Simple Icons](https://github.com/simple-icons/simple-icons), under CC0. Product names and logos belong to their respective owners. No recordings are hosted in this repository.

Release metadata: when publishing, increment the version in package.json/package-lock.json and the account menu in index.html, update its UTC timestamp, and refresh changed module/cache query versions.
