import '../styles/video/scaffold.css';
import './skin.css';
import './frameindex.css';
import '@videojs/html/i18n';
import '@videojs/html/ui/container';
import '@videojs/html/ui/poster';
import '@videojs/html/ui/error-dialog';
import '@videojs/html/ui/dialog-backdrop';
import '@videojs/html/ui/dialog-popup';
import '@videojs/html/ui/dialog-title';
import '@videojs/html/ui/dialog-description';
import '@videojs/html/ui/dialog-close';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-backdrop';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/buffering-indicator';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/title';
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-label';
import '@videojs/html/ui/tooltip-shortcut';
import '@videojs/html/ui/pip-button';
import '@videojs/html/ui/fullscreen-button';
import '@videojs/html/ui/seek-button';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/time-slider-chapters';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/slider-preview';
import '@videojs/html/ui/slider-value';
import '@videojs/html/ui/time-slider-chapter-title';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/volume-popover';
import '@videojs/html/ui/volume-slider';
import '@videojs/html/ui/time-group';
import '@videojs/html/ui/time';
import '@videojs/html/ui/time-separator';
import '@videojs/html/ui/captions-button';
import '@videojs/html/ui/menu';
import '@videojs/html/ui/menu-content';
import '@videojs/html/ui/menu-item';
import '@videojs/html/ui/menu-separator';
import '@videojs/html/ui/quality-radio-group';
import '@videojs/html/ui/menu-radio-item';
import '@videojs/html/ui/menu-item-indicator';
import '@videojs/html/ui/playback-rate-radio-group';
import '@videojs/html/ui/captions-radio-group';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/status-announcer';
import '@videojs/html/ui/volume-indicator';
import '@videojs/html/ui/volume-indicator-fill';
import '@videojs/html/ui/volume-indicator-value';
import '@videojs/html/ui/status-indicator';
import '@videojs/html/ui/status-indicator-value';
import '@videojs/html/ui/seek-indicator';
import '@videojs/html/ui/seek-indicator-value';
import { registerIcons } from '@videojs/html/icons';

// FRAME INDEX icon family — original geometric archive-style glyphs drawn for this skin
// (18×18 grid, stroke-based, square terminals; no scaffold artwork reused).
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" aria-hidden="true" viewBox="0 0 18 18">${body}</svg>`;

registerIcons('frameindex', {
  play: svg(
    '<path d="M2.6 5.2V2.6h2.6M12.8 2.6h2.6v2.6M15.4 12.8v2.6h-2.6M5.2 15.4H2.6v-2.6"/><path d="M7.4 6.1v5.8L12.4 9z" fill="currentColor" stroke="none"/>'
  ),
  pause: svg(
    '<rect x="4.6" y="3.4" width="3" height="11.2" fill="currentColor" stroke="none"/><rect x="10.4" y="3.4" width="3" height="11.2" fill="currentColor" stroke="none"/>'
  ),
  restart: svg('<path d="M14.9 9a5.9 5.9 0 1 1-1.7-4.2M15.4 2.6v3.1h-3.1"/>'),
  seek: svg('<path d="M7.2 4.2 11.4 9l-4.2 4.8M3 4.2 7.2 9l-4.2 4.8"/>'),
  'volume-high': svg(
    '<path d="M3 7.1v3.8h2.5L10 15V3L5.5 7.1H3z" fill="currentColor" stroke="none"/><path d="M12.4 6.6a3.4 3.4 0 0 1 0 4.8M14.6 4.4a6.4 6.4 0 0 1 0 9.2"/>'
  ),
  'volume-low': svg(
    '<path d="M3 7.1v3.8h2.5L10 15V3L5.5 7.1H3z" fill="currentColor" stroke="none"/><path d="M12.4 6.6a3.4 3.4 0 0 1 0 4.8"/>'
  ),
  'volume-off': svg(
    '<path d="M3 7.1v3.8h2.5L10 15V3L5.5 7.1H3z" fill="currentColor" stroke="none"/><path d="M12.2 6.8l3.6 4.4M15.8 6.8l-3.6 4.4"/>'
  ),
  'captions-off': svg(
    '<rect x="2" y="4" width="14" height="10"/><path d="M8.3 7.5a2.3 2.3 0 1 0 0 3M13.3 7.5a2.3 2.3 0 1 0 0 3"/>'
  ),
  'captions-on': svg(
    '<rect x="2" y="4" width="14" height="10" fill="currentColor" stroke="none"/><path d="M8.3 7.5a2.3 2.3 0 1 0 0 3M13.3 7.5a2.3 2.3 0 1 0 0 3" stroke="var(--media-background, #101014)"/>'
  ),
  gear: svg(
    '<circle cx="9" cy="9" r="2.1"/><path d="M9 2.7v2.3M9 13v2.3M2.7 9H5M13 9h2.3M4.5 4.5l1.6 1.6M11.9 11.9l1.6 1.6M13.5 4.5l-1.6 1.6M6.1 11.9l-1.6 1.6"/>'
  ),
  switches: svg(
    '<path d="M2.5 6h8.2M14.3 6h1.2M2.5 12h2.7M8.8 12h6.7"/><rect x="10.9" y="4.3" width="3.2" height="3.4"/><rect x="5.4" y="10.3" width="3.2" height="3.4"/>'
  ),
  speed: svg(
    '<path d="M3.2 13.8a7.6 7.6 0 1 1 11.6 0"/><path d="M9 9.2 12.4 5.8"/><circle cx="9" cy="9.4" r="1.1" fill="currentColor" stroke="none"/><path d="M4.6 6.4l1 1M13.4 6.4l-1 1"/>'
  ),
  speech: svg('<path d="M3 4.2h12v8.2H9.2L6 14.8v-2.4H3z"/><path d="M5.8 7.3h6.4M5.8 9.7h4.2"/>'),
  check: svg('<path d="M3.4 9.6 7.1 13.1 14.6 5.4"/>'),
  chevron: svg('<path d="M7.2 4.4 11.6 9l-4.4 4.6"/>'),
  'fullscreen-enter': svg('<path d="M2.6 6.2V2.6h3.6M11.8 2.6h3.6v3.6M15.4 11.8v3.6h-3.6M6.2 15.4H2.6v-3.6"/>'),
  'fullscreen-exit': svg('<path d="M6.2 2.6v3.6H2.6M11.8 2.6v3.6h3.6M11.8 15.4v-3.6h3.6M6.2 15.4v-3.6H2.6"/>'),
  'pip-enter': svg('<rect x="2.4" y="3.8" width="13.2" height="10.4"/><rect x="9.2" y="9.6" width="4.8" height="3.4" fill="currentColor" stroke="none"/>'),
  'pip-exit': svg('<rect x="2.4" y="3.8" width="13.2" height="10.4"/><path d="M13.8 9.4 10.6 12.6M10.8 9.5h3v3"/>'),
  spinner: svg('<path d="M9 2.7a6.3 6.3 0 1 1-6.3 6.3"/><path d="M9 2.7v3" stroke-width="2"/>'),
});
