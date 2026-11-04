import { Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { loadArticle, loadLesson, prefetchLesson, type LessonProps } from '../content/host';
import { interactives } from '../content/registry';
import { api, invalidate, prefetch, setCached, useQuery } from '../lib/api';
import { duration } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { Lesson, SubjectDetail } from '../lib/types';

export default function Watch() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const key = `lesson:${id}`;
  const { data: l, error } = useQuery<Lesson>(key, `/api/lessons/${encodeURIComponent(id)}`);
  const subjectKey = l ? `subject:${l.course.slug}/${l.subject.slug}` : null;
  const { data: subject } = useQuery<SubjectDetail>(
    subjectKey,
    l ? `/api/courses/${encodeURIComponent(l.course.slug)}/subjects/${encodeURIComponent(l.subject.slug)}` : '',
  );
  useSeo({ title: `${l?.title ?? 'Lesson'} · ${SITE}`, noindex: true });

  // Warm the next lesson (its data and its code) so "Next" opens instantly.
  useEffect(() => {
    if (!l?.nextId) return;
    void prefetch<Lesson>(`lesson:${l.nextId}`, `/api/lessons/${l.nextId}`).then((next) => next && !next.locked && prefetchLesson(next));
  }, [l?.nextId]);

  const lastSaved = useRef(0);
  const save = useCallback(
    (position: number, completed: boolean) => {
      if (!l || l.locked) return;
      const pos = Math.floor(position);
      if (!completed && Math.abs(pos - lastSaved.current) < 10) return; // at most every 10s of watching
      lastSaved.current = pos;
      void api(`/api/lessons/${l.id}/progress`, { method: 'PUT', body: { positionSeconds: pos, completed } })
        .then(() => {
          // Patch what we already show instead of refetching it.
          setCached<Lesson>(key, (prev) => (prev ? { ...prev, positionSeconds: pos, completed: prev.completed || completed } : prev!));
          if (subjectKey) {
            setCached<SubjectDetail>(subjectKey, (prev) =>
              prev ? { ...prev, lessons: prev.lessons.map((x) => (x.id === l.id ? { ...x, positionSeconds: pos, completed: x.completed || completed } : x)) } : prev!,
            );
          }
          invalidate('home', `course:${l.course.slug}`);
        })
        .catch(() => {});
    },
    [l, key, subjectKey],
  );

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="container page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!l) return <main className="container page"><div className="skeleton" style={{ aspectRatio: '16 / 9' }} /></main>;

  return (
    <main className="container page">
      <div className="split">
        <div className="stack">
          <div className="row small">
            <Link to={`/courses/${l.course.slug}`} className="muted">{l.course.title}</Link>
            <span className="muted">/</span>
            <Link to={`/app/courses/${l.course.slug}/${l.subject.slug}`} className="muted">{l.subject.title}</Link>
          </div>

          {l.locked ? (
            <div className="locked">
              <div className="stack">
                <h2>This lesson is part of {l.course.title}</h2>
                <p className="muted">Buy the course once to unlock every lesson.</p>
                <Link className="btn btn-primary" to={`/app/checkout/${l.course.slug}`}>Unlock the course</Link>
              </div>
            </div>
          ) : l.kind === 'video' ? (
            <Player key={l.id} lesson={l} onSave={save} onEnded={() => l.nextId && navigate(`/app/watch/${l.nextId}`)} />
          ) : l.kind === 'article' ? (
            <Article key={l.id} lesson={l} onSave={save} />
          ) : (
            <Interactive key={l.id} lesson={l} onSave={save} />
          )}

          <div className="row">
            <h1 style={{ fontSize: '1.5rem', margin: 0, flex: 1 }}>{l.title}</h1>
            {l.completed && <span className="badge badge-free">Completed</span>}
          </div>
          {l.description && <p className="muted">{l.description}</p>}
          <div className="row">
            {l.prevId && <Link className="btn" to={`/app/watch/${l.prevId}`}>← Previous</Link>}
            <span className="spacer" />
            {l.nextId && <Link className="btn btn-primary" to={`/app/watch/${l.nextId}`}>Next lesson →</Link>}
          </div>
        </div>

        <aside>
          <h2 style={{ fontSize: '1rem' }}>{l.subject.title}</h2>
          {subject ? (
            <ol className="list">
              {subject.lessons.map((x, i) => {
                const open = subject.owned || x.isPreview;
                const current = x.id === l.id;
                const inner = (
                  <>
                    <span className={x.completed ? 'icon-dot done' : 'icon-dot'} aria-hidden>{x.completed ? '✓' : open ? i + 1 : '🔒'}</span>
                    <span className="grow">
                      <span className="title" style={current ? { color: 'var(--primary)' } : undefined}>{x.title}</span>
                      <span className="muted small" style={{ display: 'block' }}>{duration(x.durationSeconds)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={x.id}>
                    {open && !current ? <Link className="list-item" to={`/app/watch/${x.id}`}>{inner}</Link> : <div className="list-item" aria-current={current ? 'true' : undefined}>{inner}</div>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="skeleton" style={{ height: 240 }} />
          )}
        </aside>
      </div>
    </main>
  );
}

function Player({ lesson, onSave, onEnded }: { lesson: Lesson; onSave: (p: number, done: boolean) => void; onEnded: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);

  // Resume where the learner left off (unless they had finished it).
  useEffect(() => {
    const v = ref.current;
    if (!v || lesson.completed || !lesson.positionSeconds) return;
    const seek = () => {
      if (lesson.positionSeconds < v.duration - 5) v.currentTime = lesson.positionSeconds;
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
          onEnded();
        }}
      />
    </div>
  );
}

function Unavailable({ message = "This lesson isn't available in this version of the app yet.", retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="locked">
      <div className="stack">
        <p className="muted">{message}</p>
        {retry && <button className="btn" onClick={retry}>Try again</button>}
      </div>
    </div>
  );
}

// An interactive lesson comes either from a content release (moduleUrl, loaded
// at runtime) or from code built into this app (contentRef → registry.ts).
function Interactive({ lesson, onSave }: { lesson: Lesson; onSave: (p: number, done: boolean) => void }) {
  const [C, setC] = useState<ComponentType<LessonProps> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!lesson.moduleUrl) return;
    let live = true;
    setFailed(false);
    loadLesson(lesson.moduleUrl, lesson.cssUrls).then(
      (c) => live && setC(() => c),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [lesson.moduleUrl, lesson.cssUrls, attempt]);

  const props: LessonProps = {
    lesson: { id: lesson.id, title: lesson.title, durationSeconds: lesson.durationSeconds },
    onComplete: () => onSave(lesson.durationSeconds, true),
    onProgress: (f) => onSave(f * (lesson.durationSeconds || 100), false),
  };
  const skeleton = <div className="skeleton" style={{ aspectRatio: '16 / 9' }} />;

  if (lesson.moduleUrl) {
    if (failed) return <Unavailable message="This lesson didn't load. Check your connection." retry={() => setAttempt((n) => n + 1)} />;
    return C ? <C {...props} /> : skeleton;
  }
  const Built = lesson.contentRef ? interactives[lesson.contentRef] : undefined;
  if (!Built) return <Unavailable />;
  return (
    <Suspense fallback={skeleton}>
      <Built {...props} />
    </Suspense>
  );
}

// A reading: pre-rendered HTML (Markdown + math) from a content release.
// Reaching the end of it counts as finishing it.
function Article({ lesson, onSave }: { lesson: Lesson; onSave: (p: number, done: boolean) => void }) {
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
