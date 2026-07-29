import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { env } from '../config';
import { PortfolioRow, serializePortfolio, selfHostedContactSubmitUrl, toTemplateContext } from './portfolioMapper';

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else if (entry.name.endsWith('.hbs')) {
      continue;
    } else {
      await fs.copyFile(from, to);
    }
  }
}

function extensionFromUrlOrType(url: string, contentType: string | null): string {
  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return '.jpg';
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  if (type === 'image/gif') return '.gif';
  if (type === 'image/svg+xml') return '.svg';
  if (type === 'image/x-icon' || type === 'image/vnd.microsoft.icon') return '.ico';

  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico'].includes(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext;
    }
  } catch {
    // ignore invalid URL pathname
  }
  return '.bin';
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

type ImageLocalizer = {
  localize: (url: string, basename: string) => Promise<string>;
};

function createImageLocalizer(assetsDir: string): ImageLocalizer {
  const cache = new Map<string, Promise<string>>();
  let counter = 0;

  return {
    localize(url: string, basename: string) {
      const trimmed = (url || '').trim();
      if (!trimmed || !isHttpUrl(trimmed)) return Promise.resolve(trimmed);

      const existing = cache.get(trimmed);
      if (existing) return existing;

      const job = (async () => {
        try {
          const response = await fetch(trimmed, {
            redirect: 'follow',
            headers: { Accept: 'image/*,*/*;q=0.8' },
          });
          if (!response.ok) {
            console.warn(`ZIP image download failed (${response.status}): ${trimmed}`);
            return trimmed;
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          if (!buffer.length) return trimmed;

          const ext = extensionFromUrlOrType(trimmed, response.headers.get('content-type'));
          const safeBase =
            basename
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 40) || 'image';
          counter += 1;
          const filename = `${safeBase}-${counter}${ext}`;
          await fs.writeFile(path.join(assetsDir, filename), buffer);
          return `./assets/${filename}`;
        } catch (err) {
          console.warn('ZIP image download error:', trimmed, err);
          return trimmed;
        }
      })();

      cache.set(trimmed, job);
      return job;
    },
  };
}

async function localizeHtmlImages(
  html: string,
  localizer: ImageLocalizer,
  prefix: string
): Promise<string> {
  if (!html) return html;
  const pattern = /(<img\b[^>]*?\bsrc=["'])(https?:\/\/[^"']+)(["'])/gi;
  const matches = [...html.matchAll(pattern)];
  if (!matches.length) return html;

  let next = html;
  let i = 0;
  for (const match of matches) {
    const full = match[0];
    const before = match[1];
    const url = match[2];
    const after = match[3];
    i += 1;
    const local = await localizer.localize(url, `${prefix}-${i}`);
    if (local !== url) {
      next = next.replace(full, `${before}${local}${after}`);
    }
  }
  return next;
}

