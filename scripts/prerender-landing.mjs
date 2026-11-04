// After `vite build`: render the landing page to static HTML and put it into
// dist/landing.html (which Vite already built with the hashed CSS link). The
// server sends it for "/". The page ships no JavaScript.
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
const page = html.replace('<!--landing-->', render()).replace('</title>', `</title>${preload}`);
writeFileSync(file, page);
writeFileSync(file + '.br', brotliCompressSync(page, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
writeFileSync(file + '.gz', gzipSync(page, { level: 9 }));
rmSync(out, { recursive: true, force: true });
console.log(`landing.html: ${(page.length / 1024).toFixed(1)} kB, ${fonts.length} font preloads`);
