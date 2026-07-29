import PDFDocument from 'pdfkit';
import { stripMarkdown } from '../utils/markdown';

type PortfolioData = {
  personal: {
    fullName: string;
    headline: string;
    bio: string;
    email: string;
    phone: string;
    whatsapp: string;
    location: string;
  };
  socials: {
    website?: string;
    linkedin?: string;
    github?: string;
  };
  theme: { primaryColor: string };
  sectionTitles?: {
    projects?: string;
  };
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    tech?: string[];
    link?: string;
  }>;
};

const MARGIN = 54;
const CONTENT_WIDTH = 595.28 - MARGIN * 2;
const BOTTOM_SAFE = 52;

const COLORS = {
  ink: '#111827',
  body: '#374151',
  muted: '#6b7280',
  line: '#e5e7eb',
};

function safeFilename(name: string): string {
  return (
    (name || 'cv')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'cv'
  );
}

function dateRange(start?: string, end?: string): string {
  const a = (start || '').trim();
  const b = (end || '').trim();
  if (a && b) return `${a} – ${b}`;
  return a || b || '';
}

function cleanText(text: string): string {
  return stripMarkdown(text).replace(/\s+/g, ' ').trim();
}

function shorten(text: string, maxChars: number): string {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxChars) return cleaned;
  const sliced = cleaned.slice(0, maxChars);
  const stop = Math.max(sliced.lastIndexOf('. '), sliced.lastIndexOf('; '));
  if (stop > maxChars * 0.5) return sliced.slice(0, stop + 1).trim();
  return `${sliced.trim().replace(/\s+\S*$/, '')}…`;
}

function resetX(doc: PDFKit.PDFDocument) {
  doc.x = MARGIN;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed = 72) {
  const limit = doc.page.height - BOTTOM_SAFE;
  if (doc.y + needed > limit) {
    doc.addPage();
    resetX(doc);
  }
}

function hrule(doc: PDFKit.PDFDocument, color: string, width = 1) {
  const y = doc.y;
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y)
    .strokeColor(color)
    .lineWidth(width)
    .stroke();
  doc.y = y + 14;
  resetX(doc);
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, accent: string) {
  ensureSpace(doc, 56);
  doc.moveDown(1.05);
  resetX(doc);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(accent)
    .text(title.toUpperCase(), { width: CONTENT_WIDTH, characterSpacing: 0.6 });
  resetX(doc);
  doc.moveDown(0.2);
  hrule(doc, COLORS.line, 0.8);
}

function text(
  doc: PDFKit.PDFDocument,
  value: string,
  opts: {
    font?: string;
    size?: number;
    color?: string;
    link?: string;
    lineGap?: number;
    align?: 'left' | 'right' | 'center';
    width?: number;
  } = {}
) {
  resetX(doc);
  doc
    .font(opts.font || 'Helvetica')
    .fontSize(opts.size || 10.25)
    .fillColor(opts.color || COLORS.body)
    .text(value, {
      width: opts.width ?? CONTENT_WIDTH,
      align: opts.align || 'left',
      link: opts.link,
      lineGap: opts.lineGap ?? 3.2,
    });
  resetX(doc);
}

function roleLine(doc: PDFKit.PDFDocument, role: string, dates: string) {
  resetX(doc);
  if (!dates) {
    text(doc, role, { font: 'Helvetica-Bold', size: 11.5, color: COLORS.ink, lineGap: 2 });
    return;
  }

  const dateWidth = 130;
  const roleWidth = CONTENT_WIDTH - dateWidth - 10;
  const startY = doc.y;

  doc
    .font('Helvetica-Bold')
    .fontSize(11.5)
    .fillColor(COLORS.ink)
    .text(role, { width: roleWidth, lineGap: 2 });
  const afterRole = doc.y;

  const previousBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(dates, MARGIN + roleWidth + 10, startY, {
      width: dateWidth,
      align: 'right',
      lineBreak: false,
    });
  doc.page.margins.bottom = previousBottom;

  doc.y = Math.max(afterRole, startY + 14);
  resetX(doc);
}

function bullets(doc: PDFKit.PDFDocument, value: string, max = 4) {
  const cleaned = cleanText(value);
  if (!cleaned) return;
  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12)
    .slice(0, max);
  const items = parts.length > 1 ? parts : [shorten(cleaned, 360)];
  for (const item of items) {
    text(doc, `•  ${item}`, { size: 10, color: COLORS.body, lineGap: 2.8 });
    doc.moveDown(0.18);
  }
}

function drawFooter(doc: PDFKit.PDFDocument, name: string, accent: string) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 32;
    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .moveTo(MARGIN, footerY - 8)
      .lineTo(MARGIN + CONTENT_WIDTH, footerY - 8)
      .strokeColor(COLORS.line)
      .lineWidth(0.6)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(name, MARGIN, footerY - 1, { width: CONTENT_WIDTH * 0.65, lineBreak: false });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(accent)
      .text(`${i + 1} / ${range.count}`, MARGIN, footerY - 1, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      });

    doc.page.margins.bottom = previousBottom;
  }
}

export function cvFilenameFor(portfolio: PortfolioData): string {
  return `${safeFilename(portfolio.personal.fullName || 'portfolio')}-cv.pdf`;
}

