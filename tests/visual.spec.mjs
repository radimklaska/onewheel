/**
 * Visual regression: PR preview (Cloudflare Workers Preview) vs production.
 *
 * This runs only when the *toolchain* changes (Gemfile, _config.yml, _includes,
 * _data, ...) and never when page content changes - see
 * the `visual` job in .github/workflows/deploy.yml. That constraint is what makes the test
 * meaningful: if the content is identical on both sides, any pixel difference was
 * caused by the dependency or layout change under review, which is exactly what we
 * want a human to look at.
 *
 * There are no committed baseline images. Production is the baseline, so nothing has to
 * be regenerated when the site legitimately changes.
 *
 * Every page also writes visual-results/<slug>.json; tests/visual-report.mjs turns those
 * into the job summary, the preview comment row and, when something differs, one HTML
 * page with the images. Same setup as https://cfsite.klaska.net/checks/#visual.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PREVIEW = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
const PROD = (process.env.PROD_URL || 'https://onewheel.klaska.net').replace(/\/$/, '');
// Two limits per page. The share of differing pixels catches broad changes (layout,
// colours); the most differing pixels within any 16x16 square catches compact ones that
// are a tiny share of a long page, like one changed character (identical renders score 0).
const MAX_DIFF_RATIO = Number(process.env.MAX_DIFF_RATIO || 0.002);
const WINDOW_SIZE = 16;
const MAX_WINDOW_PIXELS = Number(process.env.MAX_WINDOW_PIXELS || 10);
const DIFF_DIR = 'visual-diffs';
const RESULTS_DIR = 'visual-results';

// Written by the workflow from a local build, so the page list maintains itself.
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));

if (!PREVIEW) throw new Error('PREVIEW_URL is not set');

/**
 * Elements that legitimately differ between the two sites and would otherwise
 * dominate the diff. Add a selector here rather than raising MAX_DIFF_RATIO.
 *   - contributors.svg is regenerated weekly by a scheduled workflow, so preview and
 *     production routinely disagree on it.
 */
const MASK_SELECTORS = ['img[src*="contributors"]'];

async function shoot(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Fonts settle after networkidle in some cases; wait explicitly.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const masks = MASK_SELECTORS.map((s) => page.locator(s));
  return page.screenshot({
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    mask: masks,
  });
}

test.describe('preview matches production', () => {
  for (const p of pages) {
    test(`page ${p}`, async ({ page }) => {
      const previewPng = PNG.sync.read(await shoot(page, `${PREVIEW}${p}`));
      const prodPng = PNG.sync.read(await shoot(page, `${PROD}${p}`));

      // Full-page screenshots differ in height whenever content reflows. Compare the
      // overlapping region and report the height delta separately, so a layout change
      // that makes the page taller is visible rather than a hard crash.
      const width = Math.min(previewPng.width, prodPng.width);
      const height = Math.min(previewPng.height, prodPng.height);
      const heightDelta = Math.abs(previewPng.height - prodPng.height);

      const crop = (src) => {
        const out = new PNG({ width, height });
        PNG.bitblt(src, out, 0, 0, width, height, 0, 0);
        return out;
      };
      const a = crop(previewPng);
      const b = crop(prodPng);
      const diff = new PNG({ width, height });

      const differing = pixelmatch(a.data, b.data, diff.data, width, height, {
        threshold: 0.2,
        includeAA: false,
      });
      const ratio = differing / (width * height);
      const windowMax = pixelmatch(a.data, b.data, null, width, height,
        { threshold: 0.2, includeAA: false, windowSize: WINDOW_SIZE });
      const passed = ratio <= MAX_DIFF_RATIO && windowMax <= MAX_WINDOW_PIXELS && heightDelta <= 20;

      const slug = p === '/' ? 'index' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-');
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
      fs.writeFileSync(path.join(RESULTS_DIR, `${slug}.json`), JSON.stringify({
        name: slug, path: p, passed, ratio, differing, pixels: width * height, windowMax,
        previewHeight: previewPng.height, productionHeight: prodPng.height,
      }));

      if (!passed) {
        fs.mkdirSync(DIFF_DIR, { recursive: true });
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-diff.png`), PNG.sync.write(diff));
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-preview.png`), PNG.sync.write(previewPng));
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-production.png`), PNG.sync.write(prodPng));
      }

      expect
        .soft(heightDelta, `page height differs by ${heightDelta}px (preview ${previewPng.height} vs production ${prodPng.height})`)
        .toBeLessThanOrEqual(20);
      expect.soft(windowMax, `${windowMax} pixels differ within one ${WINDOW_SIZE}x${WINDOW_SIZE} square - see the visual diffs page`)
        .toBeLessThanOrEqual(MAX_WINDOW_PIXELS);
      expect(
        ratio,
        `${differing} of ${width * height} pixels differ (${(ratio * 100).toFixed(3)}%) - see the visual diffs page`
      ).toBeLessThanOrEqual(MAX_DIFF_RATIO);
    });
  }
});
