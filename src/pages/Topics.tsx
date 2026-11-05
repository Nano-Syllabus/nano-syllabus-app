// /app/topics/:program, the Figma "Topics" frame (160:4696, dark 160:6822):
// the program name, then one row per semester with its subjects as tiles
// (src/data/curriculum.ts). A subject taught by a catalogue course opens it,
// or shows a lock ("Click to unlock") when that course is paid and not owned;
// a subject with no lessons yet says "Coming soon".
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQueries, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard, CourseDetail } from '../lib/types';
import { Bolt } from '../ui/TopNav';
import { PROGRAMS, type Semester } from '../data/curriculum';

const ICONS: [RegExp, string][] = [
  [/physic|motor|machine|magnet|field|wave|electromag|antenna|propagation|microwave/i, 'ic-physics'],
  [/program|code|software|web|java|python|graphics|intelligence|network|ict/i, 'ic-code'],
  [/discrete|statistic|probab|numeric|algebra|sigma/i, 'ic-sigma'],
  [/math|calculus|geometry/i, 'ic-math'],
  [/logic|digital|circuit|gate|electronic|filter|signal|instrument|control|communication|wireless/i, 'ic-logic'],
  [/object|oop|design|system/i, 'ic-oop'],
  [/micro|processor|chip|computer|architecture|transformer|generator|embedded|robot/i, 'ic-chip'],
];
const ROTATE = ['ic-physics', 'ic-code', 'ic-math', 'ic-logic', 'ic-oop', 'ic-chip', 'ic-sigma'];

export function subjectIcon(title: string, i: number) {
  for (const [re, name] of ICONS) if (re.test(title)) return `/app/${name}.webp`;
  return `/app/${ROTATE[i % ROTATE.length]}.webp`;
}

