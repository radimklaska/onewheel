/**
 * Visual regression: PR deploy preview vs production.
 *
 * This runs only when the *toolchain* changes (Gemfile, _config.yml, _includes, ...)
 * and never when page content changes — see .github/workflows/visual-regression.yml.
 * That constraint is what makes the test meaningful: if the content is identical on
 * both sides, any pixel difference was caused by the dependency or layout change under
 * review, which is exactly what we want a human to look at.
 *
 * There are no committed baseline images. Production is the baseline, so nothing has to
 * be regenerated when the site legitimately changes.
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const PREVIEW = (process.env.PREVIEW_URL || '').replace(/\/$/, '');
const PROD = (process.env.PROD_URL || 'https://klaska.net/onewheel').replace(/\/$/, '');
// Fraction of differing pixels tolerated per page. Antialiasing and image
// recompression produce a small nonzero floor even between identical renders.
const MAX_DIFF_RATIO = Number(process.env.MAX_DIFF_RATIO || 0.002);
const DIFF_DIR = 'visual-diffs';

// Written by the workflow from the preview's sitemap, so the page list maintains itself.
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));

if (!PREVIEW) throw new Error('PREVIEW_URL is not set');

/**
 * Elements that legitimately differ between the two sites and would otherwise
 * dominate the diff:
 *   - contributors.svg is regenerated weekly by a scheduled workflow, so preview and
 *     production routinely disagree on it.
 */
const MASK_SELECTORS = ['img[src*="contributors"]'];

async function shoot(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Fonts settle after networkidle in some cases; wait explicitly.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const masks = MASK_SELECTORS.flatMap((s) => {
    const loc = page.locator(s);
    return [loc];
  });
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

      if (ratio > MAX_DIFF_RATIO || heightDelta > 20) {
        fs.mkdirSync(DIFF_DIR, { recursive: true });
        const slug = p === '/' ? 'index' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-');
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-diff.png`), PNG.sync.write(diff));
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-preview.png`), PNG.sync.write(previewPng));
        fs.writeFileSync(path.join(DIFF_DIR, `${slug}-production.png`), PNG.sync.write(prodPng));
      }

      expect
        .soft(heightDelta, `page height differs by ${heightDelta}px (preview ${previewPng.height} vs production ${prodPng.height})`)
        .toBeLessThanOrEqual(20);
      expect(
        ratio,
        `${differing} of ${width * height} pixels differ (${(ratio * 100).toFixed(3)}%) — see the visual-diffs artifact`
      ).toBeLessThanOrEqual(MAX_DIFF_RATIO);
    });
  }
});
