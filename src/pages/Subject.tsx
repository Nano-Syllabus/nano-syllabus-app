// /app/courses/:slug/:subject, the Figma subject path (160:4045, dark
// 160:4402): the subject card on the left; on the right the unit header and
// a winding path of lessons, the current one marked by the mascot, with a
// floating "Start" card for it. Lessons are the subject's real lessons.
import { Link, useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail, LessonSummary, SubjectDetail } from '../lib/types';
import { subjectIcon } from './Topics';

// Horizontal offsets of the path's stops, as drawn in the frame.
const ZIG = [0, 45, 101, 154, 101, 45];

function Bars({ filled, active }: { filled: number; active: boolean }) {
  return (
    <span className="flex gap-[5px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={'h-[7px] w-[29px] rounded-[5px] ' + (i < filled ? 'bg-[#7491ff]' : active ? 'bg-[#d9d9d9] dark:bg-white/25' : 'bg-[#d9d9d9] dark:bg-white/20')} />
      ))}
    </span>
  );
}

export function Stop({ l, i, current, open, href }: { l: LessonSummary; i: number; current: boolean; open: boolean; href: string }) {
  const filled = l.completed ? 3 : current && l.durationSeconds ? Math.min(2, Math.floor((3 * l.positionSeconds) / l.durationSeconds)) : current ? 1 : 0;
  return <PathStop title={l.title} i={i} filled={filled} done={l.completed} current={current} open={open} href={href} />;
}

/** One stop on the winding path. `external` links leave the SPA (e.g. /em/). */
export function PathStop({ title, i, filled, done, current, open, href, external, note, soon }: { title: string; i: number; filled: number; done: boolean; current: boolean; open: boolean; href: string | null; external?: boolean; note?: string; soon?: boolean }) {
  const x = ZIG[i % ZIG.length];
  const label = (
    <span className="flex min-w-0 flex-col gap-[5px]">
      <Bars filled={filled} active={current} />
      <span className={'text-sm font-semibold leading-5 ' + (soon ? 'text-[#a3a3a3] dark:text-[#6b6b6b]' : current ? 'text-[#2e4ec3] dark:text-[#8ea4ff]' : done ? 'text-[#18251e] dark:text-[#dae7e0]' : 'text-[#595959] dark:text-[#9a9a9a]')}>
        {title}
        {note ? <span className="ml-1.5 align-middle text-[11px] font-medium text-[#1c8a4a] dark:text-[#4ade80]">· {note}</span> : null}
        {!open && !soon ? <span className="ml-1.5 align-middle text-[11px] font-medium text-[#858582]">· Locked</span> : null}
      </span>
      {soon ? <span className="w-max rounded-full bg-[#f1f2f4] px-2 py-[1px] text-[11px] font-medium text-[#8a8a8a] dark:bg-white/[0.06] dark:text-[#7a7a7a]">Coming soon</span> : null}
    </span>
  );
  const body = (
    <>
      {current ? (
        <img src="/app/node-active.webp" width={123} height={101} alt="" className="h-[101px] w-[123px] shrink-0 transition group-hover:scale-105" />
      ) : (
        <span className="flex h-[101px] w-[123px] shrink-0 items-end justify-center pb-[2px]">
          <img
            src="/app/node-idle.webp"
            width={93}
            height={56}
            alt=""
            className={'h-[56px] w-[93px] transition ' + (soon ? 'opacity-45 grayscale dark:opacity-30' : 'group-hover:scale-105 ' + (done ? '[filter:sepia(1)_saturate(6)_hue-rotate(195deg)_brightness(0.95)]' : 'dark:opacity-60'))}
          />
        </span>
      )}
      {label}
    </>
  );
  const props = {
    className: 'group flex w-max max-w-full items-center gap-[21px]' + (href ? '' : ' cursor-default'),
    'aria-current': current ? ('step' as const) : undefined,
    'aria-label': `${title}${soon ? ', coming soon' : done ? ', done' : current ? ', up next' : ''}${open || soon ? '' : ', locked'}`,
  };
  return (
    <li className="relative" style={{ paddingLeft: `min(${x}px, 22vw)` }}>
      {!href ? <div {...props}>{body}</div> : external ? <a href={href} {...props}>{body}</a> : <Link to={href} {...props}>{body}</Link>}
    </li>
  );
}

