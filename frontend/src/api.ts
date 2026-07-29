export type Portfolio = {
  id: string;
  userId: string;
  userRoute: string | null;
  templateSlug: string;
  personal: {
    fullName: string;
    headline: string;
    bio: string;
    email: string;
    phone: string;
    whatsapp: string;
    location: string;
    avatarUrl: string;
  };
  socials: {
    github: string;
    linkedin: string;
    website: string;
    twitter: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    behance: string;
    dribbble: string;
    instagram: string;
  };
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    tech: string[];
    link?: string;
    imageUrl?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
    logoUrl: string;
  }>;
  sectionTitles: {
    about: string;
    skills: string;
    projects: string;
    education: string;
    experience: string;
  };
  theme: {
    primaryColor: string;
    mode: 'light' | 'dark';
  };
  isPublished: boolean;
  publishedAt: string | null;
  publicUrl: string | null;
  publicLive: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeaders(json = true): HeadersInit {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data.error;
    const message =
      typeof err === 'string'
        ? err
        : data.detail || (err ? JSON.stringify(err) : `Request failed (${res.status})`);
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () =>
    request<{ user: { id: string; username: string }; portfolio: Portfolio | null }>('/api/auth/me'),
  getPortfolio: () => request<Portfolio>('/api/portfolio'),
  savePortfolio: (body: unknown) =>
    request<Portfolio>('/api/portfolio', { method: 'PUT', body: JSON.stringify(body) }),
  publish: () => request<Portfolio>('/api/portfolio/publish', { method: 'POST' }),
  unpublish: () => request<Portfolio>('/api/portfolio/unpublish', { method: 'POST' }),
  checkRoute: (userRoute: string) =>
    request<{ available: boolean; reason?: string | null }>(
      `/api/routes/check?userRoute=${encodeURIComponent(userRoute)}`
    ),
  templates: () =>
    request<Array<{ slug: string; name: string; description: string }>>('/api/templates'),
  download: () =>
    request<{ id: string; downloadUrl: string; filename: string }>('/api/portfolio/download', {
      method: 'POST',
    }),
  publicPortfolio: (userRoute: string) =>
    request<Portfolio>(`/api/public/portfolios/${encodeURIComponent(userRoute)}`),
  uploadQuota: () =>
    request<{ usedBytes: number; maxBytes: number; remainingBytes: number }>('/api/uploads/quota'),
  uploadImage: async (file: File, purpose: 'avatar' | 'project' | 'logo', replaceUrl?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('purpose', purpose);
    if (replaceUrl) {
      form.append('replaceUrl', replaceUrl);
    }

    const res = await fetch(`${API_URL}/api/uploads/image`, {
      method: 'POST',
      headers: authHeaders(false),
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data.error;
      const message =
        typeof err === 'string'
          ? err
          : data.detail || (err ? JSON.stringify(err) : `Upload failed (${res.status})`);
      throw new Error(message);
    }
    return data as {
      url: string;
      sizeBytes: number;
      usedBytes: number;
      maxBytes: number;
    };
  },
  downloadFileUrl: (id: string) => `${API_URL}/api/downloads/${id}/file`,
};
