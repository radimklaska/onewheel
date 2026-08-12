// Visual regression: render every page on the PR's deploy preview and on production,
// then diff the two. Deliberately no stored baseline images — the comparison is always
// against whatever production currently looks like, so there is nothing to keep updated.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  // Screenshots of two sites per page; parallelism mostly waits on the network.
  workers: 4,
  // A single retry absorbs a cold Netlify edge cache or a slow image.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    // Fixed viewport so the two screenshots are directly comparable.
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    // The sites are on different hosts; be generous with load time.
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
  },
});
