import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { SITE } from '../lib/seo';

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="header">
        <div className="container">
          <Link to={user ? '/app' : '/'} className="brand" aria-label={`${SITE} home`}>
            <img src="/icon.svg" alt="" width={28} height={28} />
            <span className="brand-name">{SITE}</span>
          </Link>
          <nav className="nav">
            <NavLink to="/courses">Courses</NavLink>
            {user && <NavLink to="/app" end>My learning</NavLink>}
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
        <div className="container row">
          <span>© {new Date().getFullYear()} {SITE}</span>
          <span className="spacer" />
          <Link to="/courses">All courses</Link>
        </div>
      </footer>
    </>
  );
}
