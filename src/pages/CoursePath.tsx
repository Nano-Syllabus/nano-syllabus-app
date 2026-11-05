// /app/courses/:slug, a whole course as the Figma subject path (160:4045,
// dark 160:4402): the subject card on the left; on the right every unit as a
// "Unit N" header with its lessons on the winding path, the next lesson marked
// by the mascot, and the floating Start card. Units without lessons say so.
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { useQueries, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail, LessonSummary, SubjectDetail } from '../lib/types';
import { PathStop, StartCard, Stop, SubjectCard, UnitHeader } from './Subject';
import { subjectIcon } from './Topics';

const unitTitle = (t: string) => t.replace(/^Unit \d+\s*·\s*/, '');

/** "Ohm's law, air gaps, B-H curve." → ["Ohm's law", "Air gaps", "B-H curve"] */
function descTopics(d: string): string[] {
  return d
    .replace(/\.\s*$/, '')
    .replace(/\s+and the model answers.*$/i, '')
    .split(/,\s*/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 80)
    .map((t) => t[0].toUpperCase() + t.slice(1));
}

export default function CoursePath() {
  const { slug = '' } = useParams();
  return <PlainCoursePath key={slug} />;
}

function PlainCoursePath() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data: c, error } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const withLessons = (c?.subjects ?? []).filter((s) => s.lessonCount > 0);
  const details = useQueries<SubjectDetail>(
    withLessons.map((s) => [`subject:${slug}/${s.slug}`, `/api/courses/${encodeURIComponent(slug)}/subjects/${encodeURIComponent(s.slug)}`]),
  );
  useSeo({ title: `${c?.title ?? 'Course'} · ${SITE}`, noindex: true });
  const ready = Boolean(c) && !details.some((d) => !d);
  // Units without lessons come first in some courses; bring the next lesson
  // into view instead of leaving it below the fold.
  useEffect(() => {
    if (!ready) return;
    const el = document.querySelector('[aria-current="step"]');
    if (el && el.getBoundingClientRect().bottom > window.innerHeight - 220) el.scrollIntoView({ block: 'center' });
  }, [ready]);

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="mx-auto w-[min(1030px,100%-32px)] py-16"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!c || details.some((d) => !d)) {
    return (
      <div className="mx-auto grid w-[min(1030px,100%-32px)] gap-16 py-16 md:grid-cols-[482px_1fr]">
        <div className="h-[332px] animate-pulse rounded-[26px] bg-[#f5f6f8] dark:bg-white/5" />
        <div className="h-[72px] animate-pulse rounded-[21px] bg-[#f5f6f8] dark:bg-white/5" />
      </div>
    );
  }

  const lessonsOf = new Map(details.map((d) => [d!.slug, d!.lessons]));
  const all: LessonSummary[] = c.subjects.flatMap((s) => lessonsOf.get(s.slug) ?? []);
  const has = c.owned || user?.role === 'admin' || c.pricePaisa === 0;
  const canOpen = (l: LessonSummary) => has || l.isPreview;
  const total = all.length;
  const done = all.filter((l) => l.completed).length;
  const pct = total ? Math.round((100 * done) / total) : 0;
  const exercises = all.filter((l) => l.kind === 'interactive').length;
  const current = all.find((l) => !l.completed && canOpen(l)) ?? null;
  const premium = `/app/premium/${slug}`;
  const icon = subjectIcon(c.title, 0);
  const hero = icon.includes('ic-physics') ? '/app/subject-hero.webp' : icon;

  return (
    <div className="mx-auto grid w-[min(1030px,100%-32px)] items-start gap-x-[62px] gap-y-10 pb-28 pt-[65px] max-md:pt-8 md:grid-cols-[482px_minmax(0,457px)]">
      <SubjectCard hero={hero} title={c.title} pct={pct} summary={c.tagline || c.description} total={total} exercises={exercises} unlock={has ? null : premium} />

      <section className="relative min-w-0">
        {c.subjects.map((s, ui) => {
          const lessons = lessonsOf.get(s.slug) ?? [];
          // Every syllabus topic is a stop: its lesson(s), or a greyed "Coming soon"
          // stop. Lessons that name no topic follow in their own order.
          const stops: ({ lesson: LessonSummary } | { soon: string; key: string })[] = [];
          for (const t of s.topics ?? []) {
            const of = lessons.filter((l) => l.topic === t.id);
            if (of.length) of.forEach((l) => stops.push({ lesson: l }));
            else stops.push({ soon: t.title, key: `t-${t.id}` });
          }
          const known = new Set((s.topics ?? []).map((t) => t.id));
          lessons.filter((l) => !l.topic || !known.has(l.topic)).forEach((l) => stops.push({ lesson: l }));
          // No topics or lessons yet: the unit's description lists its syllabus
          // topics, so show those as greyed stops on the path.
          if (!stops.length) descTopics(s.description).forEach((t, k) => stops.push({ soon: t, key: `d-${k}` }));
          const prev = ui ? c.subjects[ui - 1] : null;
          return (
            <div key={s.slug} className={!prev ? '' : (lessonsOf.get(prev.slug) ?? []).length || prev.topics?.length ? 'mt-[72px]' : 'mt-8'}>
              <UnitHeader no={ui + 1} title={unitTitle(s.title)} />
              {stops.length ? (
                <ol className="mt-[64px] space-y-[64px] pl-[42px] max-md:mt-10 max-md:space-y-10 max-sm:pl-0">
                  {stops.map((x, i) =>
                    'lesson' in x ? (
                      <Stop key={x.lesson.id} l={x.lesson} i={i} current={current?.id === x.lesson.id} open={canOpen(x.lesson)} href={canOpen(x.lesson) ? `/app/watch/${x.lesson.id}` : premium} />
                    ) : (
                      <PathStop key={x.key} title={x.soon} i={i} filled={0} done={false} current={false} open={false} href={null} soon />
                    ),
                  )}
                </ol>
              ) : (
                <p className="mt-4 text-center text-sm text-[#858582] dark:text-[#8a8a8a]">Lessons for this unit are coming soon.</p>
              )}
            </div>
          );
        })}
        {current ? <StartCard lesson={current} /> : null}
      </section>
    </div>
  );
}
