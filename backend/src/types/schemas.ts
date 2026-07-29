import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscore'),
  password: z.string().min(8).max(128),
});

export const loginSchema = registerSchema;

const projectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2500).default(''),
  tech: z.array(z.string().max(40)).max(12).default([]),
  link: z.string().url().or(z.literal('')).optional().default(''),
  imageUrl: z.string().url().or(z.literal('')).optional().default(''),
});

const educationSchema = z.object({
  school: z.string().max(200).default(''),
  degree: z.string().max(200).default(''),
  field: z.string().max(200).default(''),
  startDate: z.string().max(40).default(''),
  endDate: z.string().max(40).default(''),
  description: z.string().max(1500).default(''),
});

const experienceSchema = z.object({
  company: z.string().max(200).default(''),
  role: z.string().max(200).default(''),
  location: z.string().max(120).default(''),
  startDate: z.string().max(40).default(''),
  endDate: z.string().max(40).default(''),
  description: z.string().max(1500).default(''),
  logoUrl: z.string().url().or(z.literal('')).optional().default(''),
});

export const portfolioUpdateSchema = z.object({
  userRoute: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .nullable()
    .optional(),
  templateSlug: z
    .enum(['minimal', 'developer', 'terminal', 'aurora', 'editorial', 'noir'])
    .default('minimal'),
  personal: z.object({
    fullName: z.string().max(120).default(''),
    headline: z.string().max(255).default(''),
    bio: z.string().max(2000).default(''),
    email: z.string().email().or(z.literal('')).optional().default(''),
    phone: z.string().max(40).default(''),
    whatsapp: z.string().max(40).default(''),
    location: z.string().max(120).default(''),
    avatarUrl: z.string().url().or(z.literal('')).optional().default(''),
  }),
  socials: z
    .object({
      github: z.string().default(''),
      linkedin: z.string().default(''),
      website: z.string().default(''),
      twitter: z.string().default(''),
      facebook: z.string().default(''),
      tiktok: z.string().default(''),
      youtube: z.string().default(''),
      behance: z.string().default(''),
      dribbble: z.string().default(''),
      instagram: z.string().default(''),
    })
    .default({}),
  skills: z.array(z.string().max(80)).max(20).default([]),
  projects: z.array(projectSchema).max(8).default([]),
  education: z.array(educationSchema).max(8).default([]),
  experience: z.array(experienceSchema).max(8).default([]),
  sectionTitles: z
    .object({
      about: z.string().max(80).default(''),
      skills: z.string().max(80).default(''),
      projects: z.string().max(80).default(''),
      education: z.string().max(80).default(''),
      experience: z.string().max(80).default(''),
    })
    .default({}),
  theme: z
    .object({
      primaryColor: z.string().max(32).default('#0F766E'),
      mode: z.enum(['light', 'dark']).default('light'),
    })
    .default({ primaryColor: '#0F766E', mode: 'light' }),
});

export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
