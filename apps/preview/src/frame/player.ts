import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import '@/video/skin';
import skinTemplate from '@/video/skin.html?raw';

// What the preview plays: NASA's "Cosmic Dawn" trailer (public domain), streamed
// from the entrant's own Mux account. Poster is a frame extracted from the film
// itself, served from `apps/preview/public`.
const SRC = 'https://stream.mux.com/2U9qL96dDKsN1LcT6017gXvAbdnWs6jowGR3wiwCq4mg.m3u8';
const POSTER = './poster.jpg';
/** Chapters for the time slider, served from `apps/preview/public`. */
const CHAPTERS = './cosmic-dawn-chapters.vtt';

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';

export function createPlayer(): HTMLElement {
  const player = document.createElement('video-player');
  player.setAttribute('poster', POSTER);

  player.innerHTML = skinTemplate.replace(
    MEDIA_PLACEHOLDER,
    `<mux-video src="${SRC}" title="Cosmic Dawn — NASA" playsinline crossorigin><track kind="chapters" label="English" srclang="en" src="${CHAPTERS}" default></mux-video>`
  );

  return player;
}
