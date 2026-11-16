# Accessibility

FRAME INDEX is built to the Video.js v10 skin accessibility model and verified with axe-core plus scripted keyboard/focus checks (see `docs/testing.md` and `tests/RESULTS.md`).

## Keyboard

Every control is keyboard-operable, in source order matching visual order, with a visible focus indicator. Player hotkeys (from `skin.html`):

| Keys | Action |
|------|--------|
| `Space` / `k` | Play / pause |
| `m` | Mute / unmute |
| `←` / `→` / `j` / `l` | Seek ∓/± step (10 s) |
| `↑` / `↓` | Volume step |
| `0`–`9` | Seek to percentage |
| `Home` / `End` | Start / end |
| `>` / `<` | Speed up / down |
| `f` | Fullscreen |
| `c` | Captions on/off |
| `i` | Picture-in-Picture |

Menus open from labelled buttons, navigate by keyboard, and expose their state (`aria-checked` on radio items, hints announcing current values). The demo's contact-sheet cells and scene cards are real `<button>`s with descriptive `aria-label`s ("Seek to frame 13, 00:50 — Scene 3: …") and `aria-current` on the active item.

## Focus visibility

The focus outline is a solid 2 px Signal Orange (`#ff5a1f`) ring — measured by the test suite, not just eyeballed. Controls remain available while keyboard-focused (no hover-only traps).

## Motion

`prefers-reduced-motion` is respected: the buffering spinner's animation is effectively disabled and the demo's active-frame scrolling switches from smooth to instant. The suite verifies playback and the calmed spinner under an emulated reduced-motion preference.

## Captions & announcements

- Captions: English and Japanese tracks ship with the demo stream, selectable in the Captions menu or with `c`; the skin styles caption text for legibility over bright and dark footage.
- A `media-status-announcer` reports state changes (play, seek, captions, fullscreen, PiP) to assistive technology; seek/volume/speed actions surface visual indicator cards as well.
- The demo's status line (`role="status"`) reports frame, timecode, scene and play state.

## Errors

Stream failures surface the skin's error dialog with a title and description and a dismiss control — verified by the suite with the stream deliberately aborted.

## Verified vs not tested — stated plainly

- **Verified automatically:** axe-core reports **0 violations** on both the demo page and the bare player; focus outline, keyboard operation, menu behaviour, reduced motion and the error dialog are covered by the committed suite (`tests/`).
- **NOT TESTED:** a full screen-reader pass (NVDA / VoiceOver / JAWS) has **not** been performed. Automated checks cannot substitute for one; treat screen-reader support as unverified until such a pass is run and recorded here.
