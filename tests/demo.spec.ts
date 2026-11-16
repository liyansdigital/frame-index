import { expect, test, type Browser, type Page } from '@playwright/test';
import { axeViolations, clickEl, mediaState, openPlayer, seekMedia } from './helpers';

// Demo page (index.html) — Phase 9 checks 07–10, 21, 22, 25–27.
// The Contact-Sheet Timeline and Scene Explorer live in the demo app
// (apps/preview/src/demo/); these tests drive them against the real stream.

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  await openPlayer(page, '/index.html');
});

test.afterAll(async () => {
  await page?.context().close();
});

test('07 · contact-sheet frame selection works (28 frames, click seeks)', async () => {
  await expect(page.locator('.fi-cell')).toHaveCount(28);
  await page.locator('.fi-cell').nth(12).click(); // frame at t=50s
  await page.waitForTimeout(1500);
  const s = await mediaState(page);
  expect(Math.abs((s?.currentTime ?? 0) - 50)).toBeLessThan(4);
  expect(s?.paused).toBe(false);
});

test('09 · scene selection works (Scene Explorer click seeks)', async () => {
  await page.locator('.fi-scene').nth(2).click(); // Scene 3 starts at 52s
  await page.waitForTimeout(1200);
  const s = await mediaState(page);
  expect(Math.abs((s?.currentTime ?? 0) - 52)).toBeLessThan(4);
});

test('08 · active frame follows playback', async () => {
  await seekMedia(page, 60);
  await page.waitForTimeout(1200);
  const active = await page.evaluate(() => ({
    cell: document.querySelector('.fi-cell.is-active .fi-cell-no')?.textContent,
    ariaCurrent: document.querySelector('.fi-cell.is-active')?.getAttribute('aria-current'),
  }));
  expect(active.cell).toBe('F-015'); // frame at t=58s is the last one ≤ 60s
  expect(active.ariaCurrent).toBe('true');
});

test('10 · active scene follows playback (status line agrees)', async () => {
  const state = await page.evaluate(() => ({
    scene: document.querySelector('.fi-scene.is-active .fi-scene-no')?.textContent,
    status: document.querySelector('.fi-sheet-status')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }));
  expect(state.scene ?? '').toContain('03');
  expect(state.status).toContain('Scene 3');
  expect(state.status).toContain('F-015');
});

test('25 · no broken thumbnail assets (frames, scenes, manifest)', async () => {
  // Every referenced asset must exist on the server (HTTP 200)…
  const assets = await page.evaluate(async () => {
    const srcs = [...document.querySelectorAll('.fi-cell img, .fi-scene img')].map((i) => i.getAttribute('src'));
    const out: { src: string | null; status: number }[] = [];
    for (const src of srcs) {
      const r = await fetch(src as string, { method: 'HEAD' }).catch(() => null);
      out.push({ src, status: r?.status ?? 0 });
    }
    return out;
  });
  expect(assets.length).toBe(32); // 28 frames + 4 scene thumbnails
  for (const a of assets) expect(a.status, `${a.src} served`).toBe(200);
  // …and once the strip is scrolled (lazy images fetched), every image must
  // actually decode (naturalWidth > 0).
  await page.evaluate(() => {
    const strip = document.querySelector('.fi-strip');
    if (strip) strip.scrollLeft = strip.scrollWidth;
  });
  await page.waitForTimeout(2000);
  const decoded = await page.evaluate(() =>
    [...document.querySelectorAll('.fi-cell img, .fi-scene img')].map((i) => {
      const img = i as HTMLImageElement;
      return { src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 };
    })
  );
  for (const img of decoded) expect(img.ok, `${img.src} decoded`).toBe(true);
  const manifest = await page.evaluate(async () => {
    const r = await fetch('./frames/frames.json');
    const data = (await r.json()) as unknown[];
    return { status: r.status, count: data.length };
  });
  expect(manifest.status).toBe(200);
  expect(manifest.count).toBe(28);
});

test('21 · mobile frame-strip navigation works (390px, tap seeks, strip scrolls)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await context.newPage();
  try {
    await openPlayer(p, '/index.html');
    const strip = await p.evaluate(() => {
      const el = document.querySelector('.fi-strip');
      return el ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth } : null;
    });
    expect(strip).not.toBeNull();
    expect(strip!.scrollWidth).toBeGreaterThan(strip!.clientWidth);
    await p.locator('.fi-cell').nth(5).tap(); // frame at t=22s
    await p.waitForTimeout(1300);
    const s = await mediaState(p);
    expect(Math.abs((s?.currentTime ?? 0) - 22)).toBeLessThan(5);
  } finally {
    await context.close();
  }
});

test('22 · no horizontal overflow (demo 1440/390, player 360)', async ({ browser }) => {
  const overflow = (p: Page) =>
    p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow(page)).toBeLessThanOrEqual(1);
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mp = await mobile.newPage();
  await openPlayer(mp, '/index.html');
  expect(await overflow(mp)).toBeLessThanOrEqual(1);
  await mobile.close();
  const small = await browser.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true });
  const sp = await small.newPage();
  await openPlayer(sp, '/preview.html');
  expect(await overflow(sp)).toBeLessThanOrEqual(1);
  await small.close();
});

test('26 · no critical console errors (fresh player + demo pages)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await context.newPage();
  const errors: string[] = [];
  p.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  try {
    await openPlayer(p, '/preview.html');
    await clickEl(p, '.fi-centre-play');
    await p.waitForTimeout(2000);
    await openPlayer(p, '/index.html');
    await p.waitForTimeout(1000);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('27 · no axe-core violations (player and demo pages)', async () => {
  expect(await axeViolations(page)).toEqual([]);
  const context = await page.context().browser()!.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await context.newPage();
  try {
    await openPlayer(p, '/preview.html');
    expect(await axeViolations(p)).toEqual([]);
  } finally {
    await context.close();
  }
});