export function buildCvPdf(portfolio: PortfolioData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: `${portfolio.personal.fullName || 'Portfolio'} — CV`,
        Author: portfolio.personal.fullName || 'Portfolio',
        Creator: 'Adawwa',
      },
    });

    // Keep body clear of the footer band
    doc.page.margins.bottom = BOTTOM_SAFE;

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const accent = portfolio.theme.primaryColor || '#0F766E';
    const { personal, socials, skills, experience, education, projects, sectionTitles } = portfolio;
    const displayName = personal.fullName || 'Curriculum Vitae';

    doc.on('pageAdded', () => {
      doc.page.margins.bottom = BOTTOM_SAFE;
      resetX(doc);
    });

    // Top accent bar
    doc.save();
    doc.rect(0, 0, doc.page.width, 6).fill(accent);
    doc.restore();
    doc.y = MARGIN + 6;

    text(doc, displayName, { font: 'Helvetica-Bold', size: 26, color: COLORS.ink, lineGap: 1 });

    if (personal.headline) {
      doc.moveDown(0.35);
      text(doc, personal.headline, { size: 12, color: accent, lineGap: 2 });
    }

    const contactParts: Array<{ label: string; url?: string }> = [
      personal.location ? { label: personal.location } : null,
      personal.email ? { label: personal.email, url: `mailto:${personal.email}` } : null,
      personal.phone ? { label: personal.phone, url: `tel:${personal.phone.replace(/\s+/g, '')}` } : null,
      socials.website
        ? { label: socials.website.replace(/^https?:\/\//, ''), url: socials.website }
        : null,
      socials.linkedin ? { label: 'LinkedIn', url: socials.linkedin } : null,
      socials.github ? { label: 'GitHub', url: socials.github } : null,
    ].filter(Boolean) as Array<{ label: string; url?: string }>;

    if (contactParts.length) {
      doc.moveDown(0.45);
      resetX(doc);
      const sep = '  ·  ';
      const fontSize = 9.25;
      doc.font('Helvetica').fontSize(fontSize).fillColor(COLORS.muted);
      contactParts.forEach((part, i) => {
        if (part.url) {
          doc.fillColor(accent).text(part.label, doc.x, doc.y, {
            link: part.url,
            underline: true,
            continued: i < contactParts.length - 1,
          });
        } else {
          doc.fillColor(COLORS.muted).text(part.label, doc.x, doc.y, {
            continued: i < contactParts.length - 1,
          });
        }
        if (i < contactParts.length - 1) {
          doc.fillColor(COLORS.muted).text(sep, { continued: true });
        }
      });
      resetX(doc);
    }

    doc.moveDown(0.55);
    hrule(doc, accent, 1.6);

    if (personal.bio) {
      sectionTitle(doc, 'Profile', accent);
      text(doc, shorten(personal.bio, 720), { size: 10.25, color: COLORS.body, lineGap: 3.6 });
    }

    if (experience.length) {
      sectionTitle(doc, 'Experience', accent);
      experience.forEach((item, index) => {
        ensureSpace(doc, 88);
        roleLine(doc, item.role || 'Role', dateRange(item.startDate, item.endDate));
        const meta = [item.company, item.location].filter(Boolean).join('  ·  ');
        if (meta) {
          doc.moveDown(0.12);
          text(doc, meta, { size: 9.75, color: COLORS.muted, lineGap: 2 });
        }
        if (item.description) {
          doc.moveDown(0.28);
          bullets(doc, item.description, 4);
        }
        if (index < experience.length - 1) doc.moveDown(0.7);
      });
    }

    if (education.length) {
      sectionTitle(doc, 'Education', accent);
      education.forEach((item, index) => {
        ensureSpace(doc, 72);
        const title = [item.degree, item.field].filter(Boolean).join(', ') || item.school || 'Education';
        roleLine(doc, title, dateRange(item.startDate, item.endDate));
        if (item.school && title !== item.school) {
          doc.moveDown(0.1);
          text(doc, item.school, { size: 9.75, color: COLORS.muted, lineGap: 2 });
        }
        if (item.description) {
          doc.moveDown(0.22);
          text(doc, shorten(item.description, 320), {
            size: 10,
            color: COLORS.body,
            lineGap: 3,
          });
        }
        if (index < education.length - 1) doc.moveDown(0.55);
      });
    }

    if (skills.length) {
      sectionTitle(doc, 'Skills', accent);
      text(doc, skills.join('   ·   '), { size: 10, color: COLORS.body, lineGap: 4 });
    }

    if (projects.length) {
      const projectsTitle = sectionTitles?.projects?.trim() || 'Projects';
      sectionTitle(doc, projectsTitle, accent);
      projects.slice(0, 6).forEach((project, index, list) => {
        ensureSpace(doc, 80);
        text(doc, project.title || 'Project', {
          font: 'Helvetica-Bold',
          size: 11.25,
          color: COLORS.ink,
          lineGap: 2,
        });
        if (project.description) {
          doc.moveDown(0.18);
          text(doc, shorten(project.description, 360), {
            size: 10,
            color: COLORS.body,
            lineGap: 3.2,
          });
        }
        const tech = (project.tech || []).filter(Boolean).slice(0, 8);
        if (tech.length) {
          doc.moveDown(0.16);
          text(doc, tech.join('  ·  '), { size: 8.75, color: COLORS.muted, lineGap: 2 });
        }
        if (project.link) {
          doc.moveDown(0.12);
          text(doc, project.link.replace(/^https?:\/\//, ''), {
            size: 9,
            color: accent,
            link: project.link,
            lineGap: 2,
          });
        }
        if (index < list.length - 1) doc.moveDown(0.6);
      });
    }

    drawFooter(doc, displayName, accent);
    doc.end();
  });
}
