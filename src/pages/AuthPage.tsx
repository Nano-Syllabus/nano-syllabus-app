// Sign in, sign up and password reset, drawn from the Figma "Login" frame
// (file 5D1OeHdCb2HU4uefNHKs73, node 160:5223): the NS logo, two icon inputs,
// a navy button, "or", Google, and a one-line switch to the other form.
// Sign-up asks only for email and password (the frame has no name field);
// the name defaults to the email's first part and can be changed later.
// When the server emails codes (config.emailCodes), sign-up asks for the
// 6-digit code before the account exists, and /forgot resets a password.
import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import { config } from '../lib/config';
import type { User } from '../lib/types';

export const APP_START = '/app/topics';

// Only same-site paths are honoured, so ?next= cannot bounce users off-site.
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : APP_START;
}

const nameFromEmail = (email: string) => {
  const local = email.split('@')[0].replace(/[._\-+0-9]+/g, ' ').trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60) : 'Learner';
};

/** Accounts are ready to learn straight away: the old onboarding step (name +
 *  answer language) is filled in quietly with defaults. */
export async function completeProfile(u: User, setUser: (u: User) => void) {
  if (u.onboarded !== false) return u;
  const { user } = await api<{ user: User }>('/api/me/profile', {
    method: 'PUT',
    body: { name: u.name?.trim() || nameFromEmail(u.email), languagePref: u.languagePref || 'EN' },
  });
  setUser(user);
  return user;
}

function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, () => setLeft(60)] as const;
}

