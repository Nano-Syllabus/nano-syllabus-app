// Walk the Nano Syllabus flow and freeze every page into self-contained HTML.
// usage: node run.mjs [desktop|phone|both] [only-substring]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { phase1, phase2 } from './serialize.mjs';
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

const BASE = process.env.BASE || 'http://localhost:8090';
// it signs up test accounts, so it only runs against a local server
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) { console.error('BASE must be a local server'); process.exit(1); }
const OUT = path.join(HERE, 'out');
fs.mkdirSync(OUT, { recursive: true });
const which = process.argv[2] || 'both';
const only = process.argv[3] || '';
const STUDENT = { name: 'Pratiksha Rai', email: "pratiksha.rai@example.test", password: 'figma-flow-2026' };
const ADMIN = { name: 'Yogesh Aryal', email: 'admin.figma@example.test', password: 'figma-flow-2026' };
const LANDING = fs.readFileSync(path.join(HERE, '../../dist/landing.html'), 'utf8');
const LANDING_LIVE = fs.readFileSync(path.join(HERE, '../../dist/landing-live.html'), 'utf8');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dataCache = new Map();

async function settle(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch {}
  // scroll through to trigger lazy content / reveal observers, then back up
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
  });
  await sleep(900);
  await page.evaluate(() => { for (const a of document.getAnimations()) { try { const t = a.effect?.getTiming(); if (t.iterations !== Infinity && Number(t.duration) <= 1500) a.finish(); else a.pause(); } catch {} } });
  for (const f of page.frames()) { try { await f.evaluate(() => { for (const a of document.getAnimations()) { try { const t = a.effect?.getTiming(); if (t.iterations !== Infinity && Number(t.duration) <= 1500) a.finish(); else a.pause(); } catch {} } }); } catch {} }
  await sleep(200);
}

// unroll inner scroll containers so a full-page capture shows everything
async function unroll(frame) {
  await frame.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter((el) => {
      const cs = getComputedStyle(el);
      return /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 200 && el.tagName !== 'TEXTAREA';
    });
    for (const el of els) {
      el.style.setProperty('overflow-y', 'visible', 'important');
      el.style.setProperty('height', 'auto', 'important');
      el.style.setProperty('max-height', 'none', 'important');
      let p = el.parentElement;
      while (p && p !== document.documentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowY !== 'visible' || /px$/.test(p.style.height) || cs.height === innerHeight + 'px') {
          p.style.setProperty('height', 'auto', 'important');
          p.style.setProperty('min-height', innerHeight + 'px', 'important');
          p.style.setProperty('overflow', 'visible', 'important');
        }
        p = p.parentElement;
      }
    }
  });
}

async function fetchData(ctx, url) {
  if (url.startsWith('data:')) return url;
  if (dataCache.has(url)) return dataCache.get(url);
  try {
    const r = await ctx.request.get(url, { timeout: 30000 });
    if (!r.ok()) { dataCache.set(url, null); return null; }
    let ct = (r.headers()['content-type'] || '').split(';')[0];
    if (!ct || ct === 'application/octet-stream') {
      const ext = url.split('?')[0].split('.').pop();
      ct = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }[ext] || ct;
    }
    const d = `data:${ct};base64,${(await r.body()).toString('base64')}`;
    dataCache.set(url, d);
    return d;
  } catch { dataCache.set(url, null); return null; }
}

async function freezeFrame(ctx, frame, title, asFragment) {
  // children first
  const frames = {};
  let i = 0;
  for (const child of frame.childFrames()) {
    const el = await child.frameElement();
    const id = 'f' + (i++);
    await el.evaluate((e, id) => e.setAttribute('data-cap-frame', id), id);
    try { frames[id] = await freezeFrame(ctx, child, title, true); } catch (e) { console.log('  frame fail', e.message); }
  }
  // screenshots for canvas / video
  const shots = {};
  const shotEls = await frame.$$('canvas, video');
  let k = 0;
  for (const el of shotEls) {
    const box = await el.boundingBox();
    if (!box || box.width < 2 || box.height < 2) continue;
    const id = 's' + (k++);
    await el.evaluate((e, id) => e.setAttribute('data-cap-shot', id), id);
    // shoot the canvas/video alone: everything else hidden, transparent background
    const hide = await frame.addStyleTag({ content: `*{visibility:hidden!important;background:transparent!important;box-shadow:none!important}[data-cap-shot="${id}"]{visibility:visible!important}` });
    try { shots[id] = 'data:image/png;base64,' + (await el.screenshot({ timeout: 10000, omitBackground: true, animations: 'disabled' })).toString('base64'); } catch {}
    await hide.evaluate((n) => n.remove());
  }
  await frame.evaluate(() => scrollTo(0, 0));
  await frame.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 50));
    for (const a of document.getAnimations()) { try { const t = a.effect?.getTiming(); if (t.iterations !== Infinity && Number(t.duration) <= 1500) a.finish(); } catch {} }
  });
  const { urls, xsheets, families } = await frame.evaluate(phase1, { shots });
  const map = {};
  await Promise.all(urls.map(async (u) => { const d = await fetchData(ctx, u); if (d) map[u] = d; }));
  // cross-origin stylesheets (Google Fonts): pull their latin @font-face blocks
  const extraFaces = [];
  for (const href of xsheets) {
    try {
      const css = await (await ctx.request.get(href, { headers: { 'user-agent': UA } })).text();
      for (const m of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g)) {
        if (m[1] !== 'latin') continue;
        let block = m[2];
        const fam = (block.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1]?.toLowerCase();
        if (!families.includes(fam)) continue;
        for (const u of block.matchAll(/url\(([^)]+)\)/g)) { const d = await fetchData(ctx, u[1]); if (d) block = block.replace(u[1], d); }
        extraFaces.push(block);
      }
    } catch (e) { console.log('  sheet fail', href, e.message); }
  }
  return frame.evaluate(phase2, { map, frames, title, asFragment, extraFaces });
}

