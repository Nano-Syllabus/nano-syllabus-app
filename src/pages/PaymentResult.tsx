import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { invalidate, useQuery } from '../lib/api';
import { SITE, useSeo } from '../lib/seo';
import type { CourseDetail } from '../lib/types';

const COPY = {
  paid: { title: 'Payment successful', body: 'The course is unlocked. Enjoy learning!', cls: 'alert-success' },
  pending: { title: 'Payment is being confirmed', body: "We couldn't confirm it with the gateway yet. Refresh in a minute; you won't be charged twice.", cls: '' },
  cancelled: { title: 'Payment cancelled', body: 'Nothing was charged. You can try again whenever you like.', cls: '' },
  failed: { title: "Payment didn't go through", body: 'Nothing was unlocked. If money left your wallet, it will be refunded by the gateway.', cls: 'alert-error' },
} as const;

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = (params.get('status') ?? 'failed') as keyof typeof COPY;
  const slug = params.get('course') ?? '';
  const copy = COPY[status] ?? COPY.failed;
  useSeo({ title: `${copy.title} · ${SITE}`, noindex: true });
  const { data: course } = useQuery<CourseDetail>(slug ? `course:${slug}` : null, `/api/courses/${encodeURIComponent(slug)}`);

  // A paid course changes what the home page and course page show.
  useEffect(() => {
    if (status === 'paid' && slug) {
      invalidate('home', `course:${slug}`, `subject:${slug}/`);
    }
  }, [status, slug]);

  const first = course?.subjects.find((s) => s.lessonCount > 0);

  return (
    <main className="container page narrow stack">
      <div className={`alert ${copy.cls}`}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 6px' }}>{copy.title}</h1>
        <p style={{ margin: 0 }}>{copy.body}</p>
      </div>
      <div className="row">
        {status === 'paid' && course && first && (
          <Link className="btn btn-primary" to={`/app/courses/${course.slug}/${first.slug}`}>Start {course.title}</Link>
        )}
        {status !== 'paid' && slug && <Link className="btn btn-primary" to={`/app/checkout/${slug}`}>Try again</Link>}
        {status === 'pending' && <button className="btn" onClick={() => location.reload()}>Refresh</button>}
        <Link className="btn" to="/app">My learning</Link>
      </div>
    </main>
  );
}
