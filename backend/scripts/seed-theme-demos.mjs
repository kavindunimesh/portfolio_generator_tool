/**
 * Clone a source user's portfolio into published demo accounts for every theme.
 *
 * Usage:
 *   node scripts/seed-theme-demos.mjs
 *   SOURCE_USER_ID=... DEMO_PASSWORD=demo1234 node scripts/seed-theme-demos.mjs
 *
 * Requires MYSQL_* env vars (or defaults matching local .env).
 */
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const SOURCE_USER_ID =
  process.env.SOURCE_USER_ID || 'd1d5dc6e-034c-4772-b26e-684284c710f7';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';

const THEMES = [
  { slug: 'minimal', username: 'demo-minimal', route: 'demo-minimal', color: '#0F766E', mode: 'light' },
  { slug: 'developer', username: 'demo-developer', route: 'demo-developer', color: '#22d3ee', mode: 'dark' },
  { slug: 'aurora', username: 'demo-aurora', route: 'demo-aurora', color: '#14b8a6', mode: 'dark' },
  { slug: 'editorial', username: 'demo-editorial', route: 'demo-editorial', color: '#9f1239', mode: 'light' },
  { slug: 'noir', username: 'demo-noir', route: 'demo-noir', color: '#f59e0b', mode: 'dark' },
];

function asJson(value, fallback) {
  if (value == null) return JSON.stringify(fallback);
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'portfolio_generator',
});

const [rows] = await pool.query(
  `SELECT p.*
   FROM users u
   JOIN portfolios p ON p.user_id = u.id
   WHERE u.id = ?`,
  [SOURCE_USER_ID]
);

if (!rows[0]) {
  console.error(`Source user not found: ${SOURCE_USER_ID}`);
  process.exit(1);
}

const src = rows[0];
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
const payload = parseJson(src.payload_json, {});
const created = [];

for (const theme of THEMES) {
  const [existing] = await pool.query(`SELECT id FROM users WHERE username = ?`, [theme.username]);
  for (const row of existing) {
    await pool.query(`DELETE FROM users WHERE id = ?`, [row.id]);
  }

  const userId = crypto.randomUUID();
  const portfolioId = crypto.randomUUID();
  const nextPayload = {
    ...payload,
    userRoute: theme.route,
    templateSlug: theme.slug,
    theme: {
      ...(payload.theme || {}),
      primaryColor: theme.color,
      mode: theme.mode,
    },
  };

  await pool.query(`INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)`, [
    userId,
    theme.username,
    passwordHash,
  ]);

  await pool.query(
    `INSERT INTO portfolios (
      id, user_id, user_route, template_slug, full_name, email, phone, whatsapp,
      headline, bio, location, avatar_url, primary_color, theme_mode,
      socials_json, skills_json, projects_json, payload_json,
      is_published, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [
      portfolioId,
      userId,
      theme.route,
      theme.slug,
      src.full_name,
      src.email,
      src.phone,
      src.whatsapp,
      src.headline,
      src.bio,
      src.location,
      src.avatar_url,
      theme.color,
      theme.mode,
      asJson(src.socials_json, {}),
      asJson(src.skills_json, []),
      asJson(src.projects_json, []),
      JSON.stringify(nextPayload),
    ]
  );

  created.push({
    username: theme.username,
    route: theme.route,
    slug: theme.slug,
    url: `/portfolio/${theme.route}`,
  });
}

console.log(JSON.stringify({ sourceUserId: SOURCE_USER_ID, password: DEMO_PASSWORD, created }, null, 2));
await pool.end();
