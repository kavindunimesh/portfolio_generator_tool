import { useEffect, useState, type ReactNode } from 'react';
import type { Portfolio } from '../../api';
import { getTemplate, resolveSectionTitles } from '../../templates/catalog';
import { MarkdownContent } from '../MarkdownContent';
import { socialIconPaths, type SocialIconName } from './socialIcons';

type Props = {
  portfolio: Portfolio;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function SocialIcon({ name }: { name: SocialIconName }) {
  return (
    <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
      <path fill="currentColor" d={socialIconPaths[name]} />
    </svg>
  );
}

function Socials({
  socials,
  email,
  phone,
  whatsapp,
}: {
  socials: Portfolio['socials'];
  email?: string;
  phone?: string;
  whatsapp?: string;
}) {
  const whatsappDigits = digitsOnly(whatsapp || '');
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const hasIcons = Boolean(
    socials.github ||
      socials.linkedin ||
      socials.website ||
      socials.twitter ||
      socials.facebook ||
      socials.tiktok ||
      socials.youtube ||
      socials.behance ||
      socials.dribbble ||
      socials.instagram ||
      phone
  );
  const hasContacts = Boolean(email || (whatsapp && whatsappDigits));

  if (!hasIcons && !hasContacts) return null;

  return (
    <nav className="socials" aria-label="Social links">
      {hasIcons && (
        <div className="social-icons-row">
          {socials.github && (
            <a
              className="social-btn"
              href={socials.github}
              rel="noopener noreferrer"
              target="_blank"
              title="GitHub"
              aria-label="GitHub"
            >
              <SocialIcon name="github" />
            </a>
          )}
          {socials.linkedin && (
            <a
              className="social-btn"
              href={socials.linkedin}
              rel="noopener noreferrer"
              target="_blank"
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <SocialIcon name="linkedin" />
            </a>
          )}
          {socials.website && (
            <a
              className="social-btn"
              href={socials.website}
              rel="noopener noreferrer"
              target="_blank"
              title="Website"
              aria-label="Website"
            >
              <SocialIcon name="website" />
            </a>
          )}
          {socials.twitter && (
            <a
              className="social-btn"
              href={socials.twitter}
              rel="noopener noreferrer"
              target="_blank"
              title="Twitter / X"
              aria-label="Twitter / X"
            >
              <SocialIcon name="twitter" />
            </a>
          )}
          {socials.facebook && (
            <a
              className="social-btn"
              href={socials.facebook}
              rel="noopener noreferrer"
              target="_blank"
              title="Facebook"
              aria-label="Facebook"
            >
              <SocialIcon name="facebook" />
            </a>
          )}
          {socials.tiktok && (
            <a
              className="social-btn"
              href={socials.tiktok}
              rel="noopener noreferrer"
              target="_blank"
              title="TikTok"
              aria-label="TikTok"
            >
              <SocialIcon name="tiktok" />
            </a>
          )}
          {socials.youtube && (
            <a
              className="social-btn"
              href={socials.youtube}
              rel="noopener noreferrer"
              target="_blank"
              title="YouTube"
              aria-label="YouTube"
            >
              <SocialIcon name="youtube" />
            </a>
          )}
          {socials.instagram && (
            <a
              className="social-btn"
              href={socials.instagram}
              rel="noopener noreferrer"
              target="_blank"
              title="Instagram"
              aria-label="Instagram"
            >
              <SocialIcon name="instagram" />
            </a>
          )}
          {socials.behance && (
            <a
              className="social-btn"
              href={socials.behance}
              rel="noopener noreferrer"
              target="_blank"
              title="Behance"
              aria-label="Behance"
            >
              <SocialIcon name="behance" />
            </a>
          )}
          {socials.dribbble && (
            <a
              className="social-btn"
              href={socials.dribbble}
              rel="noopener noreferrer"
              target="_blank"
              title="Dribbble"
              aria-label="Dribbble"
            >
              <SocialIcon name="dribbble" />
            </a>
          )}
          {phone && phoneHref && (
            <a className="social-btn" href={phoneHref} title={phone} aria-label={`Call ${phone}`}>
              <SocialIcon name="phone" />
            </a>
          )}
        </div>
      )}
      {hasContacts && (
        <div className="social-contact-row">
          {email && (
            <a className="mail-link contact-chip" href={`mailto:${email}`} title={email}>
              <SocialIcon name="email" />
              <span>{email}</span>
            </a>
          )}
          {whatsapp && whatsappDigits && (
            <a
              className="wa-link contact-chip"
              href={`https://wa.me/${whatsappDigits}`}
              rel="noopener noreferrer"
              target="_blank"
              title={`WhatsApp ${whatsapp}`}
            >
              <SocialIcon name="whatsapp" />
              <span>{whatsapp}</span>
            </a>
          )}
        </div>
      )}
    </nav>
  );
}

function ProjectCards({
  projects,
  linkLabel = 'View project →',
  showIndex = false,
  imageWrapClass,
}: {
  projects: Portfolio['projects'];
  linkLabel?: string;
  showIndex?: boolean;
  imageWrapClass?: string;
}) {
  return (
    <div className="projects">
      {projects.map((p, index) => (
        <article className="card" key={`${p.title}-${index}`}>
          {showIndex && (
            <div className="card-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </div>
          )}
          {showIndex ? (
            <div className="card-main">
              {p.imageUrl &&
                (imageWrapClass ? (
                  <div className={imageWrapClass}>
                    <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                  </div>
                ) : (
                  <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                ))}
              <div className="card-body">
                <h3>{p.title}</h3>
                {p.description && <MarkdownContent markdown={p.description} />}
                {p.tech?.length > 0 && (
                  <ul className="chips small">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                {p.link && (
                  <a className="link" href={p.link} rel="noopener noreferrer" target="_blank">
                    {linkLabel}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              {p.imageUrl &&
                (imageWrapClass ? (
                  <div className={imageWrapClass}>
                    <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                  </div>
                ) : (
                  <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                ))}
              <div className="card-body">
                <h3>{p.title}</h3>
                {p.description && <MarkdownContent markdown={p.description} />}
                {p.tech?.length > 0 && (
                  <ul className="chips small">
                    {p.tech.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                {p.link && (
                  <a className="link" href={p.link} rel="noopener noreferrer" target="_blank">
                    {linkLabel}
                  </a>
                )}
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function formatDateRange(start?: string, end?: string) {
  const s = (start || '').trim();
  const e = (end || '').trim();
  if (!s && !e) return '';
  if (s && e) return `${s} — ${e}`;
  return s || e;
}

function ExperienceList({ items }: { items: Portfolio['experience'] }) {
  if (!items.length) return null;
  return (
    <div className="timeline">
      {items.map((item, index) => {
        const range = formatDateRange(item.startDate, item.endDate);
        return (
          <article className="timeline-item" key={`${item.company}-${item.role}-${index}`}>
            <div className="timeline-rail" aria-hidden="true">
              <span className="timeline-dot" />
            </div>
            <div className="timeline-body">
              <div className="timeline-head">
                {item.logoUrl ? (
                  <img className="timeline-logo" src={item.logoUrl} alt="" width={40} height={40} loading="lazy" />
                ) : null}
                <div className="timeline-copy">
                  <h3>{item.role || item.company}</h3>
                  {(item.company && item.role) || item.location ? (
                    <p className="timeline-org">
                      {item.role && item.company ? <span>{item.company}</span> : null}
                      {item.role && item.company && item.location ? (
                        <span className="timeline-sep" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      {item.location ? <span className="timeline-loc">{item.location}</span> : null}
                    </p>
                  ) : null}
                  {range ? <p className="timeline-dates">{range}</p> : null}
                </div>
              </div>
              {item.description && <MarkdownContent markdown={item.description} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function EducationList({ items }: { items: Portfolio['education'] }) {
  if (!items.length) return null;
  return (
    <div className="timeline">
      {items.map((item, index) => {
        const range = formatDateRange(item.startDate, item.endDate);
        return (
          <article className="timeline-item" key={`${item.school}-${item.degree}-${index}`}>
            <div className="timeline-rail" aria-hidden="true">
              <span className="timeline-dot" />
            </div>
            <div className="timeline-body">
              <div className="timeline-head">
                <div className="timeline-copy">
                  <h3>{item.degree || item.school}</h3>
                  {item.degree && item.school ? <p className="timeline-org">{item.school}</p> : null}
                  {item.field ? <p className="timeline-field">{item.field}</p> : null}
                  {range ? <p className="timeline-dates">{range}</p> : null}
                </div>
              </div>
              {item.description && <MarkdownContent markdown={item.description} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PortfolioSiteNav({
  brand,
  showAbout,
  showWork,
  workHref,
  showProjects,
  end,
}: {
  brand: string;
  showAbout: boolean;
  showWork: boolean;
  workHref: string;
  showProjects: boolean;
  end?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className={`site-nav${open ? ' is-open' : ''}`} aria-label="Primary">
      <div className="site-nav-inner">
        <a className="nav-brand" href="#home" onClick={close}>
          {brand}
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
          <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
        <div className="nav-links" id="site-nav-menu">
          <a href="#home" onClick={close}>
            Home
          </a>
          {showAbout && (
            <a href="#about" onClick={close}>
              About
            </a>
          )}
          {showWork && (
            <a href={workHref} onClick={close}>
              Work
            </a>
          )}
          {showProjects && (
            <a href="#projects" onClick={close}>
              Projects
            </a>
          )}
          <a href="#contact" onClick={close}>
            Contact
          </a>
        </div>
        {end}
      </div>
    </nav>
  );
}

function CareerSections({
  titles,
  experience,
  education,
  variant = 'default',
}: {
  titles: ReturnType<typeof resolveSectionTitles>;
  experience: Portfolio['experience'];
  education: Portfolio['education'];
  variant?: 'default' | 'developer' | 'editorial';
}) {
  return (
    <>
      {experience.length > 0 && (
        <section
          id="experience"
          className={
            variant === 'developer'
              ? 'panel career-panel'
              : 'section'
          }
        >
          {variant === 'developer' ? (
            <div className="panel-bar">
              <span />
              <span />
              <span />
              <code>experience.md</code>
            </div>
          ) : variant === 'editorial' ? (
            <div className="section-rule">
              <h2>{titles.experience}</h2>
              <span />
            </div>
          ) : (
            <div className="section-title">
              <h2>{titles.experience}</h2>
            </div>
          )}
          {variant === 'developer' && (
            <div className="section-head panel-section-head">
              <h2>{titles.experience}</h2>
            </div>
          )}
          <ExperienceList items={experience} />
        </section>
      )}
      {education.length > 0 && (
        <section
          id="education"
          className={
            variant === 'developer'
              ? 'panel career-panel'
              : 'section'
          }
        >
          {variant === 'developer' ? (
            <div className="panel-bar">
              <span />
              <span />
              <span />
              <code>education.md</code>
            </div>
          ) : variant === 'editorial' ? (
            <div className="section-rule">
              <h2>{titles.education}</h2>
              <span />
            </div>
          ) : (
            <div className="section-title">
              <h2>{titles.education}</h2>
            </div>
          )}
          {variant === 'developer' && (
            <div className="section-head panel-section-head">
              <h2>{titles.education}</h2>
            </div>
          )}
          <EducationList items={education} />
        </section>
      )}
    </>
  );
}

export function PortfolioView({ portfolio }: Props) {
  const slug = getTemplate(portfolio.templateSlug || 'minimal').slug;
  const template = getTemplate(slug);
  const { personal, socials, skills, projects, theme } = portfolio;
  const experience = portfolio.experience || [];
  const education = portfolio.education || [];
  const titles = resolveSectionTitles(slug, portfolio.sectionTitles);
  const year = new Date().getFullYear();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const rootClass = `pf pf-${slug} theme-${theme.mode}${ready ? ' is-ready' : ''}`;
  const style = { ['--accent' as string]: theme.primaryColor || template.defaultColor };

  if (slug === 'developer') {
    const showAbout = Boolean(personal.bio);
    const showWork = experience.length > 0 || education.length > 0;
    const showProjects = projects.length > 0;

    return (
      <div className={rootClass} style={style}>
        <PortfolioSiteNav
          brand={personal.fullName.split(' ')[0] || 'dev'}
          showAbout={showAbout}
          showWork={showWork}
          workHref={experience.length > 0 ? '#experience' : '#education'}
          showProjects={showProjects}
        />
        <div className="shell">
          <aside className="rail" id="home">
            <div className="rail-top">
              {personal.avatarUrl ? (
                <img className="avatar" src={personal.avatarUrl} alt={personal.fullName} width={252} height={252} />
              ) : (
                <div className="avatar avatar-fallback">{personal.fullName.charAt(0) || '?'}</div>
              )}
              <p className="mono tag">~/portfolio</p>
              <h1>{personal.fullName}</h1>
              {personal.headline && <p className="headline">{personal.headline}</p>}
              {personal.location && <p className="meta">{personal.location}</p>}
            </div>
            {skills.length > 0 && (
              <div className="rail-skills">
                <h2>{titles.skills}</h2>
                <ul className="chips">
                  {skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div id="contact">
              <Socials
                socials={socials}
                email={personal.email}
                phone={personal.phone}
                whatsapp={personal.whatsapp}
              />
            </div>
          </aside>
          <main id="main">
            {personal.bio && (
              <section className="panel" id="about">
                <div className="panel-bar">
                  <span />
                  <span />
                  <span />
                  <code>about.md</code>
                </div>
                <MarkdownContent className="bio" markdown={personal.bio} />
              </section>
            )}
            <CareerSections
              titles={titles}
              experience={experience}
              education={education}
              variant="developer"
            />
            {projects.length > 0 && (
              <section className="projects-section" id="projects">
                <div className="section-head">
                  <h2>{titles.projects}</h2>
                  <span className="mono">{projects.length} shipped</span>
                </div>
                <div className="projects">
                  {projects.map((p, index) => (
                    <article className="project-row" key={`${p.title}-${index}`}>
                      <div className="project-row-bar">
                        <span />
                        <span />
                        <span />
                        <code>{`projects/0${index}.md`}</code>
                        {p.link && (
                          <a className="link" href={p.link} rel="noopener noreferrer" target="_blank">
                            open ↗
                          </a>
                        )}
                      </div>
                      <div className={`project-row-body${p.imageUrl ? ' has-media' : ''}`}>
                        {p.imageUrl && (
                          <div className="project-media">
                            <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                          </div>
                        )}
                        <div className="project-content">
                          <div className="project-title-row">
                            <span className="project-index mono">0{index}</span>
                            <h3>{p.title}</h3>
                          </div>
                          {p.description && <MarkdownContent markdown={p.description} />}
                          {p.tech?.length > 0 && (
                            <ul className="chips small">
                              {p.tech.map((t) => (
                                <li key={t}>{t}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <footer className="footer">
              <p>
                © {year} {personal.fullName}
              </p>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  if (slug === 'aurora') {
    const showAbout = Boolean(personal.bio);
    const showWork = experience.length > 0 || education.length > 0;
    const showProjects = projects.length > 0;

    return (
      <div className={rootClass} style={style}>
        <div className="aurora-bg" aria-hidden="true">
          <span className="aurora-orb aurora-orb-a" />
          <span className="aurora-orb aurora-orb-b" />
          <span className="aurora-orb aurora-orb-c" />
          <span className="aurora-veil" />
        </div>
        <PortfolioSiteNav
          brand={personal.fullName.split(' ')[0] || 'Home'}
          showAbout={showAbout}
          showWork={showWork}
          workHref={experience.length > 0 ? '#experience' : '#education'}
          showProjects={showProjects}
        />
        <header className="hero" id="home">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <div className="hero-topline">
                <p className="badge">
                  <span className="badge-dot" aria-hidden="true" />
                  Available for work
                </p>
                {personal.location && <p className="loc-inline">{personal.location}</p>}
              </div>
              <h1>{personal.fullName}</h1>
              {personal.headline && <p className="headline">{personal.headline}</p>}
              <div className="hero-actions">
                {(experience.length > 0 || education.length > 0 || projects.length > 0) && (
                  <a
                    className="hero-cta"
                    href={
                      experience.length > 0
                        ? '#experience'
                        : education.length > 0
                          ? '#education'
                          : '#projects'
                    }
                  >
                    View my work
                  </a>
                )}
                {personal.email && (
                  <a className="hero-cta ghost" href={`mailto:${personal.email}`}>
                    Say hello
                  </a>
                )}
              </div>
              <div id="contact">
                <Socials
                  socials={socials}
                  email={undefined}
                  phone={personal.phone}
                  whatsapp={personal.whatsapp}
                />
              </div>
            </div>
            <div className="hero-visual">
              <div className="avatar-frame">
                {personal.avatarUrl ? (
                  <img className="avatar" src={personal.avatarUrl} alt={personal.fullName} width={300} height={360} />
                ) : (
                  <div className="avatar avatar-empty" />
                )}
              </div>
            </div>
          </div>
        </header>
        <main id="main" className="wrap">
          {personal.bio && (
            <section className="section panel" id="about">
              <div className="section-head">
                <h2>{titles.about}</h2>
              </div>
              <MarkdownContent className="bio" markdown={personal.bio} />
            </section>
          )}
          {skills.length > 0 && (
            <section className="section panel skills-panel">
              <div className="section-head">
                <h2>{titles.skills}</h2>
              </div>
              <ul className="chips">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          <CareerSections titles={titles} experience={experience} education={education} />
          {projects.length > 0 && (
            <section className="section projects-panel" id="projects">
              <div className="section-head">
                <h2>{titles.projects}</h2>
                <span className="section-count">{projects.length} selected</span>
              </div>
              <div className="projects">
                {projects.map((p, index) => (
                  <article className="card" key={`${p.title}-${index}`}>
                    <div className={`card-media${p.imageUrl ? '' : ' is-empty'}`}>
                      {p.imageUrl ? (
                        <img className="project-image" src={p.imageUrl} alt={p.title} loading="lazy" />
                      ) : (
                        <span className="card-media-fallback" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="card-top">
                        <h3>{p.title}</h3>
                        {p.link && (
                          <a className="link" href={p.link} rel="noopener noreferrer" target="_blank">
                            Open ↗
                          </a>
                        )}
                      </div>
                      {p.description && <MarkdownContent markdown={p.description} />}
                      {p.tech?.length > 0 && (
                        <ul className="chips small">
                          {p.tech.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
        <footer className="wrap footer">
          <div className="footer-inner">
            <div>
              <p className="footer-brand">{personal.fullName}</p>
              <p className="footer-copy">© {year} · Crafted with Aurora</p>
            </div>
            <a className="footer-top" href="#home" aria-label="Back to top">
              ↑
            </a>
          </div>
        </footer>
      </div>
    );
  }

  if (slug === 'editorial') {
    const showAbout = Boolean(personal.bio);
    const showWork = experience.length > 0 || education.length > 0;
    const showProjects = projects.length > 0;

    return (
      <div className={rootClass} style={style}>
        <div className="paper-grain" aria-hidden="true" />
        <PortfolioSiteNav
          brand={personal.fullName.split(' ')[0] || 'Portfolio'}
          showAbout={showAbout}
          showWork={showWork}
          workHref={experience.length > 0 ? '#experience' : '#education'}
          showProjects={showProjects}
          end={
            <div className="mast-meta">
              <p className="issue">Vol. 01 · {year}</p>
              {personal.location && <p className="issue">{personal.location}</p>}
            </div>
          }
        />
        <header className="hero wrap" id="home">
          <div className="hero-copy">
            <p className="byline">Featured profile</p>
            <h1>{personal.fullName}</h1>
            {personal.headline && <p className="headline">{personal.headline}</p>}
            <div id="contact">
              <Socials
                socials={socials}
                email={personal.email}
                phone={personal.phone}
                whatsapp={personal.whatsapp}
              />
            </div>
          </div>
          <div className="hero-visual">
            {personal.avatarUrl ? (
              <figure className="portrait">
                <img className="avatar" src={personal.avatarUrl} alt={personal.fullName} width={260} height={320} />
                <figcaption>{personal.fullName}</figcaption>
              </figure>
            ) : (
              <div className="portrait portrait-empty" aria-hidden="true" />
            )}
          </div>
        </header>
        <main id="main" className="wrap">
          {personal.bio && (
            <section className="section about" id="about">
              <div className="section-rule">
                <h2>{titles.about}</h2>
                <span />
              </div>
              <MarkdownContent className="bio lede" markdown={personal.bio} />
            </section>
          )}
          {skills.length > 0 && (
            <section className="section skills-row">
              <div className="section-rule">
                <h2>{titles.skills}</h2>
                <span />
              </div>
              <ul className="chips">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          <CareerSections
            titles={titles}
            experience={experience}
            education={education}
            variant="editorial"
          />
          {projects.length > 0 && (
            <section className="section" id="projects">
              <div className="section-rule">
                <h2>{titles.projects}</h2>
                <span />
              </div>
              <ProjectCards projects={projects} linkLabel="Read more" showIndex />
            </section>
          )}
        </main>
        <footer className="wrap footer">
          <p>
            © {year} {personal.fullName}
          </p>
          <p className="footer-end">End of issue</p>
        </footer>
      </div>
    );
  }

  if (slug === 'noir') {
    return (
      <div className={rootClass} style={style}>
        <div className="film-grain" aria-hidden="true" />
        <header className="hero">
          <div className="wrap">
            <p className="kicker">Portfolio / {year}</p>
            <div className="hero-row">
              {personal.avatarUrl && (
                <img className="avatar" src={personal.avatarUrl} alt={personal.fullName} width={120} height={120} />
              )}
              <div>
                <h1>{personal.fullName}</h1>
                {personal.headline && <p className="headline">{personal.headline}</p>}
              </div>
            </div>
            <div className="hero-meta">
              {personal.location && <span>{personal.location}</span>}
              <Socials
                socials={socials}
                email={personal.email}
                phone={personal.phone}
                whatsapp={personal.whatsapp}
              />
            </div>
          </div>
        </header>
        <main id="main" className="wrap">
          {personal.bio && (
            <section className="section intro">
              <h2>{titles.about}</h2>
              <MarkdownContent className="bio" markdown={personal.bio} />
            </section>
          )}
          {skills.length > 0 && (
            <section className="section">
              <h2>{titles.skills}</h2>
              <ul className="chips">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          <CareerSections titles={titles} experience={experience} education={education} />
          {projects.length > 0 && (
            <section className="section">
              <h2>{titles.projects}</h2>
              <ProjectCards projects={projects} linkLabel="Watch cut →" imageWrapClass="shot" />
            </section>
          )}
        </main>
        <footer className="wrap footer">
          <p>
            © {year} {personal.fullName} — End credits
          </p>
        </footer>
      </div>
    );
  }

  // minimal (default)
  const showAbout = Boolean(personal.bio || personal.avatarUrl || personal.location);
  const showWork = experience.length > 0 || education.length > 0;
  const showProjects = projects.length > 0;

  return (
    <div className={rootClass} style={style}>
      <PortfolioSiteNav
        brand={personal.fullName.split(' ')[0] || 'Home'}
        showAbout={showAbout}
        showWork={showWork}
        workHref={experience.length > 0 ? '#experience' : '#education'}
        showProjects={showProjects}
      />

      <div className="page">
        <header className="hero" id="home">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-inner">
            <p className="hello">Hi! I am</p>
            <h1>{personal.fullName}</h1>
            {personal.headline && <p className="headline">{personal.headline}</p>}
            <div className="hero-actions">
              {personal.email && (
                <a className="cta" href={`mailto:${personal.email}`}>
                  Contact Me
                </a>
              )}
              <Socials
                socials={socials}
                email={undefined}
                phone={personal.phone}
                whatsapp={personal.whatsapp}
              />
            </div>
            <a className="scroll-cue" href="#about">
              <span>Scroll for more</span>
              <span className="scroll-arrow" aria-hidden="true" />
            </a>
          </div>
        </header>

        {skills.length > 0 && (
          <div className="skill-marquee" aria-hidden="true">
            <div className="skill-track">
              {[...skills, ...skills].map((s, i) => (
                <span key={`${s}-${i}`}>{s}</span>
              ))}
            </div>
          </div>
        )}

        <main id="main">
          {showAbout && (
            <section className="section about-split" id="about">
              {personal.avatarUrl && (
                <div className="about-media">
                  <img
                    className="about-photo"
                    src={personal.avatarUrl}
                    alt={personal.fullName}
                    width={420}
                    height={520}
                  />
                </div>
              )}
              <div className="about-copy">
                <p className="section-kicker">{titles.about}</p>
                <h2>About Me</h2>
                {personal.location && (
                  <p className="based">
                    Based in <strong>{personal.location}</strong>
                  </p>
                )}
                {personal.bio && <MarkdownContent className="lead" markdown={personal.bio} />}
                {skills.length > 0 && (
                  <ul className="chips">
                    {skills.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          <CareerSections titles={titles} experience={experience} education={education} />

          {showProjects && (
            <section className="section" id="projects">
              <div className="section-title">
                <p className="section-kicker">Selected</p>
                <h2>{titles.projects}</h2>
              </div>
              <ProjectCards projects={projects} linkLabel="View work" />
            </section>
          )}

          <section className="section connect" id="contact">
            <p className="section-kicker">Let&apos;s connect</p>
            <h2>Say Hi!</h2>
            {personal.email && (
              <a className="connect-mail" href={`mailto:${personal.email}`}>
                {personal.email}
              </a>
            )}
            <Socials
              socials={socials}
              email={personal.email}
              phone={personal.phone}
              whatsapp={personal.whatsapp}
            />
          </section>
        </main>

        <footer className="footer">
          <p>
            © {year} {personal.fullName}
          </p>
        </footer>
      </div>
    </div>
  );
}
