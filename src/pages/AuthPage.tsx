// Sign in and sign up, as nano_sylabus's login-form.tsx / signup-form.tsx.
// A new account goes to onboarding first; a returning one to where it was going.

import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import { AuthShell, Button, Field, Input } from '../ui/kit';

// Only same-site paths are honoured, so ?next= cannot bounce users off-site.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score++;
  return { score: score as 0 | 1 | 2 | 3, label: ['Too short', 'Weak', 'Medium', 'Strong'][score] };
}

const linkClass = 'inline-flex min-h-10 items-center font-medium text-text-primary underline underline-offset-4';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const isSignup = mode === 'signup';
  useSeo({ title: `${isSignup ? 'Create account' : 'Sign in'} · ${SITE}`, noindex: true });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);

  if (user) return <Navigate to={user.onboarded === false ? `/onboarding?next=${encodeURIComponent(next)}` : next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (isSignup && password !== password2) return setError('Passwords do not match.');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(name, email, password);
        navigate(`/onboarding?next=${encodeURIComponent(next)}`, { replace: true });
      } else {
        const u = await login(email, password);
        navigate(u.onboarded === false ? `/onboarding?next=${encodeURIComponent(next)}` : next, { replace: true });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const carry = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';

  if (isSignup) {
    return (
      <AuthShell title="Create your account" subtitle="Start learning one small topic at a time.">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pratiksha Rai" autoComplete="name" required />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.np" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" minLength={8} required />
            <div className="mt-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={
                    'h-1 flex-1 rounded-full ' +
                    (i < strength.score ? (strength.score === 1 ? 'bg-destructive' : strength.score === 2 ? 'bg-warning' : 'bg-success') : 'bg-bg-tertiary')
                  }
                />
              ))}
            </div>
            <span className="font-mono-ui mt-1 block text-[11px] text-text-muted">{strength.label}</span>
          </Field>
          <Field label="Confirm password" error={error || undefined}>
            <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" autoComplete="new-password" invalid={Boolean(error)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to={`/login${carry}`} className={linkClass}>
            Login
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your study sessions.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.np" autoComplete="email" required />
        </Field>
        <Field label="Password" error={error || undefined}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              invalid={Boolean(error)}
              className="pr-16"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="font-mono-ui absolute right-1.5 top-1/2 inline-flex min-h-10 min-w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-xs text-text-muted transition hover:bg-bg-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong/70"
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to={`/signup${carry}`} className={linkClass}>
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
