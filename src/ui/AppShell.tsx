// The signed-in frame: nano_sylabus's components/app-shell.tsx + app-sidebar.tsx
// (brand row with collapse, nav, Discord Study Room card, account row with the
// theme toggle and its menu; on phones a slim row with the menu button). The
// nav lists what this app has: Micro-Topics (the hub), Courses, and Teach /
// Admin for those roles.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardCheck, GraduationCap, LogOut, Target } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn, ThemeToggle } from './kit';

const DISCORD_STUDY_ROOM_URL = 'https://discord.gg/7nMeSdpwPg';

type NavItem = { to: string; label: string; icon: ReactNode; match: (p: string) => boolean };

function navFor(role?: string): NavItem[] {
  const items: NavItem[] = [
    { to: '/app', label: 'Micro-Topics', icon: <Target strokeWidth={1.8} />, match: (p) => p === '/app' || p.startsWith('/app/watch') },
    {
      to: '/app/courses',
      label: 'Courses',
      icon: <BookOpen strokeWidth={1.8} />,
      match: (p) => p.startsWith('/app/courses') || p.startsWith('/courses') || p.startsWith('/app/checkout') || p.startsWith('/app/payment'),
    },
  ];
  if (role === 'teacher' || role === 'admin') items.push({ to: '/app/teach', label: 'Teach', icon: <GraduationCap strokeWidth={1.8} />, match: (p) => p.startsWith('/app/teach') });
  else items.push({ to: '/app/teacher/guide', label: 'Teach', icon: <GraduationCap strokeWidth={1.8} />, match: (p) => p === '/app/teacher/guide' });
  if (role === 'admin') items.push({ to: '/app/admin', label: 'Admin', icon: <ClipboardCheck strokeWidth={1.8} />, match: (p) => p.startsWith('/app/admin') });
  return items;
}

const COLLAPSE_KEY = 'ns-sidebar-collapsed';

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        /* private mode */
      }
      return !c;
    });

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg-primary text-text-primary">
      <aside
        className={
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-bg-primary transition-[width,transform] duration-200 ease-in-out motion-reduce:transition-none md:static md:translate-x-0 ' +
          (open ? 'translate-x-0 ' : '-translate-x-full ') +
          (collapsed ? 'w-[68px]' : 'w-[min(86vw,320px)] md:w-[250px]')
        }
      >
        <Sidebar collapsed={collapsed} onToggle={toggle} onClose={() => setOpen(false)} />
      </aside>
      {open ? <button aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/40 md:hidden" /> : null}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-12 shrink-0 items-center border-b border-border px-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div id="app-scroll" className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

const sidebarIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="18" height="18" x="3" y="3" rx="4" ry="4" />
    <path d="M9 3v18" />
  </svg>
);

