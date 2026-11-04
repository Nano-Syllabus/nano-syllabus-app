// nano_sylabus's small UI pieces (components/ui/button.tsx, field.tsx,
// theme-toggle.tsx, marketing-nav Logo), for the new client.

import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getTheme, onTheme, setTheme, type Theme } from './theme';

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'filled' | 'outline' | 'ghost' | 'blue';
const variants: Record<Variant, string> = {
  filled: 'bg-text-primary text-text-inverse hover:opacity-90 disabled:opacity-50',
  outline: 'border border-border-strong text-text-primary hover:bg-bg-secondary disabled:opacity-50',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
  blue: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50',
};
const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

export function Button({
  variant = 'filled',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes; children: ReactNode }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'filled', size = 'md', className, children }: { to: string; variant?: Variant; size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center justify-center gap-2 rounded-full font-medium no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong', variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}

export function Field({ label, error, hint, children }: { label?: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-3">
      {label ? <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">{label}</span> : null}
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : hint ? <span className="block text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(
        'block h-11 w-full rounded-md border bg-bg-primary px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-strong/40',
        invalid ? 'border-destructive' : 'border-border',
        className,
      )}
    />
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 text-[18px] font-semibold tracking-tight text-text-primary no-underline" aria-label="Nano Syllabus home">
      <img src="/nanologo-76.png" alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0 rounded-lg object-contain" />
      <span className="font-figma-library">Nano Syllabus</span>
    </Link>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setLocal] = useState<Theme>(getTheme);
  useEffect(() => onTheme(setLocal), []);
  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong/70',
        className,
      )}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

/** nano_sylabus components/auth-shell.tsx */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <div className="bg-dotgrid absolute inset-0 opacity-40" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-5 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="animate-fade-in w-full max-w-[420px] rounded-xl border border-border bg-bg-primary p-8 shadow-sm">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function DividerOr() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** nano_sylabus's "Continue with Google" button (an outline button with the G mark). */
export function GoogleButton({ next }: { next: string }) {
  const [going, setGoing] = useState(false);
  return (
    <a
      href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
      onClick={() => setGoing(true)}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-text-primary no-underline transition hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong focus-visible:ring-offset-2"
    >
      {!going && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      {going ? 'Redirecting...' : 'Continue with Google'}
    </a>
  );
}
