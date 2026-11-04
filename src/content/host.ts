// Helpers for lessons published from nano-syllabus-content and from teachers.
//
// Interactive lessons never load into this page: they run in the sealed
// lesson frame (src/frame/main.tsx, played by src/content/LessonBody.tsx),
// which provides React to them as globalThis.__NS_HOST__ (lesson API 1).
// Readings are pre-rendered HTML shown in the page, so they are sanitised.

export const LESSON_API = 1;

declare global {
  // eslint-disable-next-line no-var
  var __NS_HOST__: { api: number; modules: Record<string, unknown> } | undefined;
}

const styles = new Map<string, Promise<void>>();
/** Adds each stylesheet once and resolves when they have loaded (no flash of unstyled lesson). */
export function loadStyles(urls: string[] = []): Promise<void> {
  return Promise.all(
    urls.map((href) => {
      let p = styles.get(href);
      if (!p) {
        p = new Promise<void>((resolve) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          link.onload = link.onerror = () => resolve();
          document.head.appendChild(link);
        });
        styles.set(href, p);
      }
      return p;
    }),
  ).then(() => undefined);
}

const articles = new Map<string, Promise<string>>();
/** Fetches article HTML and makes its relative image/link URLs absolute. */
export function loadArticle(htmlUrl: string, cssUrls?: string[]): Promise<string> {
  let p = articles.get(htmlUrl);
  if (!p) {
    const base = new URL(htmlUrl, location.href);
    p = Promise.all([
      fetch(base).then((r) => {
        if (!r.ok) throw new Error(`Could not load this reading (${r.status}).`);
        return r.text();
      }),
      loadStyles(cssUrls),
    ]).then(([html]) => {
      const tpl = document.createElement('template');
      tpl.innerHTML = html;
      // Readings are rendered from Markdown at build time with raw HTML
      // escaped; this is a second line of defence, since a reading shows
      // inside the app's own page (unlike interactive lessons).
      tpl.content.querySelectorAll('script,iframe,object,embed,link,meta,base,form,style,frame,frameset').forEach((el) => el.remove());
      for (const el of tpl.content.querySelectorAll<HTMLElement>('*')) {
        for (const a of [...el.attributes]) {
          const v = a.value.trim().toLowerCase();
          if (a.name.startsWith('on') || a.name === 'srcdoc' || a.name === 'formaction' || ((a.name === 'href' || a.name === 'src' || a.name === 'xlink:href' || a.name === 'action') && /^(javascript|vbscript|data:text)/.test(v.replace(/\s+/g, '')))) {
            el.removeAttribute(a.name);
          }
        }
      }
      for (const el of tpl.content.querySelectorAll<HTMLElement>('[src],[href]')) {
        for (const attr of ['src', 'href']) {
          const v = el.getAttribute(attr);
          if (v && !/^(https?:|data:|mailto:|#|\/)/.test(v)) el.setAttribute(attr, new URL(v, base).href);
        }
        if (el.tagName === 'A' && /^https?:/.test(el.getAttribute('href') ?? '') && !(el.getAttribute('href') ?? '').startsWith(location.origin)) {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
        }
      }
      return tpl.innerHTML;
    });
    p.catch(() => articles.delete(htmlUrl));
    articles.set(htmlUrl, p);
  }
  return p;
}

/** Warm the next lesson's code while the learner is still on this one. */
export function prefetchLesson(l: { kind: string; moduleUrl?: string; htmlUrl?: string; cssUrls?: string[] }) {
  if (l.kind === 'interactive' && l.moduleUrl) {
    // The lesson runs in the sandboxed frame, so warm the HTTP cache rather
    // than this page's module map.
    for (const href of ['/lesson-frame.html', l.moduleUrl, ...(l.cssUrls ?? [])]) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }
  } else if (l.kind === 'article' && l.htmlUrl) void loadArticle(l.htmlUrl, l.cssUrls).catch(() => {});
}

