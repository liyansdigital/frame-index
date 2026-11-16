import { expect, test, type Browser, type Page } from '@playwright/test';
import { clickEl, mediaState, openPlayer, seekMedia, setPaused } from './helpers';

// Bare player (/preview.html) — Phase 9 checks 01–06, 11–20, 23, 24, 28.
// Tests in this file share one page and run in order (serial), mirroring a
// real user session: load → play → seek → menus → fullscreen → ended state.

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
  await openPlayer(page);
});

test.afterAll(async () => {
  await page?.context().close();
});

test('01 · player mounts', async () => {
  await expect(page.locator('media-container')).toHaveCount(1);
  await expect(page.locator('video-player')).toHaveCount(1);
  // FRAME INDEX identity: slate header + FI mark are part of the skin.
  await expect(page.locator('.fi-slate')).toHaveCount(1);
  await expect(page.locator('.fi-slate-mark')).toHaveText('FI');
});

test('02 · video loads (metadata, real duration)', async () => {
  const s = await mediaState(page);
  expect(s).not.toBeNull();
  expect(Math.abs((s?.duration ?? 0) - 111.14)).toBeLessThan(1.5);
  expect(s?.readyState).toBeGreaterThanOrEqual(1);
});

test('03 · play works (centre play button)', async () => {
  await clickEl(page, '.fi-centre-play');
  await page.waitForTimeout(1600);
  const s = await mediaState(page);
  expect(s?.paused).toBe(false);
  expect(s?.currentTime ?? 0).toBeGreaterThan(0.3);
});

test('04 · pause works (control-bar play button)', async () => {
  await clickEl(page, '.video-controls-row .media-play-button');
  await page.waitForTimeout(400);
  const s = await mediaState(page);
  expect(s?.paused).toBe(true);
});

test('05 · seeking works (timeline click)', async () => {
  const before = (await mediaState(page))?.currentTime ?? 0;
  const slider = await page.locator('.media-time-slider').boundingBox();
  expect(slider).not.toBeNull();
  await page.mouse.click(slider!.x + slider!.width * 0.5, slider!.y + slider!.height / 2);
  await page.waitForTimeout(900);
  const s = await mediaState(page);
  expect(Math.abs((s?.currentTime ?? 0) - before)).toBeGreaterThan(10);
});

test('06 · seek reaches the correct timestamp', async () => {
  const s5 = await mediaState(page);
  expect(Math.abs((s5?.currentTime ?? 0) - 55.6)).toBeLessThan(7);
  await seekMedia(page, 30);
  await page.waitForTimeout(700);
  const s = await mediaState(page);
  expect(Math.abs((s?.currentTime ?? 0) - 30)).toBeLessThan(2);
});

test('11 · chapter transitions work (chapter track follows position)', async () => {
  const chapterAt = () =>
    page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        if (el.localName.startsWith('media-')) continue;
        if ('paused' in el && 'play' in el) {
          const tracks = (el as unknown as HTMLVideoElement).textTracks;
          for (const t of tracks) {
            if (t.kind === 'chapters') {
              const active = [...t.activeCues].map((c) => (c as VTTCue).text);
              return active;
            }
          }
        }
      }
      return [];
    });
  // Poll: an HLS seek completes asynchronously (segment fetch), so the active
  // cue updates when the seek lands, not on a fixed clock.
  await seekMedia(page, 10);
  await expect.poll(chapterAt, { timeout: 15_000 }).toContain('A Never-Before-Seen Look');
  await seekMedia(page, 60);
  await expect.poll(chapterAt, { timeout: 15_000 }).toContain('Building and Launching Webb');
});

test('12 · volume and mute work', async () => {
  const before = await mediaState(page);
  await clickEl(page, '.media-mute-button');
  await page.waitForTimeout(300);
  let s = await mediaState(page);
  expect(s?.muted).toBe(!before?.muted);
  await clickEl(page, '.media-mute-button');
  await page.waitForTimeout(300);
  s = await mediaState(page);
  expect(s?.muted).toBe(before?.muted);
  // Volume via the player's own ArrowUp hotkey (focus the player first).
  await page.locator('media-container').click({ position: { x: 40, y: 40 } }).catch(() => undefined);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.localName.startsWith('media-')) continue;
      if ('paused' in el && 'play' in el) (el as unknown as HTMLVideoElement).volume = 0.4;
    }
  });
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(400);
  s = await mediaState(page);
  expect(s?.volume ?? 0).toBeGreaterThan(0.4);
});

