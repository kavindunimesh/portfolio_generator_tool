import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

const steps = [
  { n: '01', title: 'Create account', desc: 'Username + password. Takes seconds.' },
  { n: '02', title: 'Fill your details', desc: 'Bio, skills, projects, and a public route.' },
  { n: '03', title: 'Download or host', desc: 'Zip source for SEO, or go live instantly.' },
];

const highlights = [
  {
    title: 'Static source zip',
    desc: 'SEO-ready HTML & CSS you can deploy on Netlify, Vercel, or cPanel.',
    tag: 'Download',
  },
  {
    title: 'Instant hosting',
    desc: 'Publish at /portfolio/your-name and share a link right away.',
    tag: 'Host',
  },
  {
    title: 'Edit anytime',
    desc: 'Update MySQL-backed details and your live page refreshes with you.',
    tag: 'Sync',
  },
];

export function HomePage() {
  const { token } = useAuth();

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-orb home-orb-a" aria-hidden />
        <div className="home-orb home-orb-b" aria-hidden />
        <div className="home-grid-bg" aria-hidden />

        <div className="home-hero-copy">
          <div className="home-pill">
            <span className="home-pill-dot" />
            Live in minutes — no design tools
          </div>

          <h1>
            Your portfolio, <em>ready to ship</em>
          </h1>

          <p className="home-lead">
            Build a single-page portfolio, download clean source code, or host it with us at{' '}
            <code>/portfolio/your-name</code>.
          </p>

          <div className="home-cta">
            <Link className="btn btn-primary btn-lg" to={token ? '/builder' : '/register'}>
              {token ? 'Open builder →' : 'Start free →'}
            </Link>
            {!token && (
              <Link className="btn btn-secondary btn-lg" to="/login">
                Log in
              </Link>
            )}
          </div>

          <ul className="home-trust">
            <li>No credit card</li>
            <li>Static HTML zip</li>
            <li>cPanel friendly</li>
          </ul>
        </div>

        <div className="home-preview" aria-hidden>
          <div className="preview-window">
            <div className="preview-chrome">
              <span />
              <span />
              <span />
              <p>portfolio/alex-rivera</p>
            </div>
            <div className="preview-body">
              <div className="preview-avatar" />
              <div className="preview-lines">
                <strong>Alex Rivera</strong>
                <span>Full-stack developer</span>
                <p>I build fast web products with clean UX.</p>
              </div>
              <div className="preview-chips">
                <span>React</span>
                <span>Node</span>
                <span>MySQL</span>
              </div>
              <div className="preview-cards">
                <article>
                  <b>ERP Suite</b>
                  <small>Operations platform</small>
                </article>
                <article>
                  <b>Music Bot</b>
                  <small>AI-powered Discord</small>
                </article>
              </div>
            </div>
          </div>
          <div className="preview-float preview-float-zip">ZIP ready</div>
          <div className="preview-float preview-float-live">● Live</div>
        </div>
      </section>

      <section className="home-steps">
        <div className="home-section-head">
          <p className="home-kicker">How it works</p>
          <h2>Three steps. Done.</h2>
        </div>
        <ol className="home-step-list">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="step-n">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-highlights">
        {highlights.map((h) => (
          <article key={h.title} className="home-highlight-card">
            <span className="home-tag">{h.tag}</span>
            <h3>{h.title}</h3>
            <p>{h.desc}</p>
          </article>
        ))}
      </section>

      <section className="home-banner">
        <div>
          <h2>Ready when you are</h2>
          <p>Register, save details, download or publish — your call.</p>
        </div>
        <Link className="btn btn-primary btn-lg" to={token ? '/dashboard' : '/register'}>
          {token ? 'Go to dashboard →' : 'Create account →'}
        </Link>
      </section>
    </main>
  );
}
