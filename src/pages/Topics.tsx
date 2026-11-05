// /app/topics, the Figma "Topics" frame (160:4696, dark 160:6822): a program
// heading, then one row per course (the frame's "Semester" rows) with its
// subjects as tiles. A tile shows progress, or a lock ("Click to unlock")
// when the course is paid and not owned; the pill next to the row title
// opens the premium page. Every course and subject is real data.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { config } from '../lib/config';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard, CourseDetail, SubjectSummary } from '../lib/types';
import { Bolt } from '../ui/TopNav';

const ICONS: [RegExp, string][] = [
  [/physic|motor|machine|magnet|field|wave/i, 'ic-physics'],
  [/program|code|c\b|software|web|java|python/i, 'ic-code'],
  [/discrete|statistic|probab|numeric|algebra|sigma/i, 'ic-sigma'],
  [/math|calculus|geometry/i, 'ic-math'],
  [/logic|digital|circuit|gate/i, 'ic-logic'],
  [/object|oop|design|system/i, 'ic-oop'],
  [/micro|processor|chip|computer|architecture|transformer|generator/i, 'ic-chip'],
];
const ROTATE = ['ic-physics', 'ic-code', 'ic-math', 'ic-logic', 'ic-oop', 'ic-chip', 'ic-sigma'];

export function subjectIcon(title: string, i: number) {
  for (const [re, name] of ICONS) if (re.test(title)) return `/app/${name}.webp`;
  return `/app/${ROTATE[i % ROTATE.length]}.webp`;
}

