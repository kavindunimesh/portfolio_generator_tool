export type TemplateMeta = {
  slug: string;
  name: string;
  description: string;
  defaultColor: string;
  defaultMode: 'light' | 'dark';
  preview: {
    bg: string;
    accent: string;
    text: string;
  };
};

export const TEMPLATES: TemplateMeta[] = [
  {
    slug: 'minimal',
    name: 'Minimal',
    description: 'Bold creative portfolio with oversized hero type and open layout.',
    defaultColor: '#0F766E',
    defaultMode: 'light',
    preview: { bg: '#f6f4f1', accent: '#0F766E', text: '#171513' },
  },
  {
    slug: 'developer',
    name: 'Developer',
    description: 'Tech-forward layout with split hero and project grid.',
    defaultColor: '#22d3ee',
    defaultMode: 'dark',
    preview: { bg: '#0b1220', accent: '#22d3ee', text: '#e2e8f0' },
  },
  {
    slug: 'aurora',
    name: 'Aurora',
    description: 'Atmospheric gradients and modern creative energy.',
    defaultColor: '#14b8a6',
    defaultMode: 'dark',
    preview: { bg: '#07141a', accent: '#14b8a6', text: '#ecfdf5' },
  },
  {
    slug: 'editorial',
    name: 'Editorial',
    description: 'Magazine feature layout with display type and ruled sections.',
    defaultColor: '#9f1239',
    defaultMode: 'light',
    preview: { bg: '#f2f0eb', accent: '#9f1239', text: '#141210' },
  },
  {
    slug: 'noir',
    name: 'Noir',
    description: 'Cinematic dark theme with sharp contrast and motion.',
    defaultColor: '#f59e0b',
    defaultMode: 'dark',
    preview: { bg: '#09090b', accent: '#f59e0b', text: '#fafafa' },
  },
];

export const TEMPLATE_SLUGS = TEMPLATES.map((t) => t.slug) as [string, ...string[]];

export function getTemplate(slug: string): TemplateMeta {
  const normalized = slug === 'terminal' ? 'developer' : slug;
  return TEMPLATES.find((t) => t.slug === normalized) || TEMPLATES[0];
}

export type SectionTitles = {
  about: string;
  skills: string;
  projects: string;
  education: string;
  experience: string;
};

export const SECTION_TITLE_DEFAULTS: Record<string, SectionTitles> = {
  minimal: {
    about: 'About',
    skills: 'Skills',
    projects: 'Selected work',
    education: 'Education',
    experience: 'Work experience',
  },
  developer: {
    about: 'About',
    skills: 'Skills',
    projects: 'Projects',
    education: 'Education',
    experience: 'Experience',
  },
  aurora: {
    about: 'About',
    skills: 'Capabilities',
    projects: 'Featured projects',
    education: 'Education',
    experience: 'Experience',
  },
  editorial: {
    about: 'About',
    skills: 'Expertise',
    projects: 'Work',
    education: 'Education',
    experience: 'Career',
  },
  noir: {
    about: 'Synopsis',
    skills: 'Credits',
    projects: 'Reels',
    education: 'Training',
    experience: 'Roles',
  },
};

export function resolveSectionTitles(
  slug: string,
  custom?: Partial<SectionTitles> | null
): SectionTitles {
  const defaults = SECTION_TITLE_DEFAULTS[slug] || SECTION_TITLE_DEFAULTS.minimal;
  return {
    about: custom?.about?.trim() || defaults.about,
    skills: custom?.skills?.trim() || defaults.skills,
    projects: custom?.projects?.trim() || defaults.projects,
    education: custom?.education?.trim() || defaults.education,
    experience: custom?.experience?.trim() || defaults.experience,
  };
}
