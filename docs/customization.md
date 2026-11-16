# Customization

## Design tokens

The FRAME INDEX identity is tokenised in `src/video/frameindex.css`:

| Token | Role |
|-------|------|
| `--fi-ink` | Deep Ink Black — primary surface |
| `--fi-ink-2` | Raised ink surface |
| `--fi-graphite` | Graphite — secondary surface / borders' base |
| `--fi-ivory` | Warm Ivory — primary text |
| `--fi-silver` | Muted Silver — secondary text |
| `--fi-orange` | **Signal Orange `#ff5a1f`** — interaction, active states, focus ring |
| `--fi-rule` | 1 px rule lines |
| `--fi-rule-strong` | Emphasised rule lines |

Change `--fi-orange` to re-accent the whole player (timeline fill, active frame, focus outline, indicators all derive from it). Keep the matte discipline: flat surfaces, 1 px rules, no gradients, no glass, no glow — that restraint is the design.

The demo page has its own small token set in `apps/preview/src/demo/demo.css` (`--orange: #ff5a1f` mirrors the skin accent).

## Typography

Archivo (sans, headings/UI) and IBM Plex Mono (timecodes, frame numbers, tabular figures) are loaded by the demo pages from Google Fonts. All clocks use tabular mono so timecodes never jitter.

## Icons

Icons are an original, custom-drawn set registered under the `frameindex` family and referenced from `skin.html` as `<media-icon family="frameindex" name="…">` (play, pause, restart, seek, volume, captions, gear, pip, fullscreen, spinner, check, chevron, switches, speed, speech). To restyle an icon, edit its drawing in the skin's icon definitions — keep the stroke-based, geometric character.

## Changing the film

`apps/preview/src/frame/player.ts` is the designated place: it holds the stream URL, poster path and chapters path. Point it at any HLS source your player setup supports. If you change the film, the demo's contact sheet and scenes must change with it:

- Frames: extract stills (e.g. with ffmpeg) into `apps/preview/public/frames/` and regenerate `frames.json` (`{index, time, file}` per frame).
- Scenes: replace the thumbnails in `apps/preview/public/chapters/`, the chapter track VTT, and the chapter table in `apps/preview/src/demo/main.tsx` — keep all three consistent (the test suite checks the chapter track against playback).

## Layout knobs

- The slate header (brand + title + TC readout) is the `.fi-slate` group at the top of `skin.html`; remove the group if a host page provides its own chrome.
- Centre controls (seek −10 s / play / seek +10 s) and the bottom control bar are independent groups in `skin.html`; either can be dropped without breaking the other.
- Control auto-hide, buffering and ended states come from the Video.js scaffold behaviour in `src/styles/` — adjust there rather than in the identity layer.

## What not to do

- Don't delete the `<!-- Add a compatible media component here. -->` comment in `skin.html` — hosts (and `player.ts`) replace that exact string with the media element.
- Don't hard-code credentials anywhere. The demo needs none; a public playback ID is not a credential.
