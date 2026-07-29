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
    desc: 'Clean HTML & CSS ready for Netlify, Vercel, or cPanel.',
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
          <p className="home-brand">PortfolioGen</p>
          <h1>Your portfolio, ready to share</h1>
          <p className="home-lead">
            Build a single-page portfolio once. Download clean source for SEO, or host it live with
            us.
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
          <ul className="home-trust">
            <li>Free to start</li>
            <li>SEO-friendly ZIP</li>
            <li>Live hosting</li>
          </ul>
        </div>

        <div className="home-hero-visual" aria-hidden>
          <div className="home-mock">
            <div className="home-mock-bar">
              <span />
              <span />
              <span />
              <em>portfolio/alex-rivera</em>
            </div>
            <div className="home-mock-body">
              <div className="home-mock-avatar" />
              <strong>Alex Rivera</strong>
              <span>Product engineer</span>
              <p>I design and ship clear web products for growing teams.</p>
              <div className="home-mock-tags">
                <span>React</span>
                <span>Node</span>
                <span>MySQL</span>
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
