import { useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { prefetchLesson } from '../content/host';
import { LessonBody } from '../content/LessonBody';
import { api, invalidate, prefetch, setCached, useQuery } from '../lib/api';
import { duration } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { Lesson, SubjectDetail } from '../lib/types';
import { config } from '../lib/config';
import { Bolt, Sparkles, usePoints } from '../ui/TopNav';

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
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  // A course that is its own app (Electrical Machines) is played from its
  // course path only; its old lesson pages go there.
  if (l && config.appCourses[l.course.slug]) return <Navigate to={`/app/courses/${l.course.slug}`} replace />;
  if (!l) return <div className="min-h-[100dvh] bg-white p-4 dark:bg-[#121214]"><div className="mt-16 aspect-video w-full max-w-[1160px] animate-pulse rounded-lg bg-[#f2f3f5] dark:bg-white/5" /></div>;

  const lessons = subject?.lessons ?? [];
  const index = lessons.findIndex((x) => x.id === l.id);
  const back = `/app/courses/${l.course.slug}`;
  const kindLabel = (k: string) => (k === 'interactive' ? 'Interactive' : k === 'article' ? 'Reading' : 'Video');

  // The Figma lesson player (frame 160:4400): a slim top bar with close,
  // breadcrumb, a segment per lesson, points; the lesson in a bordered panel;
  // the subject's lessons as cards on the right.
  return (
    <div className="min-h-[100dvh] bg-white text-[#16171b] dark:bg-[#121214] dark:text-white">
      <header className="flex h-[60px] items-center gap-3 px-[6px] pr-4">
        <Link to={back} aria-label="Close lesson" className="flex h-[48px] w-[37px] shrink-0 items-center justify-center rounded-lg bg-[#f2f3f5] text-[#3a3a3a] transition hover:bg-[#e8e9ec] dark:bg-white/10 dark:text-white">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </Link>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm font-semibold">
          <Link to="/app/topics" className="max-w-[110px] truncate text-[#2a2a2a] dark:text-[#d0d0d6] max-md:hidden">{l.course.title}</Link>
          <span className="text-[#888] max-md:hidden">›</span>
          <Link to={back} className="max-w-[110px] truncate text-[#2a2a2a] dark:text-[#d0d0d6] max-sm:hidden">{l.subject.title}</Link>
          <span className="text-[#888] max-sm:hidden">›</span>
          <span className="truncate text-[#1c8a4a] dark:text-[#4ade80]">{l.title}</span>
        </nav>
        <div className="ml-3 flex min-w-[80px] flex-1 items-center gap-[6px] max-sm:hidden" aria-label={index >= 0 ? `Lesson ${index + 1} of ${lessons.length}` : undefined}>
          {lessons.map((x) => (
            <span key={x.id} className="relative h-[9px] max-w-[226px] flex-1 overflow-hidden rounded-full bg-[#eef0f2] dark:bg-white/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-[#1c8a4a] dark:bg-[#4ade80]"
                style={{ width: x.completed ? '100%' : x.id === l.id ? `${x.durationSeconds ? Math.max(4, Math.min(100, (100 * x.positionSeconds) / x.durationSeconds)) : 4}%` : '0%' }}
              />
            </span>
          ))}
        </div>
        <span className="ml-auto shrink-0"><WatchStats /></span>
      </header>
      <div className="grid gap-5 px-[14px] pb-10 pt-[24px] lg:grid-cols-[minmax(0,1fr)_304px]">
        <div className="min-w-0">
          <div className="overflow-hidden rounded-[4px] border border-[#dfe1e4] bg-white dark:border-white/10 dark:bg-[#17171a]">
            {l.locked ? (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
                <h2 className="text-xl font-semibold">This lesson is part of {l.course.title}</h2>
                <p className="text-sm text-[#69738e]">Unlock the course once to open every lesson.</p>
                <Link className="mt-2 rounded-full bg-[#456dff] px-6 py-3 text-sm font-semibold text-white shadow-[0_3px_0_#2e4ec3]" to={`/app/premium/${l.course.slug}`}>Unlock the course</Link>
              </div>
            ) : (
              <LessonBody lesson={l} onSave={save} onEnded={() => l.nextId && navigate(`/app/watch/${l.nextId}`)} onExit={() => navigate(back)} />
            )}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-semibold">{l.title}</h1>
            {l.completed ? <span className="rounded-full bg-[#e7f6ec] px-3 py-1 text-xs font-semibold text-[#1c8a4a] dark:bg-[#1c8a4a]/20 dark:text-[#4ade80]">Completed</span> : null}
          </div>
          {l.description ? <p className="mt-2 text-sm text-[#69738e] dark:text-[#a6a6af]">{l.description}</p> : null}
          <div className="mt-5 flex items-center gap-3">
            {l.prevId ? <Link className="rounded-full border border-[#dfe1e4] px-5 py-2.5 text-sm font-semibold dark:border-white/15" to={`/app/watch/${l.prevId}`}>← Previous</Link> : null}
            <span className="flex-1" />
            {l.nextId ? <Link className="rounded-full bg-[#456dff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_3px_0_#2e4ec3]" to={`/app/watch/${l.nextId}`}>Next lesson →</Link> : null}
          </div>
        </div>
        <aside className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-[26px]">{l.subject.title}</h2>
          {subject ? (
            <ol className="mt-[10px] space-y-[13px]">
              {lessons.map((x, i) => {
                const open = subject.owned || x.isPreview;
                const current = x.id === l.id;
                const card = (
                  <span className={'flex gap-[11px] rounded-[10px] p-[6px] transition ' + (current ? 'border-l-[3px] border-[#2563eb] bg-[#f3f4f6] dark:bg-white/[0.06]' : 'hover:bg-[#f7f7f8] dark:hover:bg-white/[0.04]')}>
                    <span className="relative flex h-[68px] w-[122px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-[#e5e7eb] bg-[#9aa3b2] dark:border-white/10">
                      {x.kind === 'video' && l.posterUrl && current ? <img src={l.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
                      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden className="relative"><path d="M0 0v18l16-9z" fill="#fff" /></svg>
                      {x.durationSeconds ? <span className="absolute bottom-[4px] right-[4px] rounded-[4px] bg-[#1f2937] px-[5px] text-[11px] font-semibold leading-[18px] text-white">{duration(x.durationSeconds)}</span> : null}
                      {!open ? <span className="absolute left-1 top-1 text-xs" aria-label="Locked">🔒</span> : null}
                    </span>
                    <span className="min-w-0 pt-[5px]">
                      <span className="block text-xs font-semibold text-[#4b5563] dark:text-[#a6a6af]">{i + 1}/{lessons.length}</span>
                      <span className="mt-[3px] block text-sm font-semibold leading-5">{x.title}</span>
                      <span className="mt-[3px] block text-xs leading-5 text-[#6b7280]">{kindLabel(x.kind)} · {current ? 'Now playing' : x.completed ? 'Done' : open ? 'Click to watch' : 'Locked'}</span>
                    </span>
                  </span>
                );
                return (
                  <li key={x.id}>
                    {open && !current ? <Link to={`/app/watch/${x.id}`} className="block">{card}</Link> : <div aria-current={current ? 'true' : undefined}>{card}</div>}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="mt-3 h-[240px] animate-pulse rounded-lg bg-[#f2f3f5] dark:bg-white/5" />
          )}
        </aside>
      </div>
    </div>
  );
}

function WatchStats() {
  const { points } = usePoints();
  return (
    <span className="flex items-center gap-[7px] text-[17px] font-semibold text-[#6b7280] dark:text-[#a6a6af]">
      {points}
      <Sparkles className="h-[18px] w-[18px] text-[#22c55e]" />
      <Bolt className="text-[#fbbf24]" />
    </span>
  );
}

