// Loads lessons published from nano-syllabus-content at runtime, so new
// lessons go live without a new app build.
//
// The contract (lesson API 1), mirrored in nano-syllabus-content/lib/vite.mjs:
//   - The app puts its React on globalThis.__NS_HOST__ before importing a
//     lesson; the lesson's `react` imports resolve to it. One React, so hooks
//     work and lesson chunks stay small.
//   - An interactive lesson module's default export is a React component taking
//     { lesson, onComplete, onProgress }.
//   - Its styles come as cssUrls; articles are pre-rendered HTML + cssUrls.

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as jsxRuntime from 'react/jsx-runtime';
import type { ComponentType } from 'react';

export const LESSON_API = 1;

export type LessonProps = {
  lesson: { id: number; title: string; durationSeconds: number };
  onComplete: () => void;
  onProgress?: (fraction: number) => void;
};

declare global {
  // eslint-disable-next-line no-var
  var __NS_HOST__: { api: number; modules: Record<string, unknown> } | undefined;
}

function installHost() {
  globalThis.__NS_HOST__ ??= {
    api: LESSON_API,
    modules: { react: React, 'react/jsx-runtime': jsxRuntime, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient },
  };
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

const modules = new Map<string, Promise<ComponentType<LessonProps>>>();
export function loadLesson(moduleUrl: string, cssUrls?: string[]): Promise<ComponentType<LessonProps>> {
  installHost();
  let p = modules.get(moduleUrl);
  if (!p) {
    p = Promise.all([import(/* @vite-ignore */ moduleUrl), loadStyles(cssUrls)]).then(([m]) => {
      if (typeof m.default !== 'function') throw new Error('This lesson has no component to show.');
      return m.default as ComponentType<LessonProps>;
    });
    p.catch(() => modules.delete(moduleUrl)); // let a retry fetch again
    modules.set(moduleUrl, p);
  }
  return p;
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
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = l.moduleUrl;
    document.head.appendChild(link);
  } else if (l.kind === 'article' && l.htmlUrl) void loadArticle(l.htmlUrl, l.cssUrls).catch(() => {});
}

