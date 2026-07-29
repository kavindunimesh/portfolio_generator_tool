import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export function AppShell() {
  const { token, username, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isPublicPortfolio = location.pathname.startsWith('/portfolio/');

  if (isPublicPortfolio) {
    return <Outlet />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          Portfolio<span className="brand-accent">Gen</span>
        </Link>
        <nav>
          {token ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/builder" className="nav-link">
                Builder
              </Link>
              <button type="button" className="nav-link linkish" onClick={logout}>
                Log out
              </button>
              <span className="user-pill">{username}</span>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log in
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>
      <div className={isHome ? 'home-shell' : 'page-shell'}>
        <Outlet />
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading…
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
