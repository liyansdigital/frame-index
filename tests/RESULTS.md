# Test results — FRAME INDEX browser suite

## Final recorded run

- **Date:** 2026-11-16, 15:54 UTC (21:24 IST)
- **Command:** `npm test` (builds `dist/` first via `pretest`, then `playwright test`)
- **Result: 28 executed — 28 passed — 0 failed — 0 skipped — 0 flaky** (duration 96.7 s)
- **Browser:** Chromium 156.0.8078.4 (headless), Playwright 1.57.0, axe-core 4.10.2
- **Environment:** Node v24.22.1, Linux (sandbox VM); the production build was served locally from `dist/` and the film streamed from the real Mux HLS source. Because this sandbox reaches the internet through an authenticated egress proxy, the run used the suite's documented `CHROME_PATH` + chaining-proxy overrides (see `docs/testing.md`) — the checks themselves are identical to a direct-connection run.
- **Raw output:** Playwright JSON reporter writes `test-results/results.json` on every run (git-ignored).

### Evidence notes per check

| # | Check | Evidence from the run |
|---|-------|------------------------|
| 01 | Player mounts | `media-container` + `video-player` present; slate header with FI mark rendered |
| 02 | Video loads | duration 111.1 s (film is 111.14 s), readyState ≥ 1 |
| 03 | Play works | centre play → `paused=false`, currentTime advancing |
| 04 | Pause works | control-bar play → `paused=true` |
| 05 | Seeking works | timeline click at 50% moved playback by >10 s |
| 06 | Correct timestamp | landed at 55.6 s ±7 after the 50% click; programmatic seek to 30 s landed within 2 s |
| 07 | Contact-sheet selection | 28 cells rendered; clicking the t=50 s frame seeked to 50 s ±4 and played |
| 08 | Active frame follows | at t=60 s the active cell is F-015 with `aria-current="true"` |
| 09 | Scene selection | Scene 3 card click seeked to 52 s ±4 |
| 10 | Active scene follows | at t=60 s active scene is SCENE 03; status line reads Frame F-015 / Scene 3 |
| 11 | Chapter transitions | chapter track `activeCues`: t=10 s → "A Never-Before-Seen Look"; t=60 s → "Building and Launching Webb" |
| 12 | Volume & mute | mute button toggles `muted` both ways; ArrowUp hotkey raised volume from 0.4 |
| 13 | Captions | menu lists Off + English + Japanese; selecting English put a track into `showing` mode |
| 14 | Playback speed | menu selection set `playbackRate = 1.5` |
| 15 | Quality selection | menu lists the stream's real renditions (incl. 720p); 480p selection stuck (`aria-checked="true"`) |
| 16 | Fullscreen | button entered (`document.fullscreenElement` set) and exited cleanly |
| 17 | Picture-in-Picture | **entered for real**: `document.pictureInPictureElement` was set, then exited. (In environments where headless PiP is unavailable the test falls back to asserting the control is present, labelled, operable and raises no error dialog, and records a platform note.) |
| 18 | Keyboard shortcuts | `k` started playback; ArrowRight seeked +10 s (observed delta within 5–15 s) |
| 19 | Menus | Settings popup visible; Quality submenu opens |
| 20 | Focus indicators | focused control shows a solid 2 px outline in `rgb(255, 90, 31)` (Signal Orange) |
| 21 | Mobile strip navigation | 390 px touch context: strip scrolls horizontally; tapping the t=22 s frame seeked within 5 s |
| 22 | No horizontal overflow | demo at 1440 px and 390 px, player at 360 px: overflow ≤ 1 px everywhere |
| 23 | Reduced motion | with `prefers-reduced-motion`, playback works and the buffering spinner's animation is effectively off |
| 24 | Error state | with the stream route aborted, the error dialog appears with a title |
| 25 | No broken thumbnails | all 32 referenced images (28 frames + 4 scenes) return HTTP 200 and decode; manifest serves 28 entries |
| 26 | No console errors | fresh player + demo pages through load and playback: zero console errors, zero page errors |
| 27 | axe-core violations | 0 violations on the demo page and on the bare player |
| 28 | Essential controls | centre play, bar play, seek, mute, time slider, volume slider, time display, captions, settings, PiP, fullscreen, error dialog and status announcer all present; interactive controls carry accessible names |

## Run history (kept honest)

The final 28/28 was the **third** run of the committed suite. The first two runs failed on **test-harness defects, not product defects**; no product code was changed at any point.

1. **Run 1 — 23 passed, 1 failed, 4 did not run.** Check 25 failed on `f-023.jpg`: the original assertion required every lazy-loaded image to be fully decoded at check time, but off-strip frames are only fetched when scrolled into view. Fixed by asserting each asset over HTTP and decoding after scrolling the strip.
2. **Run 2 — 15 passed, 1 failed, 12 did not run.** Check 11 failed: the chapter assertion used a fixed 600 ms wait after an HLS seek; the seek (and therefore the active cue) landed later through the proxied stream. Fixed by polling for the expected cue. (Serial mode stops a file at its first failure, which is why later checks "did not run" in runs 1–2.)
3. **Run 3 — 28/28 passed** (above).

## Known limitations

- **Screen-reader testing: NOT TESTED.** No NVDA/VoiceOver/JAWS pass has been run by anyone; axe-core is an automated checker, not a screen-reader verdict.
- **One engine:** the suite runs Chromium only. Firefox and WebKit/Safari are not covered.
- **Touch is emulated** (Playwright touch contexts), not a physical device.
- **Live-stream dependency:** media checks stream the real film from Mux; an upstream outage would fail load-dependent checks for reasons outside this codebase. Check 24 deliberately breaks the stream locally and is unaffected.
- **Serial execution:** the suite runs with one worker in session order (a user session, not 28 isolated cold starts) — total runtime ≈ 1.6 min.
