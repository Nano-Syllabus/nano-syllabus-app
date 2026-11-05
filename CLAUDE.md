# nano-syllabus-client

The Nano Syllabus web app (github.com/Nano-Syllabus/nano-syllabus-app): a Vite + React 18 SPA plus a pre-rendered landing page. It is **live on https://nanosyllabus.com**, served by `nano-syllabus-server`. The whole system (VPS, Cloudflare, content pipeline) is described in `../CLAUDE.md`.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api, /media, /content to the Go server on :8090
npm run build      # tsc → vite build (app + landing) → scripts/prerender-landing.mjs → dist/
npm run typecheck
```

To deploy (only when the user says so), run `../nano-syllabus-server/deploy/deploy.sh`. It builds this repo too.

---

## What's done so far

### 1. The app (2026-11-03): commit d66d343
A plain course SaaS with no tenants, communities or tiers. Every page is its own lazy-loaded chunk. The app uses plain CSS (`src/styles.css`) and no web fonts, and its only libraries are React and react-router 6, the same stack as `brilliant-sample`, so lessons move across unchanged.

| Page | Route | File |
|---|---|---|
| Landing | `/` | pre-rendered `dist/landing.html` (see §2); `src/pages/Landing.tsx` is the in-app fallback |
| Course browse | `/courses` | `src/pages/Courses.tsx` |
| Course detail | `/courses/:slug` | `src/pages/CourseDetail.tsx` |
| Sign in / sign up | `/login`, `/signup` | `src/pages/AuthPage.tsx` |
| App home | `/app` | `src/pages/AppHome.tsx` |
| Checkout (eSewa / Khalti) | `/app/checkout/:slug` | `src/pages/Checkout.tsx` |
| Payment result | `/app/payment/result` | `src/pages/PaymentResult.tsx` |
| Subject (lesson list) | `/app/courses/:slug/:subject` | `src/pages/Subject.tsx` |
| Lesson player | `/app/watch/:id` | `src/pages/Watch.tsx` |

- **Auth** (`src/lib/auth.tsx`): uses the server's cookie session. `/app/*` routes are wrapped in `authed()`.
- **Data** (`src/lib/api.ts`): cache-first.
  1. A page paints from the data the server embedded, from memory, or from this tab's sessionStorage.
  2. It revalidates once per page load.
  3. A write patches only the keys it changes.
  4. Signing in or out clears the cache.
- **SEO** (`src/lib/seo.ts`, `index.html` markers):
  - The server fills `<!--seo:start/end-->`, `<!--ssr-->` and `<!--data-->` on first load.
  - `useSeo` keeps the tags right during in-app navigation.
  - Signed-in pages are `noindex`, and course pages carry `Course` JSON-LD.
- **Runtime config** (`src/lib/config.ts`): reads `window.__NS_CONFIG__` (site name, description, content URL, lesson API), so one build serves any environment.
- **Builds are pre-compressed**: every asset gets `.br` and `.gz` twins (the `precompress()` plugin in `vite.config.ts`).

### 2. Lessons load at runtime (2026-11-03)
Lessons are **not in this repo**. They come from `nano-syllabus-content` releases.
- `Watch.tsx` plays three kinds:
  - **video**: resumes where the learner stopped and saves progress;
  - **article**: pre-rendered HTML plus its CSS, and reaching the end marks it complete;
  - **interactive**: an ES module imported at runtime.
- **Lesson API 1** (`src/content/host.ts`):
  - Before the import, the app puts its own React on `globalThis.__NS_HOST__`.
  - The module's default export gets `{ lesson, onComplete, onProgress }`.
  - Bump `LESSON_API` together with the content repo's `HOST_API` and the server's `content.HostAPI`.
- While the learner is on one lesson, the next lesson's data and code are prefetched.
- `src/content/registry.ts` still supports lessons compiled into the app (`contentRef`, `src/content/demo/`), but releases are the normal path.

### 3. Landing page from nano_sylabus (2026-11-04): commit 0254c1a
The user wanted nanosyllabus.com to look like the old `nano_sylabus` landing, and chose a pixel-exact port of the landing only.
- `src/landing/MainLandingView.tsx` is a line-for-line port of `nano_sylabus/components/main-landing-view.tsx` (ce600de). Only the Next.js parts changed: next/link and next/image became `<a>` and `<img>`, next/font became `@font-face`, and the CSS module became `.lp-original`.
- `src/landing/landing.css`:
  - It is the **only place Tailwind 4 is used** (`@import "tailwindcss" source(none); @source "./MainLandingView.tsx";`).
  - It carries nano_sylabus's radius scale (`rounded-lg` = 16px) and the base layer from globals.css (press feedback, selection).
  - It has next/font's exact `@font-face` rules, including the metric-matched Arial fallbacks (`"dmSans Fallback"`, `"manrope Fallback"`). The fallbacks draw the ↗ and ▶ glyphs, so keep them.
- `src/landing/fonts/` holds the DM Sans, Manrope and Inter woff2 files. `public/` holds `nanologo.png`, `nanologo-76.png`, `demo-video/nanosyllabus-demo.mp4` and its poster.
- `landing.html` is the second Vite entry. Its head has the old site's metadata (title, description, canonical, OG/Twitter).
- `scripts/prerender-landing.mjs` does the rest:
  - it runs an SSR build of `src/landing/render.tsx` (`renderToStaticMarkup`);
  - it injects the result into `<!--landing-->` and adds font preloads;
  - it writes `dist/landing.html` (~23 kB, **no JavaScript**) with .br/.gz twins.
- A pixel diff against `next dev` came out at 0.015%; only the logo resample differed.
- `src/App.tsx`: the index route hard-loads `/` (`window.location.assign('/')`) when the user navigates there inside the app, so the static landing always serves it.

### 4. Landing copy from the user's outline (2026-11-04): commit a25b9f5
The landing has now **diverged from nano_sylabus** on purpose:
- The hero reads "Turn any syllabus into short **interactive video lessons.**"
- The "How it works" section, its `steps` data and its nav link are removed. The nav shows Courses and FAQ.
- The Courses section has a greyed **"Browse all courses · Coming soon"** beside the heading. It is a `<span>` with no link, no hover and the default cursor. "More programs will be added as we grow." sits under the cards.
- The comparison table is headed "Why NanoSyllabus". The FAQ and the final "Start free" call to action stay.

Don't re-port from nano_sylabus without merging these changes back in.

### 5. Sandboxed lessons (2026-11-04): uncommitted
- `lesson-frame.html` + `src/frame/main.tsx` (the third Vite entry) is the page every interactive lesson runs in. `src/content/LessonBody.tsx` plays video, reading and interactive lessons for both Watch and the review preview, using `<iframe sandbox="allow-scripts" src="/lesson-frame.html">`.
- Protocol 1 messages are `{ns:1, type}`: hello, init, shown, height, progress, complete, error. The frame sizes itself to its content.
- The toolkit's `engine/frame/frame.jsx` is the same protocol for `ns preview`. **Keep the two in step.**
- `src/content/host.ts` no longer imports lessons into the page, and it sanitises readings (removes scripts, frames, event handlers and javascript: URLs) on top of the build-time escaping.
- Lessons compiled into the app (`contentRef`) still render in-page.

### 6. Teacher pages (2026-11-04): uncommitted
| Route | File | What |
|---|---|---|
| `/app/teacher/guide` (`/teach` and `/app/teach/guide` redirect here, section links included) | `src/pages/TeachGuide.tsx` | public guide: what you need, the 8 steps with example prompts, the rules, the review states, troubleshooting, other AI tools (MCP), FAQ |
| `/app/teach` | `src/pages/Teach.tsx` | students see how to get access; teachers see plugin install, access tokens (shown once), courses and submissions |
| `/app/teach/preview/:id` | `src/pages/TeachPreview.tsx` | a push played in the real player; admins approve or send back |
| `/app/admin` | `src/pages/Admin.tsx` | review queue, all submissions, Teachers (add or remove by email) |

The header nav shows Teach (to `/app/teach` for teachers, `/app/teacher/guide` otherwise) and Admin. Shared bits are in `src/components/teach.tsx`. Types: `Role`, `Submission` and the rest in `src/lib/types.ts`; `User.role` comes from `/api/auth/me`.

### 7. Two landing builds (2026-11-04): uncommitted
`MainLandingView` takes `variant`: `waitlist` (nanosyllabus.com, "Join Waitlist" → book a call) or `live` (live.nanosyllabus.com, "Sign in" → `/login`, closing "Start free" → `/signup`). `scripts/prerender-landing.mjs` writes `dist/landing.html` and `dist/landing-live.html` (the live one is `noindex`). Everything else on the two pages is identical.

### 8. Signed-in look = nano_sylabus (2026-11-04): uncommitted, NOT deployed yet
The user wanted the sign-in, onboarding and dashboard to look like the old app ("same look, new app's pages").
- `src/ui/ui.css` (imported by `main.tsx`):
  - Tailwind 4 with nano_sylabus's tokens, fonts and type utilities (Outfit for headings, Inter for body, Poppins for the sidebar, DM Mono for eyebrows);
  - `[data-theme]` light/dark, stored in localStorage `ns-theme-v2` and applied before first paint by a script in `index.html`;
  - `styles.css` is imported **as a lower layer** (`legacy`), so Tailwind classes win.
- **Renamed legacy classes** that collided with Tailwind's (`.container` is now `.wrap`, `.grid` is now `.card-grid`). Don't reintroduce legacy class names that match Tailwind utilities.
- `src/ui/kit.tsx` has Button, Field, Input, Logo, ThemeToggle and AuthShell. `src/ui/AppShell.tsx` is the sidebar shell. `src/ui/hub.tsx` has the hub classes and the lime banner.
- `/login` and `/signup` follow the old forms (password strength bar). New accounts go to `/onboarding` (name + EN/RN answer language, `PUT /api/me/profile`), then `/app`.
- `/app` is the **Micro-Topics Hub**: banner, Course progress, Streak, Today's goal (/3), Lessons done, and "Available lessons" (the first unfinished lesson per subject). A learner with no course gets the "Your learning space: Choose your course" dialog.
- `/app/courses` is "My Courses" (old "My Subjects" style). Every signed-in page renders inside the shell (`Layout`). Signed-out pages keep the public header.
- The lesson frame gets the theme in `init` and `theme` messages. `styles.css` tokens use the old palette, so lessons match.

### Status
- The app and the landing are deployed and verified live through Cloudflare:
  - end-to-end checks passed 12/12 (sign-up, interactive lesson, KaTeX article, video, no 404s);
  - landing checks passed 12/12;
  - no sideways scroll at 390px or 1280px.
- **Unpushed:** `0254c1a` and `a25b9f5`. Sections 5 and 6, plus `.github/workflows/deploy.yml`, are **uncommitted but deployed**. Push only when the user says so.

## Not built yet
- Google OAuth sign-in.
- The admin dashboard (planned inside this client).
- A link from the landing into `/courses` (for now it is "Coming soon"). The landing is the waitlist on `nanosyllabus.com`, and the app is on `live.nanosyllabus.com`.
- brilliant-sample LessonPlayer journeys as interactive lessons (that work belongs in the content repo).

## Rules
- Never push or deploy without the user saying so in that turn. Commit only when asked.
- **Never put secrets in `public/`.** Everything in it is published. A Cloudflare private key once landed in `public/message.txt` and was caught before it was built.
- New lessons go in `nano-syllabus-content`, not here.
- After changing `src/styles.css`, run `node scripts/sync-host-css.mjs` in the content repo so the studio previews match.
- Check UI changes in a browser at 390px and 1280px.