const ic = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const MailIcon = () => (<svg {...ic}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
const LockIcon = () => (<svg {...ic} width={16} height={16}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
const KeyIcon = () => (<svg {...ic} width={16} height={16}><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l2 2" /></svg>);
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg {...ic} width={22} height={22} strokeWidth={1.4}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

function FInput({ icon, invalid, right, ...rest }: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; invalid?: boolean; right?: ReactNode }) {
  return (
    <label
      className={
        'flex h-[41px] w-full items-center gap-1.5 rounded-xl border bg-white px-3 text-[#626263] shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition focus-within:border-[#142c7d] focus-within:ring-2 focus-within:ring-[#142c7d]/15 dark:bg-[#18181a] dark:text-[#a6a6af] ' +
        (invalid ? 'border-[#c53030]' : 'border-[#b4b4b4] dark:border-white/20')
      }
    >
      <span className="flex w-5 shrink-0 justify-center">{icon}</span>
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        className="h-full min-w-0 flex-1 bg-transparent font-sans text-base text-[#16171b] outline-none placeholder:text-[#626263] dark:text-white dark:placeholder:text-[#a6a6af]"
      />
      {right}
    </label>
  );
}

function PrimaryButton({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-[41px] w-full cursor-pointer rounded-xl bg-[#142c7d] font-sans text-base font-semibold text-white shadow-[0_4px_10px_rgba(234,69,76,0.18)] transition hover:bg-[#1a3797] disabled:cursor-default disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Or() {
  return (
    <div className="flex items-center text-xs text-[#595959] dark:text-[#a6a6af]">
      <span className="h-px flex-1 bg-black/25 dark:bg-white/20" />
      <span className="px-1">or</span>
      <span className="h-px flex-1 bg-black/25 dark:bg-white/20" />
    </div>
  );
}

function Google({ next, label }: { next: string; label: string }) {
  const [going, setGoing] = useState(false);
  return (
    <a
      href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
      onClick={() => setGoing(true)}
      className="flex h-[41px] w-full items-center justify-center gap-[6px] rounded-xl border border-[#b4b4b4] bg-white font-sans text-base font-semibold text-[#181818] no-underline shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition hover:bg-[#f6f6f8] dark:border-white/20 dark:bg-[#18181a] dark:text-white"
    >
      <img src="/app/google.webp" width={29} height={29} alt="" />
      <span className="ml-1">{going ? 'Redirecting...' : label}</span>
    </a>
  );
}

function Shell({ children, heading, sub }: { children: ReactNode; heading?: string; sub?: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-white px-4 py-10 text-[#16171b] dark:bg-[#121214] dark:text-white">
      <div className="w-full max-w-[317px]">
        <Link to="/" aria-label={`${SITE} home`} className="mx-auto block w-[128px]">
          <img src="/app/ns-logo.webp" width={128} height={116} alt={SITE} className="h-auto w-[128px] dark:brightness-0 dark:invert" />
        </Link>
        {heading ? (
          <div className="mt-6 text-center">
            <h1 className="text-xl font-semibold">{heading}</h1>
            {sub ? <p className="mt-1 text-sm text-[#595959] dark:text-[#a6a6af]">{sub}</p> : null}
          </div>
        ) : (
          <h1 className="sr-only">{sub}</h1>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="text-sm text-[#c53030]">{msg}</p> : null);
const linkCls = 'font-semibold text-[#142c7d] dark:text-[#8ea4ff]';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' | 'forgot' }) {
  const { user, login, signup, verifySignup, startReset, finishReset, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  useSeo({ title: `${isSignup ? 'Create account' : isForgot ? 'Reset password' : 'Sign in'} · ${SITE}`, noindex: true });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(params.get('error') ?? '');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [cooldown, startCooldown] = useCooldown();

  if (user && !loading && !(isForgot && codeSent)) {
    return <Navigate to={user.onboarded === false ? `/onboarding?next=${encodeURIComponent(next)}` : next} replace />;
  }

  async function arrive(u: User) {
    await completeProfile(u, setUser);
    navigate(next, { replace: true });
  }

  async function run(fn: () => Promise<void>) {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (isSignup) {
        const u = await signup(nameFromEmail(email), email, password);
        if (!u) {
          setCodeSent(true);
          setCode('');
          startCooldown();
          return;
        }
        await arrive(u);
      } else {
        await arrive(await login(email, password));
      }
    });
  };

  const carry = params.get('next') ? `?next=${encodeURIComponent(next)}` : '';
  const codeInput = (
    <FInput
      icon={<KeyIcon />}
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      placeholder="6-digit code"
      aria-label="6-digit code"
      invalid={Boolean(error)}
      autoFocus
      required
    />
  );
  const resendRow = (onResend: () => void) => (
    <div className="flex items-center justify-between text-sm text-[#595959] dark:text-[#a6a6af]">
      <button type="button" className="cursor-pointer disabled:cursor-default disabled:opacity-60" disabled={cooldown > 0 || loading} onClick={onResend}>
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
      <button type="button" className={linkCls + ' cursor-pointer'} onClick={() => { setCodeSent(false); setError(''); }}>
        Change email
      </button>
    </div>
  );

  if (isSignup && codeSent) {
    return (
      <Shell heading="Check your email" sub={`We sent a 6-digit code to ${email}. It works for 15 minutes.`}>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(async () => arrive(await verifySignup(email, code))); }}>
          {codeInput}
          <Err msg={error} />
          <div className="pt-2"><PrimaryButton disabled={loading || code.length !== 6}>{loading ? 'Checking...' : 'Verify and create account'}</PrimaryButton></div>
          <div className="pt-2">{resendRow(() => void run(async () => { await signup(nameFromEmail(email), email, password); startCooldown(); }))}</div>
        </form>
      </Shell>
    );
  }

  if (isForgot) {
    const sendCode = () => run(async () => { await startReset(email); setCodeSent(true); setCode(''); startCooldown(); });
    if (!codeSent) {
      return (
        <Shell heading="Reset your password" sub="We'll email you a 6-digit code.">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
            <FInput icon={<MailIcon />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" invalid={Boolean(error)} autoFocus required />
            <Err msg={error} />
            <div className="pt-2"><PrimaryButton disabled={loading}>{loading ? 'Sending...' : 'Send code'}</PrimaryButton></div>
          </form>
          <p className="mt-5 text-center text-sm text-[#595959] dark:text-[#a6a6af]">Remembered it? <Link to={`/login${carry}`} className={linkCls}>Sign in</Link></p>
        </Shell>
      );
    }
    return (
      <Shell heading="Check your email" sub={`We sent a 6-digit code to ${email}.`}>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== password2) return setError('Passwords do not match.');
            void run(async () => arrive(await finishReset(email, code, password)));
          }}
        >
          {codeInput}
          <FInput icon={<LockIcon />} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" aria-label="New password" autoComplete="new-password" minLength={8} required />
          <FInput icon={<LockIcon />} type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Confirm new password" aria-label="Confirm new password" autoComplete="new-password" required />
          <Err msg={error} />
          <div className="pt-2"><PrimaryButton disabled={loading || code.length !== 6}>{loading ? 'Saving...' : 'Set new password'}</PrimaryButton></div>
          <div className="pt-2">{resendRow(() => void sendCode())}</div>
        </form>
      </Shell>
    );
  }

  return (
    <Shell sub={isSignup ? 'Create your account' : 'Sign in'}>
      <form onSubmit={onSubmit}>
        <div className="space-y-3">
          <FInput icon={<MailIcon />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" autoComplete="email" invalid={Boolean(error)} required />
          <FInput
            icon={<LockIcon />}
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={isSignup ? 8 : undefined}
            invalid={Boolean(error)}
            required
            right={
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="-mr-1 flex h-8 w-8 cursor-pointer items-center justify-center text-[#9a9a9a]">
                <EyeIcon off={!show} />
              </button>
            }
          />
        </div>
        {error ? <div className="mt-3"><Err msg={error} /></div> : null}
        {!isSignup && config.emailCodes ? (
          <div className="mt-2 text-right">
            <Link to={`/forgot${carry}`} className="text-sm text-[#595959] hover:text-[#142c7d] dark:text-[#a6a6af]">Forgot password?</Link>
          </div>
        ) : null}
        <div className="mt-5">
          <PrimaryButton disabled={loading}>{loading ? (isSignup ? 'Creating account...' : 'Logging in...') : isSignup ? 'Sign up' : 'Login'}</PrimaryButton>
        </div>
      </form>
      {config.googleAuth ? (
        <>
          <div className="mt-5"><Or /></div>
          <div className="mt-5"><Google next={next} label={isSignup ? 'Sign up with Google' : 'Sign in with Google'} /></div>
        </>
      ) : null}
      <p className="mt-5 text-center text-sm text-[#595959] dark:text-[#a6a6af]">
        {isSignup ? 'Existing user?' : 'New user?'}{' '}
        <Link to={`${isSignup ? '/login' : '/signup'}${carry}`} className={linkCls + ' ml-1'}>
          {isSignup ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </Shell>
  );
}