const WALK = () => { const out = []; const go = (e, d) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); if (c.display === 'none' || e.hasAttribute('data-pseudo')) return; out.push(`${'  '.repeat(d)}${e.tagName}.${String(e.className?.baseVal ?? e.className).slice(0, 30)} y=${r.top.toFixed(1)} h=${r.height.toFixed(1)} w=${r.width.toFixed(1)} pos=${c.position} disp=${c.display}`); if (d < 12) for (const k of e.children) go(k, d + 1); }; go(document.body, 0); return out; };
const manifest = [];
async function cap(ctx, page, name, title, { prep } = {}) {
  if (only && !name.includes(only)) return;
  if (prep) await prep(page);
  await settle(page);
  await unroll(page.mainFrame());
  await sleep(300);
  const tag = ctx.__tag;
  if (process.env.DUMP) fs.writeFileSync(path.join(OUT, `${tag}-${name}.walk.json`), JSON.stringify(await page.evaluate(WALK)));
  const html = await freezeFrame(ctx, page.mainFrame(), title, false);
  const file = path.join(OUT, `${tag}-${name}.html`);
  fs.writeFileSync(file, html);
  await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`), fullPage: true });
  manifest.push({ tag, name, title, file, bytes: html.length });
  console.log(`${tag} ${name}  ${(html.length / 1024).toFixed(0)} kB  "${page.url().replace(BASE, '')}"`);
}

async function go(page, p) { await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); }

async function ensureAccount(ctx, acct) {
  const H = { 'content-type': 'application/json', origin: BASE };
  for (let t = 0; t < 6; t++) {
    let r = await ctx.request.post(BASE + '/api/auth/login', { data: { email: acct.email, password: acct.password }, headers: H });
    if (!r.ok()) r = await ctx.request.post(BASE + '/api/auth/signup', { data: acct, headers: H });
    const me = await ctx.request.get(BASE + '/api/auth/me');
    if (me.ok() && (await me.text()).includes(acct.email)) return;
    console.log('  auth retry', r.status());
    await sleep(10000);
  }
  throw new Error('could not sign in ' + acct.email);
}

async function runViewport(browser, tag, viewport) {
  const mk = async () => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: tag === 'phone', hasTouch: tag === 'phone', colorScheme: 'light', locale: 'en-US', timezoneId: 'Asia/Kathmandu' });
    ctx.__tag = tag;
    return ctx;
  };
  // ---------- anonymous visitor ----------
  {
    const ctx = await mk();
    const page = await ctx.newPage();
    await page.route(BASE + '/__waitlist', (r) => r.fulfill({ body: LANDING, contentType: 'text/html' }));
    await go(page, '/__waitlist');
    await cap(ctx, page, '00-landing-waitlist', 'Landing · nanosyllabus.com (waitlist)');
    await page.route(BASE + '/__live', (r) => r.fulfill({ body: LANDING_LIVE, contentType: 'text/html' }));
    await go(page, '/__live');
    await cap(ctx, page, '01-landing-live', 'Landing · live.nanosyllabus.com');
    await go(page, '/courses');
    await cap(ctx, page, '02-courses', 'Course browse');
    await go(page, '/courses/electrical-machines');
    await cap(ctx, page, '03-course-paid', 'Course detail · paid (signed out)');
    await go(page, '/courses/dc-motor-taster');
    await cap(ctx, page, '04-course-free', 'Course detail · free (signed out)');
    await go(page, '/login');
    await cap(ctx, page, '05-sign-in', 'Sign in');
    await go(page, '/signup');
    await cap(ctx, page, '06-sign-up', 'Sign up');
    await go(page, '/teach');
    await cap(ctx, page, '30-teach-guide', 'Teach guide (public)');
    await ctx.close();
  }
  // ---------- student ----------
  {
    const ctx = await mk();
    const page = await ctx.newPage();
    await ensureAccount(ctx, STUDENT);
    await go(page, '/onboarding');
    await cap(ctx, page, '07-onboarding', 'Onboarding');
    // finish onboarding through the API so the app stops redirecting to it
    await ctx.request.put(BASE + '/api/me/profile', { data: { name: STUDENT.name, languagePref: 'RN' }, headers: { 'content-type': 'application/json', origin: BASE } }).catch(() => {});
    await go(page, '/app');
    await cap(ctx, page, '08-app-home-new', 'App home · new learner');
    await go(page, '/courses');
    await cap(ctx, page, '09-courses-signed-in', 'Course browse (signed in)');
    await go(page, '/courses/electrical-machines');
    await cap(ctx, page, '10-course-paid-signed-in', 'Course detail · paid (signed in)');
    await go(page, '/app/checkout/electrical-machines');
    await cap(ctx, page, '11-checkout', 'Checkout · choose eSewa or Khalti');
    await go(page, '/courses/dc-motor-taster');
    await cap(ctx, page, '12-course-free-signed-in', 'Course detail · free (signed in)');
    await ctx.request.post(BASE + '/api/courses/dc-motor-taster/enroll', { headers: { 'content-type': 'application/json', origin: BASE }, data: {} });
    await go(page, '/app/payment/result?status=paid&course=electrical-machines');
    await cap(ctx, page, '13-payment-result', 'Payment result');
    await go(page, '/app/courses');
    await cap(ctx, page, '14-my-courses', 'My courses');
    await go(page, '/app/courses/dc-motor-taster/basics');
    await cap(ctx, page, '15-subject', 'Subject detail · lesson list');
    const subj = await (await ctx.request.get(BASE + '/api/courses/dc-motor-taster/subjects/basics')).json();
    const lessons = subj.lessons || [];
    const byKind = {};
    for (const l of lessons) if (!byKind[l.kind]) byKind[l.kind] = l;
    let n = 16;
    for (const kind of ['video', 'interactive', 'article']) {
      const l = byKind[kind];
      if (!l) continue;
      await go(page, `/app/watch/${l.id}`);
      if (kind === 'video') await page.evaluate(() => { const v = document.querySelector('video'); if (v) { v.currentTime = 6; } }).catch(() => {});
      await sleep(kind === 'interactive' ? 2500 : 1200);
      await cap(ctx, page, `${n++}-lesson-${kind}`, `Lesson · ${kind} · ${l.title}`);
    }
    await go(page, '/app');
    await cap(ctx, page, '19-app-home-learning', 'App home · learning');
    await ctx.close();
  }
  // ---------- admin ----------
  {
    const ctx = await mk();
    const page = await ctx.newPage();
    await ensureAccount(ctx, ADMIN);
    await ctx.request.put(BASE + '/api/me/profile', { data: { name: ADMIN.name, languagePref: 'RN' }, headers: { 'content-type': 'application/json', origin: BASE } }).catch(() => {});
    await go(page, '/courses/electrical-machines');
    await cap(ctx, page, '20-course-owned', 'Course detail · owned (Open course)');
    await go(page, '/em/');
    await sleep(1500);
    await cap(ctx, page, '22-em-syllabus', 'Electrical Machines · syllabus (7 units)');
    await go(page, '/em/electrical-machines/dc-motor');
    await sleep(1500);
    await cap(ctx, page, '23-em-unit-path', 'Electrical Machines · unit path');
    await go(page, '/em/electrical-machines/dc-motor/lesson/1');
    await sleep(9000);
    await cap(ctx, page, '24-em-lesson-player', 'Electrical Machines · lesson player', {
      prep: async (p) => { await p.click('[aria-label="Pause"]').catch(() => {}); await sleep(800); },
    });
    await go(page, '/app/teach');
    await cap(ctx, page, '31-teach-dashboard', 'Teacher dashboard');
    await go(page, '/app/admin');
    await cap(ctx, page, '32-admin', 'Admin · review queue');
    await ctx.close();
  }
}

const browser = await chromium.launch({ executablePath: findChrome() });
if (which === 'desktop' || which === 'both') await runViewport(browser, 'desktop', { width: 1440, height: 900 });
if (which === 'phone' || which === 'both') await runViewport(browser, 'phone', { width: 390, height: 844 });
await browser.close();
fs.writeFileSync(path.join(OUT, `manifest-${which}${only ? '-' + only : ''}.json`), JSON.stringify(manifest, null, 1));
