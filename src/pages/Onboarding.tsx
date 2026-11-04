// /onboarding: nano_sylabus's onboarding-form.tsx. Just the name and how the
// student likes to read answers; choosing a course comes next, on the hub.

import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import type { User } from '../lib/types';
import { Button, Field, Input, Logo, ThemeToggle } from '../ui/kit';

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/app');

export default function Onboarding() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [languagePref, setLanguagePref] = useState<'EN' | 'RN'>(user?.languagePref ?? 'RN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useSeo({ title: `Welcome · ${SITE}`, noindex: true });

  if (!user && ready) return <Navigate to="/login?next=/onboarding" replace />;

  async function finish() {
    if (!fullName.trim()) return setError('Please tell us your name.');
    setLoading(true);
    setError('');
    try {
      const { user: u } = await api<{ user: User }>('/api/me/profile', { method: 'PUT', body: { name: fullName.trim(), languagePref } });
      setUser(u);
      navigate(next, { replace: true });
    } catch (e) {
      setLoading(false);
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-text-primary">
      <header className="flex items-center justify-between px-5 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      {loading ? (
        <div className="animate-fade-in flex flex-1 flex-col items-center justify-center pb-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-text-primary" />
          <h2 className="mt-6 text-lg font-medium">Setting up your profile...</h2>
          <p className="mt-2 text-sm text-text-muted">Personalizing your learning experience</p>
        </div>
      ) : (
        <form
          className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-10"
          onSubmit={(e) => {
            e.preventDefault();
            void finish();
          }}
        >
          <main className="flex flex-1 flex-col py-12">
            <div className="animate-fade-in">
              <p className="font-mono-ui text-xs uppercase text-text-muted">Onboarding</p>
              <h1 className="mt-2 font-display text-4xl">Let&apos;s get you set up</h1>
              <p className="mt-2 text-sm text-text-secondary">Just your name and how you like to read answers. You can choose your course next.</p>
              <div className="mt-8 space-y-6">
                <Field label="Your name">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prashant Giri" autoComplete="name" />
                </Field>
                <Field label="Answer language">
                  <div className="flex gap-2">
                    {(
                      [
                        { value: 'RN', label: 'Roman Nepali' },
                        { value: 'EN', label: 'English' },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setLanguagePref(o.value)}
                        aria-pressed={languagePref === o.value}
                        className={`min-h-10 cursor-pointer rounded-lg border px-4 text-sm font-medium transition ${
                          languagePref === o.value ? 'border-text-primary bg-text-primary text-text-inverse' : 'border-border hover:bg-bg-secondary'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
            {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
            <div className="mt-auto flex items-center justify-end pt-10">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Start learning →'}
              </Button>
            </div>
          </main>
        </form>
      )}
    </div>
  );
}
