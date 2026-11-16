# Testing

FRAME INDEX ships a real browser test suite. It drives the **production build** (`dist/`) in Chromium against the **real Mux stream** — no mocked media — and checks the 28 behaviours listed in the project plan (mount, playback, seeking accuracy, Contact-Sheet Timeline, Scene Explorer, chapters, volume, captions, speed, quality, fullscreen, PiP, keyboard, menus, focus, mobile strip, overflow, reduced motion, error state, assets, console errors, axe-core, and a controls regression pass).

## Run it

```sh
npm install
npx playwright install chromium   # once, downloads the test browser
npm test                          # builds dist/ (pretest), then runs the suite
```

- Entry point is `npm test`; running `playwright test` directly skips the build step.
- The suite serves `dist/` itself (`tests/static-server.mjs`, port 4317) — no dev server needed.
- Runtime ≈ 1.6 minutes. Tests run serially with one worker, in session order.
- Machine-readable output lands in `test-results/results.json` (git-ignored); the human record of the latest verified run is [`tests/RESULTS.md`](../tests/RESULTS.md).

## Layout

| File | Covers |
|------|--------|
| `tests/player.spec.ts` | Bare player (`preview.html`): checks 01–06, 11–20, 23, 24, 28 |
| `tests/demo.spec.ts` | Demo page (`index.html`): checks 07–10, 21, 22, 25–27 |
| `tests/helpers.ts` | Media-element access, seek/play helpers, axe-core runner |
| `tests/static-server.mjs` | Dependency-free static server for `dist/` |
| `tests/local-proxy.mjs` | Optional chaining proxy for restricted sandboxes (below) |
| `playwright.config.ts` | Suite configuration |

## Environment overrides (sandbox support)

Two opt-in overrides exist for restricted environments; both are **unset in CI and normal use**:

- `CHROME_PATH` — path to a Chromium executable to use instead of the Playwright-managed browser.
- `https_proxy` — if an authenticated egress proxy is configured in the environment, the config starts `tests/local-proxy.mjs` (127.0.0.1:8899) and points Chromium at it. The helper reads the upstream credentials from the environment at runtime; **no credential is stored in this repository**. Local targets (the `dist/` server) are always connected directly.

## Honest limitations

- **Screen-reader testing has not been performed** (no NVDA/VoiceOver/JAWS pass). axe-core checks are automated rules, not a screen-reader verdict.
- Chromium only; Firefox/WebKit are not covered. Touch is emulated, not a physical device.
- Media checks depend on the live Mux stream being reachable; check 24 (error state) is the deliberate exception — it aborts the stream itself.
- Check 17 (PiP) asserts real PiP entry where the platform allows it; where headless PiP is unavailable it asserts the control is present, labelled, operable and error-free, and records a platform note instead of a silent pass.
