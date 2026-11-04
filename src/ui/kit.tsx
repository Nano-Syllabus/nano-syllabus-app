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
