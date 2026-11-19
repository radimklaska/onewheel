/**
 * Turns the visual regression results into things a person can look at on GitHub.
 * Copied from https://github.com/radimklaska/cfsite (keep in sync).
 * Run by the `visual` job in .github/workflows/deploy.yml after the comparison,
 * whether it passed or not:
 *
 *   SHA=<commit> PREVIEW_URL=... PROD_URL=... node tests/visual-report.mjs
 *
 * Reads visual-results/<page>.json and visual-diffs/<page>-{preview,production,diff}.png
 * (both written by tests/visual.spec.mjs) and writes into visual-report/:
 *   summary.md                one table for the job summary
 *   result.json               { total, failed: [...], file } for the preview comment row
 *   visual-diffs-<sha>.html   only when a page differs: one self-contained page (images
 *                             inlined) with preview, production and diff side by side.
 *                             Uploaded unzipped, so GitHub opens it in the browser.
 */
import fs from 'node:fs';
import path from 'node:path';

const RESULTS_DIR = 'visual-results';
const DIFF_DIR = 'visual-diffs';
const OUT_DIR = 'visual-report';
const sha = (process.env.SHA || 'local').slice(0, 7);
const previewUrl = process.env.PREVIEW_URL || '';
const prodUrl = process.env.PROD_URL || '';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pct = (r) => `${(r * 100).toFixed(3)} %`;
const delta = (r) => {
  const d = r.previewHeight - r.productionHeight;
  return d === 0 ? '0 px' : `${d > 0 ? '+' : ''}${d} px`;
};
const inline = (file) =>
  fs.existsSync(file) ? `data:image/png;base64,${fs.readFileSync(file).toString('base64')}` : '';

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = fs.existsSync(RESULTS_DIR)
  ? fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')))
      .sort((a, b) => a.path.localeCompare(b.path))
  : [];
const failed = results.filter((r) => !r.passed);

// Job summary table.
const rows = results.map((r) =>
  `| \`${r.path}\` | ${r.passed ? '✅' : '❌'} | ${pct(r.ratio)} | ${r.windowMax ?? ''} | ${delta(r)} |`);
fs.writeFileSync(path.join(OUT_DIR, 'summary.md'), [
  '## Visual regression: preview vs production',
  '',
  results.length
    ? `${results.length - failed.length} of ${results.length} pages match production.`
    : 'No results: the comparison did not run to the end. See the job log.',
  '',
  ...(results.length ? ['| Page | Match | Pixels differing | Most in one 16×16 square | Height (preview − production) |', '|---|:-:|--:|--:|--:|', ...rows] : []),
  '',
].join('\n'));

// The HTML page, only when something differs.
let file = '';
if (failed.length) {
  file = `visual-diffs-${sha}.html`;
  const sections = failed.map((r) => `
<section>
  <h2><code>${esc(r.path)}</code>: ${pct(r.ratio)} of pixels differ, up to ${r.windowMax ?? '?'} in one 16×16 square, height ${delta(r)}</h2>
  <div class="row">
    ${[['preview', 'Preview (this PR)'], ['production', 'Production'], ['diff', 'Difference (red)']]
      .map(([k, label]) => {
        const src = inline(path.join(DIFF_DIR, `${r.name}-${k}.png`));
        return `<figure><figcaption>${label}</figcaption>${src ? `<img src="${src}" alt="${esc(label)}: ${esc(r.path)}">` : '<p>missing</p>'}</figure>`;
      }).join('\n    ')}
  </div>
</section>`).join('\n');
  fs.writeFileSync(path.join(OUT_DIR, file), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visual diffs ${esc(sha)}</title>
<style>
  body { font: 15px/1.5 system-ui, sans-serif; margin: 1rem; color: #1b1b1b; background: #fff; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1.05rem; margin-top: 2rem; }
  .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; align-items: start; }
  figure { margin: 0; overflow-x: auto; } figcaption { font-weight: 600; margin-bottom: 0.25rem; }
  img { width: 100%; border: 1px solid #ccc; cursor: zoom-in; }
  img.full { width: auto; max-width: none; cursor: zoom-out; }
  @media (max-width: 800px) { .row { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<h1>Visual diffs for commit ${esc(sha)}: ${failed.length} of ${results.length} pages differ</h1>
<p>Preview: <a href="${esc(previewUrl)}">${esc(previewUrl)}</a> · Production: <a href="${esc(prodUrl)}">${esc(prodUrl)}</a>.
A page that changed on purpose is fine: merge anyway. Click an image to see it at full size.</p>
${sections}
<script>document.addEventListener('click', (e) => { if (e.target.tagName === 'IMG') e.target.classList.toggle('full'); });</script>
</body>
</html>
`);
}

fs.writeFileSync(path.join(OUT_DIR, 'result.json'), JSON.stringify({
  total: results.length,
  failed: failed.map((r) => ({ path: r.path, percent: pct(r.ratio), height: delta(r) })),
  file,
}));
console.log(`${results.length - failed.length}/${results.length} pages match${file ? `; wrote ${OUT_DIR}/${file}` : ''}`);
