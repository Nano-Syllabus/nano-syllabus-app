# figma-capture

Turns every page of the live flow into a self-contained HTML snapshot that
Figma's `html_to_figma` import turns into editable layers (text stays text,
boxes stay frames), at desktop (1440) and phone (390) widths.

Each element's computed style is written inline, so class CSS and media
queries no longer matter. Pseudo-elements become spans, canvases and videos
become screenshots, sandboxed lesson iframes are inlined, scroll offsets and
sticky/fixed positions are baked in, and fonts and images become `data:` URIs.

## Run

Needs a local server on :8090 (see `../../../CLAUDE.md` §7) serving this
repo's `dist/` and, for Electrical Machines, the brilliant-sample build
(`vite build --base=/em/`) as `EM_DIR`. The admin account must be made admin
once: `server user role admin.figma@example.test admin`.

```bash
node run.mjs both            # desktop + phone → out/*.html (+ real screenshots)
node verify.mjs desktop      # re-render each snapshot and pixel-diff it
node verify.mjs phone
python3 figma-fonts.py       # out/ → fig/: real Google Fonts names for Figma
```

`run.mjs desktop 24-em` captures one page. It signs up local test accounts,
so it refuses any `BASE` that isn't localhost. Each viewport needs a brand-new
learner (onboarding, the empty hub), so delete them before a rerun:

```bash
docker exec nanosyl-pg psql -U nano -d nanosyllabus \
  -c "delete from users where email like 'pratiksha.%@example.test'"
```

## Into Figma

Each `fig/*.html` goes through the Figma MCP `html_to_figma` tool: one call per
page returns a single-use submit URL, then `upload.sh list.txt urls.txt` POSTs
the files in order (`list.txt` = file names, `urls.txt` = the submit ids, same
order). Frames take their name from the page `<title>`. The Starter plan caps
MCP tool calls, so a full import (54 pages) needs a paid seat or several days.

## Pages

00 waitlist landing · 01 live landing · 02 courses · 03/04 course detail
(paid/free) · 05 sign in · 06 sign up · 07 onboarding · 08 app home (new) ·
09 courses signed in · 10 paid course signed in · 11 checkout · 12 free course
signed in · 13 payment result · 14 my courses · 15 subject · 16–18 lessons
(video, interactive, article) · 19 app home (learning) · 20 owned course ·
22 Electrical Machines syllabus · 23 unit path · 24 lesson player ·
30 teach guide · 31 teacher dashboard · 32 admin.

## Things the snapshot has to work around

- The style baseline is a 0×0 box in a shadow root, so sizes, `transform-origin`
  and margins/paddings (UA defaults are `em`) are always written out.
- A border style without a width falls back to `medium`, so widths are written
  whenever a style is set.
- Short entrance animations are finished; long ones (progress fills, the
  narrated player) are paused where they are. The lesson player is paused first.
- Google Fonts sheets are cross-origin, so their latin `@font-face` blocks are
  fetched separately.
- A modal `<dialog>` lives in the top layer: its `::backdrop` becomes a real
  layer and the dialog is pinned to its on-screen box (margins and centring
  transforms dropped).
- Negative `z-index` layers are moved first in their parent so Figma's layer
  order matches what the browser paints.
