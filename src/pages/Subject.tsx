import { Link, useParams } from 'react-router-dom';
import { ErrorBox, NotFound, Progress } from '../components/bits';
import { useQuery } from '../lib/api';
import { duration, plural, price } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail, SubjectDetail } from '../lib/types';

export default function Subject() {
  const { slug = '', subject = '' } = useParams();
  const { data: s, error } = useQuery<SubjectDetail>(
    `subject:${slug}/${subject}`,
    `/api/courses/${encodeURIComponent(slug)}/subjects/${encodeURIComponent(subject)}`,
  );
  const { data: course } = useQuery<CourseDetail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  useSeo({ title: `${s?.title ?? 'Subject'} · ${SITE}`, noindex: true });

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!s) return <main className="wrap page narrow"><div className="skeleton" style={{ height: 300 }} /></main>;

  const done = s.lessons.filter((l) => l.completed).length;
  const next = s.lessons.find((l) => !l.completed && (s.owned || l.isPreview));

  return (
    <main className="wrap page narrow stack">
      <div className="row small">
        <Link to={`/courses/${slug}`} className="muted">{s.course.title}</Link>
        <span className="muted">/</span>
        <span>{s.title}</span>
      </div>
      <h1>{s.title}</h1>
      {s.description && <p className="muted">{s.description}</p>}

      {s.lessons.length > 0 && (
        <div className="stack" style={{ marginBottom: 8 }}>
          <Progress value={done / s.lessons.length} />
          <div className="row">
            <span className="muted small">{done} of {plural(s.lessons.length, 'lesson')} done</span>
            <span className="spacer" />
            {next && <Link className="btn btn-primary" to={`/app/watch/${next.id}`}>{done ? 'Continue' : 'Start'}</Link>}
          </div>
        </div>
      )}

      {!s.owned && course && course.pricePaisa > 0 && (
        <div className="alert row">
          <span style={{ flex: 1 }}>Preview lessons are open. Buy the course to unlock the rest.</span>
          <Link className="btn btn-primary" to={`/app/checkout/${slug}`}>Buy · {price(course.pricePaisa)}</Link>
        </div>
      )}

      <ol className="list">
        {s.lessons.map((l, i) => {
          const open = s.owned || l.isPreview;
          const inner = (
            <>
              <span className={l.completed ? 'icon-dot done' : 'icon-dot'} aria-hidden>{l.completed ? '✓' : open ? i + 1 : '🔒'}</span>
              <span className="grow">
                <span className="title">{l.title}</span>
                <span className="muted small" style={{ display: 'block' }}>
                  {l.kind === 'interactive' ? 'Interactive' : l.kind === 'article' ? 'Reading' : 'Video'}
                  {l.durationSeconds ? ` · ${duration(l.durationSeconds)}` : ''}
                  {!s.owned && l.isPreview ? ' · Free preview' : ''}
                </span>
              </span>
            </>
          );
          return (
            <li key={l.id}>
              {open ? <Link className="list-item" to={`/app/watch/${l.id}`}>{inner}</Link> : <div className="list-item" style={{ opacity: 0.7 }}>{inner}</div>}
            </li>
          );
        })}
      </ol>
      {s.lessons.length === 0 && <p className="muted">Lessons for this subject are coming soon.</p>}
    </main>
  );
}
