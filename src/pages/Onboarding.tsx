// /onboarding: the Figma flow has no onboarding screen, so an account that
// still needs a profile (e.g. a first Google sign-in) gets the defaults
// filled in here and goes straight on to Topics.
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE, useSeo } from '../lib/seo';
import { APP_START, completeProfile } from './AuthPage';

const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : APP_START);

export default function Onboarding() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [error, setError] = useState('');
  const started = useRef(false);
  useSeo({ title: `Welcome · ${SITE}`, noindex: true });

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    completeProfile(user, setUser)
      .then(() => navigate(next, { replace: true }))
      .catch((e: Error) => setError(e.message));
  }, [user, next, navigate, setUser]);

  if (!user && ready) return <Navigate to="/login?next=/onboarding" replace />;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-4 text-center dark:bg-[#121214] dark:text-white">
      {error ? (
        <p role="alert" className="text-sm text-[#c53030]">{error}</p>
      ) : (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-[#142c7d]" aria-label="Setting up your account" />
      )}
    </div>
  );
}
