# Architecture

FRAME INDEX is a Video.js v10 HTML skin plus a demonstration app, scaffolded with `videojs skin create` (`skin.json` records the recipe: framework `html`, styling `css`, preset `video`, base `scaffold`, Video.js 10.4.0).

## Two layers

### 1. The skin — `src/`

Everything reusable lives here, starting from `src/video/skin`:

- `src/video/skin.html` — the player's component tree: slate header with live timecode readout, centre seek/play trio, chapter-tick time slider, volume popover, settings menu (Quality / Speed / Captions radio groups), PiP and fullscreen buttons, hotkeys, gestures, error dialog and status announcer. One line is load-bearing: the `<!-- Add a compatible media component here. -->` comment is the **media injection point** — hosts replace it with their media element (see `player.ts` below). Do not delete it.
- `src/video/skin.ts` — imports the Video.js UI components used by the template, plus the stylesheets.
- `src/video/frameindex.css` — the FRAME INDEX identity layer (443 lines): matte archive surfaces, the `--fi-*` design tokens, Signal Orange `#ff5a1f` interaction colour, custom `frameindex` icon family styling, focus ring, slate and control-bar layout.
- `src/video/skin.css` + `src/styles/` — the scaffold's base/theme styles the identity layer builds on.

The skin deliberately contains **no media source**: any Video.js-compatible media component can be injected, which is what makes the skin reusable outside this demo.

### 2. The workbench / demo — `apps/preview/`

Per the project house rules (`AGENTS.md`), `apps/preview/` is the workbench that previews the skin. Vite uses it as its root; the build emits two pages into `dist/`:

- `dist/index.html` — the **demo app** (React, `apps/preview/src/demo/`): an archive page that mounts the player and adds the two signature features:
  - **Contact-Sheet Timeline** — 28 real frames from the film (`public/frames/`, manifest `frames.json`: `{index, time, file}`), rendered as numbered cells (F-001…F-028) with timecodes and SCENE badges. Clicking a cell seeks; the active cell follows `currentTime`, is marked `aria-current`, and scrolls into view.
  - **Scene Explorer** — the film's chapter track as index cards (`public/chapters/` thumbnails); clicking seeks to the scene start; the active scene follows playback. Chapter data in the demo mirrors `public/cosmic-dawn-chapters.vtt` exactly.
  - A status line (`role="status"`) reports frame / timecode / scene / play state.
- `dist/preview.html` — the **bare player** (`apps/preview/src/frame/`), the skin with no demo furniture.
- `apps/preview/src/frame/player.ts` — creates the player: it takes the skin template and replaces the injection-point comment with a `<mux-video>` element pointing at the demo film (NASA's "Cosmic Dawn", public domain) with the chapters track attached. This file is the one place the house rules reserve for changing what the preview plays.
- `apps/preview/src/shell/` — the scaffold workbench shell (options panel, navbar) retained from `videojs skin create`.
- `apps/preview/deploy.mjs` — interactive dispatcher for the `deploy:vercel` / `deploy:netlify` / `deploy:cloudflare` scripts.

**Architecture note (honest):** the Contact-Sheet Timeline and Scene Explorer live in the demo app, not in `src/`. That is a deliberate, documented split — the skin stays a clean reusable player — with a real consequence: embedding only the skin does not include the two signature features. Moving them into the skin package would be a product decision, not a bug fix.

## Build

- `vite.config.ts`: root `apps/preview`, `base: './'` (the build works at a domain root or in a subfolder, e.g. GitHub Pages), aliases `@/` → `src/` and `@preview/` → `apps/preview/src/`, output `dist/`.
- `npm run dev` — workbench with the demo · `npm run build` — production build · `npm run typecheck` — `tsc --noEmit` over `src` + `apps` · `npm test` — the browser suite (see `docs/testing.md`).

## Media & data

- Streaming: Mux HLS via `@videojs/mux-video` 10.4.0; the playback ID in `player.ts` is a public playback identifier (not a credential). Subtitle tracks (EN/JA) are served by Mux with the stream; chapters and frames are local static assets.
- No environment variables are read by the app; there is nothing to configure in a `.env` file.
- No backend, no analytics, no storage: the demo is fully static.
