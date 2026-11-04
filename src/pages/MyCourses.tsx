// /app/courses: nano_sylabus's "My Subjects" page for this app's courses:
// the learner's courses first, then the rest of the catalogue.

import { Link } from 'react-router-dom';
import { ErrorBox } from '../components/bits';
import { useQuery } from '../lib/api';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard as Card, Home } from '../lib/types';
import { hubContainerClass, hubMainClass } from '../ui/hub';

const cardClass =
  'group flex flex-col rounded-[20px] border border-[#e5e7eb] bg-white p-5 no-underline shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition hover:border-border-strong/40 hover:shadow-sm dark:border-border dark:bg-card';

function CourseTile({ c, done }: { c: Card; done?: number }) {
  const pct = done != null && c.lessonCount ? Math.round((done / c.lessonCount) * 100) : null;
  return (
    <Link to={`/courses/${c.slug}`} className={cardClass}>
      {c.coverUrl ? (
        <img src={c.coverUrl} alt="" loading="lazy" className="mb-4 aspect-[16/9] w-full rounded-xl border border-border object-cover" />
      ) : (
        <div className="mb-4 grid aspect-[16/9] w-full place-items-center rounded-xl border border-black/10 bg-[#cbf738] font-display text-2xl font-semibold tracking-tight text-black">
          {c.title.split(' ').slice(0, 2).map((w) => w[0]).join('')}
        </div>
      )}
      <p className="type-student-eyebrow text-[#6b7280] dark:text-text-muted">{c.level || 'Course'}</p>
      <h3 className="type-student-card-title mt-1 text-text-primary">{c.title}</h3>
      {c.tagline && <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-text-secondary">{c.tagline}</p>}
      <div className="mt-auto pt-4">
        {pct != null ? (
          <>
            <div className="flex justify-between text-[12px] text-text-muted">
              <span>
                {done}/{c.lessonCount} lessons
              </span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f1f3f5] dark:bg-bg-tertiary">
              <div className="h-full rounded-full bg-[#84cc16]" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-[12px] text-text-muted">
            <span>
              {c.subjectCount} subjects · {c.lessonCount} lessons
            </span>
            <span className={c.pricePaisa ? 'font-semibold text-text-primary' : 'font-semibold text-success'}>{c.pricePaisa ? `Rs ${Math.round(c.pricePaisa / 100)}` : 'Free'}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MyCourses() {
  const { data: home, error } = useQuery<Home>('home', '/api/me/home');
  const { data: all } = useQuery<{ courses: Card[] }>('courses', '/api/courses');
  useSeo({ title: `My Courses · ${SITE}`, noindex: true });
  const mine = new Set(home?.courses.map((c) => c.slug));
  const more = all?.courses.filter((c) => !mine.has(c.slug)) ?? [];

  return (
    <main className={hubMainClass}>
      <div className={hubContainerClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-student-page-title text-text-primary">My Courses</h1>
          <a href="#browse" className="inline-flex h-10 items-center rounded-full border border-border bg-bg-primary px-4 text-sm font-medium text-text-primary no-underline transition hover:bg-bg-secondary">
            Browse courses
          </a>
        </div>
        <p className="mt-3 text-sm text-text-secondary">Your courses appear first. Every lesson you finish counts towards your hub.</p>
        {error && <ErrorBox message={error.message} retry={() => location.reload()} />}

        {home && !home.courses.length ? (
          <div className="mt-6 rounded-[20px] border border-dashed border-border px-6 py-14 text-center">
            <p className="type-student-card-title text-text-primary">No courses yet</p>
            <p className="mt-1 text-sm text-text-secondary">Start a free course or buy one below to see it here.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home?.courses.map((c) => <CourseTile key={c.slug} c={c} done={c.done} />) ??
              [0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-[20px] bg-bg-secondary" />)}
          </div>
        )}

        {more.length > 0 && (
          <section id="browse" className="mt-12 scroll-mt-6">
            <h2 className="type-student-section-title text-text-primary">More courses</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((c) => (
                <CourseTile key={c.slug} c={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