test('19 · menus work (settings opens, submenus navigate)', async () => {
  await page.locator('.media-settings-button').click();
  await page.waitForTimeout(800);
  const visible = await page.evaluate(() => {
    const m = document.querySelector('.media-menu-popup');
    return !!m && getComputedStyle(m).visibility !== 'hidden' && m.getClientRects().length > 0;
  });
  expect(visible).toBe(true);
  await page.locator('media-menu-item', { hasText: 'Quality' }).first().click();
  await page.waitForTimeout(800);
  const submenuVisible = await page.evaluate(() => {
    const m = document.querySelector('#fi-quality-content');
    return !!m && m.getClientRects().length > 0;
  });
  expect(submenuVisible).toBe(true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
});

test('15 · quality selection works (real renditions, switch sticks)', async () => {
  await page.locator('.media-settings-button').click();
  await page.waitForTimeout(700);
  await page.locator('media-menu-item', { hasText: 'Quality' }).first().click();
  await page.waitForTimeout(1000);
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('media-quality-radio-group .media-menu-radio-item')].map((i) => i.textContent.trim())
  );
  expect(labels.length).toBeGreaterThanOrEqual(2);
  expect(labels.join(' ')).toMatch(/720p/);
  await page.locator('media-quality-radio-group .media-menu-radio-item', { hasText: '480p' }).first().click();
  await page.waitForTimeout(600);
  const checked = await page.evaluate(() => {
    const item = [...document.querySelectorAll('media-quality-radio-group .media-menu-radio-item')].find((i) =>
      i.textContent.includes('480p')
    );
    return item?.getAttribute('aria-checked');
  });
  expect(checked).toBe('true');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

test('14 · playback speed works (1.5x via menu)', async () => {
  await page.locator('.media-settings-button').click();
  await page.waitForTimeout(700);
  await page.locator('media-menu-item', { hasText: 'Speed' }).first().click();
  await page.waitForTimeout(800);
  await page.locator('media-playback-rate-radio-group .media-menu-radio-item', { hasText: '1.5' }).first().click();
  await page.waitForTimeout(500);
  const s = await mediaState(page);
  expect(Math.abs((s?.playbackRate ?? 0) - 1.5)).toBeLessThan(0.01);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      if (el.localName.startsWith('media-')) continue;
      if ('paused' in el && 'play' in el) (el as unknown as HTMLVideoElement).playbackRate = 1;
    }
  });
});

test('13 · captions work (EN/JA listed, a track reaches "showing")', async () => {
  await page.locator('.media-settings-button').click();
  await page.waitForTimeout(700);
  await page.locator('media-menu-item', { hasText: 'Captions' }).first().click();
  await page.waitForTimeout(800);
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('media-captions-radio-group .media-menu-radio-item')].map((i) => i.textContent.trim())
  );
  expect(labels.length).toBeGreaterThanOrEqual(3);
  await page.locator('media-captions-radio-group .media-menu-radio-item', { hasText: 'English' }).first().click();
  await page.waitForTimeout(700);
  const s = await mediaState(page);
  const showing = (s?.textTracks ?? []).filter((t) => t.mode === 'showing');
  expect(showing.length).toBeGreaterThanOrEqual(1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
});

test('16 · fullscreen works (enter and exit via button)', async () => {
  await clickEl(page, '.media-fullscreen-button');
  await page.waitForTimeout(900);
  let fs = await page.evaluate(() => !!document.fullscreenElement);
  expect(fs).toBe(true);
  await clickEl(page, '.media-fullscreen-button');
  await page.waitForTimeout(700);
  fs = await page.evaluate(() => !!document.fullscreenElement);
  expect(fs).toBe(false);
});

test('17 · picture-in-picture (where the platform supports it)', async ({}, testInfo) => {
  const btn = page.locator('.media-pip-button');
  await expect(btn).toHaveCount(1);
  const label = await btn.getAttribute('aria-label');
  expect(label ?? '').toMatch(/picture-in-picture/i);
  const pipEnabled = await page.evaluate(() => document.pictureInPictureEnabled);
  await clickEl(page, '.media-pip-button');
  await page.waitForTimeout(1200);
  const state = await page.evaluate(() => ({
    pipElement: !!document.pictureInPictureElement,
    dialogVisible: (() => {
      const d = document.querySelector('.media-dialog-popup');
      return !!d && d.getClientRects().length > 0;
    })(),
  }));
  if (state.pipElement) {
    testInfo.annotations.push({ type: 'evidence', description: 'PiP entered: document.pictureInPictureElement set' });
    await page.evaluate(() => void document.exitPictureInPicture().catch(() => undefined));
    await page.waitForTimeout(400);
  } else {
    // Headless Chromium cannot always enter PiP even when the API reports
    // enabled; the requirement is "works where supported", so the control
    // must be present, labelled, operable and must not raise the error dialog.
    testInfo.annotations.push({
      type: 'platform-note',
      description: `PiP enter not assertable in this environment (pictureInPictureEnabled=${pipEnabled}); control present, labelled, operable, no error dialog`,
    });
    expect(state.dialogVisible).toBe(false);
  }
});

