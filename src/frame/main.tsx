// The lesson frame: the sealed page every interactive lesson from a content
// release or a teacher runs in. The server sends it with
// `Content-Security-Policy: sandbox allow-scripts; connect-src 'none'; …`
// (nano-syllabus-server internal/httpapi/frame.go) and the lesson page loads
// it in <iframe sandbox="allow-scripts">, so lesson code gets an opaque
// origin: no cookies, storage, network or access to the page around it.
//
// Lesson frame protocol 1 (the same as nano-syllabus-toolkit
// engine/frame/frame.jsx, which runs `ns preview`; keep them in step):
//   frame → page  hello · shown · height {value} · progress {value 0..1} · complete · error {message}
//   page → frame  init {moduleUrl, cssUrls, lesson, theme?} · theme {theme}
// Every message is { ns: 1, type, … }.
//
// Lessons import React from globalThis.__NS_HOST__ (lesson API 1), which
// this page provides with its own copy.

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as jsxRuntime from 'react/jsx-runtime';
import { Component, type ComponentType, type ReactNode } from 'react';
import '../styles.css';
import './frame.css';

globalThis.__NS_HOST__ = {
  api: 1,
  modules: { react: React, 'react/jsx-runtime': jsxRuntime, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient },
};

type Msg = { ns: 1; type: string; [k: string]: unknown };
const send = (msg: Omit<Msg, 'ns'>) => window.parent.postMessage({ ns: 1, ...msg }, '*');

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    send({ type: 'error', message: String(error?.message ?? error) });
  }
  render() {
    if (this.state.error) return <div className="alert alert-error">This lesson hit a problem: {this.state.error.message}</div>;
    return this.props.children;
  }
}

const loadCss = (href: string) =>
  new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => resolve();
    document.head.appendChild(link);
  });

const root = document.getElementById('root')!;
let booted = false;

const setTheme = (t: unknown) => {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
};

window.addEventListener('message', async (e: MessageEvent<Msg>) => {
  if (e.source !== window.parent) return;
  const m = e.data;
  if (!m || m.ns !== 1) return;
  if (m.type === 'theme') return setTheme(m.theme);
  if (m.type !== 'init' || booted) return;
  booted = true;
  setTheme(m.theme);
  try {
    const moduleUrl = String(m.moduleUrl);
    // Relative asset URLs inside the lesson resolve against its own folder.
    const base = document.createElement('base');
    base.href = new URL('.', moduleUrl).href;
    document.head.prepend(base);
    await Promise.all(((m.cssUrls as string[]) ?? []).map(loadCss));
    const mod = await import(/* @vite-ignore */ moduleUrl);
    if (typeof mod.default !== 'function') throw new Error('this lesson has no component to show');
    const Lesson = mod.default as ComponentType<Record<string, unknown>>;
    ReactDOMClient.createRoot(root).render(
      <Boundary>
        <Lesson
          lesson={m.lesson}
          onComplete={() => send({ type: 'complete' })}
          onProgress={(f: number) => send({ type: 'progress', value: Math.max(0, Math.min(1, Number(f) || 0)) })}
        />
      </Boundary>,
    );
    requestAnimationFrame(() => send({ type: 'shown' }));
  } catch (err) {
    const message = String((err as Error)?.message ?? err);
    send({ type: 'error', message });
    const div = document.createElement('div');
    div.className = 'alert alert-error';
    div.textContent = `This lesson did not load: ${message}`;
    root.replaceChildren(div);
  }
});

let last = 0;
new ResizeObserver(() => {
  const h = Math.ceil(root.getBoundingClientRect().height);
  if (h !== last) {
    last = h;
    send({ type: 'height', value: h });
  }
}).observe(root);

send({ type: 'hello' });
