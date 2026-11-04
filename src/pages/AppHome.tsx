import { Link } from 'react-router-dom';
import { CardSkeletons, CourseCard, ErrorBox, Progress } from '../components/bits';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { duration } from '../lib/format';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard as Card, Home } from '../lib/types';

export default function AppHome() {
  const { user } = useAuth();
  const { data, error } = useQuery<Home>('home', '/api/me/home');
  const { data: all } = useQuery<{ courses: Card[] }>('courses', '/api/courses');
  useSeo({ title: `My learning · ${SITE}`, noindex: true });

  const mine = new Set(data?.courses.map((c) => c.slug));
  const more = all?.courses.filter((c) => !mine.has(c.slug)) ?? [];
  const cont = data?.continue;

  return (
    <main className="container page stack">
      <h1>Hi, {user?.name.split(' ')[0]}</h1>
      {error && <ErrorBox message={error.message} retry={() => location.reload()} />}

      {cont && (
        <Link to={`/app/watch/${cont.lessonId}`} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="icon-dot" style={{ width: 48, height: 48, fontSize: '1.2rem' }} aria-hidden>▶</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="muted small">Continue · {cont.course.title} · {cont.subject.title}</span>
            <span className="title" style={{ display: 'block', fontWeight: 700 }}>{cont.title}</span>
            {cont.durationSeconds > 0 && (
              <span style={{ display: 'block', marginTop: 8 }}>
                <Progress value={cont.positionSeconds / cont.durationSeconds} />
                <span className="muted small">{duration(cont.positionSeconds)} of {duration(cont.durationSeconds)}</span>
              </span>
            )}
          </span>
        </Link>
      )}

      <h2 style={{ marginTop: 32 }}>Your courses</h2>
      {!data && !error && <CardSkeletons n={2} />}
      {data && data.courses.length === 0 && (
        <div className="card">
          <p>You haven't started a course yet.</p>
          <Link to="/courses" className="btn btn-primary">Find a course</Link>
        </div>
      )}
      {data && data.courses.length > 0 && (
        <div className="grid">
          {data.courses.map((c) => <CourseCard key={c.slug} c={c} done={c.done} />)}
        </div>
      )}

      {more.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>More courses</h2>
          <div className="grid">{more.map((c) => <CourseCard key={c.slug} c={c} />)}</div>
        </>
      )}
    </main>
  );
}