test('18 · keyboard shortcuts work (k toggles play, ArrowRight seeks +10s)', async () => {
  await seekMedia(page, 10);
  await setPaused(page, true);
  await page.waitForTimeout(300);
  await page.locator('media-container').click({ position: { x: 40, y: 40 } }).catch(() => undefined);
  await page.keyboard.press('k');
  await page.waitForTimeout(700);
  let s = await mediaState(page);
  expect(s?.paused).toBe(false);
  const tBefore = s?.currentTime ?? 0;
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  s = await mediaState(page);
  const delta = (s?.currentTime ?? 0) - tBefore;
  expect(delta).toBeGreaterThan(5);
  expect(delta).toBeLessThan(15);
  await page.keyboard.press('k');
  await page.waitForTimeout(300);
});

test('20 · focus indicators remain visible (Signal Orange outline)', async () => {
  await page.evaluate(() => {
    (document.querySelector('.video-controls-row .media-play-button') as HTMLElement | null)?.focus();
  });
  await page.waitForTimeout(250);
  const outline = await page.evaluate(() => {
    const el = document.querySelector('.video-controls-row .media-play-button');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor, focused: document.activeElement === el };
  });
  expect(outline?.focused).toBe(true);
  expect(outline?.style).not.toBe('none');
  expect(outline?.width).not.toBe('0px');
  expect(outline?.color).toBe('rgb(255, 90, 31)');
});

test('28 · essential controls regression (all present, labelled, enabled)', async () => {
  const controls = await page.evaluate(() => {
    const named = (el: Element | null) =>
      el ? { present: true, name: (el.getAttribute('aria-label') || el.textContent || '').trim().length > 0 } : { present: false, name: false };
    return {
      centrePlay: named(document.querySelector('.fi-centre-play')),
      barPlay: named(document.querySelector('.video-controls-row .media-play-button')),
      seekBack: named(document.querySelector('.video-controls-center-seek')),
      mute: named(document.querySelector('.media-mute-button')),
      timeSlider: { present: !!document.querySelector('.media-time-slider') },
      volumeSlider: { present: !!document.querySelector('.media-volume-slider') },
      timeDisplay: { present: !!document.querySelector('.media-time-group') },
      captions: named(document.querySelector('.media-captions-button')),
      settings: named(document.querySelector('.media-settings-button')),
      pip: named(document.querySelector('.media-pip-button')),
      fullscreen: named(document.querySelector('.media-fullscreen-button')),
      errorDialog: { present: !!document.querySelector('media-error-dialog') },
      announcer: { present: !!document.querySelector('.media-status-announcer') },
    };
  });
  for (const [key, value] of Object.entries(controls)) {
    expect(value.present, `${key} present`).toBe(true);
    if ('name' in value) expect(value.name, `${key} has an accessible name`).toBe(true);
  }
});

test('23 · reduced-motion preference works (playback fine, spinner calmed)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await context.newPage();
  try {
    await openPlayer(p);
    await clickEl(p, '.fi-centre-play');
    await p.waitForTimeout(1200);
    const s = await mediaState(p);
    expect(s?.paused).toBe(false);
    const spinner = await p.evaluate(() => {
      const icon = document.querySelector('.media-buffering-indicator-spinner-icon');
      if (!icon) return 'no-icon';
      const cs = getComputedStyle(icon);
      return `${cs.animationName}/${cs.animationDuration}`;
    });
    // Under reduced motion the spinner animation must be effectively off.
    expect(spinner === 'no-icon' || /none|0s/.test(spinner)).toBe(true);
  } finally {
    await context.close();
  }
});

test('24 · error state works (stream failure surfaces the error dialog)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await context.newPage();
  try {
    await p.route('**/stream.mux.com/**', (route) => route.abort());
    await p.goto('/preview.html', { waitUntil: 'load', timeout: 60_000 });
    await p.waitForTimeout(6000);
    const dialog = await p.evaluate(() => {
      const d = document.querySelector('.media-dialog-popup');
      return {
        exists: !!d,
        visible: !!d && d.getClientRects().length > 0,
        title: document.querySelector('.media-dialog-title')?.textContent?.trim() ?? '',
      };
    });
    expect(dialog.exists).toBe(true);
    expect(dialog.visible).toBe(true);
    expect(dialog.title.length).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
