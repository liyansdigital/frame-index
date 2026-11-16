import { defineConfig } from '@playwright/test';

// FRAME INDEX browser suite — runs against the production build in dist/.
// Entry point: `npm test` (which builds first via the pretest script).
//
// Two environment overrides exist for restricted sandboxes and are unset in
// normal use and in CI:
//   CHROME_PATH  — use a specific Chromium executable instead of the
//                  Playwright-managed one (`npx playwright install chromium`).
//   https_proxy  — when an authenticated egress proxy is present in the
//                  environment, tests/local-proxy.mjs chains Chromium through
//                  it (the proxy credentials stay in the environment; nothing
//                  is stored in this repository).

const hasEnvProxy = Boolean(process.env.https_proxy || process.env.HTTPS_PROXY);
const sandbox = Boolean(process.env.CHROME_PATH) || hasEnvProxy;

const webServer = [
  {
    command: 'node tests/static-server.mjs',
    url: 'http://127.0.0.1:4317/preview.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
];

if (hasEnvProxy) {
  webServer.push({
    command: 'node tests/local-proxy.mjs',
    url: 'http://127.0.0.1:8899',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  });
}

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  webServer,
  use: {
    baseURL: 'http://127.0.0.1:4317',
    ...(hasEnvProxy ? { proxy: { server: 'http://127.0.0.1:8899', bypass: '127.0.0.1, localhost' } } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: {
        launchOptions: {
          ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
          args: sandbox
            ? ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--no-sandbox', '--ignore-certificate-errors']
            : ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
        },
      },
    },
  ],
});