/** The subject card on the left of the path (frame 160:4045). */
export function SubjectCard({ hero, title, pct, summary, total, exercises, topics, unlock, children }: { hero: string; title: string; pct: number; summary: string; total: number; exercises?: number; topics?: number; unlock: string | null; children?: React.ReactNode }) {
  return (
    <section className="rounded-[25.6px] border-[0.75px] border-[#b4b4b4] bg-white px-[32px] pb-[40px] pt-[12px] dark:border-white/20 dark:bg-[#141414] md:sticky md:top-[85px]">
      <img src={hero} width={119} height={104} alt="" className={'h-[104px] w-[119px] object-contain ' + (hero.includes('ic-') ? 'mix-blend-multiply dark:mix-blend-screen dark:invert dark:hue-rotate-180' : '')} />
      <div className="mt-[26px] flex items-baseline justify-between gap-4">
        <h1 className="font-clash text-2xl font-semibold leading-8 text-black dark:text-white">{title}</h1>
        <span className="text-xl font-semibold leading-7 text-[#456dff] dark:text-white">{pct}%</span>
      </div>
      {summary ? <p className="mt-[15px] max-w-[414px] text-base leading-6 text-[#4a4a4a] dark:text-[#b8b8b8]">{summary}</p> : null}
      <div className="mt-[15px] inline-flex h-[38px] items-center rounded-full bg-[#f5f5ff] px-4 text-xs text-[#03041f] dark:bg-white/10 dark:text-white">
        <span className="flex items-center gap-[9px]">
          <span className="flex h-[23px] w-[21px] items-center justify-center rounded-full bg-[#456dff] dark:bg-white">
            <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden><path d="M0 0v11l9-5.5z" className="fill-white dark:fill-[#141414]" /></svg>
          </span>
          {total} {total === 1 ? 'Lesson' : 'Lessons'}
        </span>
        <span className="mx-[6px] h-7 w-px bg-[#d7daed] dark:bg-white/20" />
        <span className="flex items-center gap-[9px]">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-[#2d3044] dark:text-white"><path fill="currentColor" d="M2 9h3V7h2v10H5v-2H2zm20 0h-3V7h-2v10h2v-2h3zM9 11h6v2H9z" /></svg>
          {topics !== undefined ? `${topics} ${topics === 1 ? 'Topic' : 'Topics'}` : `${exercises ?? 0} ${exercises === 1 ? 'Exercise' : 'Exercises'}`}
        </span>
      </div>
      {unlock ? (
        <Link to={unlock} className="mt-6 flex h-11 items-center justify-center rounded-full bg-[#456dff] text-sm font-semibold text-white shadow-[0_4px_0_#2e4ec3] transition hover:brightness-105">
          Unlock the full subject
        </Link>
      ) : null}
      {children}
    </section>
  );
}

/** The floating card for the next lesson, with its Start / Continue button. */
export function StartCard({ lesson }: { lesson: LessonSummary }) {
  return <NextCard title={lesson.title} href={`/app/watch/${lesson.id}`} label={lesson.completed || lesson.positionSeconds ? 'Continue' : 'Start'} />;
}

export function NextCard({ title, href, label, external }: { title: string; href: string; label: string; external?: boolean }) {
  const cls = 'relative mt-[20px] flex h-[47px] items-center justify-center overflow-hidden rounded-[50px] bg-[#456dff] text-base font-semibold text-white shadow-[0_3px_0_#2e4ec3] transition hover:brightness-105';
  const inner = (
    <>
      <span aria-hidden className="absolute left-[18px] top-0 h-full w-[127px] bg-[linear-gradient(115deg,transparent_0_28%,rgba(255,255,255,0.18)_28%_44%,transparent_44%_52%,rgba(255,255,255,0.18)_52%_66%,transparent_66%)]" />
      <span className="relative [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]">{label}</span>
    </>
  );
  return (
    <div className="pointer-events-none sticky bottom-0 z-10 -mx-[142px] mt-16 max-md:static max-md:mx-0 max-md:mt-12">
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[325px] bg-[radial-gradient(60%_70%_at_50%_100%,rgba(69,109,255,0.22),rgba(69,109,255,0))]" />
      <div className="pointer-events-auto relative mx-auto mb-6 w-[min(457px,100%)] rounded-[33.7px] border-[1.7px] border-[#e5e5e5] bg-white px-[15px] pb-[15px] pt-[22px] text-center shadow-[0_8px_30px_rgba(69,109,255,0.10)] dark:border-white/15 dark:bg-[#1a1a1a]">
        <p className="text-xl font-semibold leading-7 text-black dark:text-white">{title}</p>
        {external ? <a href={href} className={cls}>{inner}</a> : <Link to={href} className={cls}>{inner}</Link>}
      </div>
    </div>
  );
}

/** The "Unit N" header card above a unit's path. */
export function UnitHeader({ no, title }: { no: number; title: string }) {
  return (
    <div className="rounded-[20.7px] bg-[#7491ff] pb-[5px] dark:bg-[#2c4ff0]">
      <div className="rounded-[18.7px] border border-[#7491ff] bg-white px-6 py-[10px] text-center dark:border-[#2c4ff0] dark:bg-[#141414]">
        <p className="text-xs font-semibold leading-4 text-[#7491ff] dark:text-[#5b7bff]">Unit {no}</p>
        <p className="mt-[3px] text-base leading-6 text-black dark:text-white">{title}</p>
      </div>
    </div>
  );
}

export default function Subject() {
  const { slug = '', subject = '' } = useParams();
  const { user } = useAuth();
  const { data: s, error } = useQuery<SubjectDetail>(
    `subject:${slug}/${subject}`,
    `/api/courses/${encodeURIComponent(slug)}/subjects/${encodeURIComponent(subject)}`,
  );
  const { data: course } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  useSeo({ title: `${s?.title ?? 'Subject'} · ${SITE}`, noindex: true });
  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="mx-auto w-[min(1030px,100%-32px)] py-16"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!s) {
    return (
      <div className="mx-auto grid w-[min(1030px,100%-32px)] gap-16 py-16 md:grid-cols-[482px_1fr]">
        <div className="h-[332px] animate-pulse rounded-[26px] bg-[#f5f6f8] dark:bg-white/5" />
        <div className="h-[72px] animate-pulse rounded-[21px] bg-[#f5f6f8] dark:bg-white/5" />
      </div>
    );
  }

  const has = s.owned || user?.role === 'admin';
  const canOpen = (l: LessonSummary) => has || l.isPreview;
  const total = s.lessons.length;
  const done = s.lessons.filter((l) => l.completed).length;
  const pct = total ? Math.round((100 * done) / total) : 0;
  const exercises = s.lessons.filter((l) => l.kind === 'interactive').length;
  const current = s.lessons.find((l) => !l.completed && canOpen(l)) ?? null;
  const unitNo = Math.max(1, (course?.subjects.findIndex((x) => x.slug === s.slug) ?? 0) + 1);
  const summary = s.description || s.lessons.slice(0, 3).map((l) => l.title).join(', ');
  const premium = `/app/premium/${slug}`;
  const icon = subjectIcon(s.title, unitNo - 1);
  const hero = icon.includes('ic-physics') ? '/app/subject-hero.webp' : icon;

  return (
    <div className="mx-auto grid w-[min(1030px,100%-32px)] items-start gap-x-[62px] gap-y-10 pb-28 pt-[65px] max-md:pt-8 md:grid-cols-[482px_minmax(0,457px)]">
      <SubjectCard hero={hero} title={s.title} pct={pct} summary={summary} total={total} exercises={exercises} unlock={!has && course && course.pricePaisa > 0 ? premium : null} />

      <section className="relative min-w-0">
        <UnitHeader no={unitNo} title={s.title.replace(/^Unit \d+\s*·\s*/, '')} />
        {total === 0 ? (
          <p className="mt-16 text-center text-sm text-[#6d7971]">Lessons for this subject are on the way.</p>
        ) : (
          <ol className="mt-[92px] space-y-[64px] max-md:mt-12 max-md:space-y-10 pl-[42px] max-sm:pl-0">
            {s.lessons.map((l, i) => (
              <Stop key={l.id} l={l} i={i} current={current?.id === l.id} open={canOpen(l)} href={canOpen(l) ? `/app/watch/${l.id}` : premium} />
            ))}
          </ol>
        )}
        {current ? <StartCard lesson={current} /> : null}
      </section>
    </div>
  );
}
