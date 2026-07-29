import { useEffect, useId, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export function AppShell() {
  const { token, username, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isPublicPortfolio = location.pathname.startsWith('/portfolio/');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (isPublicPortfolio) {
    return <Outlet />;
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' is-active' : ''}`;

  return (
    <div className="app app-light">
      <header className={`topbar${menuOpen ? ' is-menu-open' : ''}`}>
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Adawwa home">
            <span className="brand-mark-wrap">
              <img className="brand-mark" src="/logo-mark.png" alt="" width={28} height={28} />
            </span>
            <span className="brand-text">Adawwa</span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>

          <nav id={menuId} className={`topbar-nav${menuOpen ? ' is-open' : ''}`}>
            {token ? (
              <>
                <div className="nav-links">
                  <NavLink to="/dashboard" className={navClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/builder" className={navClass}>
                    Builder
                  </NavLink>
                </div>
                <div className="nav-account">
                  <span className="user-pill" title={username || undefined}>
                    <span className="user-pill-avatar" aria-hidden>
                      {(username || '?').charAt(0).toUpperCase()}
                    </span>
                    <span className="user-pill-name">{username}</span>
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm nav-logout" onClick={logout}>
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="nav-links">
                  <NavLink to="/login" className={navClass}>
                    Log in
                  </NavLink>
                </div>
                <div className="nav-account">
                  <Link className="btn btn-primary btn-sm" to="/register">
                    Get started
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className={isHome ? 'home-shell' : 'page-shell'}>
        <Outlet />
      </div>
      <footer className="site-credit">
        <p>
          Designed and Developed by{' '}
          <a href="https://griffinzone.com" target="_blank" rel="noopener noreferrer">
            Griffinzone (PVT) Ltd
          </a>
        </p>
      </footer>
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
