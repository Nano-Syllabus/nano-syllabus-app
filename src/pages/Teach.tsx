// /app/teach: a teacher's home. Connect Claude Code (plugin + token), see
// their courses and every push with its check report and the reviewer's note.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox } from '../components/bits';
import { CopyBlock, ProblemList, StatusBadge, useHashScroll, when } from '../components/teach';
import { api, setCached, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { ApiToken, TeachMe } from '../lib/types';

export default function Teach() {
  const { user, ready } = useAuth();
  useSeo({ title: `Teacher tools · ${SITE}`, noindex: true });
  const teacher = user?.role === 'teacher' || user?.role === 'admin';
  if (!teacher && !ready) return <main className="wrap page"><div className="skeleton" style={{ height: 240 }} /></main>;
  if (!teacher) {
    return (
      <main className="wrap page narrow stack">
        <h1>Teacher tools</h1>
        <div className="card stack">
          <p>
            Your account is a student account. Teachers make courses with Claude Code and publish them here after a review.
          </p>
          <p className="muted">
            To become a teacher, send the email you signed in with (<b>{user?.email}</b>) to the Nano Syllabus team. Once an admin gives
            your account the Teacher role, this page shows your access tokens and submissions.
          </p>
          <Link className="btn btn-primary" to="/app/teacher/guide">How teaching on Nano Syllabus works</Link>
        </div>
      </main>
    );
  }
  return <TeacherHome />;
}

function TeacherHome() {
  const { data, error } = useQuery<TeachMe>('teach:me', '/api/teach/me');
  const { data: tokens } = useQuery<{ tokens: ApiToken[] }>('teach:tokens', '/api/teach/tokens');
  const site = data?.site ?? location.origin;
  useHashScroll();

  return (
    <main className="wrap page stack">
      <div className="row">
        <h1 style={{ flex: 1, margin: 0 }}>Teacher tools</h1>
        <Link className="btn" to="/app/teacher/guide">Guide</Link>
      </div>
      {error && <ErrorBox message={error.message} retry={() => location.reload()} />}

      <section className="card stack">
        <h2>Connect Claude Code</h2>
        <p className="muted">Once per computer. Then ask Claude to make a course; it checks, previews and pushes it for you.</p>
        <ol className="stack" style={{ paddingLeft: 20, margin: 0 }}>
          <li>
            In Claude Code, add the Nano Syllabus plugin:
            <CopyBlock text={'/plugin marketplace add Nano-Syllabus/nano-syllabus-toolkit\n/plugin install nano-syllabus@nano-syllabus'} />
          </li>
          <li>
            Create an access token below, then tell Claude: <span className="prompt" style={{ display: 'inline-block' }}>Sign me in to Nano Syllabus with this token: nst_…</span>
          </li>
          <li>
            Start: <span className="prompt" style={{ display: 'inline-block' }}>Make a Nano Syllabus course from this syllabus</span> (attach the PDF or paste it).
          </li>
        </ol>
      </section>

      <Tokens tokens={tokens?.tokens} site={site} />

      <section id="courses" className="stack">
        <h2>Your courses</h2>
        {data && !data.courses.length && <p className="muted">None yet. A course appears here after its first push is approved.</p>}
        <div className="rows">
          {data?.courses.map((c) => (
            <div key={c.slug} className="card row">
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>{c.title}</b>
                <span className="muted small" style={{ display: 'block' }}>
                  {c.slug} · {c.lessons} lessons · updated {when(c.updatedAt)}
                </span>
              </span>
              {c.published ? <Link className="btn" to={`/courses/${c.slug}`}>Open</Link> : <span className="muted small">not published</span>}
            </div>
          ))}
        </div>
      </section>

      <section id="submissions" className="stack">
        <h2>Submissions</h2>
        {data && !data.submissions.length && (
          <p className="muted">
            Nothing pushed yet. When Claude runs <code>ns push</code>, the push shows up here while the site checks it.
          </p>
        )}
        <div className="rows">
          {data?.submissions.map((s) => (
            <div key={s.id} className="card">
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <b style={{ flex: 1, minWidth: 160 }}>
                  #{s.id} · {s.courseTitle || s.courseSlug}
                </b>
                <StatusBadge status={s.status} />
              </div>
              <span className="muted small">
                {when(s.createdAt)} · {s.via === 'mcp' ? 'via MCP' : s.via === 'rebuild' ? 'rebuild' : 'ns push'}
                {s.lessons ? ` · ${s.lessons} lessons` : ''}
                {s.report?.warnings?.length ? ` · ${s.report.warnings.length} warnings` : ''}
              </span>
              {s.status === 'failed' && <ProblemList errors={s.report?.errors} max={8} />}
              {s.reviewNote && (
                <div className={s.status === 'rejected' ? 'alert alert-error' : 'alert'}>
                  <b>{s.reviewedBy || 'Reviewer'}:</b> {s.reviewNote}
                </div>
              )}
              {(s.status === 'review' || s.status === 'approved' || s.status === 'rejected') && (
                <div className="row">
                  <Link className="btn" to={`/app/teach/preview/${s.id}`}>Preview</Link>
                  {s.status === 'approved' && <Link className="btn btn-ghost" to={`/courses/${s.courseSlug}`}>Live course</Link>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Tokens({ tokens, site }: { tokens?: ApiToken[]; site: string }) {
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const r = await api<{ token: string; item: ApiToken }>('/api/teach/tokens', { method: 'POST', body: { name: name || 'Claude Code' } });
      setFresh(r.token);
      setName('');
      setCached<{ tokens: ApiToken[] }>('teach:tokens', (prev) => ({ tokens: [r.item, ...(prev?.tokens ?? [])] }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (id: number) => {
    if (!confirm('Revoke this token? Anything using it stops working.')) return;
    await api(`/api/teach/tokens/${id}`, { method: 'DELETE', body: {} }).catch((e) => setErr((e as Error).message));
    setCached<{ tokens: ApiToken[] }>('teach:tokens', (prev) => ({ tokens: (prev?.tokens ?? []).filter((t) => t.id !== id) }));
  };

  return (
    <section id="tokens" className="card stack">
      <h2>Access tokens</h2>
      <p className="muted small">
        A token lets Claude Code (and other AI tools) push courses as you. Keep it like a password; revoke it if it leaks.
      </p>
      {fresh && (
        <div className="alert alert-success stack">
          <b>Copy this token now. It is not shown again.</b>
          <CopyBlock text={fresh} />
          <span className="small">Give it to Claude ("sign me in to Nano Syllabus with this token"), or run:</span>
          <CopyBlock text={`ns login ${fresh}${site.includes('live.nanosyllabus.com') ? '' : ` --server ${site}`}`} />
          <span className="small">For the MCP connector, also set it in your shell profile:</span>
          <CopyBlock text={`export NANO_SYLLABUS_TOKEN=${fresh}`} />
        </div>
      )}
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Name, e.g. Laptop" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label="Token name" />
        <button className="btn btn-primary" disabled={busy} onClick={() => void create()}>Create token</button>
      </div>
      {err && <div className="alert alert-error">{err}</div>}
      {tokens?.length ? (
        <div className="rows">
          {tokens.map((t) => (
            <div key={t.id} className="row" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <span style={{ flex: 1 }}>
                <b>{t.name}</b> <span className="muted small">…{t.hint}</span>
                <span className="muted small" style={{ display: 'block' }}>
                  made {when(t.createdAt)} · {t.lastUsedAt ? `last used ${when(t.lastUsedAt)}` : 'never used'}
                </span>
              </span>
              <button className="btn btn-ghost" onClick={() => void revoke(t.id)}>Revoke</button>
            </div>
          ))}
        </div>
      ) : (
        tokens && <p className="muted small">No tokens yet.</p>
      )}
    </section>
  );
}
