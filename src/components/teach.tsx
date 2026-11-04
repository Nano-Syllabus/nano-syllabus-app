import { useState } from 'react';
import type { Problem, SubmissionStatus } from '../lib/types';

const STATUS_WORDS: Record<SubmissionStatus, string> = {
  building: 'Checking',
  failed: 'Failed checks',
  review: 'Waiting for review',
  approved: 'Live',
  rejected: 'Sent back',
  superseded: 'Replaced',
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <span className={`status status-${status}`}>{STATUS_WORDS[status] ?? status}</span>;
}

/** A command or text block with a Copy button. */
export function CopyBlock({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="code">
      <pre>{text}</pre>
      <button
        type="button"
        className="btn"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          });
        }}
      >
        {done ? 'Copied' : label}
      </button>
    </div>
  );
}

export function ProblemList({ errors = [], warnings = [], max = 50 }: { errors?: Problem[]; warnings?: Problem[]; max?: number }) {
  const all = [...errors.map((p) => ({ ...p, c: 'err' })), ...warnings.map((p) => ({ ...p, c: 'warn' }))];
  if (!all.length) return <p className="muted small">No problems found.</p>;
  return (
    <div className="problems">
      {all.slice(0, max).map((p, i) => (
        <div key={i} className={p.c}>
          {p.file && <code>{p.file}: </code>}
          {p.message}
        </div>
      ))}
      {all.length > max && <div className="muted small">… and {all.length - max} more</div>}
    </div>
  );
}

export const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');