const STAR_KEY = 'ns-starred-semesters';
function useStars() {
  const [stars, setStars] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const toggle = (id: string) =>
    setStars((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      try {
        localStorage.setItem(STAR_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  return [stars, toggle] as const;
}

const Star = ({ on }: { on: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 2.6 2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z" fill={on ? '#ffc800' : 'none'} stroke={on ? '#ffc800' : 'currentColor'} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

const Lock = () => (
  <svg width="40" height="45" viewBox="0 0 40 45" aria-hidden="true">
    <path d="M10 18v-6a10 10 0 0 1 20 0v6" fill="none" stroke="currentColor" strokeWidth="4.5" />
    <rect x="1" y="18" width="38" height="26" rx="5" fill="currentColor" />
    <circle cx="20" cy="29" r="3.4" fill="#fff" className="dark:fill-[#2a2a2a]" />
    <path d="M18.6 30.5h2.8l.8 6h-4.4z" fill="#fff" className="dark:fill-[#2a2a2a]" />
  </svg>
);

type TileState = 'open' | 'locked' | 'soon';
type TileProps = { title: string; icon: string; state: TileState; to: string; pct: number; started: boolean; hint?: string };

function Tile({ title, icon, state, to, pct, started, hint }: TileProps) {
  const body =
    state === 'locked' ? (
      <span className="flex h-full flex-col items-center justify-center pt-4 text-[#858585] dark:text-[#6f6f6f]">
        <Lock />
        <span className="mt-[11px] text-[10px] leading-5 text-[#858582]">Click to unlock</span>
      </span>
    ) : (
      <span className="flex h-full flex-col items-center justify-center">
        <img src={icon} alt="" className={'max-h-[96px] max-w-[110px] object-contain mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180 ' + (state === 'soon' ? 'opacity-35 grayscale dark:opacity-45' : '')} />
        {state === 'soon' ? <span className="mt-2 text-[10px] leading-4 text-[#858582]">Coming soon</span> : null}
        {started ? (
          <span className="absolute inset-x-[18px] bottom-[30px] h-1 overflow-hidden rounded-full bg-[#e0e8e7] dark:bg-white/15">
            <span className="block h-full rounded-full bg-[#456dff]" style={{ width: `${Math.max(pct, 4)}%` }} />
          </span>
        ) : null}
      </span>
    );
  const card =
    'relative block h-[154px] w-[150px] max-sm:h-[136px] max-sm:w-[132px] rounded-[17.5px] bg-white transition dark:bg-[#141414] ' +
    (state === 'locked'
      ? 'rounded-[21px] border-[1.5px] border-[#484848] shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:border-[#3a3a3a] dark:bg-[#2a2a2a]'
      : state === 'soon'
        ? 'border border-dashed border-[#d6dad8] dark:border-white/20'
        : started
          ? 'border border-[#456dff]/60 shadow-[0_2px_12px_rgba(69,109,255,0.12)] dark:border-[#456dff]'
          : 'border border-[#e2ede5]/75 shadow-[0_2px_15px_rgba(0,0,0,0.04)] dark:border-white/80');
  const inner = (
    <>
      <span className={card + (state !== 'soon' ? ' group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_22px_rgba(0,0,0,0.10)]' : '')}>{body}</span>
      <span className={'mt-[13px] block text-center text-sm font-semibold leading-5 ' + (state === 'soon' ? 'text-[#7d8681] dark:text-[#8a948f]' : 'text-[#18251e] dark:text-[#dae7e0]')}>{title}</span>
    </>
  );
  if (state === 'soon') return <div className="flex w-[163px] max-sm:w-[140px] flex-col items-center" title={hint} aria-label={`${title}: coming soon`}>{inner}</div>;
  return (
    <Link to={to} title={hint} className="group flex w-[163px] max-sm:w-[140px] flex-col items-center" aria-label={state === 'locked' ? `${title}: unlock` : title}>
      {inner}
    </Link>
  );
}

/** The grey tray the tiles sit in. */
function Tray({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[30px] rounded-[32px] border-2 border-[#f6f6f9] bg-[#f5f6f8] p-[3px] dark:border-white/[0.06] dark:bg-[#1c1c1c]">
      <div className="flex flex-wrap gap-x-[20px] gap-y-6 rounded-[29px] border-[1.6px] border-white px-[32px] pb-[30px] pt-[51px] dark:border-white/[0.04] max-sm:justify-center max-sm:gap-x-3 max-sm:px-3 max-sm:pt-8">
        {children}
      </div>
    </div>
  );
}

function UnlockPill({ slug }: { slug: string }) {
  return (
    <Link
      to={`/app/premium/${slug}`}
      className="flex h-[43px] items-center gap-2 rounded-full border-2 border-[#6e5cff] bg-white px-[22px] text-base font-semibold text-[#1a1a1a] shadow-[0_0_0_1px_rgba(110,92,255,0.12)] transition hover:bg-[#f6f4ff] dark:bg-[#141414] dark:text-white"
    >
      <Bolt className="text-[#ffc800]" />
      Unlock All
    </Link>
  );
}

const hasAccess = (c: CourseDetail, admin: boolean) => c.owned || admin || c.pricePaisa === 0;

/** Where a whole course opens: its own app, or its first subject with lessons. */
function courseHref(c: CourseDetail) {
  if (config.appCourses[c.slug]) return `/app/courses/${c.slug}/learn`;
  const first = c.subjects.find((s) => s.lessonCount > 0);
  return first ? `/app/courses/${c.slug}/${first.slug}` : `/courses/${c.slug}`;
}

function SemesterRow({ sem, courses, starred, onStar }: { sem: Semester; courses: Map<string, CourseDetail>; starred: boolean; onStar: () => void }) {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const tiles = sem.subjects.map((x, i) => {
    const c = x.course ? courses.get(x.course) : undefined;
    const lessons = c ? c.subjects.reduce((n, s) => n + s.lessonCount, 0) : 0;
    const done = c ? c.subjects.reduce((n, s) => n + s.done, 0) : 0;
    const live = Boolean(c && (lessons > 0 || config.appCourses[c.slug]));
    const state: TileState = !c || !live ? 'soon' : hasAccess(c, admin) ? 'open' : 'locked';
    const to = !c ? '' : state === 'locked' ? `/app/premium/${c.slug}` : courseHref(c);
    const pct = lessons ? Math.round((100 * done) / lessons) : 0;
    return { x, i, state, to, pct, started: state === 'open' && done > 0, c };
  });
  const toUnlock = tiles.find((t) => t.state === 'locked')?.c;
  return (
    <section className="mt-[45px]">
      <div className="flex min-h-[76px] items-center gap-5 pl-3 max-sm:gap-3 max-sm:pl-0">
        <img src="/app/semester.webp" width={80} height={76} alt="" className="h-[76px] w-[80px] shrink-0 object-contain max-sm:h-14 max-sm:w-14" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 title={sem.part} className="font-clash text-2xl font-medium leading-8 text-[#18251e] dark:font-sans dark:font-semibold dark:text-[#dae7e0] max-sm:text-xl">Semester {sem.no}</h2>
          {toUnlock ? <UnlockPill slug={toUnlock.slug} /> : null}
        </div>
        <button type="button" onClick={onStar} aria-pressed={starred} aria-label={starred ? `Unstar semester ${sem.no}` : `Star semester ${sem.no}`} className="mr-[70px] cursor-pointer text-[#555] dark:text-[#bbb] max-md:mr-2">
          <Star on={starred} />
        </button>
      </div>
      <Tray>
        {tiles.map((t) => (
          <Tile key={t.x.code} title={t.x.title} hint={t.x.code} icon={subjectIcon(t.x.title, t.i)} state={t.state} to={t.to} pct={t.pct} started={t.started} />
        ))}
      </Tray>
    </section>
  );
}

export default function Topics() {
  const { program = '' } = useParams();
  const p = PROGRAMS.find((x) => x.slug === program && !x.soon);
  useSeo({ title: `${p?.short ?? 'Topics'} · ${SITE}`, noindex: true });
  const { data } = useQuery<{ courses: CourseCard[] }>('courses', '/api/courses');
  const slugs = (data?.courses ?? []).map((c) => c.slug);
  const details = useQueries<CourseDetail>(slugs.map((s) => [`course:${s}`, `/api/courses/${encodeURIComponent(s)}`]));
  const [stars, toggleStar] = useStars();
  useEffect(() => window.scrollTo(0, 0), [program]);
  const byslug = useMemo(() => new Map(details.filter((d): d is CourseDetail => Boolean(d)).map((d) => [d.slug, d])), [details]);
  if (!p) return <Navigate to="/app/topics" replace />;
  const loading = !data || details.some((d) => !d);
  return (
    <div className="mx-auto w-[min(1184px,100%-32px)] pb-20 pt-[64px] max-sm:pt-8">
      <h1 title={p.name} className="font-clash text-[32px] font-medium leading-10 text-[#18251e] dark:font-sans dark:font-semibold dark:text-[#dae7e0]">{p.short}</h1>
      {loading ? (
        <div aria-busy className="mt-[45px] h-[295px] animate-pulse rounded-[32px] bg-[#f5f6f8] dark:bg-white/5" />
      ) : (
        p.semesters.map((sem) => <SemesterRow key={sem.no} sem={sem} courses={byslug} starred={stars.includes(`${p.slug}-${sem.no}`)} onStar={() => toggleStar(`${p.slug}-${sem.no}`)} />)
      )}
    </div>
  );
}
