import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Portfolio } from '../api';
import { useAuth } from '../auth';
import { NoIndex } from '../components/NoIndex';
import { ImageUpload } from '../components/ImageUpload';
import { MarkdownRichEditor } from '../components/MarkdownRichEditor';
import { createId } from '../lib/id';
import { getAuthToken } from '../lib/authSession';
import { useToast } from '../toast';
import { TEMPLATES, getTemplate, resolveSectionTitles, type TemplateSlug } from '../templates/catalog';

type ExperienceItem = Portfolio['experience'][number] & { clientId: string };
type EducationItem = Portfolio['education'][number] & { clientId: string };

type ProjectFormItem = {
  clientId: string;
  title: string;
  description: string;
  techText: string;
  link: string;
  imageUrl: string;
};

type FormState = {
  userRoute: string;
  templateSlug: TemplateSlug;
  personal: Portfolio['personal'];
  socials: Portfolio['socials'];
  skillsText: string;
  projects: ProjectFormItem[];
  education: EducationItem[];
  experience: ExperienceItem[];
  sectionTitles: Portfolio['sectionTitles'];
  seo: Portfolio['seo'];
  theme: Portfolio['theme'];
  plugins: Portfolio['plugins'];
};

type TabId =
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'socials'
  | 'seo'
  | 'design'
  | 'plugins'
  | 'share';

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: 'profile', label: 'Profile', desc: 'Name, bio & contact' },
  { id: 'experience', label: 'Experience', desc: 'Work history' },
  { id: 'education', label: 'Education', desc: 'Qualifications' },
  { id: 'skills', label: 'Skills', desc: 'What you know' },
  { id: 'projects', label: 'Projects', desc: 'Your work' },
  { id: 'socials', label: 'Socials', desc: 'Online links' },
  { id: 'seo', label: 'SEO', desc: 'Meta & sharing' },
  { id: 'design', label: 'Design', desc: 'Route, template & theme' },
  { id: 'plugins', label: 'Plugins', desc: 'Contact form & extras' },
  { id: 'share', label: 'Share', desc: 'Publish & download' },
];

function TabIcon({ id }: { id: TabId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };
  switch (id) {
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8" />
        </svg>
      );
    case 'experience':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
          <path d="M3 12h18" />
        </svg>
      );
    case 'education':
      return (
        <svg {...common}>
          <path d="M3 10 12 5l9 5-9 5-9-5Z" />
          <path d="M7 12.5v4.2c0 .6 2.2 2.3 5 2.3s5-1.7 5-2.3v-4.2" />
          <path d="M21 10v6" />
        </svg>
      );
    case 'skills':
      return (
        <svg {...common}>
          <path d="M12 3v4" />
          <path d="M12 17v4" />
          <path d="M3 12h4" />
          <path d="M17 12h4" />
          <circle cx="12" cy="12" r="3.25" />
        </svg>
      );
    case 'projects':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="6" rx="1.5" />
          <rect x="3" y="14" width="8" height="6" rx="1.5" />
          <rect x="13" y="14" width="8" height="6" rx="1.5" />
        </svg>
      );
    case 'socials':
      return (
        <svg {...common}>
          <circle cx="7.5" cy="9" r="2.5" />
          <circle cx="16.5" cy="7.5" r="2.5" />
          <circle cx="15.5" cy="16.5" r="2.5" />
          <path d="M9.5 10.2 14.2 8.3" />
          <path d="M9.3 10.8 13.5 15" />
        </svg>
      );
    case 'seo':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16.5 20.5 21" />
        </svg>
      );
    case 'design':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      );
    case 'plugins':
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <rect x="5" y="8" width="14" height="11" rx="2.5" />
          <path d="M9 13h6M9 16h4" />
        </svg>
      );
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M8.4 10.8 15.6 6.2M8.4 13.2 15.6 17.8" />
        </svg>
      );
  }
}

function isTabReady(id: TabId, form: FormState): boolean {
  switch (id) {
    case 'profile':
      return Boolean(form.personal.fullName.trim());
    case 'experience':
      return form.experience.some((e) => e.company.trim() || e.role.trim());
    case 'education':
      return form.education.some((e) => e.school.trim() || e.degree.trim());
    case 'skills':
      return form.skillsText.split(',').some((s) => s.trim());
    case 'projects':
      return form.projects.some((p) => p.title.trim());
    case 'socials':
      return Object.values(form.socials).some((v) => String(v || '').trim());
    case 'seo':
      return Boolean(form.seo.title.trim() || form.seo.description.trim());
    case 'design':
      return Boolean(form.userRoute.trim() && form.templateSlug);
    case 'plugins':
      return form.plugins.contactForm.enabled;
    case 'share':
      return Boolean(form.userRoute.trim());
  }
}

const emptyEducation = (): EducationItem => ({
  clientId: createId(),
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  description: '',
});

const emptyExperience = (): ExperienceItem => ({
  clientId: createId(),
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  logoUrl: '',
});

const emptyProject = (): ProjectFormItem => ({
  clientId: createId(),
  title: '',
  description: '',
  techText: '',
  link: '',
  imageUrl: '',
});

const emptyForm: FormState = {
  userRoute: '',
  templateSlug: 'minimal',
  personal: {
    fullName: '',
    headline: '',
    bio: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    avatarUrl: '',
  },
  socials: { github: '', linkedin: '', website: '', twitter: '', facebook: '', tiktok: '', youtube: '', behance: '', dribbble: '', instagram: '' },
  skillsText: '',
  projects: [emptyProject()],
  education: [emptyEducation()],
  experience: [emptyExperience()],
  sectionTitles: { about: '', skills: '', projects: '', education: '', experience: '' },
  seo: {
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    faviconUrl: '',
    twitterCard: 'summary_large_image',
    canonicalUrl: '',
    robots: 'index,follow',
  },
  theme: { primaryColor: '#0F766E', mode: 'light' },
  plugins: {
    contactForm: { enabled: false, mode: 'adawwa', adminUsername: 'admin', adminDomain: '' },
  },
};

