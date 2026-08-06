import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

const steps = [
  {
    n: '1',
    title: 'Create a free account',
    desc: 'Just a username and password. No payment needed.',
  },
  {
    n: '2',
    title: 'Tell your story',
    desc: 'Add your name, photo, work, and projects — like filling a form.',
  },
  {
    n: '3',
    title: 'Share your page',
    desc: 'Get a link you can send to anyone. Update it whenever you want.',
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
          <h1>Your own page on the internet — made simple</h1>
          <p className="home-lead">
            Show who you are and what you do. No design skills. No coding. Just fill in your
            details and share the link.
          </p>
          <div className="home-cta">
            <Link className="btn btn-primary btn-lg" to={token ? '/builder' : '/register'}>
              {token ? 'Continue my page' : 'Make my page — free'}
            </Link>
            {!token && (
              <Link className="btn btn-secondary btn-lg" to="/login">
                I already have an account
              </Link>
            )}
          </div>
          <p className="home-proof">Free to start · Ready in minutes · Works on phones</p>
        </div>

        <div className="home-hero-visual" aria-hidden>
          <div className="home-hero-glow" />
          <div className="home-preview">
            <p className="home-preview-label">Example of your page</p>
            <div className="home-preview-card">
              <div className="home-preview-avatar">
                <img src="/logo-mark.png" alt="" width={64} height={64} />
              </div>
              <strong className="home-preview-name">Alex Rivera</strong>
              <span className="home-preview-role">Designer & maker</span>
              <p className="home-preview-bio">
                I help people share their work clearly — from ideas to a simple online page.
              </p>
              <div className="home-preview-pills">
                <span>Writing</span>
                <span>Design</span>
                <span>Teaching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-steps" aria-labelledby="home-steps-title">
        <div className="home-section-head">
          <h2 id="home-steps-title">How it works</h2>
          <p className="home-section-lead">Three easy steps. That’s all.</p>
        </div>
        <ol className="home-step-list">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="step-n" aria-hidden>
                {s.n}
              </span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-banner">
        <div>
          <h2>{token ? 'Pick up where you left off' : 'Ready when you are'}</h2>
          <p>
            {token
              ? 'Open the builder and keep shaping your page.'
              : 'Create your free account and start your page in a few minutes.'}
          </p>
        </div>
        <Link className="btn btn-primary btn-lg" to={token ? '/builder' : '/register'}>
          {token ? 'Continue my page' : 'Create free account'}
        </Link>
      </section>
    </main>
  );
}