async function localizeTemplateContext(context: Record<string, unknown>, workDir: string) {
  const assetsDir = path.join(workDir, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  const localizer = createImageLocalizer(assetsDir);

  const next = { ...context };

  next.avatarUrl = await localizer.localize(String(next.avatarUrl || ''), 'avatar');
  next.faviconUrl = await localizer.localize(String(next.faviconUrl || ''), 'favicon');
  next.ogImageUrl = await localizer.localize(String(next.ogImageUrl || ''), 'og-image');
  next.bioHtml = await localizeHtmlImages(String(next.bioHtml || ''), localizer, 'bio');

  if (Array.isArray(next.projects)) {
    next.projects = await Promise.all(
      next.projects.map(async (project, index) => {
        const item = { ...(project as Record<string, unknown>) };
        item.imageUrl = await localizer.localize(String(item.imageUrl || ''), `project-${index + 1}`);
        item.descriptionHtml = await localizeHtmlImages(
          String(item.descriptionHtml || ''),
          localizer,
          `project-${index + 1}-desc`
        );
        return item;
      })
    );
  }

  if (Array.isArray(next.experience)) {
    next.experience = await Promise.all(
      next.experience.map(async (exp, index) => {
        const item = { ...(exp as Record<string, unknown>) };
        item.logoUrl = await localizer.localize(String(item.logoUrl || ''), `experience-${index + 1}`);
        item.descriptionHtml = await localizeHtmlImages(
          String(item.descriptionHtml || ''),
          localizer,
          `experience-${index + 1}-desc`
        );
        return item;
      })
    );
  }

  if (Array.isArray(next.education)) {
    next.education = await Promise.all(
      next.education.map(async (edu, index) => {
        const item = { ...(edu as Record<string, unknown>) };
        item.descriptionHtml = await localizeHtmlImages(
          String(item.descriptionHtml || ''),
          localizer,
          `education-${index + 1}-desc`
        );
        return item;
      })
    );
  }

  return next;
}

const SOURCE_HTML_CREDIT = `<!--
  Generated by Adawwa v1.2.0 — https://adawwa.com
  Designed and Developed by Griffinzone (PVT) Ltd — https://griffinzone.com
-->
`;

const SOURCE_CSS_CREDIT = `/*
 * Generated by Adawwa v1.2.0 — https://adawwa.com
 * Designed and Developed by Griffinzone (PVT) Ltd — https://griffinzone.com
 */

`;

function withHtmlCredit(html: string): string {
  const credit = SOURCE_HTML_CREDIT.trimEnd();
  if (html.includes('adawwa.com') && html.includes('griffinzone.com')) return html;
  const doctypeMatch = html.match(/^<!DOCTYPE[^>]*>\s*/i);
  if (doctypeMatch) {
    return `${doctypeMatch[0]}${credit}\n${html.slice(doctypeMatch[0].length)}`;
  }
  return `${credit}\n${html}`;
}

async function prependCssCredit(workDir: string) {
  const cssPath = path.join(workDir, 'styles.css');
  try {
    const css = await fs.readFile(cssPath, 'utf8');
    if (css.includes('adawwa.com') && css.includes('griffinzone.com')) return;
    await fs.writeFile(cssPath, `${SOURCE_CSS_CREDIT}${css}`, 'utf8');
  } catch {
    // styles.css may be missing for unusual templates
  }
}

export async function renderPortfolioFiles(row: PortfolioRow, workDir: string) {
  let slug = row.template_slug || 'minimal';
  if (slug === 'terminal') slug = 'developer';
  let templateDir = path.join(env.templatesPath, slug);
  let exists = await fs
    .access(templateDir)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    slug = 'minimal';
    templateDir = path.join(env.templatesPath, slug);
    exists = await fs
      .access(templateDir)
      .then(() => true)
      .catch(() => false);
  }
  if (!exists) {
    throw new Error(`Template not found: ${slug}`);
  }

  await fs.mkdir(workDir, { recursive: true });
  await copyDir(templateDir, workDir);

  const partialPath = path.join(env.templatesPath, 'partials', 'contact-form.hbs');
  const partialSource = await fs.readFile(partialPath, 'utf8');
  Handlebars.registerPartial('contactForm', partialSource);

  const hbsPath = path.join(templateDir, 'index.html.hbs');
  const source = await fs.readFile(hbsPath, 'utf8');
  const template = Handlebars.compile(source);
  const context = await localizeTemplateContext(
    toTemplateContext(row) as unknown as Record<string, unknown>,
    workDir
  );
  const html = withHtmlCredit(template(context));
  await fs.writeFile(path.join(workDir, 'index.html'), html, 'utf8');
  await prependCssCredit(workDir);

  const portfolio = serializePortfolio(row);
  const contact = portfolio.plugins.contactForm;

  if (contact.enabled) {
    const cssExtra = await fs.readFile(
      path.join(env.templatesPath, 'partials', 'contact-form.css'),
      'utf8'
    );
    const cssPath = path.join(workDir, 'styles.css');
    try {
      const css = await fs.readFile(cssPath, 'utf8');
      if (!css.includes('.pf-contact-form')) {
        await fs.writeFile(cssPath, `${css}\n\n${cssExtra}`, 'utf8');
      }
    } catch {
      await fs.writeFile(cssPath, cssExtra, 'utf8');
    }
  }

  if (contact.enabled && contact.mode === 'self_hosted') {
    const adminSrc = path.join(env.templatesPath, 'contact-admin');
    const adminDest = path.join(workDir, 'contact-admin');
    await copyDir(adminSrc, adminDest);

    const username = contact.adminUsername || 'admin';
    const example = await fs.readFile(path.join(adminSrc, 'config.example.php'), 'utf8');
    const configPhp = example.replace('{{ADMIN_USERNAME}}', username.replace(/'/g, "\\'"));
    await fs.writeFile(path.join(adminDest, 'config.php'), configPhp, 'utf8');
  }

  const readmeParts = [
    `# ${row.full_name || 'Portfolio'}`,
    '',
    'Static single-page portfolio generated by [Adawwa](https://adawwa.com) v1.2.0.',
    '',
    'Designed and Developed by [Griffinzone (PVT) Ltd](https://griffinzone.com).',
    '',
    '## Credits',
    '',
    '- Generator: **Adawwa** v1.2.0 — https://adawwa.com',
    '- Agency: **Griffinzone (PVT) Ltd** — https://griffinzone.com',
    '',
    '## Contents',
    '',
    '- `index.html` — your portfolio page',
    '- `styles.css` — theme styles',
    '- `assets/` — downloaded images (avatar, projects, logos, favicon, etc.)',
  ];

  if (contact.enabled && contact.mode === 'adawwa') {
    readmeParts.push(
      '',
      '## Contact form (Adawwa)',
      '',
      'Messages are sent to your Adawwa dashboard inbox.',
      'The form posts to the Adawwa API — keep the site online and your portfolio published.'
    );
  }

  if (contact.enabled && contact.mode === 'self_hosted') {
    const submitUrl = selfHostedContactSubmitUrl(contact.adminDomain);
    readmeParts.push(
      '- `contact-admin/` — PHP + MySQL inbox for contact messages',
      '',
      '## Contact form (self-hosted)',
      '',
      '1. Create a MySQL database and edit `contact-admin/config.php` DB settings.',
      '2. Open `contact-admin/install.php` once in the browser.',
      '3. Copy the **generated password** shown on the install page, then sign in at `contact-admin/admin/` with:',
      '',
      `   - Username: \`${contact.adminUsername || 'admin'}\``,
      '   - Password: *(shown only on the install page — a new random password is created each time you run install.php)*',
      '',
      '4. Delete or protect `install.php` after install (reopening it generates a new password).',
      '5. Host this folder on a PHP-capable server (not plain static hosting).',
      '',
      `Form submit endpoint baked into \`index.html\`: \`${submitUrl}\``,
      contact.adminDomain?.trim()
        ? 'Admin domain is used as the form origin — submit path is `/api/submit.php` (no `/contact-admin` prefix).'
        : 'Admin domain was left blank — the form uses `./contact-admin/api/submit.php` (folder next to `index.html`).',
      '',
      'Security: rate limits, honeypot field, password hashing (bcrypt), prepared statements, HttpOnly sessions.'
    );
  }

  readmeParts.push(
    '',
    '## Run locally',
    '',
    'Open `index.html` in a browser, or serve the folder:',
    '',
    '```bash',
    'npx serve .',
    '```',
    '',
    '## Deploy',
    '',
    'Upload this folder to Netlify, Vercel, GitHub Pages, or any static host.',
    '',
    'Keep the `assets` folder next to `index.html` so images load offline / on your host.',
    '',
    '## SEO',
    '',
    'Host this on **your own domain** for search ranking. A link on the generator site at `/portfolio/...` is for sharing only and is not meant for SEO.',
    ''
  );

  await fs.writeFile(path.join(workDir, 'README.md'), readmeParts.join('\n'), 'utf8');
}

export async function zipDirectory(sourceDir: string, zipPath: string): Promise<number> {
  await fs.mkdir(path.dirname(zipPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
