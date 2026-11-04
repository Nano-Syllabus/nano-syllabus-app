// Re-render each frozen HTML and diff it against the live-page screenshot.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const HERE = path.dirname(new URL(import.meta.url).pathname);
// playwright-core is borrowed from the content repo (it already has it for `npm run shots`)
const require = createRequire(process.env.PLAYWRIGHT_FROM || path.join(HERE, '../../../nano-syllabus-content/package.json'));
const { chromium } = require('playwright-core');
// any installed Playwright Chromium works; CHROME=/path/to/chrome overrides
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(process.env.HOME, '.cache/ms-playwright');
  for (const d of (fs.existsSync(base) ? fs.readdirSync(base) : []).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    const p = path.join(base, d, 'chrome-linux64/chrome');
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}
const OUT = path.join(HERE, process.env.DIR || 'out');
const tag = process.argv[2] || 'desktop';
const only = process.argv[3] || '';
const vp = tag === 'phone' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const browser = await chromium.launch({ executablePath: findChrome() });
const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: tag === 'phone' && process.env.MOB === '1' });
const page = await ctx.newPage();
const files = fs.readdirSync(OUT).filter((f) => f.startsWith(tag + '-') && f.endsWith('.html') && f.includes(only)).sort();
for (const f of files) {
  const html = path.join(OUT, f);
  await page.goto('file://' + html);
  await page.waitForTimeout(400);
  const shot = html.replace('.html', '.frozen.png');
  await page.screenshot({ path: shot, fullPage: true });
  const a = fs.readFileSync(html.replace('.html', '.png')).toString('base64');
  const b = fs.readFileSync(shot).toString('base64');
  const r = await page.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
    const c = (img) => { const cv = new OffscreenCanvas(w, h); const x = cv.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = c(A), db = c(B);
    let bad = 0;
    const rows = new Array(Math.ceil(h / 100)).fill(0);
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 60) { bad++; rows[Math.floor(i / 4 / w / 100)]++; }
    }
    const worst = rows.map((n, k) => [k * 100, n]).sort((x, y) => y[1] - x[1]).slice(0, 3).filter((x) => x[1] > 0).map((x) => `y${x[0] / 2}:${x[1]}`);
    return { sizeA: `${A.width}x${A.height}`, sizeB: `${B.width}x${B.height}`, pct: (100 * bad / (w * h)).toFixed(3), worst };
  }, [a, b]);
  console.log(f.padEnd(42), r.pct + '%', r.sizeA, r.sizeA === r.sizeB ? '' : '≠ ' + r.sizeB, r.worst.join(' '));
}
await browser.close();
