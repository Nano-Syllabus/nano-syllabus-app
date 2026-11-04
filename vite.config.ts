import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// The Go server (nano-syllabus-server) serves the API, media and, in
// production, this build. In dev, Vite proxies to it.
const SERVER = process.env.NS_SERVER ?? 'http://localhost:8090';

// Write .br and .gz next to every text asset at build time, so the server
// sends pre-compressed files and spends no CPU compressing per request.
function precompress(): Plugin {
  return {
    name: 'precompress',
    apply: 'build',
    closeBundle() {
      const walk = (dir: string): string[] =>
        readdirSync(dir).flatMap((f) => {
          const p = join(dir, f);
          return statSync(p).isDirectory() ? walk(p) : [p];
        });
      for (const file of walk('dist')) {
        if (!/\.(js|css|svg|json|txt|webmanifest)$/.test(file)) continue;
        const buf = readFileSync(file);
        if (buf.length < 1024) continue;
        writeFileSync(file + '.br', brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
        writeFileSync(file + '.gz', gzipSync(buf, { level: 9 }));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precompress()],
  server: {
    port: 5173,
    proxy: {
      '/api': SERVER,
      '/media': SERVER,
      '/content': SERVER,
      '/sitemap.xml': SERVER,
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      // landing.html is nanosyllabus.com's landing page (pre-rendered, no JS).
      input: { app: 'index.html', landing: 'landing.html' },
      output: {
        // React + router change rarely: one long-cached vendor chunk.
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
