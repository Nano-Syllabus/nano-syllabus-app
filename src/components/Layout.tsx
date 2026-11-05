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
      <header className="header">
        <div className="wrap">
          <Link to={user ? '/app' : '/'} className="brand" aria-label={`${SITE} home`}>
            <img src="/icon.svg" alt="" width={28} height={28} />
            <span className="brand-name">{SITE}</span>
          </Link>
          <nav className="nav">
            <NavLink to="/courses">Courses</NavLink>
            {user && <NavLink to="/app" end>My learning</NavLink>}
            {user?.role === 'teacher' || user?.role === 'admin' ? <NavLink to="/app/teach">Teach</NavLink> : <NavLink to="/teach" className="nav-hide-sm">Teach</NavLink>}
            {user?.role === 'admin' && <NavLink to="/app/admin">Admin</NavLink>}
          </nav>
          <span className="spacer" />
          {user ? (
            <div className="row">
              <span className="muted small nav-hide-sm">{user.name}</span>
              <button className="btn btn-ghost" onClick={() => void logout()}>Sign out</button>
            </div>
          ) : (
            <div className="row">
              <Link to="/login" className="btn btn-ghost nav-hide-sm">Sign in</Link>
              <Link to="/signup" className="btn btn-primary">Get started</Link>
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
          <Link to="/teach">Teach on {SITE}</Link>
        </div>
      </footer>
    </>
  );
}
