import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export function AppShell() {
  const { token, username, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isPublicPortfolio = location.pathname.startsWith('/portfolio/');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (isPublicPortfolio) {
    return <Outlet />;
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' is-active' : ''}`;

  const navLinks = token ? (
    <>
      <div className="nav-links">
        <NavLink to="/builder" className={navClass} onClick={() => setMenuOpen(false)}>
          Builder
        </NavLink>
        <NavLink to="/inbox" className={navClass} onClick={() => setMenuOpen(false)}>
          Inbox
        </NavLink>
      </div>
      <div className="nav-account">
        <span className="user-pill" title={username || undefined}>
          <span className="user-pill-avatar" aria-hidden>
            {(username || '?').charAt(0).toUpperCase()}
          </span>
          <span className="user-pill-name">{username}</span>
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm nav-logout"
          onClick={() => {
            setMenuOpen(false);
            logout();
          }}
        >
          Log out
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="nav-links">
        <NavLink to="/login" className={navClass} onClick={() => setMenuOpen(false)}>
          Log in
        </NavLink>
      </div>
      <div className="nav-account">
        <Link className="btn btn-primary btn-sm" to="/register" onClick={() => setMenuOpen(false)}>
          Get started
        </Link>
      </div>
    </>
  );

  return (
    <div className={`app app-light${menuOpen ? ' is-nav-open' : ''}`}>
      <header className={`topbar${menuOpen ? ' is-menu-open' : ''}`}>
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Adawwa home" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark-wrap">
              <img className="brand-mark" src="/logo-mark.png" alt="" width={28} height={28} />
            </span>
            <span className="brand-text">Adawwa</span>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="adawwa-main-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>

          <nav id="adawwa-main-nav" className="topbar-nav topbar-nav-desktop" aria-label="Main">
            {navLinks}
          </nav>
        </div>
      </header>

      <div
        className={`nav-drawer-root${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          className="nav-backdrop"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
        <nav className="topbar-nav topbar-nav-drawer" aria-label="Main">
          {navLinks}
        </nav>
      </div>

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
