// The signed-in frame from the Figma redesign (file 5D1OeHdCb2HU4uefNHKs73,
// "Product navigation" in frames 160:4696 / 160:4915): logo, Home · Topics ·
// You with an underline on the current one, then points, energy and the
// menu (160:4036: Settings, About, Help, Log out). Light and dark.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Home } from '../lib/types';
import { PROGRAMS } from '../data/curriculum';
import { getTheme, onTheme, setTheme, type Theme } from './theme';

const ico = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const HouseIcon = () => (<svg {...ico}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>);
const LayersIcon = () => (<svg {...ico}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="m6.08 9.5-3.5 1.6a1 1 0 0 0 0 1.81l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59" /></svg>);
const UserIcon = () => (<svg {...ico}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>);

export const Sparkles = ({ className = '' }: { className?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.13 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </svg>
);
export const Bolt = ({ className = '' }: { className?: string }) => (
  <svg width="13" height="19" viewBox="0 0 13 19" className={className} aria-hidden="true">
    <path d="M7.6 0 0 11h5.3L4.6 19 13 7.4H7.4z" fill="currentColor" />
  </svg>
);

type Item = { to: string; label: string; icon: ReactNode; match: (p: string) => boolean };
const items: Item[] = [
  { to: '/app', label: 'Home', icon: <HouseIcon />, match: (p) => p === '/app' },
  { to: '/app/topics', label: 'Topics', icon: <LayersIcon />, match: (p) => p.startsWith('/app/topics') || p.startsWith('/app/courses') || p.startsWith('/courses') },
  { to: '/app/you', label: 'You', icon: <UserIcon />, match: (p) => p.startsWith('/app/you') },
];

/** Points shown in the bar: 10 for every lesson finished. */
export function usePoints() {
  const { data } = useQuery<Home>('home', '/api/me/home');
  return { points: (data?.completedTotal ?? 0) * 10, streak: data?.streak ?? 0 };
}

export function NavStats() {
  const { points, streak } = usePoints();
  return (
    <div className="flex items-center gap-[18px]">
      <span className="flex items-center gap-[6px] text-xs text-[#18251e] dark:text-[#dae7e0]" title={`${points} points`}>
        {points}
        <Sparkles className="text-[#1f9d55] dark:text-[#23b261]" />
      </span>
      <span className="text-[#ffc800] dark:text-[#ffcd19]" title={streak ? `${streak}-day streak` : 'Learn today to start a streak'}>
        <Bolt />
        <span className="sr-only">{streak ? `${streak}-day streak` : 'No streak yet'}</span>
      </span>
    </div>
  );
}

function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [theme, setLocal] = useState<Theme>(getTheme);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => onTheme(setLocal), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const row = 'flex h-16 w-full cursor-pointer items-center px-[18px] text-left text-[15px] text-white transition hover:bg-white/[0.06]';
  const go = (to: string) => { setOpen(false); navigate(to); };
  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setSettings(false); }}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#6d7971] transition hover:bg-black/5 dark:hover:bg-white/10"
      >
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 1h16M1 6h16M1 11h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>
      {open ? (
        <div className="absolute right-[-6px] top-[46px] z-50 w-[251px]">
          <span className="absolute -top-[7px] right-[14px] h-0 w-0 border-x-[8px] border-b-[8px] border-x-transparent border-b-[#1f1f1f]" aria-hidden />
          <div role="menu" className="overflow-hidden rounded-xl bg-[#1f1f1f] shadow-[0_12px_32px_rgba(0,0,0,0.28)] [&>*+*]:border-t [&>*+*]:border-white/[0.06]">
            {user?.role === 'teacher' || user?.role === 'admin' ? <button role="menuitem" className={row} onClick={() => go('/app/teach')}>Teach</button> : null}
            {user?.role === 'admin' ? <button role="menuitem" className={row} onClick={() => go('/app/admin')}>Admin</button> : null}
            <button role="menuitem" className={row} aria-expanded={settings} onClick={() => setSettings((s) => !s)}>Settings</button>
            {settings ? (
              <div className="flex items-center justify-between px-[18px] py-3 text-sm text-white/80">
                <span>
                  Course
                  <span className="ml-2 font-semibold text-white">{PROGRAMS.find((p) => p.slug === user?.program)?.short ?? PROGRAMS.find((p) => !p.soon)?.short}</span>
                </span>
                <button type="button" onClick={() => go('/courses')} className="cursor-pointer rounded-md bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">
                  Change
                </button>
              </div>
            ) : null}
            {settings ? (
              <div className="flex items-center justify-between px-[18px] py-3 text-sm text-white/80">
                Theme
                <span className="flex rounded-lg bg-white/10 p-0.5">
                  {(['light', 'dark'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTheme(t)} className={'cursor-pointer rounded-md px-3 py-1 text-xs capitalize ' + (theme === t ? 'bg-white text-[#1f1f1f]' : 'text-white/80')}>
                      {t}
                    </button>
                  ))}
                </span>
              </div>
            ) : null}
            <a role="menuitem" className={row} href="/">About</a>
            <a role="menuitem" className={row} href="mailto:contact@nanosyllabus.com?subject=Help%20with%20Nano%20Syllabus">Help</a>
            <button role="menuitem" className={row} onClick={() => { setOpen(false); void logout().then(() => window.location.assign('/')); }}>Log out</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TopNav() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 h-[60px] border-b border-[#e2ede5] bg-white dark:border-[#1b2c20] dark:bg-[#141414]">
      <div className="mx-auto flex h-full w-[min(1225px,100%-32px)] items-center">
        <Link to="/app/topics" aria-label="Nano Syllabus" className="mr-[51px] shrink-0 max-sm:mr-3">
          <img src="/app/ns-logo.webp" width={51} height={47} alt="" className="h-[47px] w-[51px] object-contain dark:hidden" />
          <img src="/app/ns-logo-white.webp" width={36} height={36} alt="" className="hidden h-9 w-9 object-contain dark:block" />
        </Link>
        <nav className="flex h-full items-stretch gap-[39px] max-sm:gap-1" aria-label="Main">
          {items.map((it) => {
            const on = it.match(pathname);
            return (
              <Link
                key={it.to}
                to={it.to}
                aria-current={on ? 'page' : undefined}
                className={
                  'relative flex items-center gap-[10px] px-[5px] text-[17px] leading-[25px] transition max-sm:gap-1.5 max-sm:px-2 max-sm:text-[15px] ' +
                  (on ? 'font-semibold text-[#2f2d2d] dark:text-white' : 'font-medium text-[#6d7971] hover:text-[#2f2d2d] dark:text-[#8c948f] dark:hover:text-white')
                }
              >
                <span className="max-[380px]:hidden">{it.icon}</span>
                {it.label}
                {on ? <span className="absolute inset-x-0 bottom-0 h-1 rounded-sm bg-[#2f2d2d] dark:bg-white" aria-hidden /> : null}
              </Link>
            );
          })}
        </nav>
        <span className="flex-1" />
        <div className="flex items-center gap-[18px] max-sm:gap-2">
          <span className="max-[480px]:hidden"><NavStats /></span>
          <Menu />
        </div>
      </div>
    </header>
  );
}

export function TopNavShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#16171b] dark:bg-[#141414] dark:text-white">
      <TopNav />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
