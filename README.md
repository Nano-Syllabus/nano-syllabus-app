# nano-syllabus-client

The Nano Syllabus web app: a React 18 + Vite single-page app, deliberately on the same stack as `brilliant-sample` (React 18, react-router 6, plain CSS) so lesson content moves across unchanged. There is no Tailwind and no web fonts, and the only libraries are React and the router. Each page is its own lazy-loaded chunk.

## Page flow

| Page | Route |
|---|---|
| Landing | `/` |
| Course browse | `/courses` |
| Course detail | `/courses/:slug` |
| Sign in / sign up | `/login`, `/signup` |
| App home | `/app` |
| Payment | `/app/checkout/:slug`, then `/app/payment/result` |
| Subject detail | `/app/courses/:slug/:subject` |
| Video / lesson | `/app/watch/:id` |

## Run

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api, /media and /content to nano-syllabus-server on :8090
npm run build    # dist/, with .br and .gz next to every asset
```

## SEO

- `index.html` carries default meta tags and three markers, which nano-syllabus-server fills for each route on first load:
  - `<!--seo:start-->…<!--seo:end-->`: title, description, canonical URL, Open Graph tags, JSON-LD
  - `<!--ssr-->`: crawlable HTML
  - `<!--data-->`: the page's data
- `src/lib/seo.ts` (`useSeo`) keeps those same tags right while the user navigates inside the app. Signed-in and auth pages are `noindex`, and course pages carry `Course` JSON-LD.
- `public/robots.txt`, `public/manifest.webmanifest` and `public/icon.svg` are included. The server serves the live `/robots.txt` and `/sitemap.xml`.

## Data

`src/lib/api.ts` is cache-first:
1. A page paints from server-embedded data, memory, or this tab's sessionStorage.
2. It revalidates once per page load.
3. Writes patch or invalidate only the keys they change.

Sign-in and sign-out clear the cache.

## Lessons and content

Content is not in this repo. It is written in `nano-syllabus-content` and published as releases that the server syncs, so new lessons go live without rebuilding the app. The lesson page (`src/pages/Watch.tsx`) plays three kinds:
- **video:** a `<video>` that resumes where the learner left off and saves progress.
- **article:** pre-rendered HTML, fetched with its stylesheet. Reaching the end of it marks it complete.
- **interactive:** an ES module imported at runtime (`src/content/host.ts`).

**Lesson API 1** is the contract between this app and content releases:
- Before importing a lesson, the app puts its own React on `globalThis.__NS_HOST__`, so lessons share one React.
- The module's default export is a component taking `{ lesson, onComplete, onProgress }`.
- Changing this contract means bumping `LESSON_API` here, `HOST_API` in the content repo and `HostAPI` in the server together.

The next lesson's data and code are prefetched while the learner is on the current one. `src/content/registry.ts` still supports lessons compiled into the app (`contentRef`), but releases are the normal path.

## Runtime config

`src/lib/config.ts` reads `window.__NS_CONFIG__`, which the server writes into every page: site name, description, content URL and lesson API. One build therefore serves any site or environment. `npm run dev` uses the defaults in that file.
