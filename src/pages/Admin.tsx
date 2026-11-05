// /app/admin: the review queue, every submission, and who the teachers are.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBox, NotFound } from '../components/bits';
import { StatusBadge, when } from '../components/teach';
import { api, invalidate, prefetch, useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { StaffMember, Submission } from '../lib/types';

type Tab = 'review' | 'payments' | 'all' | 'teachers';
const TAB_LABEL: Record<Tab, string> = { review: 'Review queue', payments: 'Payments', all: 'All submissions', teachers: 'Teachers' };

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('review');
  useSeo({ title: `Admin · ${SITE}`, noindex: true });
  if (user?.role !== 'admin') return <NotFound />;
  return (
    <main className="wrap page stack">
      <h1>Admin</h1>
      <div className="tabs" role="tablist">
        {(['review', 'payments', 'all', 'teachers'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === 'teachers' ? <Teachers /> : tab === 'payments' ? <Payments /> : <Submissions status={tab === 'review' ? 'review' : ''} />}
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
  const { user } = useAuth();
  const { data, error } = useQuery<{ staff: StaffMember[] }>('admin:staff', '/api/admin/staff');
  const [email, setEmail] = useState('');
  const [role, setRoleChoice] = useState<'teacher' | 'admin'>('teacher');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const words = { student: 'a student', teacher: 'a teacher', admin: 'an admin' } as const;
  const setRole = async (e: string, r: 'student' | 'teacher' | 'admin') => {
    setMsg(null);
    try {
      const res = await api<{ user: { name: string; email: string } }>('/api/admin/staff', { method: 'POST', body: { email: e, role: r } });
      setMsg({ ok: true, text: `${res.user.name} <${res.user.email}> is now ${words[r]}.` });
      setEmail('');
      invalidate('admin:staff');
      await prefetch('admin:staff', '/api/admin/staff');
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <b>Add a teacher or admin</b>
        <p className="muted small" style={{ margin: 0 }}>They sign up on the site first (email or Google), then you add the email they used. Admins can review courses, see every submission and make other admins.</p>
        <form className="row" style={{ flexWrap: 'wrap' }} onSubmit={(e) => { e.preventDefault(); if (role === 'admin' && !confirm(`Make ${email.trim()} an admin? Admins can publish courses and make other admins.`)) return; void setRole(email.trim(), role); }}>
          <input className="input" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} aria-label="Email" />
          <select className="input" style={{ width: 'auto' }} value={role} onChange={(e) => setRoleChoice(e.target.value as 'teacher' | 'admin')} aria-label="Role">
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn btn-primary">Save</button>
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
            {m.email.toLowerCase() === user?.email.toLowerCase() ? (
              <span className="muted small">you</span>
            ) : (
              <select
                className="input"
                style={{ width: 'auto' }}
                value={m.role}
                aria-label={`Role of ${m.name}`}
                onChange={(e) => {
                  const r = e.target.value as 'student' | 'teacher' | 'admin';
                  if (confirm(`Make ${m.name} ${words[r]}?`)) void setRole(m.email, r);
                }}
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="student">Student (remove)</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type ManualPayment = {
  id: number;
  amountPaisa: number;
  remark: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  createdAt: string;
  reviewedAt?: string | null;
  userName: string;
  userEmail: string;
  courseSlug: string;
  courseTitle: string;
};

// QR payments: each learner's screenshot, checked against the bank app, then
// approved (enrolls them) or sent back with a reason they will see.
function Payments() {
  const { data, error } = useQuery<{ payments: ManualPayment[] }>('admin:payments', '/api/admin/payments');
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const review = async (p: ManualPayment, approve: boolean) => {
    let note = '';
    if (!approve) {
      note = (prompt(`Why is ${p.userName}'s payment being sent back? They will see this.`) || '').trim();
      if (!note) return;
    } else if (!confirm(`Approve NPR ${(p.amountPaisa / 100).toLocaleString('en-IN')} from ${p.userName} (remark ${p.remark})? This opens ${p.courseTitle} for them.`)) return;
    setBusy(p.id);
    setMsg(null);
    try {
      await api(`/api/admin/payments/${p.id}/${approve ? 'approve' : 'reject'}`, { method: 'POST', body: { note } });
      setMsg({ ok: true, text: `${p.userName}: ${approve ? 'approved, the course is open for them' : 'sent back'}.` });
      invalidate('admin:payments');
      await prefetch('admin:payments', '/api/admin/payments');
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(0);
    }
  };
  if (error) return <ErrorBox message={error.message} retry={() => location.reload()} />;
  if (!data) return <div className="skeleton" style={{ height: 200 }} />;
  return (
    <div className="stack">
      {msg && <div className={msg.ok ? 'alert alert-success' : 'alert alert-error'}>{msg.text}</div>}
      {!data.payments.length ? <p className="muted">No payments yet.</p> : null}
      <div className="rows">
        {data.payments.map((p) => (
          <div key={p.id} className="card stack">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <b style={{ flex: 1, minWidth: 200 }}>
                {p.userName} · NPR {(p.amountPaisa / 100).toLocaleString('en-IN')}
              </b>
              <span className={'badge ' + (p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : '')}>{p.status}</span>
            </div>
            <span className="muted small">
              {p.userEmail} · {p.courseTitle || p.courseSlug} · remark <b>{p.remark}</b> · {when(p.createdAt)}
              {p.note ? ` · “${p.note}”` : ''}
            </span>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button className="btn" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? 'Hide screenshot' : 'Screenshot'}</button>
              {p.status === 'pending' ? (
                <>
                  <button className="btn btn-primary" disabled={busy === p.id} onClick={() => void review(p, true)}>Approve</button>
                  <button className="btn" disabled={busy === p.id} onClick={() => void review(p, false)}>Send back</button>
                </>
              ) : null}
            </div>
            {open === p.id ? (
              <a href={`/api/admin/payments/${p.id}/screenshot`} target="_blank" rel="noreferrer">
                <img src={`/api/admin/payments/${p.id}/screenshot`} alt={`Payment screenshot from ${p.userName}`} style={{ maxWidth: '100%', maxHeight: 640, borderRadius: 12, border: '1px solid var(--border, #ddd)' }} />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
