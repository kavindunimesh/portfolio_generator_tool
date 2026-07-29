import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

const steps = [
  { n: '01', title: 'Create account', desc: 'Sign up with a username and password — free, no card.' },
  { n: '02', title: 'Add your details', desc: 'Profile, experience, skills, and projects in one place.' },
  { n: '03', title: 'Download or publish', desc: 'Export SEO-ready HTML, or go live at your public link.' },
];

const options = [
  {
    title: 'Static ZIP download',
    desc: 'Clean HTML & CSS ready for Netlify, Vercel, or any static host.',
  },
  {
    title: 'Instant hosting',
    desc: 'Publish at /portfolio/your-name and share the link.',
  },
  {
    title: 'Edit anytime',
    desc: 'Update your details — the hosted page stays in sync.',
  },
];

export function HomePage() {
  const { token } = useAuth();

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-brand-row">
            <img className="home-brand-logo" src="/logo-mark.png" alt="" width={40} height={40} />
            <p className="home-brand">Adawwa</p>
          </div>
          <h1>Build a portfolio you can publish today</h1>
          <p className="home-lead">
            Fill in your details once. Download clean HTML for SEO, or host a live page at your own
            link.
          </p>
          <div className="home-cta">
            <Link className="btn btn-primary btn-lg" to={token ? '/builder' : '/register'}>
              {token ? 'Open builder' : 'Get started free'}
            </Link>
            {!token && (
              <Link className="btn btn-secondary btn-lg" to="/login">
                Log in
              </Link>
            )}
          </div>
          <p className="home-proof">Free to start · ZIP download · Instant hosting</p>
        </div>

        <div className="home-hero-visual" aria-hidden>
          <div className="home-hero-glow" />
          <div className="home-mock">
            <div className="home-mock-bar">
              <span />
              <span />
              <span />
              <em>adawwa.com/portfolio/alex</em>
            </div>
            <div className="home-mock-body">
              <div className="home-mock-top">
                <div className="home-mock-avatar">
                  <img src="/logo-mark.png" alt="" width={56} height={56} />
                </div>
                <div className="home-mock-intro">
                  <strong>Alex Rivera</strong>
                  <span>Product engineer</span>
                </div>
              </div>
              <p>
                I design and ship clear web products for growing teams — from ERP suites to
                AI-powered tools.
              </p>
              <div className="home-mock-tags">
                <span>React</span>
                <span>Node</span>
                <span>MySQL</span>
                <span>TypeScript</span>
              </div>
              <div className="home-mock-work">
                <article>
                  <b>ERP Suite</b>
                  <small>Operations platform</small>
                </article>
                <article>
                  <b>Music Bot</b>
                  <small>Discord + AI</small>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-steps" aria-labelledby="home-steps-title">
        <div className="home-section-head">
          <p className="home-kicker">How it works</p>
          <h2 id="home-steps-title">Three steps to a live portfolio</h2>
        </div>
        <ol className="home-step-list">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-options" aria-labelledby="home-options-title">
        <div className="home-section-head">
          <p className="home-kicker">What you get</p>
          <h2 id="home-options-title">Built for shipping, not designing</h2>
        </div>
        <ul className="home-option-list">
          {options.map((o) => (
            <li key={o.title}>
              <h3>{o.title}</h3>
              <p>{o.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-banner">
        <div>
          <h2>{token ? 'Continue where you left off' : 'Start in about a minute'}</h2>
          <p>
            {token
              ? 'Jump back into the builder or open your dashboard.'
              : 'Register free, add your details, then download or publish.'}
          </p>
        </div>
        <Link className="btn btn-primary btn-lg" to={token ? '/dashboard' : '/register'}>
          {token ? 'Go to dashboard' : 'Create account'}
        </Link>
      </section>
    </main>
  );
}
