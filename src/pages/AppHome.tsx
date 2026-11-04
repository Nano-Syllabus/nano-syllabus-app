// /app: the Micro-Topics Hub, as nano_sylabus's challenges dashboard. The
// lime banner, four numbers, then the next lesson of every subject of the
// learner's courses. A learner with no course yet picks one first (the old
// app's "Your learning space" dialog).

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, GraduationCap } from 'lucide-react';
import { ErrorBox } from '../components/bits';
import { api, invalidate, prefetch, useQuery } from '../lib/api';
import { duration } from '../lib/format';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard as Card, Home } from '../lib/types';
import {
  StarterBanner,
  blueButtonClass,
  hubContainerClass,
  hubListCardClass,
  hubListHeaderClass,
  hubMainClass,
  hubMetricCardClass,
  hubMetricsClass,
  hubRowClass,
  hubRowsClass,
  hubTitleClass,
} from '../ui/hub';

const DAILY_TARGET = 3;

export default function AppHome() {
  const { data, error } = useQuery<Home>('home', '/api/me/home');
  const { data: all } = useQuery<{ courses: Card[] }>('courses', '/api/courses');
  useSeo({ title: `Micro-Topics Hub · ${SITE}`, noindex: true });

  const total = data?.courses.reduce((n, c) => n + c.lessonCount, 0) ?? 0;
  const done = data?.courses.reduce((n, c) => n + c.done, 0) ?? 0;
  const readiness = total ? Math.round((done / total) * 100) : 0;
  const today = data?.completedToday ?? 0;
  // Courses with their own app (Electrical Machines) get one row that opens it.
  const appCourses = data?.courses.filter((c) => config.appCourses[c.slug]) ?? [];
  const next = (data?.next ?? []).filter((n) => !config.appCourses[n.course.slug]);
  const first = next.find((n) => n.started) ?? next[0];
  const line = first ? `${first.subject.title}: ${first.title}` : data?.courses.length ? 'Every lesson done. Pick another course.' : 'Choose a course to get your next lesson.';

  return (
    <main className={hubMainClass}>
      <div className={hubContainerClass}>
        <h1 className={hubTitleClass}>Micro-Topics Hub</h1>
        {error && <ErrorBox message={error.message} retry={() => location.reload()} />}

        <StarterBanner line={line} position={first ? first.subjectDone + 1 : 1} />

        <section className={hubMetricsClass} aria-label="Your progress">
          <article className={hubMetricCardClass}>
            <p className="type-student-eyebrow text-[#6b7280] dark:text-text-muted">Course progress</p>
            <p className="type-student-metric mt-2 text-text-primary">{data ? `${readiness}%` : '–'}</p>
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-bg-tertiary" aria-hidden="true">
              <div className="h-full rounded-full bg-[#84cc16]" style={{ width: `${readiness}%` }} />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Average progress across {data?.courses.length ?? 0} course{data?.courses.length === 1 ? '' : 's'}
            </p>
          </article>
          <article className={hubMetricCardClass}>
            <p className="type-student-eyebrow text-[#6b7280] dark:text-text-muted">Streak</p>
            <p className="type-student-metric mt-2 text-text-primary">
              {data?.streak ?? 0} {data?.streak === 1 ? 'day' : 'days'}
            </p>
            <p className="mt-2 text-xs text-text-muted">{today ? 'Kept today' : 'Finish a lesson today to keep it'}</p>
          </article>
          <article className={hubMetricCardClass}>
            <p className="type-student-eyebrow text-[#6b7280] dark:text-text-muted">Today&apos;s goal</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="type-student-metric text-text-primary">{Math.min(today, DAILY_TARGET)}</span>
              <span className="type-student-metric text-[#84cc16]">/ {DAILY_TARGET}</span>
              {today > DAILY_TARGET ? <span className="ml-auto text-[13px] font-semibold tabular-nums text-success">+{today - DAILY_TARGET} extra</span> : null}
            </div>
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f3f5] dark:bg-bg-tertiary" aria-hidden="true">
              <div className="h-full rounded-full bg-[#2563eb] transition-[width] duration-300" style={{ width: `${Math.min(100, (today / DAILY_TARGET) * 100)}%` }} />
            </div>
          </article>
          <article className={hubMetricCardClass}>
            <p className="type-student-eyebrow text-[#6b7280] dark:text-text-muted">Lessons done</p>
            <p className="type-student-metric mt-2 text-text-primary">{data?.completedTotal ?? 0}</p>
            <p className="mt-2 text-xs text-text-muted">
              of {total} in your course{data?.courses.length === 1 ? '' : 's'}
            </p>
          </article>
        </section>

        <section className={hubListCardClass}>
          <div className={hubListHeaderClass}>
            <h2 className="type-student-section-title text-text-primary">Available lessons</h2>
            <Link to="/app/courses" className="text-[13px] font-medium text-[#2563eb] no-underline hover:underline dark:text-blue-400">
              All courses →
            </Link>
          </div>
          {!data ? (
            <div className="space-y-3 py-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-bg-secondary" />
              ))}
            </div>
          ) : next.length === 0 && appCourses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="type-student-card-title text-text-primary">{data.courses.length ? 'All caught up' : 'No lessons yet'}</p>
              <p className="mt-1 text-sm text-text-muted">
                {data.courses.length ? 'You have finished every lesson in your courses.' : 'Choose a course and its lessons will appear here.'}
              </p>
              <Link to="/app/courses" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-text-primary px-4 text-sm font-medium text-text-inverse no-underline hover:opacity-90">
                Browse courses
              </Link>
            </div>
          ) : (
            <div className={hubRowsClass}>
              {appCourses.map((c) => (
                <div key={c.slug} className={hubRowClass}>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                    <div className="w-full min-w-0 shrink-0 sm:w-[260px] md:w-[300px]">
                      <p className="truncate text-[15px] font-bold text-text-primary sm:text-[16px]">{c.title}</p>
                      <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#4b5563] dark:text-text-secondary sm:text-[15px]">Every unit, with Sparky: watch, try, then the model answer.</p>
                    </div>
                    <div className="min-w-0 flex-1 text-[12px] text-text-muted">{c.level}</div>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-6">
                    <Link to={`/app/courses/${c.slug}/learn`} className={`${blueButtonClass} w-[104px]`}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
              {next.map((n) => (
                <div key={n.lessonId} className={hubRowClass}>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                    <div className="w-full min-w-0 shrink-0 sm:w-[260px] md:w-[300px]">
                      <p className="truncate text-[15px] font-bold text-text-primary sm:text-[16px]">{n.subject.title}</p>
                      <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#4b5563] dark:text-text-secondary sm:text-[15px]">{n.title}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[12px] text-text-muted">
                        <span className="truncate">{n.course.title}</span>
                        <span className="tabular-nums">
                          {n.subjectDone}/{n.subjectTotal}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f3f5] dark:bg-bg-tertiary" aria-hidden="true">
                        <div className="h-full rounded-full bg-[#84cc16]" style={{ width: `${n.subjectTotal ? (n.subjectDone / n.subjectTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
                    <span className="w-[88px] shrink-0 text-right leading-tight">
                      <span className="block text-[14px] text-[#6b7280] dark:text-text-muted">{n.durationSeconds ? `~${Math.max(1, Math.round(n.durationSeconds / 60))} min` : duration(0)}</span>
                      <span className="block text-[11px] text-text-muted">{n.kind === 'video' ? 'video' : n.kind === 'article' ? 'reading' : 'interactive'}</span>
                    </span>
                    <Link to={`/app/watch/${n.lessonId}`} className={`${blueButtonClass} w-[104px]`}>
                      {n.started ? 'Continue' : 'Start'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {data && data.courses.length === 0 && all && all.courses.length > 0 && <CoursePicker courses={all.courses} />}
    </main>
  );
}

/** nano_sylabus's faculty-selection-dialog.tsx, choosing a course. */
function CoursePicker({ courses }: { courses: Card[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const [slug, setSlug] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  const chosen = courses.find((c) => c.slug === slug);

  async function save() {
    if (!chosen) return;
    setPending(true);
    setError('');
    try {
      if (chosen.pricePaisa > 0) {
        navigate(`/app/checkout/${chosen.slug}`);
        return;
      }
      await api(`/api/courses/${encodeURIComponent(chosen.slug)}/enroll`, { method: 'POST', body: {} });
      invalidate('home', `course:${chosen.slug}`);
      await prefetch('home', '/api/me/home');
      ref.current?.close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onCancel={(e) => e.preventDefault()}
      aria-labelledby="course-dialog-title"
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-border bg-bg-primary p-0 text-text-primary shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="border-b border-border bg-bg-secondary p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
          <GraduationCap size={26} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Your learning space</p>
        <h2 id="course-dialog-title" className="mt-2 text-2xl font-semibold tracking-tight">
          Choose your course
        </h2>
        <p className="mt-2 text-sm text-text-secondary">Pick the course you are studying for. Its lessons appear on your hub; you can add more courses any time.</p>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {courses.map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={slug === c.slug}
              onClick={() => setSlug(c.slug)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition ${slug === c.slug ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-600' : 'border-border hover:bg-bg-secondary'}`}
            >
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${slug === c.slug ? 'border-blue-600 bg-blue-600 text-white' : 'border-border'}`}>
                {slug === c.slug ? <Check size={12} /> : null}
              </span>
              <span>
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="mt-1 block text-xs text-text-muted">{c.level || c.tagline}</span>
                <span className="mt-2 block text-xs text-text-secondary">
                  {c.subjectCount} subjects · {c.lessonCount} lessons · {c.pricePaisa ? `Rs ${Math.round(c.pricePaisa / 100)}` : 'Free'}
                </span>
              </span>
            </button>
          ))}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!chosen || pending}
          onClick={() => void save()}
          className="min-h-12 w-full cursor-pointer rounded-xl bg-blue-600 px-4 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
        >
          {pending ? 'Setting up your course…' : chosen && chosen.pricePaisa > 0 ? 'Continue to payment' : 'Confirm course & continue'}
        </button>
        <button type="button" onClick={() => ref.current?.close()} className="block w-full cursor-pointer text-center text-sm text-text-muted hover:text-text-primary">
          I&apos;ll choose later
        </button>
      </div>
    </dialog>
  );
}
