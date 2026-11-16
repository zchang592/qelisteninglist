# Design and validation

The redesign uses [design-taste-frontend](https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill) as its design guidance. The original page was inspected in Chromium before editing. This is a functional music catalog, so the reading list, period navigation, and discussion forms determine the layout. Company-site requirements such as full-screen marketing sections, promotional artwork, and scroll effects are intentionally not used.

The visual system uses a warm paper ground, deep green actions, Instrument Serif headings, DM Sans text, a consistent radius scale, short hover/press responses, native modal dialogs, and reduced-motion support. Fonts are local. YouTube and Spotify SVGs are the actual Simple Icons assets. No reviews, recordings, usage numbers, or people are invented for the visual design.

## Automated verification

`npm test`: **17 passing tests**, comprising 12 browser workflows and 5 PostgreSQL migration/permission checks. Tests cover all 160 retained works, period navigation and global search, five recording lookups and audio decoding from test fixtures, single-player playback, provider failure/retry, registration with email confirmation or an immediate session, sign-in from a discussion, comment publishing/deletion, hostile comment text, comment failures and missing tables, pagination, admin progress/notes/export, session refresh, and responsive layouts.

Browser layouts were checked at 1440, 1024, 820, 768, 390, and 320 pixels. Actual migration SQL was executed twice against PGlite with anonymous and authenticated roles. The checks assert anonymous write denial, server-controlled authorship, rate/length/track bounds, read access, and deletion limited to the author.

The Taste Skill copy lint reports 0 failures and 1 warning for the progress-counter strip. These counters reflect the existing 160-work data and actual loaded progress, so that warning is retained. The full design checker was run, its applicable contrast, heading, focus, and touch findings were fixed, and a second quick pass was run. The final checker reports PASS for text/button contrast, accessible names, field labels, heading order, visible focus, hidden content, font loading, horizontal overflow, element collisions, and mobile target sizes. Its remaining findings concern landing-page hero/section/composition conventions; the overall landing-page checker is **not passing**. The first full pass checked reduced motion; the second quick pass does not check it. No complete Taste Skill finish-gate pass is claimed.

The skill's performance checker was also run at 1440 and 390 pixels. It measured approximately 346 KiB of initial transfer and 0.000 layout shift at both sizes after reserving navigation/list space. Local asset, script, image, and main-thread checks pass. It warns about the two local font files (303 KiB total), and fails on requests to the network-blocked live Supabase progress endpoint. Those external-request failures remain unresolved; the performance report as a whole is not passing.

## Live validation still required

External API responses in browser tests are controlled fixtures, and the local PostgreSQL auth schema is a test harness. They do not demonstrate live account creation, email delivery, live comment storage, or the availability/content of a commercial recording. The cloud instance's network policy blocked Supabase, iTunes, and the Pages hostname during this work. Use [the setup guide](supabase-setup.md) for the live migration, Auth settings, and end-to-end verification. Cloud network requirements and reproducible setup/start commands are saved separately in the environment configuration draft; saving that draft does not apply or publish it.
