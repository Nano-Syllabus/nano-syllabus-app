// /app/admin: the review queue, every submission, and who the teachers are.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { StatusBadge, when } from '../components/teach';
import { api, invalidate, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { StaffMember, Submission } from '../lib/types';

type Tab = 'review' | 'all' | 'teachers';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('review');
  useSeo({ title: `Admin · ${SITE}`, noindex: true });
  if (user?.role !== 'admin') return <NotFound />;
  return (
    <main className="wrap page stack">
      <h1>Admin</h1>
      <div className="tabs" role="tablist">
        {(['review', 'all', 'teachers'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'review' ? 'Review queue' : t === 'all' ? 'All submissions' : 'Teachers'}
          </button>
        ))}
      </div>
      {tab === 'teachers' ? <Teachers /> : <Submissions status={tab === 'review' ? 'review' : ''} />}
    </main>
  );
}

function Submissions({ status }: { status: string }) {
  const { data, error } = useQuery<{ submissions: Submission[] }>(`admin:subs:${status}`, `/api/admin/submissions?status=${status}`);
  if (error) return <ErrorBox message={error.message} retry={() => location.reload()} />;
  if (!data) return <div className="skeleton" style={{ height: 200 }} />;
  if (!data.submissions.length) return <p className="muted">{status === 'review' ? 'Nothing waiting for review.' : 'No submissions yet.'}</p>;
  return (
    <div className="rows">
      {data.submissions.map((s) => (
        <Link key={s.id} to={`/app/teach/preview/${s.id}`} className="card" style={{ textDecoration: 'none' }}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <b style={{ flex: 1, minWidth: 180 }}>
              #{s.id} · {s.courseTitle || s.courseSlug}
            </b>
            <StatusBadge status={s.status} />
          </div>
          <span className="muted small">
            {s.teacher.title} · {when(s.createdAt)} · {s.lessons} lessons
            {s.report?.warnings?.length ? ` · ${s.report.warnings.length} warnings` : ''}
            {s.via === 'mcp' ? ' · via MCP' : ''}
          </span>
          {s.note && <span className="small">“{s.note}”</span>}
        </Link>
      ))}
    </div>
  );
}

function Teachers() {
  const { data, error } = useQuery<{ staff: StaffMember[] }>('admin:staff', '/api/admin/staff');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const setRole = async (e: string, role: 'teacher' | 'student') => {
    setMsg(null);
    try {
      const r = await api<{ user: { name: string; email: string } }>('/api/admin/staff', { method: 'POST', body: { email: e, role } });
      setMsg({ ok: true, text: `${r.user.name} <${r.user.email}> is now ${role === 'teacher' ? 'a teacher' : 'a student'}.` });
      setEmail('');
      invalidate('admin:staff');
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <b>Add a teacher</b>
        <p className="muted small" style={{ margin: 0 }}>They sign up on the site first, then you add the email they used.</p>
        <form className="row" style={{ flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); void setRole(email.trim(), 'teacher'); }}>
          <input className="input" type="email" required placeholder="teacher@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} aria-label="Teacher email" />
          <button className="btn btn-primary">Make teacher</button>
        </form>
        {msg && <div className={msg.ok ? 'alert alert-success' : 'alert alert-error'}>{msg.text}</div>}
      </div>
      {error && <ErrorBox message={error.message} retry={() => location.reload()} />}
      <div className="rows">
        {data?.staff.map((m) => (
          <div key={m.id} className="card row" style={{ flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 200 }}>
              <b>{m.name}</b> <span className="muted small">{m.email}</span>
              <span className="muted small" style={{ display: 'block' }}>
                {m.role} · {m.courses} courses · {m.submissions} pushes{m.lastPush ? ` · last ${when(m.lastPush)}` : ''}
              </span>
            </span>
            {m.role === 'teacher' && (
              <button className="btn btn-ghost" onClick={() => confirm(`Remove ${m.name} as a teacher? Their live courses stay up.`) && void setRole(m.email, 'student')}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
