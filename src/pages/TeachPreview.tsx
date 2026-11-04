// /app/teach/preview/:id: a pushed course played in the real lesson player
// before it is live: the teacher sees what the reviewer sees, and admins
// approve it or send it back from here. Progress is not saved.

import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { ProblemList, StatusBadge, when } from '../components/teach';
import { LessonBody, type PlayableLesson } from '../content/LessonBody';
import { api, invalidate, setCached, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { duration } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { PreviewCourse, Submission } from '../lib/types';

type Preview = { submission: Submission; course?: PreviewCourse };

export default function TeachPreview() {
  const { id = '' } = useParams();
  const key = `teach:preview:${id}`;
  const { data, error } = useQuery<Preview>(key, `/api/teach/submissions/${encodeURIComponent(id)}/preview`);
  const { user } = useAuth();
  const [pick, setPick] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  useSeo({ title: `Preview #${id} · ${SITE}`, noindex: true });

  const lessons = useMemo(
    () =>
      data?.course?.subjects.flatMap((s, si) =>
        s.lessons.map((l, li): PlayableLesson & { key: string; subject: string; description: string } => ({
          key: `${s.slug}/${l.slug}`,
          subject: s.title,
          id: si * 1000 + li + 1,
          title: l.title,
          description: l.description,
          kind: l.kind,
          durationSeconds: l.durationSeconds,
          videoUrl: l.videoUrl,
          posterUrl: l.posterUrl,
          moduleUrl: l.moduleUrl,
          htmlUrl: l.htmlUrl,
          cssUrls: l.cssUrls ?? [],
        })),
      ) ?? [],
    [data?.course],
  );
  const current = lessons.find((l) => l.key === pick) ?? lessons[0];
  const log = useCallback((pos: number, done: boolean) => {
    setEvents((e) => [`${new Date().toLocaleTimeString()}  ${done ? 'completed' : `progress ${Math.round(pos)}s`}`, ...e].slice(0, 30));
  }, []);

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!data) return <main className="wrap page"><div className="skeleton" style={{ height: 320 }} /></main>;
  const s = data.submission;

  return (
    <main className="wrap page stack">
      <div className="row small">
        <Link to={user?.role === 'admin' ? '/app/admin' : '/app/teach'} className="muted">← {user?.role === 'admin' ? 'Review queue' : 'Teacher tools'}</Link>
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <h1 style={{ flex: 1, margin: 0, fontSize: '1.6rem' }}>
          #{s.id} · {s.courseTitle || s.courseSlug}
        </h1>
        <StatusBadge status={s.status} />
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        by {s.teacher.title} ({s.teacher.slug}) · pushed {when(s.createdAt)} {s.via === 'mcp' ? 'via MCP' : 'with ns push'} · {s.lessons} lessons · preview only, nothing is saved
      </p>
      {s.note && <div className="alert"><b>Teacher's note:</b> {s.note}</div>}
      {s.reviewNote && <div className={s.status === 'rejected' ? 'alert alert-error' : 'alert alert-success'}><b>{s.reviewedBy || 'Reviewer'}:</b> {s.reviewNote}</div>}

      {user?.role === 'admin' && s.status === 'review' && <ReviewBar s={s} previewKey={key} />}

      {!data.course ? (
        <div className="card stack">
          <p className="muted">This push has no build to preview{s.status === 'building' ? ' yet; it is still being checked.' : '.'}</p>
          <ProblemList errors={s.report?.errors} warnings={s.report?.warnings} />
        </div>
      ) : (
        <div className="split">
          <div className="stack">
            {current ? (
              <>
                <div className="row small muted">{current.subject}</div>
                <LessonBody key={current.key} lesson={current} onSave={log} />
                <h2 style={{ margin: 0 }}>{current.title}</h2>
                {current.description && <p className="muted">{current.description}</p>}
              </>
            ) : (
              <p className="muted">This course has no lessons.</p>
            )}
            <details className="card">
              <summary>Check report: {s.report?.errors?.length ?? 0} errors, {s.report?.warnings?.length ?? 0} warnings</summary>
              <div style={{ marginTop: 10 }}>
                <ProblemList errors={s.report?.errors} warnings={s.report?.warnings} />
              </div>
            </details>
            {events.length > 0 && (
              <div className="card small">
                <b>What the app would record</b>
                {events.map((e, i) => <div key={i} className="muted" style={{ fontFamily: 'ui-monospace, monospace' }}>{e}</div>)}
              </div>
            )}
          </div>
          <aside>
            <h2 style={{ fontSize: '1rem' }}>{data.course.title}</h2>
            {data.course.subjects.map((sub) => (
              <div key={sub.slug} style={{ marginBottom: 14 }}>
                <div className="muted small" style={{ fontWeight: 600, margin: '6px 0' }}>{sub.title}</div>
                <ol className="list">
                  {sub.lessons.map((l) => {
                    const k = `${sub.slug}/${l.slug}`;
                    const on = k === (current?.key ?? '');
                    return (
                      <li key={k}>
                        <button className="list-item" style={{ width: '100%', textAlign: 'left', border: 0, background: 'none', font: 'inherit', cursor: 'pointer' }} onClick={() => { setPick(k); setEvents([]); }} aria-current={on ? 'true' : undefined}>
                          <span className="icon-dot" aria-hidden>{l.kind === 'video' ? '▶' : l.kind === 'article' ? '¶' : '✦'}</span>
                          <span className="grow">
                            <span className="title" style={on ? { color: 'var(--primary)' } : undefined}>{l.title}</span>
                            <span className="muted small" style={{ display: 'block' }}>{l.kind} · {duration(l.durationSeconds)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}

function ReviewBar({ s, previewKey }: { s: Submission; previewKey: string }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const act = async (approve: boolean) => {
    if (!approve && !note.trim()) return setErr('Write what the teacher should fix; they see this note.');
    if (approve && !confirm(`Publish "${s.courseTitle || s.courseSlug}" for every student?`)) return;
    setBusy(true);
    setErr('');
    try {
      const x = await api<Submission>(`/api/admin/submissions/${s.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: { note } });
      setCached<Preview>(previewKey, (prev) => (prev ? { ...prev, submission: x } : prev!));
      invalidate('admin:', 'courses', 'home');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card stack">
      <b>Review</b>
      <textarea className="input" placeholder="Note for the teacher (required when sending back; optional when approving)" value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <div className="alert alert-error">{err}</div>}
      <div className="row">
        <button className="btn btn-primary" disabled={busy} onClick={() => void act(true)}>Approve and publish</button>
        <button className="btn" disabled={busy} onClick={() => void act(false)}>Send back</button>
      </div>
    </div>
  );
}
