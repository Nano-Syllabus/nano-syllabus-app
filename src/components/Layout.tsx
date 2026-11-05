import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE } from '../lib/seo';
import { TopNavShell } from '../ui/TopNav';

// Signed in: the Figma top bar (Home · Topics · You) around every page,
// except the full-screen ones (lesson player, premium, payment), which draw
// their own header. Signed out: the public header and footer.
const FULL_SCREEN = /^\/app\/(watch|premium|checkout)\//;

export function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user && user.onboarded !== false) {
    if (FULL_SCREEN.test(pathname)) return <Outlet />;
    return (
      <TopNavShell>
        <Outlet />
      </TopNavShell>
    );
  }
  return <PublicLayout />;
}

function PublicLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="sticky top-0 z-30 h-[60px] border-b border-[#e2ede5] bg-white/95 backdrop-blur dark:border-[#1b2c20] dark:bg-[#141414]/95">
        <div className="mx-auto flex h-full w-[min(1384px,100%-32px)] items-center gap-6">
          <Link to="/" aria-label={`${SITE} home`} className="shrink-0">
            <img src="/app/ns-logo.webp" width={52} height={47} alt="" className="h-[47px] w-[52px] object-contain dark:brightness-0 dark:invert" />
          </Link>
          <nav className="flex items-center gap-5 text-[15px] font-medium text-[#5d6862] dark:text-[#a3ada8]">
            <NavLink to="/courses" className={({ isActive }) => (isActive ? 'text-[#18251e] dark:text-white' : 'hover:text-[#18251e] dark:hover:text-white')}>Courses</NavLink>
            <NavLink to="/app/teacher/guide" className={({ isActive }) => 'max-sm:hidden ' + (isActive ? 'text-[#18251e] dark:text-white' : 'hover:text-[#18251e] dark:hover:text-white')}>Teach</NavLink>
          </nav>
          <span className="flex-1" />
          {user ? (
            <div className="flex items-center gap-4 text-sm">
              <Link to="/app/topics" className="font-medium text-[#18251e] dark:text-white">My learning</Link>
              <button type="button" className="cursor-pointer text-[#5d6862] dark:text-[#a3ada8]" onClick={() => void logout()}>Sign out</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[15px] font-medium text-[#18251e] dark:text-white">Sign in</Link>
              <Link to="/signup" className="flex h-10 items-center rounded-[12px] bg-[#142c7d] px-4 text-sm font-semibold text-white transition hover:bg-[#0f2366] max-sm:hidden">Sign up</Link>
            </div>
          )}
        </div>
      </header>
      <Outlet />
      <footer className="footer">
        <div className="wrap row">
          <span>© {new Date().getFullYear()} {SITE}</span>
          <span className="spacer" />
          <Link to="/courses">All courses</Link>
          <Link to="/app/teacher/guide">Teach on {SITE}</Link>
        </div>
      </footer>
    </>
  );
}
