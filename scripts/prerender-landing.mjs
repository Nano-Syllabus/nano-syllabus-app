// After `vite build`: render the two landing pages to static HTML, into the
// shells Vite already built with their hashed CSS links:
//   dist/landing.html       nanosyllabus.com: the waitlist (MainLandingView)
//   dist/landing-live.html  live.nanosyllabus.com: the Figma redesign (LiveLanding)
// The server sends the right one for "/". The pages ship no JavaScript.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'vite';

const out = 'node_modules/.landing-ssr';
await build({ logLevel: 'warn', configFile: false, build: { ssr: 'src/landing/render.tsx', outDir: out, emptyOutDir: true }, esbuild: { jsx: 'automatic' } });
const { render, renderLive } = await import(new URL(`../${out}/render.js`, import.meta.url));

// The faces each page's first paint uses get preloaded, as next/font does.
function preloads(html, faces) {
  const fonts = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => readFileSync('dist' + m[1], 'utf8'))
    .flatMap((css) => [...css.matchAll(/url\((\/assets\/[^)]+\.woff2)\)/g)].map((m) => m[1]))
    .filter((f) => faces.test(f));
  return [...new Set(fonts)].map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`).join('');
}
function write(target, page) {
  writeFileSync(target, page);
  writeFileSync(target + '.br', brotliCompressSync(page, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
  writeFileSync(target + '.gz', gzipSync(page, { level: 9 }));
  console.log(`${target.slice(5)}: ${(page.length / 1024).toFixed(1)} kB`);
}

// nanosyllabus.com: the waitlist page.
const html = readFileSync('dist/landing.html', 'utf8');
if (!html.includes('<!--landing-->')) throw new Error('dist/landing.html has no <!--landing--> marker');
write('dist/landing.html', html.replace('<!--landing-->', render('waitlist')).replace('</title>', `</title>${preloads(html, /\/(dm-sans|manrope)/)}`));

// live.nanosyllabus.com: the Figma redesign, from its own entry (landing-live.html).
const live = readFileSync('dist/landing-live.html', 'utf8');
if (!live.includes('<!--landing-live-->')) throw new Error('dist/landing-live.html has no <!--landing-live--> marker');
write('dist/landing-live.html', live.replace('<!--landing-live-->', renderLive()).replace('</title>', `</title>${preloads(live, /\/(clash-display|inter)/)}`));
rmSync(out, { recursive: true, force: true });
