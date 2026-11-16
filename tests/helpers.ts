import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

// Shared helpers for the FRAME INDEX suite. The media element is the
// <mux-video> custom element: it carries the full HTMLMediaElement-like API
// (paused, currentTime, duration, textTracks, ...) but its tag starts with
// neither "media-" nor matches a plain "video" selector, so — like the demo
// app itself — we find the first non-media-* element that quacks like media.

export interface MediaState {
  paused: boolean;
  currentTime: number;
  duration: number;
  muted: boolean;
  volume: number;
  playbackRate: number;
  readyState: number;
  textTracks: { label: string; language: string; mode: string; kind: string }[];
}

export async function mediaState(page: Page): Promise<MediaState | null> {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.localName.startsWith('media-')) continue;
      if ('paused' in el && 'play' in el) {
        const m = el as unknown as HTMLVideoElement & { textTracks: TextTrackList };
        return {
          paused: m.paused,
          currentTime: m.currentTime,
          duration: m.duration,
          muted: m.muted,
          volume: m.volume,
          playbackRate: m.playbackRate,
          readyState: m.readyState,
          textTracks: [...(m.textTracks || [])].map((t) => ({
            label: t.label,
            language: t.language,
            mode: t.mode,
            kind: t.kind,
          })),
        };
      }
    }
    return null;
  });
}

export async function seekMedia(page: Page, t: number): Promise<boolean> {
  return page.evaluate((time) => {
    for (const el of document.querySelectorAll('*')) {
      if (el.localName.startsWith('media-')) continue;
      if ('paused' in el && 'play' in el) {
        (el as unknown as HTMLVideoElement).currentTime = time;
        return true;
      }
    }
    return false;
  }, t);
}

export async function setPaused(page: Page, paused: boolean): Promise<void> {
  await page.evaluate((wantPaused) => {
    for (const el of document.querySelectorAll('*')) {
      if (el.localName.startsWith('media-')) continue;
      if ('paused' in el && 'play' in el) {
        const m = el as unknown as HTMLVideoElement;
        if (wantPaused) m.pause();
        else void m.play().catch(() => undefined);
        return;
      }
    }
  }, paused);
}

/** Click via el.click() — used where dispatched clicks proved necessary for custom elements. */
export async function clickEl(page: Page, selector: string, nth = 0): Promise<boolean> {
  return page.evaluate(
    ([sel, n]) => {
      const el = document.querySelectorAll(sel as string)[n as number] as HTMLElement | undefined;
      if (!el) return false;
      el.click();
      return true;
    },
    [selector, nth] as const
  );
}

/** Open a page and wait until the media metadata is loaded (duration finite). */
export async function openPlayer(page: Page, path = '/preview.html'): Promise<void> {
  await page.goto(path, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('media-container', { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      for (const el of document.querySelectorAll('*')) {
        if (el.localName.startsWith('media-')) continue;
        if ('paused' in el && 'play' in el) {
          const m = el as unknown as HTMLVideoElement;
          if (m.readyState >= 1 && Number.isFinite(m.duration)) return true;
        }
      }
      return false;
    },
    { timeout: 45_000 }
  );
  await page.waitForTimeout(800);
}

const axeSource = readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');

/** Run axe-core against the current page; returns violation ids with node counts. */
export async function axeViolations(page: Page): Promise<string[]> {
  await page.evaluate(axeSource);
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (doc: Document, opts: object) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } }).axe;
    const r = await axe.run(document, { resultTypes: ['violations'] });
    return r.violations.map((v) => `${v.id}(${v.nodes.length})`);
  });
}
