# QE Listening List

A static listening library for 160 works, hosted on GitHub Pages. Each work has a personal favorite button, YouTube recordings when available, and YouTube/NetEase search links. Supabase stores private administrator progress, individual favorites, email accounts, avatars, nicknames, and threaded comments.

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

YouTube recordings are listed in `assets/media.js`, `assets/early-recordings.js`, and `assets/later-recordings.js`. YouTube search and public video metadata help identify candidates; listeners should check interpretation, movement and version against the source list. All 160 works have at least one candidate recording; availability and interpretation can vary. The NetEase button opens a platform search, subject to availability and regional restrictions. A YouTube video link supplies an inline player and an external link. No recording is played automatically.

The five Medieval works offer an experimental Bilibili player. Because Bilibili search required verification during development, no work-specific video has been preselected; a listener can search and paste an official video URL or BV ID to test an embed. The supplied link is only used in the browser and is not saved or published. Availability, login and regional restrictions are controlled by Bilibili.

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

Plus Jakarta Sans is distributed under the SIL Open Font License; its license is in `assets/fonts/`. Platform SVGs come from [Simple Icons](https://github.com/simple-icons/simple-icons), under CC0. Product names and logos belong to their respective owners. The five Medieval MP3 files are hosted in this repository.

Release metadata: when publishing, increment the version in package.json/package-lock.json and the account menu in index.html, update its UTC timestamp, and refresh changed module/cache query versions.

The independent editorial entrance is `home.html`. The original site URL and `index.html` continue to open the library directly. Visual overrides are in `assets/editorial.css`; the six homepage period links use the existing library navigation through a small UI adapter. Supabase settings, persistent work IDs and backup identifiers are unchanged.

The five Medieval works also include user-provided MP3 recordings in `assets/audio/medieval/`. The player loads audio on demand. Recording identification and source links match the first YouTube versions listed in `assets/media.js`.
