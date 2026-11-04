import { useMemo, useState } from 'react';
import { CardSkeletons, CourseCard, ErrorBox } from '../components/bits';
import { useQuery } from '../lib/api';
import { SITE, useSeo } from '../lib/seo';
import type { CourseCard as Card } from '../lib/types';

type Filter = 'all' | 'free' | 'paid';

export default function Courses() {
  const { data, error } = useQuery<{ courses: Card[] }>('courses', '/api/courses');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  useSeo({
    title: `All courses · ${SITE}`,
    description: `Browse every course on ${SITE}: video lessons and interactive explainers, subject by subject.`,
    path: '/courses',
  });

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.courses ?? []).filter(
      (c) =>
        (filter === 'all' || (filter === 'free') === (c.pricePaisa === 0)) &&
        (!needle || `${c.title} ${c.tagline} ${c.level}`.toLowerCase().includes(needle)),
    );
  }, [data, q, filter]);

  return (
    <main className="wrap page">
      <h1>All courses</h1>
      <div className="row" style={{ margin: '16px 0 24px' }}>
        <input
          className="input"
          style={{ flex: '1 1 260px' }}
          type="search"
          placeholder="Search courses"
          aria-label="Search courses"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {(['all', 'free', 'paid'] as Filter[]).map((f) => (
          <button key={f} className={f === filter ? 'btn btn-primary' : 'btn'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'free' ? 'Free' : 'Paid'}
          </button>
        ))}
      </div>
      {error && <ErrorBox message={error.message} retry={() => location.reload()} />}
      {!data && !error && <CardSkeletons n={6} />}
      {data && shown.length === 0 && <p className="muted">No courses match.</p>}
      {data && <div className="card-grid">{shown.map((c) => <CourseCard key={c.slug} c={c} />)}</div>}
    </main>
  );
}
