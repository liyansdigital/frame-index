# Contributing to FRAME INDEX

Thanks for your interest. FRAME INDEX is a Video.js v10 skin with a demonstration app; contributions that keep it honest, accessible and matte are welcome.

## Setup

```sh
npm install
npm run dev        # workbench with the demo
npm run typecheck  # tsc --noEmit
npm run build      # production build into dist/
npm test           # browser suite (builds first; needs `npx playwright install chromium` once)
```

## House rules (from `AGENTS.md`)

- The skin is everything in `src/`, starting from `src/video/skin`. `apps/preview/` is a workbench that previews it — change it only when the task asks, except `apps/preview/src/frame/player.ts`, which is the designated place for what the preview plays.
- Use the Video.js skin tooling for skin changes (`npx @videojs/cli agents skills` explains the official skill).
- Keep every control keyboard-operable and labelled, with a visible focus indicator, in source order matching visual order. Keep the error dialog, hotkeys and status announcer unless you replace them with equivalents.
- Run `npm run typecheck` and `npm run build` after changes, and check the skin in the workbench. Run `npm test` for anything touching playback, menus, the demo app or styles that affect layout.

## Design discipline

FRAME INDEX is a matte cinematic archive: Deep Ink Black, Graphite, Warm Ivory, Muted Silver, Signal Orange `#ff5a1f`; flat 1 px rules; no glass, no gradients, no glow. Contributions that introduce a different visual language will be asked to rework. Tokens live in `src/video/frameindex.css` (see `docs/customization.md`).

## Two traps to avoid

- **Do not delete** the `<!-- Add a compatible media component here. -->` comment in `src/video/skin.html` — it is the media injection point that hosts replace with a media element.
- **Do not fabricate evidence.** Test results, screenshots and quality claims must come from real runs. If a check was not run, say so (the project uses PASS / NEEDS REVISION / BLOCKED / NOT TESTED, and "not tested" is an acceptable, honest state).

## Pull requests

- One topic per PR; describe what changed and why.
- Include the checks you ran (typecheck / build / tests) with their real outcomes.
- For visual changes, include before/after screenshots from the actual build.
- By contributing you agree your work is licensed under the project's Apache License 2.0.