function Sidebar({ collapsed, onToggle, onClose }: { collapsed: boolean; onToggle: () => void; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);
  if (!user) return null;
  const initial = (user.name?.trim() || user.email || 'U').charAt(0).toUpperCase();
  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="font-figma-library flex h-full w-full flex-col bg-bg-primary text-text-secondary">
      {/* Brand */}
      <div className={cn('mb-6 flex items-center pt-[18px]', collapsed ? 'justify-center px-0' : 'justify-between px-3')}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-text-primary transition hover:bg-bg-secondary"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <span className="flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
              <img src="/nanologo-76.png" alt="Nano Syllabus" width={34} height={34} className="h-[34px] w-[34px] shrink-0 rounded-lg object-contain" />
            </span>
            <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">{sidebarIcon}</span>
          </button>
        ) : (
          <>
            <Link to="/app" onClick={onClose} className="flex items-center gap-2.5 text-[18px] font-semibold tracking-tight text-text-primary no-underline transition hover:text-text-secondary" aria-label="Nano Syllabus home">
              <img src="/nanologo-76.png" alt="" width={34} height={34} className="h-[34px] w-[34px] shrink-0 rounded-lg object-contain" />
              <span>Nano Syllabus</span>
            </Link>
            <div className="flex items-center gap-1">
              <button type="button" onClick={onClose} className="cursor-pointer rounded-md p-1.5 text-text-muted transition hover:bg-bg-secondary hover:text-text-primary md:hidden" aria-label="Close sidebar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
              <button type="button" onClick={onToggle} className="hidden cursor-pointer rounded-md p-1.5 text-text-primary transition hover:bg-bg-secondary md:block" aria-label="Close sidebar" title="Close sidebar">
                {sidebarIcon}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {navFor(user.role).map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex min-h-10 items-center text-sm leading-5 no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong/70 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0',
                collapsed ? 'mx-auto h-10 w-10 justify-center rounded-[9px] p-2.5' : 'text-sidebar-crisp gap-3 rounded-[9px] px-[11px] py-2',
                active ? 'bg-text-primary text-text-inverse' : 'text-text-primary hover:bg-bg-secondary hover:text-text-primary',
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Discord Study Room */}
      <div className={cn('mt-auto shrink-0', collapsed ? 'p-2 pb-1' : 'px-3 pb-1.5 pt-1')}>
        {collapsed ? (
          <a href={DISCORD_STUDY_ROOM_URL} target="_blank" rel="noopener noreferrer" className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/10 text-[#5865F2] transition hover:bg-[#5865F2] hover:text-white" title="Discord Study Room">
            <DiscordGlyph size={20} />
          </a>
        ) : (
          <a
            href={DISCORD_STUDY_ROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl border border-border bg-card px-2.5 py-2 no-underline shadow-xs transition hover:border-[#5865F2]/40 hover:bg-bg-secondary"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#5865F2] text-white shadow-xs">
                <DiscordGlyph size={14} />
              </span>
              <span className="text-[13px] font-medium tracking-tight text-text-primary">Discord Study Room</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted transition group-hover:translate-x-0.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        )}
      </div>

      {/* Account */}
      <div className={cn('relative shrink-0 border-t border-border', collapsed ? 'p-2' : 'p-3')} ref={menuRef}>
        {menu && (
          <div className="absolute bottom-[calc(100%+4px)] left-2 z-50 flex w-[240px] flex-col overflow-hidden rounded-xl border border-border bg-bg-primary p-1.5 shadow-xl">
            <div className="mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-primary text-[13px] font-semibold text-text-primary shadow-sm">{initial}</span>
              <span className="min-w-0 flex-1 pl-1 text-left">
                <span className="block truncate text-[15px] font-medium capitalize leading-[22px] text-text-primary">{user.name || user.email.split('@')[0]}</span>
                <span className="mt-0.5 block truncate text-[13px] text-text-muted">{user.email}</span>
              </span>
            </div>
            {(user.role === 'teacher' || user.role === 'admin') && (
              <MenuLink to="/app/teach" onClick={() => { setMenu(false); onClose(); }} icon={<GraduationCap size={16} />}>
                Teacher tools
              </MenuLink>
            )}
            <MenuLink to="/app/teacher/guide" onClick={() => { setMenu(false); onClose(); }} icon={<BookOpen size={16} />}>
              How teaching works
            </MenuLink>
            <div className="mx-1 my-1 border-t border-border" />
            <button
              onClick={async () => {
                setLeaving(true);
                await logout();
                navigate('/login', { replace: true });
              }}
              disabled={leaving}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary transition hover:bg-bg-secondary hover:text-text-primary disabled:opacity-60"
            >
              <LogOut size={16} />
              {leaving ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        )}
        <div className={cn('flex items-center', collapsed ? 'flex-col gap-2' : 'gap-2')}>
          <button
            onClick={() => setMenu((m) => !m)}
            className={cn(
              'group relative flex cursor-pointer items-center transition hover:bg-bg-secondary',
              menu && 'bg-bg-secondary',
              collapsed ? 'mx-auto h-10 w-10 justify-center rounded-full' : 'min-w-0 flex-1 gap-2.5 rounded-xl px-2 py-2',
            )}
            aria-label="Account menu"
            aria-expanded={menu}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-primary text-[13px] font-semibold text-text-primary shadow-sm">{initial}</span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 pl-1 text-left">
                  <span className="block truncate text-[15px] font-medium capitalize leading-[22px] text-text-primary">{user.name || user.email.split('@')[0]}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-text-muted">{roleLabel}</span>
                </span>
                <span className="flex items-center pr-1 text-text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </>
            )}
          </button>
          <ThemeToggle className="h-10 w-10 shrink-0 bg-bg-primary" />
        </div>
      </div>
    </div>
  );
}

function MenuLink({ to, onClick, icon, children }: { to: string; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary no-underline transition hover:bg-bg-secondary hover:text-text-primary">
      {icon}
      {children}
    </Link>
  );
}

function DiscordGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
