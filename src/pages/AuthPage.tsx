// Sign in and sign up, as nano_sylabus's login-form.tsx / signup-form.tsx.
// A new account goes to onboarding first; a returning one to where it was going.
// When the server emails codes (config.emailCodes), sign-up asks for the
// 6-digit code before the account exists, and /forgot resets a password.

import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import { config } from '../lib/config';
import { AuthShell, Button, DividerOr, Field, GoogleButton, Input } from '../ui/kit';

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
const textButtonClass = 'inline-flex min-h-10 cursor-pointer items-center font-medium text-text-primary underline underline-offset-4 disabled:cursor-default disabled:text-text-muted disabled:no-underline';

/** Seconds left before another code may be sent (the server allows one a minute). */
function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(60)] as const;
}

function CodeInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      placeholder="123456"
      aria-label="6-digit code"
      className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
      invalid={invalid}
      autoFocus
      required
    />
  );
}

function ResendRow({ left, busy, onResend, onBack, backLabel }: { left: number; busy: boolean; onResend: () => void; onBack: () => void; backLabel: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-text-secondary">
      <button type="button" className={textButtonClass} onClick={onResend} disabled={left > 0 || busy}>
        {left > 0 ? `Resend code in ${left}s` : 'Resend code'}
      </button>
      <button type="button" className={textButtonClass} onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot' }) {
  const { user, login, signup, verifySignup, startReset, finishReset } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  useSeo({ title: `${isSignup ? 'Create account' : isForgot ? 'Reset password' : 'Sign in'} · ${SITE}`, noindex: true });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Google sign-in failures come back as ?error=…
  const [error, setError] = useState(params.get('error') ?? '');
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(password);
  // The code step: set once the server has emailed a code.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, startCooldown] = useCooldown();

  if (user && !(isForgot && codeSent)) return <Navigate to={user.onboarded === false ? `/onboarding?next=${encodeURIComponent(next)}` : next} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (isSignup && password !== password2) return setError('Passwords do not match.');
    setLoading(true);
    try {
      if (isSignup) {
        const u = await signup(name, email, password);
        if (!u) {
          setCodeSent(true);
          setCode('');
          startCooldown();
          return;
        }
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

  // Step 2 of sign-up: the code. Step 1 of a reset: the email.
  async function onVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifySignup(email, code);
      navigate(`/onboarding?next=${encodeURIComponent(next)}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function sendResetCode() {
    setError('');
    setLoading(true);
    try {
      await startReset(email);
      setCodeSent(true);
      setCode('');
      startCooldown();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resendSignup() {
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      startCooldown();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onReset(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== password2) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const u = await finishReset(email, code, password);
      navigate(u.onboarded === false ? `/onboarding?next=${encodeURIComponent(next)}` : next, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const carry = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';

  if (isSignup && codeSent) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${email}. It works for 15 minutes.`}>
        <form onSubmit={onVerify} className="space-y-4">
          <Field label="Code" error={error || undefined} hint="Not in your inbox? Check Spam or Promotions.">
            <CodeInput value={code} onChange={setCode} invalid={Boolean(error)} />
          </Field>
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Checking...' : 'Verify and create account'}
          </Button>
        </form>
        <ResendRow left={cooldown} busy={loading} onResend={resendSignup} onBack={() => { setCodeSent(false); setError(''); }} backLabel="Change email" />
      </AuthShell>
    );
  }

  if (isForgot) {
    if (!codeSent) {
      return (
        <AuthShell title="Reset your password" subtitle="We'll email you a 6-digit code.">
          <form onSubmit={(e) => { e.preventDefault(); void sendResetCode(); }} className="space-y-4">
            <Field label="Email" error={error || undefined}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu.np" autoComplete="email" invalid={Boolean(error)} autoFocus required />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send code'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">
            Remembered it?{' '}
            <Link to={`/login${carry}`} className={linkClass}>
              Login
            </Link>
          </p>
        </AuthShell>
      );
    }
    return (
      <AuthShell title="Check your email" subtitle={`We sent a 6-digit code to ${email}. It works for 15 minutes.`}>
        <form onSubmit={onReset} className="space-y-4">
          <Field label="Code" hint="Not in your inbox? Check Spam or Promotions.">
            <CodeInput value={code} onChange={setCode} />
          </Field>
          <Field label="New password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Confirm new password" error={error || undefined}>
            <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" autoComplete="new-password" invalid={Boolean(error)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'Saving...' : 'Set new password'}
          </Button>
        </form>
        <ResendRow left={cooldown} busy={loading} onResend={sendResetCode} onBack={() => { setCodeSent(false); setError(''); }} backLabel="Change email" />
      </AuthShell>
    );
  }

  if (isSignup) {
    return (
      <AuthShell title="Create your account" subtitle="Start learning one small topic at a time.">
        {config.googleAuth ? (
          <>
            <GoogleButton next={next} />
            <DividerOr />
          </>
        ) : null}
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
      {config.googleAuth ? (
        <>
          <GoogleButton next={next} />
          <DividerOr />
        </>
      ) : null}
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
        {config.emailCodes ? (
          <div className="-mt-2 flex justify-end">
            <Link to={`/forgot${carry}`} className="inline-flex min-h-10 items-center text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary">
              Forgot password?
            </Link>
          </div>
        ) : null}
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
