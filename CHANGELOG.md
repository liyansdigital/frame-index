# Changelog

All notable changes to FRAME INDEX are recorded here. The project follows a simple, honest convention: entries are added when the work lands, and test or quality claims are only written after the run that proves them.

## [Unreleased]

### Added — engineering programme (2026-11-16)

- **Committed browser test suite** (`tests/`, Playwright + axe-core): 28 checks covering playback, seeking accuracy, the Contact-Sheet Timeline, Scene Explorer, chapters, captions, quality, speed, fullscreen, PiP, keyboard, focus, mobile, reduced motion, error state, assets, console errors and axe violations — run against the production build and the real stream. Latest verified run: **28/28 passed** (see `tests/RESULTS.md`, including the two earlier failed runs and what they taught).
- **CI workflow** (`.github/workflows/ci.yml`): install, typecheck, build, Playwright + axe checks, failure artifacts.
- **Documentation set**: `docs/architecture.md`, `docs/customization.md`, `docs/accessibility.md`, `docs/troubleshooting.md`, `docs/testing.md`.
- **Repository governance**: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue/PR templates, Dependabot config.
- Social preview artwork (`docs/social-preview.png`), built from real screenshots of the production demo.

### The build itself (2026-11-15 – 2026-11-16)

- FRAME INDEX skin for Video.js v10 (`@videojs/html` + `@videojs/mux-video` 10.4.0): matte editorial archive design, slate header with live timecode, centre seek/play trio, chapter-tick timeline, settings menus (Quality / Speed / Captions), full keyboard control, Signal Orange focus ring, reduced-motion support, error dialog, ended state.
- Demo app: Contact-Sheet Timeline (28 real frames extracted from the film with ffmpeg, manifest in `apps/preview/public/frames/frames.json`) and Scene Explorer (the film's chapter track as index cards), live status readout.
- Demo film: NASA's "Cosmic Dawn" trailer (public domain), streamed from Mux with EN/JA caption tracks.

A tagged `v1.0.0` release is prepared once CI is green on GitHub; until then this changelog's Unreleased section is the record.
