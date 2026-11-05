// The course path for a course that is its own app (Electrical Machines =
// the brilliant-sample app at /em/). The path is that app's own outline
// (/em/outline.json: unit → micro-topic → segment), so it matches the player
// exactly, and every segment opens the app's player at that segment
// (/em/<course>/<unit>/lesson/<screen>). Progress is the app's own record in
// this browser (localStorage em-progress-v4, same origin).
import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ErrorBox } from '../components/bits';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { CourseDetail } from '../lib/types';
import { NextCard, PathStop, SubjectCard, UnitHeader } from './Subject';
import { subjectIcon } from './Topics';

type Segment = { label: string; start: number; end: number };
type Topic = { num: string; title: string; start: number; end: number; segments: Segment[] };
type Unit = { num: number; slug: string; title: string; screens: number; topics: Topic[] };
type Outline = { course: string; demo?: { unit: string; topic: string }; units: Unit[] };
type Rec = { done?: string[]; pos?: number; max?: number };

function readProgress(): Record<string, Rec> {
  try {
    return JSON.parse(localStorage.getItem('em-progress-v4') ?? 'null')?.units ?? {};
  } catch {
    return {};
  }
}

export default function AppCoursePath({ slug, app, c }: { slug: string; app: string; c: CourseDetail }) {
  const { user } = useAuth();
  const base = app.replace(/\/$/, '');
  const { data: o, error } = useQuery<Outline>(`outline:${slug}`, `${base}/outline.json`);
  const ready = Boolean(o);
  useEffect(() => {
    if (!ready) return;
    const el = document.querySelector('[aria-current="step"]');
    if (el && el.getBoundingClientRect().bottom > window.innerHeight - 220) el.scrollIntoView({ block: 'center' });
  }, [ready]);

  // No outline (the app build hasn't shipped one): open the app itself, as
  // before, or the buy page.
  if (error?.status === 403 || error?.status === 404) return <Navigate to={c.owned || user?.role === 'admin' ? `/app/courses/${slug}/learn` : `/app/premium/${slug}`} replace />;
  if (error) return <main className="mx-auto w-[min(1030px,100%-32px)] py-16"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!o) {
    return (
      <div className="mx-auto grid w-[min(1030px,100%-32px)] gap-16 py-16 md:grid-cols-[482px_1fr]">
        <div className="h-[332px] animate-pulse rounded-[26px] bg-[#f5f6f8] dark:bg-white/5" />
        <div className="h-[72px] animate-pulse rounded-[21px] bg-[#f5f6f8] dark:bg-white/5" />
      </div>
    );
  }

  const has = c.owned || user?.role === 'admin';
  const premium = `/app/premium/${slug}`;
  const progress = readProgress();
  const status = (u: Unit) => {
    const r = progress[u.slug] ?? {};
    const finished = (r.done ?? []).includes(`em-${u.slug}`);
    return { finished, furthest: Math.max(r.max ?? 0, r.pos ?? 0) };
  };
  const lessonUrl = (u: Unit, n: number) => `${base}/${encodeURIComponent(o.course)}/${encodeURIComponent(u.slug)}/lesson/${n}`;
  // No free taster inside the app (the server serves /em/ to buyers and admins only).
  const isDemo = (_u: Unit, _t: Topic) => false;

  // Where the mascot waits: the first started-but-unfinished unit, else the
  // first unfinished one; inside it, the segment holding the furthest screen.
  const units = o.units.filter((u) => u.topics.length);
  const started = units.find((u) => { const s = status(u); return !s.finished && s.furthest > 0; });
  const nextUnit = has ? started ?? units.find((u) => !status(u).finished) : units.find((u) => u.topics.some((t) => isDemo(u, t)));
  let next: { u: Unit; t: Topic; s: Segment; at: number } | null = null;
  if (nextUnit) {
    const { furthest } = status(nextUnit);
    for (const t of nextUnit.topics) for (const s of t.segments) {
      if (!next && (has ? furthest <= s.end : isDemo(nextUnit, t))) next = { u: nextUnit, t, s, at: has ? Math.max(s.start, furthest) : s.start };
    }
  }

  const totalScreens = units.reduce((n, u) => n + u.screens, 0);
  const seen = units.reduce((n, u) => { const s = status(u); return n + (s.finished ? u.screens : Math.min(u.screens, s.furthest)); }, 0);
  const pct = has && totalScreens ? Math.round((100 * seen) / totalScreens) : 0;
  const segments = units.reduce((n, u) => n + u.topics.reduce((m, t) => m + t.segments.length, 0), 0);
  const topics = units.reduce((n, u) => n + u.topics.length, 0);
  const icon = subjectIcon(c.title, 0);
  const hero = icon.includes('ic-physics') ? '/app/subject-hero.webp' : icon;
  const demoHref = premium;

  return (
    <div className="mx-auto grid w-[min(1030px,100%-32px)] items-start gap-x-[62px] gap-y-10 pb-28 pt-[65px] max-md:pt-8 md:grid-cols-[482px_minmax(0,457px)]">
      <SubjectCard hero={hero} title={c.title} pct={pct} summary={c.tagline || c.description} total={segments} topics={topics} unlock={has ? null : premium} />

      <section className="relative min-w-0">
        {units.map((u, ui) => {
          const { finished, furthest } = status(u);
          let i = 0;
          return (
            <div key={u.slug} className={ui ? 'mt-[72px]' : ''}>
              <UnitHeader no={u.num} title={u.title} />
              {u.topics.map((t) => (
                <div key={t.num} className="mt-10">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="h-px flex-1 bg-[#e5e5e5] dark:bg-white/10" />
                    <span className="min-w-0 text-center font-semibold text-[#595959] dark:text-[#b8b8b8]"><span className="text-black dark:text-white">{t.num}</span> {t.title}</span>
                    <span className="h-px flex-1 bg-[#e5e5e5] dark:bg-white/10" />
                  </div>
                  <ol className="mt-8 space-y-6 pl-[42px] max-sm:pl-0">
                    {t.segments.map((s) => {
                      const demo = !has && isDemo(u, t);
                      const open = has ? finished || s.start <= furthest : demo;
                      const done = has && (finished || furthest > s.end);
                      const current = next?.u === u && next.s === s;
                      const filled = done ? 3 : current ? Math.max(1, Math.min(2, Math.floor((3 * (furthest - s.start)) / Math.max(1, s.end - s.start + 1)))) : 0;
                      const href = has ? (open ? lessonUrl(u, current ? next!.at : s.start) : null) : demo ? demoHref : premium;
                      return (
                        <PathStop
                          key={s.start}
                          title={s.label}
                          i={i++}
                          filled={filled}
                          done={done}
                          current={current}
                          open={open}
                          href={href}
                          external={Boolean(href && href.startsWith(base + '/'))}
                          note={demo ? 'Free' : undefined}
                        />
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          );
        })}
        {next ? (
          <NextCard
            title={`${next.t.num} · ${next.s.label}`}
            href={has ? lessonUrl(next.u, next.at) : demoHref}
            label={has && next.at > 0 ? 'Continue' : has ? 'Start' : 'Watch free'}
            external
          />
        ) : has ? null : (
          <p className="mt-10 text-center text-sm"><Link to={premium} className="font-semibold text-[#456dff]">Unlock the course</Link></p>
        )}
      </section>
    </div>
  );
}
