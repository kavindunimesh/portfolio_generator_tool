import { markdownToHtml, stripMarkdown } from '../utils/markdown';
import { resolveSectionTitles } from '../templates/catalog';

export type PortfolioRow = {
  id: string;
  user_id: string;
  user_route: string | null;
  template_slug: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  primary_color: string | null;
  theme_mode: string | null;
  socials_json: unknown;
  skills_json: unknown;
  projects_json: unknown;
  payload_json: unknown;
  is_published: number | boolean;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type EducationItem = {
  school?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

type ExperienceItem = {
  company?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  logoUrl?: string;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function withDescriptionHtml<T extends { description?: string }>(items: T[]) {
  return items.map((item) => ({
    ...item,
    descriptionHtml: markdownToHtml(item.description || ''),
  }));
}

export function serializePortfolio(row: PortfolioRow) {
  const isPublished = Boolean(row.is_published);
  const payload = parseJson<{
    personal?: { phone?: string; whatsapp?: string };
    sectionTitles?: {
      about?: string;
      skills?: string;
      projects?: string;
      education?: string;
      experience?: string;
    };
    education?: EducationItem[];
    experience?: ExperienceItem[];
  }>(row.payload_json, {});
  const phone = row.phone || payload.personal?.phone || '';
  const whatsapp = row.whatsapp || payload.personal?.whatsapp || '';
  return {
    id: row.id,
    userId: row.user_id,
    userRoute: row.user_route,
    templateSlug: row.template_slug,
    personal: {
      fullName: row.full_name || '',
      headline: row.headline || '',
      bio: row.bio || '',
      email: row.email || '',
      phone,
      whatsapp,
      location: row.location || '',
      avatarUrl: row.avatar_url || '',
    },
    socials: {
      github: '',
      linkedin: '',
      website: '',
      twitter: '',
      facebook: '',
      tiktok: '',
      youtube: '',
      behance: '',
      dribbble: '',
      instagram: '',
      ...parseJson<Record<string, string>>(row.socials_json, {}),
    },
    skills: parseJson<string[]>(row.skills_json, []),
    projects: parseJson(row.projects_json, []),
    education: (payload.education || []).map((item) => ({
      school: item.school || '',
      degree: item.degree || '',
      field: item.field || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      description: item.description || '',
    })),
    experience: (payload.experience || []).map((item) => ({
      company: item.company || '',
      role: item.role || '',
      location: item.location || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      description: item.description || '',
      logoUrl: item.logoUrl || '',
    })),
    sectionTitles: {
      about: '',
      skills: '',
      projects: '',
      education: '',
      experience: '',
      ...(payload.sectionTitles || {}),
    },
    theme: {
      primaryColor: row.primary_color || '#0F766E',
      mode: (row.theme_mode as 'light' | 'dark') || 'light',
    },
    isPublished,
    publishedAt: row.published_at,
    publicUrl: row.user_route ? `/portfolio/${row.user_route}` : null,
    publicLive: isPublished && Boolean(row.user_route),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function toTemplateContext(row: PortfolioRow) {
  const data = serializePortfolio(row);
  const bio = data.personal.bio || '';
  const whatsappDigits = digitsOnly(data.personal.whatsapp || '');
  const plainBio = stripMarkdown(bio);
  const sectionTitles = resolveSectionTitles(data.templateSlug, data.sectionTitles);
  return {
    fullName: data.personal.fullName || 'Your Name',
    nameInitial: (data.personal.fullName || 'Y').charAt(0).toUpperCase(),
    shortName:
      (data.personal.fullName || 'user')
        .split(/\s+/)[0]
        .toLowerCase()
        .replace(/[^a-z0-9_-]/gi, '') || 'user',
    headline: data.personal.headline || '',
    bio,
    bioHtml: markdownToHtml(bio),
    metaDescription: plainBio.slice(0, 155) || `${data.personal.fullName} portfolio`,
    email: data.personal.email || '',
    phone: data.personal.phone || '',
    phoneHref: data.personal.phone ? `tel:${data.personal.phone.replace(/[^\d+]/g, '')}` : '',
    whatsapp: data.personal.whatsapp || '',
    whatsappUrl: whatsappDigits ? `https://wa.me/${whatsappDigits}` : '',
    location: data.personal.location || '',
    avatarUrl: data.personal.avatarUrl || '',
    primaryColor: data.theme.primaryColor,
    themeMode: data.theme.mode,
    socials: data.socials,
    skills: data.skills,
    projects: data.projects.map((project) => {
      const p = project as {
        title?: string;
        description?: string;
        tech?: string[];
        link?: string;
        imageUrl?: string;
      };
      return {
        ...p,
        descriptionHtml: markdownToHtml(p.description || ''),
      };
    }),
    education: withDescriptionHtml(data.education),
    experience: withDescriptionHtml(data.experience),
    hasSkills: data.skills.length > 0,
    hasProjects: data.projects.length > 0,
    hasEducation: data.education.length > 0,
    hasExperience: data.experience.length > 0,
    projectCount: data.projects.length,
    sectionTitles,
    templateSlug: data.templateSlug,
    year: new Date().getFullYear(),
  };
}