function fromPortfolio(p: Portfolio): FormState {
  return {
    userRoute: p.userRoute || '',
    templateSlug: (TEMPLATES.some((t) => t.slug === p.templateSlug)
      ? p.templateSlug
      : p.templateSlug === 'terminal'
        ? 'developer'
        : 'minimal') as TemplateSlug,
    personal: {
      fullName: p.personal.fullName || '',
      headline: p.personal.headline || '',
      bio: p.personal.bio || '',
      email: p.personal.email || '',
      phone: p.personal.phone || '',
      whatsapp: p.personal.whatsapp || '',
      location: p.personal.location || '',
      avatarUrl: p.personal.avatarUrl || '',
    },
    socials: { ...emptyForm.socials, ...p.socials },
    skillsText: (p.skills || []).join(', '),
    projects: p.projects?.length
      ? p.projects.map((x) => ({
          clientId: createId(),
          title: x.title || '',
          description: x.description || '',
          techText: (x.tech || []).join(', '),
          link: x.link || '',
          imageUrl: x.imageUrl || '',
        }))
      : [emptyProject()],
    education: p.education?.length
      ? p.education.map((x) => ({
          clientId: createId(),
          school: x.school || '',
          degree: x.degree || '',
          field: x.field || '',
          startDate: x.startDate || '',
          endDate: x.endDate || '',
          description: x.description || '',
        }))
      : [emptyEducation()],
    experience: p.experience?.length
      ? p.experience.map((x) => ({
          clientId: createId(),
          company: x.company || '',
          role: x.role || '',
          location: x.location || '',
          startDate: x.startDate || '',
          endDate: x.endDate || '',
          description: x.description || '',
          logoUrl: x.logoUrl || '',
        }))
      : [emptyExperience()],
    sectionTitles: { ...emptyForm.sectionTitles, ...p.sectionTitles },
    seo: { ...emptyForm.seo, ...p.seo },
    theme: { ...p.theme },
    plugins: {
      contactForm: {
        ...emptyForm.plugins.contactForm,
        ...(p.plugins?.contactForm || {}),
      },
    },
  };
}