const STAR_KEY = 'ns-starred-courses';
function useStars() {
  const [stars, setStars] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const toggle = (slug: string) =>
    setStars((s) => {
      const next = s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug];
      try {
        localStorage.setItem(STAR_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  return [stars, toggle] as const;
}

const Lock = () => (
  <svg width="40" height="45" viewBox="0 0 40 45" aria-hidden="true">
    <path d="M10 18v-6a10 10 0 0 1 20 0v6" fill="none" stroke="currentColor" strokeWidth="4.5" />
    <rect x="1" y="18" width="38" height="26" rx="5" fill="currentColor" />
    <circle cx="20" cy="29" r="3.4" fill="#fff" className="dark:fill-[#2a2a2a]" />
    <path d="M18.6 30.5h2.8l.8 6h-4.4z" fill="#fff" className="dark:fill-[#2a2a2a]" />
  </svg>
);

const Star = ({ on }: { on: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="m12 2.6 2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z"
      fill={on ? '#ffc800' : 'none'}
      stroke={on ? '#ffc800' : 'currentColor'}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

type TileState = 'open' | 'locked' | 'soon';

function Tile({ c, s, i, state }: { c: CourseDetail; s: SubjectSummary; i: number; state: TileState }) {
  const app = config.appCourses[c.slug];
  const to = state === 'locked' ? `/app/premium/${c.slug}` : app ? `/app/courses/${c.slug}/learn` : `/app/courses/${c.slug}/${s.slug}`;
  const pct = s.lessonCount ? Math.round((100 * s.done) / s.lessonCount) : 0;
  const started = s.done > 0;
  const body =
    state === 'locked' ? (
      <span className="flex h-full flex-col items-center justify-center pt-4 text-[#858585] dark:text-[#6f6f6f]">
        <Lock />
        <span className="mt-[11px] text-[10px] leading-5 text-[#858582]">Click to unlock</span>
      </span>
    ) : (
      <span className="flex h-full flex-col items-center justify-center">
        <img src={subjectIcon(s.title, i)} alt="" className={'max-h-[96px] max-w-[110px] object-contain dark:invert ' + (state === 'soon' ? 'opacity-40' : '')} />
        {state === 'soon' ? <span className="mt-2 text-[10px] leading-4 text-[#858582]">Coming soon</span> : null}
        {started ? (
          <span className="absolute inset-x-[18px] bottom-[30px] h-1 overflow-hidden rounded-full bg-[#e0e8e7] dark:bg-white/15">
            <span className="block h-full rounded-full bg-[#456dff]" style={{ width: `${Math.max(pct, 4)}%` }} />
          </span>
        ) : null}
      </span>
    );
  const card =
    'relative block h-[154px] w-[150px] rounded-[17.5px] bg-white transition dark:bg-[#141414] ' +
    (state === 'locked'
      ? 'rounded-[21px] border-[1.5px] border-[#484848] shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:border-[#3a3a3a] dark:bg-[#2a2a2a]'
      : started
        ? 'border border-[#456dff]/60 shadow-[0_2px_12px_rgba(69,109,255,0.12)] dark:border-[#456dff]'
        : 'border border-[#e2ede5]/75 shadow-[0_2px_15px_rgba(0,0,0,0.04)] dark:border-white/80');
  const inner = (
    <>
      <span className={card + (state !== 'soon' ? ' group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_22px_rgba(0,0,0,0.10)]' : '')}>{body}</span>
      <span className="mt-[13px] block text-center text-sm font-semibold leading-5 text-[#18251e] dark:text-[#dae7e0]">{s.title}</span>
    </>
  );
  if (state === 'soon') return <div className="w-[163px] flex flex-col items-center opacity-90" aria-disabled>{inner}</div>;
  return (
    <Link to={to} className="group flex w-[163px] flex-col items-center" aria-label={state === 'locked' ? `${s.title}: unlock` : s.title}>
      {inner}
    </Link>
  );
}

function CourseRow({ c, starred, onStar }: { c: CourseDetail; starred: boolean; onStar: () => void }) {
  const { user } = useAuth();
  const paid = c.pricePaisa > 0;
  const has = c.owned || user?.role === 'admin';
  const state = (s: SubjectSummary): TileState => {
    if (paid && !has) return 'locked';
    if (s.lessonCount === 0 && !config.appCourses[c.slug]) return 'soon';
    return 'open';
  };
  return (
    <section className="mt-[45px] first:mt-[45px]">
      <div className="flex min-h-[76px] items-center gap-5 pl-3 max-sm:gap-3 max-sm:pl-0">
        <img src="/app/semester.webp" width={80} height={76} alt="" className="h-[76px] w-[80px] shrink-0 object-contain max-sm:h-14 max-sm:w-14" />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="font-clash text-2xl font-medium leading-8 text-[#18251e] dark:font-sans dark:font-semibold dark:text-[#dae7e0] max-sm:text-xl">{c.title}</h2>
          {paid && !has ? (
            <Link
              to={`/app/premium/${c.slug}`}
              className="flex h-[43px] items-center gap-2 rounded-full border-2 border-[#6e5cff] bg-white px-[22px] text-base font-semibold text-[#1a1a1a] shadow-[0_0_0_1px_rgba(110,92,255,0.12)] transition hover:bg-[#f6f4ff] dark:bg-[#141414] dark:text-white"
            >
              <Bolt className="text-[#ffc800]" />
              Unlock All
            </Link>
          ) : null}
        </div>
        <button type="button" onClick={onStar} aria-pressed={starred} aria-label={starred ? 'Unstar' : 'Star'} className="mr-[70px] cursor-pointer text-[#555] dark:text-[#bbb] max-md:mr-2">
          <Star on={starred} />
        </button>
      </div>
      <div className="mt-[30px] rounded-[32px] border-2 border-[#f6f6f9] bg-[#f5f6f8] p-[3px] dark:border-white/[0.06] dark:bg-[#1c1c1c]">
        <div className="flex flex-wrap gap-x-[27px] gap-y-6 rounded-[29px] border-[1.6px] border-white px-[36px] pb-[30px] pt-[51px] dark:border-white/[0.04] max-sm:justify-center max-sm:gap-x-3 max-sm:px-3 max-sm:pt-8">
          {c.subjects.length ? (
            c.subjects.map((s, i) => <Tile key={s.slug} c={c} s={s} i={i} state={state(s)} />)
          ) : (
            <p className="py-10 text-sm text-[#6d7971]">Subjects are on the way.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Topics() {
  useSeo({ title: `Topics · ${SITE}`, noindex: true });
  const { data, error } = useQuery<{ courses: CourseCard[] }>('courses', '/api/courses');
  const list = data?.courses;
  const slugs = (list ?? []).map((c) => c.slug);
  const details = useQueries<CourseDetail>(slugs.map((s) => [`course:${s}`, `/api/courses/${encodeURIComponent(s)}`]));
  const [stars, toggleStar] = useStars();
  useEffect(() => window.scrollTo(0, 0), []);

  // Starred rows first, then paid courses, then free ones; grouped by level
  // (the frame's program heading).
  const groups = useMemo(() => {
    const ready = details.filter((d): d is CourseDetail => Boolean(d));
    ready.sort((a, b) => Number(stars.includes(b.slug)) - Number(stars.includes(a.slug)) || b.pricePaisa - a.pricePaisa);
    const map = new Map<string, CourseDetail[]>();
    for (const c of ready) {
      const key = c.level || 'Courses';
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()];
  }, [details, stars]);

  return (
    <div className="mx-auto w-[min(1184px,100%-32px)] pb-20 pt-[64px] max-sm:pt-8">
      {error ? <p className="text-sm text-[#c53030]">{error.message}</p> : null}
      {!list || details.some((d) => !d) ? (
        <div aria-busy className="space-y-8">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-[#f0f1f3] dark:bg-white/10" />
          <div className="h-[295px] animate-pulse rounded-[32px] bg-[#f5f6f8] dark:bg-white/5" />
        </div>
      ) : null}
      {groups.map(([level, courses], gi) => (
        <div key={level} className={gi ? 'mt-20' : ''}>
          <h1 className="font-clash text-[32px] font-medium leading-10 text-[#18251e] dark:font-sans dark:font-semibold dark:text-[#dae7e0]">{level}</h1>
          {courses.map((c) => (
            <CourseRow key={c.slug} c={c} starred={stars.includes(c.slug)} onStar={() => toggleStar(c.slug)} />
          ))}
        </div>
      ))}
    </div>
  );
}
