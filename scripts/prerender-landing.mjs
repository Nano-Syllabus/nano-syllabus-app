// After `vite build`: render the landing page to static HTML, twice, from
// dist/landing.html (which Vite already built with the hashed CSS link):
//   dist/landing.html       nanosyllabus.com: "Join Waitlist"
//   dist/landing-live.html  live.nanosyllabus.com (the app): "Sign in"
// The server sends the right one for "/". The pages ship no JavaScript.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'vite';

const out = 'node_modules/.landing-ssr';
await build({ logLevel: 'warn', configFile: false, build: { ssr: 'src/landing/render.tsx', outDir: out, emptyOutDir: true }, esbuild: { jsx: 'automatic' } });
const { render } = await import(new URL(`../${out}/render.js`, import.meta.url));
const file = 'dist/landing.html';
const html = readFileSync(file, 'utf8');
if (!html.includes('<!--landing-->')) throw new Error('dist/landing.html has no <!--landing--> marker');
// Preload the two faces the first paint uses, as next/font does.
const fonts = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => readFileSync('dist' + m[1], 'utf8'))
  .flatMap((css) => [...css.matchAll(/url\((\/assets\/(?:dm-sans|manrope)[^)]+\.woff2)\)/g)].map((m) => m[1]));
const preload = [...new Set(fonts)].map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`).join('');
const variants = { 'dist/landing.html': 'waitlist', 'dist/landing-live.html': 'live' };
for (const [target, variant] of Object.entries(variants)) {
  let page = html.replace('<!--landing-->', render(variant)).replace('</title>', `</title>${preload}`);
  // The app's copy points search engines at the main site's landing page.
  if (variant === 'live') page = page.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow">');
  writeFileSync(target, page);
  writeFileSync(target + '.br', brotliCompressSync(page, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
  writeFileSync(target + '.gz', gzipSync(page, { level: 9 }));
  console.log(`${target.slice(5)}: ${(page.length / 1024).toFixed(1)} kB, ${fonts.length} font preloads`);
}
rmSync(out, { recursive: true, force: true });
