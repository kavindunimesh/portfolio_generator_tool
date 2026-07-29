import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { NoIndex } from '../components/NoIndex';
import { useToast } from '../toast';

export function DashboardPage() {
  const { portfolio, refresh, username } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);

  async function publish() {
    if (!portfolio?.userRoute) {
      toast.warning('Route required', 'Set your public route in the builder first.');
      return;
    }
    setBusy(true);
    try {
      await api.publish();
      await refresh();
      toast.success('Portfolio published', 'Your live page is now available to share.');
    } catch (err) {
      toast.error('Publish failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    setBusy(true);
    try {
      await api.unpublish();
      await refresh();
      toast.warning('Portfolio unpublished', 'Your public page is now hidden.');
    } catch (err) {
      toast.error('Unpublish failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    setBusy(true);
    try {
      const job = await api.download();
      const token = localStorage.getItem('token');
      const res = await fetch(api.downloadFileUrl(job.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = job.filename || 'portfolio.zip';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started', 'Host the zip on your own domain for SEO.');
    } catch (err) {
      toast.error('Download failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function downloadCv() {
    setCvBusy(true);
    try {
      const { blob, filename } = await api.downloadCv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CV ready', 'Your PDF curriculum vitae has downloaded.');
    } catch (err) {
      toast.error('CV download failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setCvBusy(false);
    }
  }

  function copyLiveUrl() {
    if (!portfolio?.userRoute) return;
    const url = `${window.location.origin}/portfolio/${portfolio.userRoute}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied', url),
      () => toast.error('Copy failed', 'Could not copy to clipboard.')
    );
  }

  if (!portfolio) {
    return (
      <main className="dashboard-page">
        <NoIndex />
        <div className="dashboard-empty">
          <h1>No portfolio yet</h1>
          <p className="muted">Create your portfolio in the builder to get started.</p>
          <Link className="btn btn-primary" to="/builder">
            Open builder →
          </Link>
        </div>
      </main>
    );
  }

  const hasRoute = Boolean(portfolio.userRoute);
  const isLive = portfolio.publicLive;
  const liveUrl = portfolio.userRoute
    ? `${window.location.origin}/portfolio/${portfolio.userRoute}`
    : null;

  return (
    <main className="dashboard-page">
      <NoIndex />

      <header className="dashboard-header">
        <div className="dashboard-header-copy">
          <p className="dashboard-kicker">Welcome back, {username}</p>
          <div className="dashboard-title-row">
            <h1>Dashboard</h1>
            <div className={`dashboard-status-badge ${isLive ? 'live' : 'draft'}`}>
              <span className="status-dot" />
              {isLive ? 'Live' : 'Draft'}
            </div>
          </div>
          <p className="muted">Manage your portfolio, download source, or host it with us.</p>
        </div>
      </header>

      <section className="dashboard-overview">
        <div className="overview-main">
          <div className={`overview-avatar${portfolio.personal.avatarUrl ? ' has-image' : ''}`}>
            {portfolio.personal.avatarUrl ? (
              <img src={portfolio.personal.avatarUrl} alt="" />
            ) : (
              <span>{(portfolio.personal.fullName || username || '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overview-copy">
            <h2>{portfolio.personal.fullName || 'Untitled portfolio'}</h2>
            <p className="overview-headline">
              {portfolio.personal.headline || 'No headline yet'}
            </p>
            <div className="overview-meta">
              <span>Template: <strong>{portfolio.templateSlug}</strong></span>
              <span>Theme: <strong>{portfolio.theme.mode}</strong></span>
              <span>Skills: <strong>{portfolio.skills?.length || 0}</strong></span>
              <span>Projects: <strong>{portfolio.projects?.length || 0}</strong></span>
            </div>
          </div>
        </div>
        <Link className="btn btn-secondary" to="/builder">
          Edit portfolio
        </Link>
      </section>

      {liveUrl && isLive && (
        <section className="dashboard-live-url">
          <div>
            <span className="live-url-label">Your live link</span>
            <code>{liveUrl}</code>
          </div>
          <div className="live-url-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyLiveUrl}>
              Copy link
            </button>
            <Link className="btn btn-primary btn-sm" to={portfolio.publicUrl!} target="_blank">
              Open page
            </Link>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-icon download">↓</div>
          <h3>Download source</h3>
          <p>Get SEO-friendly static HTML/CSS as a zip. Deploy on your own domain, Netlify, or any static host.</p>
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || cvBusy}
            onClick={() => void downloadZip()}
          >
            {busy ? 'Preparing…' : 'Download ZIP'}
          </button>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-icon download">CV</div>
          <h3>Download CV</h3>
          <p>
            Generate a clean PDF resume from your portfolio — profile, experience, education, skills,
            and projects.
          </p>
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || cvBusy || !portfolio.personal.fullName}
            onClick={() => void downloadCv()}
          >
            {cvBusy ? 'Preparing…' : 'Download CV PDF'}
          </button>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-icon host">↗</div>
          <h3>Host with us</h3>
          {hasRoute ? (
            <p>
              Publish at <code>/portfolio/{portfolio.userRoute}</code>. Good for sharing — not indexed
              by search engines.
            </p>
          ) : (
            <p className="dashboard-warn">
              Set a public route in the builder before you can publish.
            </p>
          )}
          {isLive ? (
            <button
              className="btn btn-ghost"
              type="button"
              disabled={busy || cvBusy}
              onClick={() => void unpublish()}
            >
              Unpublish
            </button>
          ) : (
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || cvBusy || !hasRoute}
              onClick={() => void publish()}
            >
              Publish now
            </button>
          )}
        </section>
      </div>

      <aside className="dashboard-tip">
        <strong>SEO tip</strong>
        <p>
          For search ranking, download the zip and host on <em>your own domain</em>. Our{' '}
          <code>/portfolio/...</code> links are for quick sharing only.
        </p>
      </aside>
      {portfolio.plugins?.contactForm?.enabled &&
        portfolio.plugins.contactForm.mode === 'adawwa' && (
          <aside className="dashboard-tip">
            <strong>Contact messages</strong>
            <p>
              Visitor messages go to your{' '}
              <Link to="/inbox">contact inbox</Link>.
            </p>
          </aside>
        )}
      {portfolio.plugins?.contactForm?.enabled &&
        portfolio.plugins.contactForm.mode === 'self_hosted' && (
          <aside className="dashboard-tip">
            <strong>Self-hosted contact form</strong>
            <p>
              Download the ZIP for the PHP + MySQL admin. Set your admin domain in Builder → Plugins so
              the form posts to the right endpoint
              {portfolio.plugins.contactForm.adminDomain?.trim()
                ? ` (${portfolio.plugins.contactForm.adminDomain.trim()}).`
                : ' (relative path if left blank).'}
            </p>
          </aside>
        )}
    </main>
  );
}
