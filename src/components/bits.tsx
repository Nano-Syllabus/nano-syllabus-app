import { Link, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { plural, price } from '../lib/format';
import type { CourseCard as Card } from '../lib/types';

export function CourseCard({ c, to, done }: { c: Card; to?: string; done?: number }) {
  return (
    <Link to={to ?? `/courses/${c.slug}`} className="card">
      <div className="cover">{c.coverUrl ? <img src={c.coverUrl} alt="" loading="lazy" /> : initials(c.title)}</div>
      <div className="row small" style={{ marginBottom: 6 }}>
        {c.level && <span className="badge">{c.level}</span>}
        <span className="spacer" />
        <span className={c.pricePaisa === 0 ? 'badge badge-free' : 'price'}>{price(c.pricePaisa)}</span>
      </div>
      <h3>{c.title}</h3>
      <p className="muted small" style={{ marginBottom: 10 }}>{c.tagline}</p>
      <div className="muted small">
        {plural(c.subjectCount, 'subject')} · {plural(c.lessonCount, 'lesson')}
      </div>
      {done !== undefined && c.lessonCount > 0 && (
        <div style={{ marginTop: 12 }}>
          <Progress value={done / c.lessonCount} />
          <div className="muted small" style={{ marginTop: 4 }}>{done} of {c.lessonCount} done</div>
        </div>
      )}
    </Link>
  );
}

function initials(t: string) {
  return t.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }} />
    </div>
  );
}

export function CardSkeletons({ n = 3 }: { n?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card">
          <div className="skeleton" style={{ aspectRatio: '16 / 9', marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '90%' }} />
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="alert alert-error row">
      <span>{message}</span>
      {retry && <button className="btn" onClick={retry}>Try again</button>}
    </div>
  );
}

/** Signed-in pages. Waits for the server only when we have no remembered user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!user && !ready) return <div className="container page muted">Loading…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <>{children}</>;
}

export function NotFound() {
  return (
    <main className="container page narrow stack">
      <h1>Page not found</h1>
      <p className="muted">The page you were looking for has moved or never existed.</p>
      <Link to="/courses" className="btn btn-primary">Browse courses</Link>
    </main>
  );
}
