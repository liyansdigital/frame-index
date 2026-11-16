# Troubleshooting

## The player loads but the video never starts

- The demo streams from Mux (`stream.mux.com`). Check the browser's network tab for the `.m3u8` request: a blocked or offline network shows up there first. In restricted sandboxes behind an authenticated proxy, media requests fail with `ERR_TUNNEL_CONNECTION_FAILED` — the test suite documents its chaining-proxy workaround in `docs/testing.md`; for manual browsing, use a browser that can use your proxy.
- If the stream is unreachable, the skin shows its error dialog — that is the designed behaviour, not a crash.

## The Quality menu shows different renditions than expected

The menu lists the renditions of the **actual stream** (for the demo film: Auto plus the encoded renditions up to 720p). A different source yields a different list — the menu is generated from the stream, never hard-coded.

## Picture-in-Picture does nothing

PiP depends on the browser and the media element's state. Where the platform doesn't support it, the control is inert by design. Note that headless test browsers may report PiP as enabled yet be unable to enter it; the suite records which case it observed.

## The demo's contact sheet is empty or frames are broken images

- The demo fetches `./frames/frames.json` relative to the page — serve the whole `dist/` folder, not a single HTML file, and keep the `frames/` folder beside it.
- If you cloned from GitHub and see missing frames, check `apps/preview/public/frames/` is complete (28 JPEGs + `frames.json`); the build copies whatever is in `public/`.

## Build prints a chunk-size warning

Vite warns that one workbench chunk exceeds 500 kB. It is a warning, not a failure; the build output is complete. Code-splitting the workbench bundle is a known future optimisation.

## `npm run dev` can't read files outside the project

The Vite config allows the dev server to serve the project root (`server.fs.allow`) because the workbench in `apps/preview` imports the skin from `src/`. If you move folders, keep that relationship or adjust the alias + allow list in `vite.config.ts`.

## Deploy scripts ask questions or fail on missing CLIs

`npm run deploy` dispatches to the chosen host's script, which fetches that host's CLI via `npx` (Vercel / Netlify / Cloudflare) and expects you to sign in on first run. For a plain static deploy you can also serve or upload `dist/` directly — it has no server-side requirements and uses relative URLs, so subfolder hosting (e.g. GitHub Pages project sites) works.

## Typecheck fails after editing the skin template

`skin.html` is imported as a raw string and composed in `skin.ts`; if you rename components there, update the matching imports in `src/video/skin.ts` and keep the media injection comment intact (see `docs/customization.md`).
