import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { config } from '../lib/config';
import { ErrorBox, NotFound, Progress } from '../components/bits';
import { api, invalidate, setCached, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { plural, price } from '../lib/format';
import { SITE, courseJsonLd, useSeo } from '../lib/seo';
import type { CourseDetail as Detail } from '../lib/types';

export default function CourseDetail() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: c, error } = useQuery<Detail>(`course:${slug}`, `/api/courses/${encodeURIComponent(slug)}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useSeo({
    title: c ? `${c.title} · ${SITE}` : SITE,
    description: c ? c.tagline || c.description.slice(0, 200) : undefined,
    path: `/courses/${slug}`,
    image: c?.coverUrl || undefined,
    jsonLd: c ? courseJsonLd(c) : undefined,
  });

  if (error?.status === 404) return <NotFound />;
  if (error) return <main className="wrap page"><ErrorBox message={error.message} retry={() => location.reload()} /></main>;
  if (!c) return <main className="wrap page"><div className="skeleton" style={{ height: 240 }} /></main>;

  const firstSubject = c.subjects.find((s) => s.lessonCount > 0);
  // Courses with their own app (Electrical Machines → the brilliant-sample
  // player) open it; admins may open any.
  const appCourse = Boolean(config.appCourses[c.slug]);
  const canOpen = c.owned || user?.role === 'admin';
  const startPath = appCourse ? `/app/courses/${c.slug}/learn` : firstSubject ? `/app/courses/${c.slug}/${firstSubject.slug}` : null;

  async function start() {
    if (!user) return navigate(`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`);
    if (!c) return;
    if (appCourse && canOpen) return navigate(`/app/courses/${c.slug}/learn`);
    if (c.pricePaisa > 0 && !c.owned) return navigate(`/app/checkout/${c.slug}`);
    setBusy(true);
    setActionError('');
    try {
      if (c.pricePaisa === 0) await api(`/api/courses/${c.slug}/enroll`, { method: 'POST', body: {} });
      setCached<Detail>(`course:${slug}`, (prev) => ({ ...(prev ?? c), owned: true }));
      invalidate('home', `subject:${slug}/`);
      if (startPath) navigate(startPath);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cta = !user
    ? c.pricePaisa === 0 ? 'Sign up to start free' : `Sign up to buy · ${price(c.pricePaisa)}`
    : appCourse && canOpen ? 'Open course' : c.owned ? 'Start learning' : c.pricePaisa === 0 ? 'Start free' : `Buy course · ${price(c.pricePaisa)}`;

  return (
    <main className="wrap page">
      <div className="split">
        <div className="stack">
          <div className="row small">
            <Link to="/courses" className="muted">Courses</Link>
            <span className="muted">/</span>
            <span>{c.title}</span>
          </div>
          <h1>{c.title}</h1>
          <p className="lead muted" style={{ fontSize: '1.1rem' }}>{c.tagline}</p>
          {c.description && <p>{c.description}</p>}

          <h2 style={{ marginTop: 32 }}>Subjects</h2>
          <ol className="list">
            {c.subjects.map((s, i) => {
              const open = c.owned && s.lessonCount > 0;
              const body = (
                <>
                  <span className={s.lessonCount > 0 && s.done === s.lessonCount ? 'icon-dot done' : 'icon-dot'}>{i + 1}</span>
                  <span className="grow">
                    <span className="title">{s.title}</span>
                    {s.description && <span className="muted small" style={{ display: 'block' }}>{s.description}</span>}
                    {open && s.done > 0 && <span style={{ display: 'block', marginTop: 8 }}><Progress value={s.done / s.lessonCount} /></span>}
                  </span>
                  <span className="muted small">{s.lessonCount ? plural(s.lessonCount, 'lesson') : 'Coming soon'}</span>
                </>
              );
              return (
                <li key={s.slug}>
                  {s.lessonCount > 0 && user ? (
                    <Link className="list-item" to={appCourse ? `/app/courses/${c.slug}/learn` : `/app/courses/${c.slug}/${s.slug}`}>{body}</Link>
                  ) : (
                    <div className="list-item">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <aside>
          <div className="card stack" style={{ position: 'sticky', top: 80 }}>
            <div className="cover">{c.coverUrl ? <img src={c.coverUrl} alt="" /> : c.title.slice(0, 2).toUpperCase()}</div>
            <div className="row">
              <span className="price" style={{ fontSize: '1.5rem' }}>{price(c.pricePaisa)}</span>
              <span className="spacer" />
              {c.level && <span className="badge">{c.level}</span>}
            </div>
            <div className="muted small">{plural(c.subjectCount, 'subject')} · {plural(c.lessonCount, 'lesson')}</div>
            {actionError && <div className="alert alert-error small">{actionError}</div>}
            <button className="btn btn-primary btn-lg btn-block" onClick={() => void start()} disabled={busy}>
              {busy ? 'Opening…' : cta}
            </button>
            {c.pricePaisa > 0 && !c.owned && (
              <p className="muted small" style={{ margin: 0 }}>Pay once with eSewa or Khalti. Lifetime access to every lesson.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
