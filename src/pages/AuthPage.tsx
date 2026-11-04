import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';

// Only same-site paths are honoured, so ?next= cannot bounce users off-site.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
}

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isSignup = mode === 'signup';

  useSeo({ title: `${isSignup ? 'Create account' : 'Sign in'} · ${SITE}`, noindex: true });

  if (user) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignup) await signup(name, email, password);
      else await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const other = `${isSignup ? '/login' : '/signup'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <main className="container page" style={{ maxWidth: 440 }}>
      <div className="card stack">
        <h1 style={{ fontSize: '1.6rem' }}>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <form className="stack" onSubmit={submit} noValidate>
          {isSignup && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            {isSignup && <span className="muted small">At least 8 characters.</span>}
          </div>
          {error && <div className="alert alert-error small" role="alert">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="muted small" style={{ margin: 0, textAlign: 'center' }}>
          {isSignup ? 'Already have an account?' : `New to ${SITE}?`} <Link to={other}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </div>
    </main>
  );
}