export function BuilderPage() {
  const { portfolio, refresh } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = sessionStorage.getItem('builderActiveTab');
    return TABS.some((t) => t.id === saved) ? (saved as TabId) : 'profile';
  });
  const [routeHint, setRouteHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [cvBusy, setCvBusy] = useState(false);
  const tabsNavRef = useRef<HTMLElement | null>(null);
  const titleDefaults = resolveSectionTitles(form.templateSlug);

  useEffect(() => {
    sessionStorage.setItem('builderActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const active = tabsNavRef.current?.querySelector<HTMLElement>('.builder-tab.active');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (portfolio) {
      const next = fromPortfolio(portfolio);
      setForm(next);
      // Collapse filled entries by default so the form stays scannable
      setCollapsedItems(
        new Set([
          ...next.experience
            .filter((e) => e.company.trim() || e.role.trim())
            .map((e) => e.clientId),
          ...next.education
            .filter((e) => e.school.trim() || e.degree.trim())
            .map((e) => e.clientId),
          ...next.projects.filter((p) => p.title.trim()).map((p) => p.clientId),
        ])
      );
    }
  }, [portfolio]);

  function toggleCollapsed(clientId: string) {
    setCollapsedItems((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function moveInList<T>(list: T[], index: number, direction: -1 | 1): T[] | null {
    const target = index + direction;
    if (target < 0 || target >= list.length) return null;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    return next;
  }

  function moveExperience(index: number, direction: -1 | 1) {
    const experience = moveInList(form.experience, index, direction);
    if (experience) setForm({ ...form, experience });
  }

  function moveEducation(index: number, direction: -1 | 1) {
    const education = moveInList(form.education, index, direction);
    if (education) setForm({ ...form, education });
  }

  function moveProject(index: number, direction: -1 | 1) {
    const projects = moveInList(form.projects, index, direction);
    if (projects) setForm({ ...form, projects });
  }

  function updateExperience(index: number, patch: Partial<ExperienceItem>) {
    const experience = [...form.experience];
    experience[index] = { ...experience[index], ...patch };
    setForm({ ...form, experience });
  }

  function updateEducation(index: number, patch: Partial<EducationItem>) {
    const education = [...form.education];
    education[index] = { ...education[index], ...patch };
    setForm({ ...form, education });
  }

  function updateProject(index: number, patch: Partial<ProjectFormItem>) {
    const projects = [...form.projects];
    projects[index] = { ...projects[index], ...patch };
    setForm({ ...form, projects });
  }

  useEffect(() => {
    const route = form.userRoute.trim().toLowerCase();
    if (!route) {
      setRouteHint('');
      return;
    }
    const t = setTimeout(() => {
      void api
        .checkRoute(route)
        .then((r) => {
          if (r.available) setRouteHint('Available');
          else setRouteHint(r.reason === 'reserved' ? 'Reserved' : 'Taken or invalid');
        })
        .catch(() => setRouteHint(''));
    }, 350);
    return () => clearTimeout(t);
  }, [form.userRoute]);

  async function savePortfolio(label: string) {
    setBusy(true);
    try {
      const skills = form.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const projects = form.projects
        .filter((p) => p.title.trim())
        .map(({ clientId: _clientId, techText, ...rest }) => ({
          ...rest,
          tech: techText
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }));
      const education = form.education
        .filter((e) => e.school.trim() || e.degree.trim())
        .map(({ clientId: _clientId, ...rest }) => rest);
      const experience = form.experience
        .filter((e) => e.company.trim() || e.role.trim())
        .map(({ clientId: _clientId, ...rest }) => rest);

      await api.savePortfolio({
        userRoute: form.userRoute.trim().toLowerCase() || null,
        templateSlug: form.templateSlug,
        personal: form.personal,
        socials: form.socials,
        skills,
        projects,
        education,
        experience,
        sectionTitles: form.sectionTitles,
        seo: form.seo,
        theme: form.theme,
        plugins: form.plugins,
      });
      await refresh();
      toast.success(`${label} saved`, 'Your changes are stored and ready to publish.');
    } catch (err) {
      toast.error('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function TabSaveBar({ label }: { label: string }) {
    return (
      <div className="tab-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void savePortfolio(label)}
        >
          {busy ? 'Saving…' : `Save ${label}`}
        </button>
      </div>
    );
  }

  async function publishPage() {
    if (!form.userRoute.trim() && !portfolio?.userRoute) {
      toast.warning('Link name needed', 'Set your page link name in the Design tab first.');
      setActiveTab('design');
      return;
    }
    setShareBusy(true);
    try {
      await api.publish();
      await refresh();
      toast.success('Page is live', 'Anyone with your link can open it.');
    } catch (err) {
      toast.error('Could not publish', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setShareBusy(false);
    }
  }

  async function unpublishPage() {
    setShareBusy(true);
    try {
      await api.unpublish();
      await refresh();
      toast.warning('Page hidden', 'Your public link is no longer available.');
    } catch (err) {
      toast.error('Could not unpublish', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setShareBusy(false);
    }
  }

  async function downloadZip() {
    setShareBusy(true);
    try {
      const job = await api.download();
      const token = getAuthToken();
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
      toast.success('Download started', 'You can put these files on your own website.');
    } catch (err) {
      toast.error('Download failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setShareBusy(false);
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
      toast.success('CV ready', 'Your PDF resume has downloaded.');
    } catch (err) {
      toast.error('CV download failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setCvBusy(false);
    }
  }

  function copyLiveUrl() {
    const route = portfolio?.userRoute || form.userRoute.trim();
    if (!route) return;
    const url = `${window.location.origin}/portfolio/${route}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied', url),
      () => toast.error('Copy failed', 'Could not copy to clipboard.')
    );
  }

  const hasRoute = Boolean(portfolio?.userRoute || form.userRoute.trim());
  const isLive = Boolean(portfolio?.publicLive);
  const liveUrl = portfolio?.userRoute
    ? `${window.location.origin}/portfolio/${portfolio.userRoute}`
    : form.userRoute.trim()
      ? `${window.location.origin}/portfolio/${form.userRoute.trim()}`
      : null;

  return (
    <main className="builder-page">
      <NoIndex />

      <header className="builder-header">
        <div className="builder-header-copy">
          <p className="builder-kicker">Portfolio builder</p>
          <div className="builder-header-title-row">
            <h1>Edit your portfolio</h1>
            {form.userRoute && isLive && (
              <Link
                className="btn btn-secondary btn-sm builder-open-page"
                to={`/portfolio/${form.userRoute}`}
                target="_blank"
                rel="noreferrer"
              >
                Open page
              </Link>
            )}
          </div>
          <p className="muted builder-header-hint">Fill each tab and save when done.</p>
        </div>
      </header>

      <div className="builder-shell">
        <aside className="builder-tabs-panel">
          <div className="builder-tabs-head">
            <div>
              <p className="builder-tabs-label">Sections</p>
              <p className="builder-tabs-progress">
                {TABS.filter((t) => isTabReady(t.id, form)).length} of {TABS.length} ready
              </p>
            </div>
            <span className="builder-tabs-step">
              {TABS.findIndex((t) => t.id === activeTab) + 1}/{TABS.length}
            </span>
          </div>
          <div className="builder-tabs-meter" aria-hidden>
            <span
              style={{
                width: `${(TABS.filter((t) => isTabReady(t.id, form)).length / TABS.length) * 100}%`,
              }}
            />
          </div>
          <nav
            ref={tabsNavRef}
            className="builder-tabs"
            aria-label="Builder sections"
            role="tablist"
          >
            {TABS.map((tab) => {
              const ready = isTabReady(tab.id, form);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`builder-tab${active ? ' active' : ''}${ready ? ' is-ready' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={active}
                  role="tab"
                >
                  <span className="builder-tab-icon">
                    <TabIcon id={tab.id} />
                  </span>
                  <span className="builder-tab-text">
                    <strong>{tab.label}</strong>
                    <small>{tab.desc}</small>
                  </span>
                  <span className={`builder-tab-status${ready ? ' on' : ''}`} aria-hidden>
                    {ready ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="builder-form">
          <div className="builder-panel" role="tabpanel">
            {activeTab === 'profile' && (
              <section className="builder-section">
                <h2>Profile</h2>
                <p className="section-desc">Basic info shown at the top of your portfolio.</p>
                <div className="form-grid">
                  {(
                    [
                      ['fullName', 'Full name', true],
                      ['headline', 'Headline', false],
                      ['email', 'Email', false],
                      ['phone', 'Contact number', false],
                      ['whatsapp', 'WhatsApp number', false],
                      ['location', 'Location', false],
                    ] as const
                  ).map(([key, label, required]) => (
                    <label key={key}>
                      {label}
                      <input
                        value={form.personal[key]}
                        onChange={(e) =>
                          setForm({ ...form, personal: { ...form.personal, [key]: e.target.value } })
                        }
                        required={required}
                        placeholder={
                          key === 'fullName'
                            ? 'Alex Rivera'
                            : key === 'headline'
                              ? 'Full-stack developer'
                              : key === 'phone'
                                ? '+94 77 123 4567'
                                : key === 'whatsapp'
                                  ? '+94771234567'
                                  : ''
                        }
                      />
                    </label>
                  ))}
                  <ImageUpload
                    label="Avatar"
                    purpose="avatar"
                    value={form.personal.avatarUrl}
                    previewClassName="avatar-preview"
                    onChange={(avatarUrl) =>
                      setForm({ ...form, personal: { ...form.personal, avatarUrl } })
                    }
                  />
                  <label className="span-2">
                    Bio
                    <MarkdownRichEditor
                      value={form.personal.bio}
                      onChange={(bio) =>
                        setForm({ ...form, personal: { ...form.personal, bio } })
                      }
                      placeholder="Short intro about you and what you build…"
                      minHeight={140}
                    />
                    <span className="char-count">{form.personal.bio.length}/2000</span>
                  </label>
                  <label>
                    About section title
                    <input
                      value={form.sectionTitles.about}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          sectionTitles: { ...form.sectionTitles, about: e.target.value },
                        })
                      }
                      placeholder={titleDefaults.about}
                    />
                  </label>
                </div>
                <TabSaveBar label="Profile" />
              </section>
            )}

            {activeTab === 'experience' && (
              <section className="builder-section">
                <div className="section-head-row">
                  <div>
                    <h2>Work experience</h2>
                    <p className="section-desc">Add up to 8 roles with company, title, dates and notes. Collapse roles to keep the list tidy, and reorder with the arrows.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={form.experience.length >= 8}
                    onClick={() => {
                      const next = emptyExperience();
                      setForm({
                        ...form,
                        experience: [...form.experience, next],
                      });
                      setCollapsedItems((prev) => {
                        const copy = new Set(prev);
                        copy.delete(next.clientId);
                        return copy;
                      });
                    }}
                  >
                    + Add role
                  </button>
                </div>
                <label className="section-title-field">
                  Experience section title
                  <input
                    value={form.sectionTitles.experience}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sectionTitles: { ...form.sectionTitles, experience: e.target.value },
                      })
                    }
                    placeholder={titleDefaults.experience}
                  />
                </label>
                <div className="project-list">
                  {form.experience.map((item, index) => {
                    const collapsed = collapsedItems.has(item.clientId);
                    const title =
                      [item.role, item.company].filter(Boolean).join(' · ') || `Role ${index + 1}`;
                    const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ');
                    return (
                      <article
                        className={`project-card${collapsed ? ' is-collapsed' : ''}`}
                        key={item.clientId}
                      >
                        <div className="project-card-head">
                          <button
                            type="button"
                            className="role-collapse-toggle"
                            aria-expanded={!collapsed}
                            onClick={() => toggleCollapsed(item.clientId)}
                          >
                            <span className="role-collapse-chevron" aria-hidden="true">
                              {collapsed ? '▸' : '▾'}
                            </span>
                            <span className="role-collapse-copy">
                              <span className="role-collapse-title">{title}</span>
                              {collapsed && dates ? (
                                <span className="role-collapse-meta">{dates}</span>
                              ) : (
                                <span className="role-collapse-meta">Role {index + 1}</span>
                              )}
                            </span>
                          </button>
                          <div className="role-card-actions">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move up"
                              aria-label="Move role up"
                              disabled={index === 0}
                              onClick={() => moveExperience(index, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move down"
                              aria-label="Move role down"
                              disabled={index === form.experience.length - 1}
                              onClick={() => moveExperience(index, 1)}
                            >
                              ↓
                            </button>
                            {form.experience.length > 1 && (
                              <button
                                type="button"
                                className="btn-text danger"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    experience: form.experience.filter((_, i) => i !== index),
                                  });
                                  setCollapsedItems((prev) => {
                                    const next = new Set(prev);
                                    next.delete(item.clientId);
                                    return next;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="form-grid">
                            <ImageUpload
                              label="Company logo"
                              purpose="logo"
                              compact
                              value={item.logoUrl || ''}
                              onChange={(logoUrl) => updateExperience(index, { logoUrl })}
                            />
                            <label>
                              Company
                              <input
                                value={item.company}
                                onChange={(e) => updateExperience(index, { company: e.target.value })}
                                placeholder="Acme Inc."
                              />
                            </label>
                            <label>
                              Role / title
                              <input
                                value={item.role}
                                onChange={(e) => updateExperience(index, { role: e.target.value })}
                                placeholder="Software Engineer"
                              />
                            </label>
                            <div className="form-row-3 span-2">
                              <label>
                                Location
                                <input
                                  value={item.location}
                                  onChange={(e) => updateExperience(index, { location: e.target.value })}
                                  placeholder="Colombo / Remote"
                                />
                              </label>
                              <label>
                                Start
                                <input
                                  value={item.startDate}
                                  onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                                  placeholder="Jan 2022"
                                />
                              </label>
                              <label>
                                End
                                <input
                                  value={item.endDate}
                                  onChange={(e) => updateExperience(index, { endDate: e.target.value })}
                                  placeholder="Present"
                                />
                              </label>
                            </div>
                            <label className="span-2">
                              Description
                              <MarkdownRichEditor
                                value={item.description}
                                onChange={(description) => updateExperience(index, { description })}
                                placeholder="What you owned and achieved…"
                                minHeight={100}
                              />
                            </label>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <TabSaveBar label="Experience" />
              </section>
            )}

            {activeTab === 'education' && (
              <section className="builder-section">
                <div className="section-head-row">
                  <div>
                    <h2>Education</h2>
                    <p className="section-desc">
                      Add up to 8 qualifications. Collapse entries to keep the list tidy, and reorder
                      with the arrows.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={form.education.length >= 8}
                    onClick={() => {
                      const next = emptyEducation();
                      setForm({
                        ...form,
                        education: [...form.education, next],
                      });
                      setCollapsedItems((prev) => {
                        const copy = new Set(prev);
                        copy.delete(next.clientId);
                        return copy;
                      });
                    }}
                  >
                    + Add qualification
                  </button>
                </div>
                <label className="section-title-field">
                  Education section title
                  <input
                    value={form.sectionTitles.education}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sectionTitles: { ...form.sectionTitles, education: e.target.value },
                      })
                    }
                    placeholder={titleDefaults.education}
                  />
                </label>
                <div className="project-list">
                  {form.education.map((item, index) => {
                    const collapsed = collapsedItems.has(item.clientId);
                    const title =
                      [item.degree, item.school].filter(Boolean).join(' · ') ||
                      `Qualification ${index + 1}`;
                    const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ');
                    return (
                      <article
                        className={`project-card${collapsed ? ' is-collapsed' : ''}`}
                        key={item.clientId}
                      >
                        <div className="project-card-head">
                          <button
                            type="button"
                            className="role-collapse-toggle"
                            aria-expanded={!collapsed}
                            onClick={() => toggleCollapsed(item.clientId)}
                          >
                            <span className="role-collapse-chevron" aria-hidden="true">
                              {collapsed ? '▸' : '▾'}
                            </span>
                            <span className="role-collapse-copy">
                              <span className="role-collapse-title">{title}</span>
                              {collapsed && dates ? (
                                <span className="role-collapse-meta">{dates}</span>
                              ) : (
                                <span className="role-collapse-meta">Qualification {index + 1}</span>
                              )}
                            </span>
                          </button>
                          <div className="role-card-actions">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move up"
                              aria-label="Move qualification up"
                              disabled={index === 0}
                              onClick={() => moveEducation(index, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move down"
                              aria-label="Move qualification down"
                              disabled={index === form.education.length - 1}
                              onClick={() => moveEducation(index, 1)}
                            >
                              ↓
                            </button>
                            {form.education.length > 1 && (
                              <button
                                type="button"
                                className="btn-text danger"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    education: form.education.filter((_, i) => i !== index),
                                  });
                                  setCollapsedItems((prev) => {
                                    const next = new Set(prev);
                                    next.delete(item.clientId);
                                    return next;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="form-grid">
                            <label>
                              School / university
                              <input
                                value={item.school}
                                onChange={(e) => updateEducation(index, { school: e.target.value })}
                                placeholder="University of Colombo"
                              />
                            </label>
                            <label>
                              Degree / qualification
                              <input
                                value={item.degree}
                                onChange={(e) => updateEducation(index, { degree: e.target.value })}
                                placeholder="BSc Computer Science"
                              />
                            </label>
                            <label>
                              Field of study
                              <input
                                value={item.field}
                                onChange={(e) => updateEducation(index, { field: e.target.value })}
                                placeholder="Software Engineering"
                              />
                            </label>
                            <label>
                              Start
                              <input
                                value={item.startDate}
                                onChange={(e) => updateEducation(index, { startDate: e.target.value })}
                                placeholder="2018"
                              />
                            </label>
                            <label>
                              End
                              <input
                                value={item.endDate}
                                onChange={(e) => updateEducation(index, { endDate: e.target.value })}
                                placeholder="2022"
                              />
                            </label>
                            <label className="span-2">
                              Description
                              <MarkdownRichEditor
                                value={item.description}
                                onChange={(description) => updateEducation(index, { description })}
                                placeholder="Highlights, GPA, activities…"
                                minHeight={100}
                              />
                            </label>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <TabSaveBar label="Education" />
              </section>
            )}

            {activeTab === 'skills' && (
              <section className="builder-section">
                <h2>Skills</h2>
                <p className="section-desc">Add technologies or strengths as comma-separated tags.</p>
                <label>
                  Skills section title
                  <input
                    value={form.sectionTitles.skills}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sectionTitles: { ...form.sectionTitles, skills: e.target.value },
                      })
                    }
                    placeholder={titleDefaults.skills}
                  />
                </label>
                <label>
                  Skills
                  <input
                    value={form.skillsText}
                    onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
                    placeholder="React, Node.js, MySQL, TypeScript"
                  />
                </label>
                {form.skillsText && (
                  <div className="skill-preview">
                    {form.skillsText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                  </div>
                )}
                <TabSaveBar label="Skills" />
              </section>
            )}

            {activeTab === 'projects' && (
              <section className="builder-section">
                <div className="section-head-row">
                  <div>
                    <h2>Projects</h2>
                    <p className="section-desc">
                      Showcase up to 8 projects. Collapse cards to keep the list tidy, and reorder
                      with the arrows.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={form.projects.length >= 8}
                    onClick={() => {
                      const next = emptyProject();
                      setForm({
                        ...form,
                        projects: [...form.projects, next],
                      });
                      setCollapsedItems((prev) => {
                        const copy = new Set(prev);
                        copy.delete(next.clientId);
                        return copy;
                      });
                    }}
                  >
                    + Add project
                  </button>
                </div>
                <label className="section-title-field">
                  Projects section title
                  <input
                    value={form.sectionTitles.projects}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        sectionTitles: { ...form.sectionTitles, projects: e.target.value },
                      })
                    }
                    placeholder={titleDefaults.projects}
                  />
                </label>

                <div className="project-list">
                  {form.projects.map((project, index) => {
                    const collapsed = collapsedItems.has(project.clientId);
                    const title = project.title.trim() || `Project ${index + 1}`;
                    const meta = project.techText
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(' · ');
                    return (
                      <article
                        className={`project-card${collapsed ? ' is-collapsed' : ''}`}
                        key={project.clientId}
                      >
                        <div className="project-card-head">
                          <button
                            type="button"
                            className="role-collapse-toggle"
                            aria-expanded={!collapsed}
                            onClick={() => toggleCollapsed(project.clientId)}
                          >
                            <span className="role-collapse-chevron" aria-hidden="true">
                              {collapsed ? '▸' : '▾'}
                            </span>
                            <span className="role-collapse-copy">
                              <span className="role-collapse-title">{title}</span>
                              <span className="role-collapse-meta">
                                {collapsed && meta ? meta : `Project ${index + 1}`}
                              </span>
                            </span>
                          </button>
                          <div className="role-card-actions">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move up"
                              aria-label="Move project up"
                              disabled={index === 0}
                              onClick={() => moveProject(index, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              title="Move down"
                              aria-label="Move project down"
                              disabled={index === form.projects.length - 1}
                              onClick={() => moveProject(index, 1)}
                            >
                              ↓
                            </button>
                            {form.projects.length > 1 && (
                              <button
                                type="button"
                                className="btn-text danger"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    projects: form.projects.filter((_, i) => i !== index),
                                  });
                                  setCollapsedItems((prev) => {
                                    const next = new Set(prev);
                                    next.delete(project.clientId);
                                    return next;
                                  });
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="form-grid">
                            <label className="span-2">
                              Title
                              <input
                                value={project.title}
                                onChange={(e) => updateProject(index, { title: e.target.value })}
                                placeholder="ERP System"
                              />
                            </label>
                            <label className="span-2">
                              Description
                              <MarkdownRichEditor
                                value={project.description}
                                onChange={(description) => updateProject(index, { description })}
                                placeholder="What did you build?"
                                minHeight={120}
                              />
                            </label>
                            <label>
                              Tech (comma-separated)
                              <input
                                value={project.techText}
                                onChange={(e) => updateProject(index, { techText: e.target.value })}
                                placeholder="React, Node"
                              />
                            </label>
                            <label>
                              Link
                              <input
                                value={project.link || ''}
                                onChange={(e) => updateProject(index, { link: e.target.value })}
                                placeholder="https://..."
                              />
                            </label>
                            <ImageUpload
                              label="Project image"
                              purpose="project"
                              value={project.imageUrl || ''}
                              onChange={(imageUrl) => updateProject(index, { imageUrl })}
                            />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                <TabSaveBar label="Projects" />
              </section>
            )}

            {activeTab === 'socials' && (
              <section className="builder-section">
                <h2>Social links</h2>
                <p className="section-desc">Optional links shown on your portfolio header.</p>
                <div className="form-grid">
                  {(
                    [
                      ['github', 'GitHub', 'https://github.com/username'],
                      ['linkedin', 'LinkedIn', 'https://linkedin.com/in/username'],
                      ['website', 'Website', 'https://yoursite.com'],
                      ['twitter', 'Twitter / X', 'https://x.com/username'],
                      ['facebook', 'Facebook', 'https://facebook.com/username'],
                      ['tiktok', 'TikTok', 'https://tiktok.com/@username'],
                      ['youtube', 'YouTube', 'https://youtube.com/@username'],
                      ['instagram', 'Instagram', 'https://instagram.com/username'],
                      ['behance', 'Behance', 'https://behance.net/username'],
                      ['dribbble', 'Dribbble', 'https://dribbble.com/username'],
                    ] as const
                  ).map(([key, label, placeholder]) => (
                    <label key={key}>
                      {label}
                      <input
                        value={form.socials[key]}
                        onChange={(e) =>
                          setForm({ ...form, socials: { ...form.socials, [key]: e.target.value } })
                        }
                        placeholder={placeholder}
                      />
                    </label>
                  ))}
                </div>
                <TabSaveBar label="Socials" />
              </section>
            )}

            {activeTab === 'seo' && (
              <section className="builder-section">
                <h2>SEO & sharing</h2>
                <p className="section-desc">
                  Control page title, meta description, Open Graph and Twitter cards for your ZIP download.
                  Leave blank to auto-fill from your name, headline and bio.
                </p>
                <div className="form-grid">
                  <label className="span-2">
                    Page title
                    <input
                      value={form.seo.title}
                      onChange={(e) => setForm({ ...form, seo: { ...form.seo, title: e.target.value } })}
                      placeholder={`${form.personal.fullName || 'Your Name'}${form.personal.headline ? ` — ${form.personal.headline}` : ''}`}
                      maxLength={120}
                    />
                    <span className="char-count">{form.seo.title.length}/120</span>
                  </label>
                  <label className="span-2">
                    Meta description
                    <textarea
                      value={form.seo.description}
                      onChange={(e) =>
                        setForm({ ...form, seo: { ...form.seo, description: e.target.value } })
                      }
                      placeholder="Short summary for search results (about 150–160 characters)"
                      rows={3}
                      maxLength={320}
                    />
                    <span className="char-count">{form.seo.description.length}/320</span>
                  </label>
                  <label className="span-2">
                    Keywords (comma-separated)
                    <input
                      value={form.seo.keywords}
                      onChange={(e) =>
                        setForm({ ...form, seo: { ...form.seo, keywords: e.target.value } })
                      }
                      placeholder="designer, portfolio, ui ux, sri lanka"
                      maxLength={300}
                    />
                  </label>
                  <label>
                    Robots
                    <select
                      value={form.seo.robots}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          seo: {
                            ...form.seo,
                            robots: e.target.value as Portfolio['seo']['robots'],
                          },
                        })
                      }
                    >
                      <option value="index,follow">Index, follow</option>
                      <option value="noindex,nofollow">No index, no follow</option>
                      <option value="noindex,follow">No index, follow</option>
                      <option value="index,nofollow">Index, no follow</option>
                    </select>
                  </label>
                  <label>
                    Canonical URL
                    <input
                      value={form.seo.canonicalUrl}
                      onChange={(e) =>
                        setForm({ ...form, seo: { ...form.seo, canonicalUrl: e.target.value } })
                      }
                      placeholder="https://yoursite.com/"
                    />
                  </label>
                  <label>
                    Open Graph title
                    <input
                      value={form.seo.ogTitle}
                      onChange={(e) =>
                        setForm({ ...form, seo: { ...form.seo, ogTitle: e.target.value } })
                      }
                      placeholder="Defaults to page title"
                      maxLength={120}
                    />
                  </label>
                  <label>
                    Twitter card
                    <select
                      value={form.seo.twitterCard}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          seo: {
                            ...form.seo,
                            twitterCard: e.target.value as Portfolio['seo']['twitterCard'],
                          },
                        })
                      }
                    >
                      <option value="summary_large_image">Summary large image</option>
                      <option value="summary">Summary</option>
                    </select>
                  </label>
                  <label className="span-2">
                    Open Graph description
                    <textarea
                      value={form.seo.ogDescription}
                      onChange={(e) =>
                        setForm({ ...form, seo: { ...form.seo, ogDescription: e.target.value } })
                      }
                      placeholder="Defaults to meta description"
                      rows={2}
                      maxLength={320}
                    />
                  </label>
                  <div className="span-2">
                    <ImageUpload
                      label="Favicon"
                      purpose="favicon"
                      compact
                      value={form.seo.faviconUrl || ''}
                      onChange={(faviconUrl) =>
                        setForm({ ...form, seo: { ...form.seo, faviconUrl } })
                      }
                    />
                    <p className="section-desc" style={{ marginTop: '0.5rem' }}>
                      Small square icon for browser tabs. PNG/JPG works; it will be resized to 64×64.
                    </p>
                  </div>
                  <div className="span-2">
                    <ImageUpload
                      label="Share / OG image"
                      purpose="project"
                      value={form.seo.ogImageUrl || ''}
                      onChange={(ogImageUrl) =>
                        setForm({ ...form, seo: { ...form.seo, ogImageUrl } })
                      }
                    />
                    <p className="section-desc" style={{ marginTop: '0.5rem' }}>
                      Used for social previews. Falls back to your profile photo if empty.
                    </p>
                  </div>
                </div>
                <TabSaveBar label="SEO" />
              </section>
            )}

            {activeTab === 'design' && (
              <section className="builder-section">
                <h2>Design & hosting</h2>
                <p className="section-desc">Pick your look and reserve your public route.</p>
                <div className="form-grid">
                  <label className="span-2">
                    Public route
                    <div className="route-input-wrap">
                      <span className="route-prefix">/portfolio/</span>
                      <input
                        value={form.userRoute}
                        onChange={(e) =>
                          setForm({ ...form, userRoute: e.target.value.toLowerCase() })
                        }
                        placeholder="alex-rivera"
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      />
                    </div>
                    {routeHint && (
                      <span className={`hint ${routeHint === 'Available' ? 'ok' : 'error'}`}>
                        {routeHint}
                      </span>
                    )}
                  </label>
                  <div className="span-2">
                    <div className="field-label">Theme</div>
                    <p className="section-desc" style={{ marginTop: 0 }}>
                      Pick a visual scheme. Light/dark and accent color still apply.
                    </p>
                    <div className="theme-picker">
                      {TEMPLATES.map((tpl) => {
                        const selected = form.templateSlug === tpl.slug;
                        return (
                          <div
                            key={tpl.slug}
                            className={`theme-card ${selected ? 'selected' : ''}`}
                          >
                            <button
                              type="button"
                              className="theme-card-select"
                              onClick={() => {
                                const next = getTemplate(tpl.slug);
                                setForm({
                                  ...form,
                                  templateSlug: next.slug,
                                  theme: {
                                    ...form.theme,
                                    primaryColor: next.defaultColor,
                                    mode: next.defaultMode,
                                  },
                                });
                              }}
                            >
                              <div
                                className="theme-card-swatch"
                                style={{
                                  background: tpl.preview.bg,
                                  color: tpl.preview.text,
                                }}
                              >
                                <span style={{ background: tpl.preview.accent }} />
                                <strong>Aa</strong>
                              </div>
                              <div className="theme-card-meta">
                                <strong>{tpl.name}</strong>
                                <span>{tpl.description}</span>
                              </div>
                            </button>
                            <a
                              className="theme-card-demo"
                              href={`/portfolio/${tpl.demoRoute}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View demo →
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <label>
                    Theme mode
                    <select
                      value={form.theme.mode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          theme: { ...form.theme, mode: e.target.value as 'light' | 'dark' },
                        })
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>
                  <label>
                    Primary color
                    <div className="color-field">
                      <input
                        type="color"
                        value={form.theme.primaryColor}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            theme: { ...form.theme, primaryColor: e.target.value },
                          })
                        }
                      />
                      <span>{form.theme.primaryColor}</span>
                    </div>
                  </label>
                </div>

                <div className="theme-preview" style={{ ['--preview-accent' as string]: form.theme.primaryColor }}>
                  <div className={`theme-preview-card theme-${form.theme.mode}`}>
                    <div className="theme-preview-dot" />
                    <strong>{form.personal.fullName || 'Your name'}</strong>
                    <span>
                      {TEMPLATES.find((t) => t.slug === form.templateSlug)?.name || 'Theme'} ·{' '}
                      {form.personal.headline || 'Your headline'}
                    </span>
                  </div>
                </div>

                <TabSaveBar label="Design" />
              </section>
            )}

            {activeTab === 'plugins' && (
              <section className="builder-section">
                <h2>Plugins</h2>
                <p className="section-desc">Optional extras for your portfolio. All off by default.</p>

                <div className="plugin-card">
                  <div className="field-label">Contact form</div>
                  <p className="section-desc" style={{ marginTop: 0 }}>
                    Let visitors send you a message from your portfolio.
                  </p>
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={form.plugins.contactForm.enabled}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          plugins: {
                            ...form.plugins,
                            contactForm: {
                              ...form.plugins.contactForm,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    Allow contact form
                  </label>
                  {form.plugins.contactForm.enabled && (
                    <div className="plugin-options">
                      <fieldset className="radio-stack">
                        <legend>Where should messages go?</legend>
                        <label className="checkbox-row">
                          <input
                            type="radio"
                            name="contact-mode"
                            checked={form.plugins.contactForm.mode === 'adawwa'}
                            onChange={() =>
                              setForm({
                                ...form,
                                plugins: {
                                  ...form.plugins,
                                  contactForm: { ...form.plugins.contactForm, mode: 'adawwa' },
                                },
                              })
                            }
                          />
                          <span>
                            <strong>Adawwa inbox</strong>
                            <small>Messages appear in your Inbox. Works on the live Adawwa page.</small>
                          </span>
                        </label>
                        <label className="checkbox-row">
                          <input
                            type="radio"
                            name="contact-mode"
                            checked={form.plugins.contactForm.mode === 'self_hosted'}
                            onChange={() =>
                              setForm({
                                ...form,
                                plugins: {
                                  ...form.plugins,
                                  contactForm: {
                                    ...form.plugins.contactForm,
                                    mode: 'self_hosted',
                                  },
                                },
                              })
                            }
                          />
                          <span>
                            <strong>Self-hosted admin</strong>
                            <small>
                              Includes a PHP + MySQL admin panel in your ZIP download. Host it yourself.
                            </small>
                          </span>
                        </label>
                      </fieldset>
                      {form.plugins.contactForm.mode === 'self_hosted' && (
                        <>
                          <label>
                            Admin username (used by install.php)
                            <input
                              value={form.plugins.contactForm.adminUsername}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  plugins: {
                                    ...form.plugins,
                                    contactForm: {
                                      ...form.plugins.contactForm,
                                      adminUsername: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                                    },
                                  },
                                })
                              }
                              placeholder="admin"
                              maxLength={32}
                            />
                          </label>
                          <label>
                            Admin domain / URL
                            <input
                              value={form.plugins.contactForm.adminDomain}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  plugins: {
                                    ...form.plugins,
                                    contactForm: {
                                      ...form.plugins.contactForm,
                                      adminDomain: e.target.value.trimStart(),
                                    },
                                  },
                                })
                              }
                              placeholder="https://yourdomain.com"
                              maxLength={255}
                              inputMode="url"
                              autoComplete="url"
                            />
                            <small className="muted">
                              Base URL where the PHP admin is hosted (no <code>/contact-admin</code> added).
                              Example: <code>https://yourdomain.com</code> → form posts to{' '}
                              <code>https://yourdomain.com/api/submit.php</code>. Leave blank to use{' '}
                              <code>./contact-admin/api/submit.php</code> in the ZIP.
                            </small>
                          </label>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <TabSaveBar label="Plugins" />
              </section>
            )}

            {activeTab === 'share' && (
              <section className="builder-section">
                <h2>Share your page</h2>
                <p className="section-desc">
                  Make your page live, copy the link, or download a copy for yourself.
                </p>

                {!hasRoute && (
                  <p className="error" style={{ marginBottom: '1rem' }}>
                    First set a page link name in the{' '}
                    <button type="button" className="btn-text" onClick={() => setActiveTab('design')}>
                      Design
                    </button>{' '}
                    tab, then save.
                  </p>
                )}

                {liveUrl && isLive && (
                  <div className="builder-share-url">
                    <div>
                      <span className="live-url-label">Your live link</span>
                      <code>{liveUrl}</code>
                    </div>
                    <div className="live-url-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={copyLiveUrl}>
                        Copy link
                      </button>
                      {portfolio?.publicUrl && (
                        <Link className="btn btn-primary btn-sm" to={portfolio.publicUrl} target="_blank">
                          Open page
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <div className="builder-share-grid">
                  <div className="builder-share-card">
                    <h3>{isLive ? 'Your page is live' : 'Put your page online'}</h3>
                    <p>
                      {isLive
                        ? 'Anyone with the link can see your page. You can hide it anytime.'
                        : 'Publish to get a link you can share with friends, clients, or employers.'}
                    </p>
                    {isLive ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={shareBusy || cvBusy}
                        onClick={() => void unpublishPage()}
                      >
                        {shareBusy ? 'Working…' : 'Hide my page'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={shareBusy || cvBusy || !hasRoute}
                        onClick={() => void publishPage()}
                      >
                        {shareBusy ? 'Working…' : 'Publish my page'}
                      </button>
                    )}
                  </div>

                  <div className="builder-share-card">
                    <h3>Download website files</h3>
                    <p>Get a zip of your page to put on your own website hosting, if you want.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={shareBusy || cvBusy}
                      onClick={() => void downloadZip()}
                    >
                      {shareBusy ? 'Preparing…' : 'Download ZIP'}
                    </button>
                  </div>

                  <div className="builder-share-card">
                    <h3>Download CV (PDF)</h3>
                    <p>A resume-style PDF made from the details you filled in.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={shareBusy || cvBusy || !form.personal.fullName.trim()}
                      onClick={() => void downloadCv()}
                    >
                      {cvBusy ? 'Preparing…' : 'Download CV PDF'}
                    </button>
                  </div>
                </div>

                {portfolio?.plugins?.contactForm?.enabled &&
                  portfolio.plugins.contactForm.mode === 'adawwa' && (
                    <p className="muted" style={{ marginTop: '1.25rem' }}>
                      Contact messages from your page go to{' '}
                      <Link to="/inbox">Inbox</Link>.
                    </p>
                  )}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
