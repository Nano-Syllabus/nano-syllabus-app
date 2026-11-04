import { useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { config } from '../lib/config';
import { ErrorBox, NotFound } from '../components/bits';
import { prefetchLesson } from '../content/host';
import { LessonBody } from '../content/LessonBody';
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

  if (l && config.appCourses[l.course.slug]) return <Navigate to={`/app/courses/${l.course.slug}/learn`} replace />;
  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!l) return <main className="wrap page"><div className="skeleton" style={{ aspectRatio: '16 / 9' }} /></main>;

  return (
    <main className="wrap page">
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
          ) : (
            <LessonBody lesson={l} onSave={save} onEnded={() => l.nextId && navigate(`/app/watch/${l.nextId}`)} />
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
