// The three ways a lesson plays, shared by the lesson page (Watch) and the
// review preview of a teacher's submission (TeachPreview).
//
// Interactive lessons from content releases and teachers always run in the
// sealed lesson frame (/lesson-frame.html, see src/frame/main.tsx): an
// <iframe sandbox="allow-scripts"> with an opaque origin and no network, so
// lesson code can never touch the learner's account. Lessons compiled into
// this app (contentRef) are our own code and render in the page.

import { Suspense, useEffect, useRef, useState } from 'react';
import { loadArticle } from './host';
import { getTheme, onTheme } from '../ui/theme';
import { interactives } from './registry';

export type PlayableLesson = {
  id: number;
  title: string;
  kind: 'video' | 'interactive' | 'article';
  durationSeconds: number;
  completed?: boolean;
  positionSeconds?: number;
  videoUrl?: string;
  posterUrl?: string;
  contentRef?: string;
  moduleUrl?: string;
  htmlUrl?: string;
  cssUrls?: string[];
};

export type OnSave = (position: number, done: boolean) => void;

export function LessonBody({ lesson, onSave, onEnded }: { lesson: PlayableLesson; onSave: OnSave; onEnded?: () => void }) {
  if (lesson.kind === 'video') return <Player key={lesson.id} lesson={lesson} onSave={onSave} onEnded={onEnded} />;
  if (lesson.kind === 'article') return <Article key={lesson.id} lesson={lesson} onSave={onSave} />;
  return <Interactive key={lesson.id} lesson={lesson} onSave={onSave} />;
}

export function Unavailable({ message = "This lesson isn't available in this version of the app yet.", retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="locked">
      <div className="stack">
        <p className="muted">{message}</p>
        {retry && <button className="btn" onClick={retry}>Try again</button>}
      </div>
    </div>
  );
}

function Player({ lesson, onSave, onEnded }: { lesson: PlayableLesson; onSave: OnSave; onEnded?: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  // Resume where the learner left off (unless they had finished it).
  useEffect(() => {
    const v = ref.current;
    if (!v || lesson.completed || !lesson.positionSeconds) return;
    const seek = () => {
      if (lesson.positionSeconds! < v.duration - 5) v.currentTime = lesson.positionSeconds!;
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener('loadedmetadata', seek, { once: true });
  }, [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on leaving the page too.
  useEffect(() => {
    const v = ref.current;
    return () => {
      if (v && v.currentTime > 0) onSave(v.currentTime, v.duration > 0 && v.currentTime / v.duration > 0.9);
    };
  }, [onSave]);

  return (
    <div className="player">
      <video
        ref={ref}
        src={lesson.videoUrl}
        poster={lesson.posterUrl || undefined}
        controls
        playsInline
        preload="metadata"
        autoPlay
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration && v.currentTime / v.duration > 0.9 && !lesson.completed) onSave(v.currentTime, true);
          else onSave(v.currentTime, false);
        }}
        onPause={(e) => onSave(e.currentTarget.currentTime, false)}
        onEnded={(e) => {
          onSave(e.currentTarget.duration, true);
          onEnded?.();
        }}
      />
    </div>
  );
}

function Interactive({ lesson, onSave }: { lesson: PlayableLesson; onSave: OnSave }) {
  if (lesson.moduleUrl) return <SandboxedLesson lesson={lesson} onSave={onSave} />;
  const Built = lesson.contentRef ? interactives[lesson.contentRef] : undefined;
  if (!Built) return <Unavailable />;
  return (
    <Suspense fallback={<div className="skeleton" style={{ aspectRatio: '16 / 9' }} />}>
      <Built
        onComplete={() => onSave(lesson.durationSeconds, true)}
        onProgress={(f) => onSave(f * (lesson.durationSeconds || 100), false)}
      />
    </Suspense>
  );
}

/** An interactive lesson in the sealed lesson frame (lesson frame protocol 1). */
function SandboxedLesson({ lesson, onSave }: { lesson: PlayableLesson; onSave: OnSave }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  const [shown, setShown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const save = useRef(onSave);
  save.current = onSave;

  useEffect(() => {
    setShown(false);
    setError(null);
    const abs = (u: string) => new URL(u, location.href).href;
    const timeout = window.setTimeout(() => setError((e) => e ?? 'This lesson is taking too long to load. Check your connection.'), 20000);
    const onMessage = (e: MessageEvent) => {
      const win = frame.current?.contentWindow;
      if (!win || e.source !== win) return;
      const m = e.data;
      if (!m || m.ns !== 1) return;
      switch (m.type) {
        case 'hello':
          win.postMessage(
            {
              ns: 1,
              type: 'init',
              moduleUrl: abs(lesson.moduleUrl!),
              cssUrls: (lesson.cssUrls ?? []).map(abs),
              lesson: { id: lesson.id, title: lesson.title, durationSeconds: lesson.durationSeconds },
              theme: getTheme(),
            },
            '*',
          );
          break;
        case 'shown':
          clearTimeout(timeout);
          setShown(true);
          break;
        case 'height':
          setHeight(Math.max(0, Math.min(6000, Number(m.value) || 0)));
          break;
        case 'progress':
          save.current(Math.max(0, Math.min(1, Number(m.value) || 0)) * (lesson.durationSeconds || 100), false);
          break;
        case 'complete':
          save.current(lesson.durationSeconds, true);
          break;
        case 'error':
          clearTimeout(timeout);
          setError(String(m.message ?? 'This lesson hit a problem.'));
          break;
      }
    };
    window.addEventListener('message', onMessage);
    // The sidebar's theme toggle reaches the lesson too.
    const offTheme = onTheme((theme) => frame.current?.contentWindow?.postMessage({ ns: 1, type: 'theme', theme }, '*'));
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      offTheme();
    };
  }, [lesson.id, lesson.moduleUrl, lesson.cssUrls, lesson.title, lesson.durationSeconds, attempt]);

  return (
    <div className="lesson-frame">
      {error && <Unavailable message={`This lesson didn't load. ${error}`} retry={() => setAttempt((n) => n + 1)} />}
      {!shown && !error && <div className="skeleton" style={{ aspectRatio: '16 / 9' }} />}
      <iframe
        key={attempt}
        ref={frame}
        src="/lesson-frame.html"
        sandbox="allow-scripts"
        title={lesson.title}
        loading="eager"
        style={{ width: '100%', height: shown ? height : 0, border: 0, display: 'block', colorScheme: 'normal' }}
      />
    </div>
  );
}

// A reading: pre-rendered HTML (Markdown + math). Reaching the end of it
// counts as finishing it.
function Article({ lesson, onSave }: { lesson: PlayableLesson; onSave: OnSave }) {
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!lesson.htmlUrl) return;
    let live = true;
    setFailed(false);
    loadArticle(lesson.htmlUrl, lesson.cssUrls).then(
      (h) => live && setHtml(h),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [lesson.htmlUrl, lesson.cssUrls, attempt]);
  useEffect(() => {
    const el = end.current;
    if (!el || !html || lesson.completed) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        onSave(lesson.durationSeconds, true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [html, lesson.completed, lesson.durationSeconds, onSave]);

  if (!lesson.htmlUrl) return <Unavailable />;
  if (failed) return <Unavailable message="This reading didn't load. Check your connection." retry={() => setAttempt((n) => n + 1)} />;
  if (html == null) return <div className="skeleton" style={{ height: 320 }} />;
  return (
    <div className="card">
      <article className="nk-article" dangerouslySetInnerHTML={{ __html: html }} />
      <div ref={end} aria-hidden style={{ height: 1 }} />
    </div>
  );
}
