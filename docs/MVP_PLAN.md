# Portfolio Generator — Product Plan (MVP+)

## 1. Goal (MVP)

Users **register** (username + password), **save** their single-page portfolio details, then either **download** the source zip or **host** it on our system at a reserved path.

```text
Register → Save details → Download ZIP  and/or  Host at /portfolio/:userRoute
```

| Step | What happens |
|------|----------------|
| Register | Simple account: username + password |
| Save | Portfolio content stored in **MySQL** (name, bio, skills, projects, theme, template, `userRoute`) |
| Download | Generate ready-to-run source code zip from saved data |
| Host | Publish live page at `/portfolio/:userRoute` (path reserved for that user) |

Example live URL: `https://yoursite.com/portfolio/alex-rivera`

**Account is required** for the happy path (no anonymous generate). No design tools / drag-drop builder. Hosted pages update from MySQL when the user edits; zip is generated on demand.

**SEO (summary):** our marketing/app site and **downloaded** portfolio source are SEO-friendly. Portfolios **hosted on our domain** at `/portfolio/:userRoute` must **not** be indexed by search engines.

**One sentence:** Sign up → save portfolio in MySQL → download code **and/or** publish at `/portfolio/:userRoute`.

**MySQL role:** source of truth for **accounts** and **portfolio content**. Templates stay on disk. Zips are files on disk. Hosted pages render from MySQL.

---

## 2. Why this shape works for single-page portfolios

| Approach | Verdict |
|----------|---------|
| Drag-drop multi-page builder | Too heavy |
| Only zip download | Useful, but users still need somewhere to host |
| Only our hosting | Users don’t own the code |
| **Download + optional hosted path** | Best of both; single-page sites are cheap to host |

Because the output is **one page**, hosting is simple: one React route (or SSR) that loads portfolio JSON by `userRoute` and renders the chosen template. No per-user servers, no custom domains in MVP.

---

## 3. User journeys

### A. Register & build (core)

```
Landing → Register (username + password)
       → Login → Portfolio builder (save details)
       → Pick template + claim route (/portfolio/:userRoute)
```

### B. Download code

```
Dashboard → Download ZIP → Unzip → deploy on Vercel/Netlify/own server
```

### C. Host with us

```
Dashboard → Enable Hosting → set/confirm userRoute
         → Live at /portfolio/:userRoute
         → Edit details anytime → live page updates
```

### D. Both

Same saved data powers **zip generation** and **hosted page**. User can download and host; hosting is optional.

---

## 4. Route reservation rules (`userRoute`)

Public URL: `/portfolio/:userRoute`

| Rule | Detail |
|------|--------|
| Format | lowercase letters, numbers, hyphens; 3–32 chars |
| Examples | `alex`, `alex-rivera`, `dev-kavi` |
| Uniqueness | Globally unique in MySQL |
| Reserved list | Block system paths: `admin`, `api`, `login`, `register`, `new`, `edit`, `download`, `assets`, etc. |
| Claiming | Set at register **or** in dashboard before first publish |
| Change | Allowed if new slug free; old URL can 404 or redirect once (MVP: 404 is OK) |
| Ownership | One active hosted portfolio per account in MVP |

Availability check: `GET /api/routes/check?userRoute=alex-rivera` → `{ available: true }`.

---

## 5. What “Host” means (MVP)

**Not** uploading static zip files per user.

**Do this instead:**

1. User saves portfolio data in MySQL and sets `userRoute`.
2. User toggles **Publish / Host**.
3. Public page `GET /portfolio/:userRoute` loads data from MySQL and renders the selected template **server-side or client-side**.
4. When they edit & save, the live URL updates immediately.

Benefits:

- One data source (MySQL).
- No stale hosted HTML.
- Easy unpublish (`is_published = false` → 404).

**Download** remains a separate action: generate zip from the same MySQL row when they click Download.

**SEO for hosted pages:** `/portfolio/:userRoute` on our domain is for convenience/sharing only — **block search indexing** (`noindex`, robots rules). SEO belongs to (1) our product website and (2) portfolios users download and host on their own domain.

```
                    ┌──────────────────┐
                    │  MySQL           │
                    │  users           │
                    │  portfolios      │◄── builder saves here
                    └────────┬─────────┘
               ┌─────────────┴─────────────┐
               ▼                           ▼
        Download ZIP                 Hosted page
     SEO-friendly source           /portfolio/:userRoute
     (user deploys elsewhere)      NOINDEX on our domain
```

---

## 5.1 SEO policy

| Surface | SEO? | How |
|---------|------|-----|
| **Our website** (home, marketing, register/login landing content) | **Yes** | Crawlable public pages, proper titles/meta, semantic HTML, sitemap for marketing URLs, good Core Web Vitals basics |
| **Generated portfolio (ZIP)** | **Yes** | Templates ship with real `<title>`, meta description, semantic headings, Open Graph defaults from user data, clean HTML; user hosts on their own site for ranking |
| **Hosted on our site** `/portfolio/:userRoute` | **No** | Must not compete with / dilute our domain SEO; treat as private-ish preview/share links |

### Is React OK for SEO?

| Part of product | React OK? | Why |
|-----------------|-----------|-----|
| App (`/login`, `/dashboard`, `/builder`) | **Yes** | `noindex` anyway; SEO not needed |
| Hosted `/portfolio/:userRoute` | **Yes** | Intentionally **not** SEO (`noindex`) |
| Our marketing site (`/`) | **Partly** | Pure client-only React SPA is weak for Google. Need real HTML in the first response |
| Downloaded ZIP portfolio | **Prefer static HTML** | Best SEO = HTML/CSS (or light JS), not a React SPA the user must build |

**Practical rule for this project:**

1. **Frontend app** → React + Vite is fine.
2. **Marketing/home** → keep React, but make the **landing SEO-ready**: put real title, description, and main copy in `index.html` / prerender home (or later switch home to SSG). Do not rely on JS-only content for the homepage.
3. **ZIP templates** → **static HTML + CSS** (Handlebars), not a React app. That is what ranks when users deploy on their own domain.
4. **Hosted portfolio view** → React is fine (fetch MySQL data + render); add `noindex`.

So: **React is OK for the product UI and hosted previews. SEO-critical pages should ship crawlable HTML — especially generated portfolios.**

### Our website (SEO-friendly)

- Marketing pages (`/`, maybe `/features`) use meaningful titles, meta descriptions, one H1, readable content in the initial HTML.
- React SPA for the app is OK; for the **home page**, either:
  - put SEO content in `index.html` (MVP), or
  - prerender/SSG the marketing routes later (better).
- `robots.txt` **allows** marketing routes; do **not** allow `/portfolio/`.
- Optional: `sitemap.xml` with home (+ static marketing pages only). Never include `/portfolio/*`.
- App-only routes (`/dashboard`, `/builder`, `/login`, `/register`) → `noindex`.

### Generated portfolios in the ZIP (SEO-friendly)

When user downloads and deploys elsewhere, the site should rank for *their* name/brand. **Use static HTML templates, not React:**

- `<title>{{fullName}} — {{headline}}</title>`
- `<meta name="description" content="{{bio truncated}}">`
- Open Graph / Twitter tags from name, bio, avatar
- Semantic structure: `header`, `main`, `section`, `h1`–`h2`, project lists
- Fast static HTML/CSS (+ tiny JS if needed)
- Include a short note in generated `README.md`: deploy on own domain for SEO; our hosted URL is not for search ranking

Do **not** bake `noindex` into the downloadable zip templates.

### Hosted `/portfolio/:userRoute` (NOT SEO)

Every hosted portfolio page on our domain must:

1. HTML: `<meta name="robots" content="noindex, nofollow">`
2. HTTP (ideal): `X-Robots-Tag: noindex, nofollow` on `/portfolio/*` and `/api/public/portfolios/*`
3. `robots.txt`:

```text
User-agent: *
Allow: /
Disallow: /portfolio/
Disallow: /dashboard
Disallow: /builder
Disallow: /login
Disallow: /register
```

4. Not listed in sitemap.
5. Share links still work for humans; search engines should skip them.

**Why:** keeps Google focused on the product site; avoids thin/user-generated pages flooding our domain; users who care about SEO download and host on their own domain.

---

## 6. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite + TypeScript | App UI; marketing home gets SEO meta in HTML / later prerender |
| ZIP templates | **Static HTML + CSS** (Handlebars) | SEO-friendly when users host on their own domain |
| Hosted portfolio view | React page + `noindex` | Fine — not meant for search |
| Backend API | Node.js + Express + TypeScript | Runs via cPanel **Setup Node.js App** (Passenger) |
| Database | **MySQL** | Native on cPanel (MySQL Databases + phpMyAdmin) |
| Auth | Username/password + JWT | Simple; works behind cPanel HTTPS |
| Password | bcrypt (or argon2) | Never store plain passwords |
| Zip | `archiver` | Download source |
| Templates | Disk packs next to API | Available on server filesystem |
| Storage | `backend/storage/zips/` | Writable folder on hosting account |

**Hosting target:** shared **cPanel** (static frontend + Node app + MySQL). Avoid Docker/Redis/queues on production for MVP.

---

## 7. MySQL data model

### `users`

Simple auth account.

| Column | Type | Notes |
|--------|------|--------|
| id | CHAR(36) PK | |
| username | VARCHAR(64) UNIQUE | Login name (not necessarily the public route) |
| password_hash | VARCHAR(255) | bcrypt/argon2 |
| created_at / updated_at | DATETIME | |

Optional later: `email` (not required for MVP register).

### `portfolios`

One portfolio per user in MVP (can relax later).

| Column | Type | Notes |
|--------|------|--------|
| id | CHAR(36) PK | |
| user_id | CHAR(36) FK UNIQUE | Owner |
| user_route | VARCHAR(64) UNIQUE NULL | Reserved public slug; null until claimed |
| template_slug | VARCHAR(64) | Disk template |
| full_name | VARCHAR(120) | |
| email | VARCHAR(255) NULL | Shown on portfolio (contact) |
| headline | VARCHAR(255) NULL | |
| bio | TEXT NULL | |
| location | VARCHAR(120) NULL | |
| avatar_url | VARCHAR(512) NULL | |
| primary_color | VARCHAR(32) NULL | |
| theme_mode | VARCHAR(16) NULL | `light` / `dark` |
| socials_json | JSON | |
| skills_json | JSON | |
| projects_json | JSON | |
| payload_json | JSON | Full form backup |
| is_published | BOOLEAN DEFAULT false | Hosted live only if true + user_route set |
| published_at | DATETIME NULL | |
| created_at / updated_at | DATETIME | |

### `download_jobs` (optional but useful)

Track zip builds without mixing into portfolio content.

| Column | Type | Notes |
|--------|------|--------|
| id | CHAR(36) PK | |
| portfolio_id | CHAR(36) FK | |
| user_id | CHAR(36) FK | |
| status | ENUM('processing','ready','failed') | |
| zip_filename | VARCHAR(255) NULL | |
| zip_path | VARCHAR(512) NULL | |
| zip_size_bytes | INT NULL | |
| error_message | TEXT NULL | |
| expires_at | DATETIME | Cleanup old zips |
| created_at | DATETIME | |

### Indexes

- `users(username)`
- `portfolios(user_route)` UNIQUE
- `portfolios(user_id)` UNIQUE
- `portfolios(is_published, user_route)`
- `download_jobs(expires_at)`

### Reserved routes table (optional)

`reserved_routes(slug)` seeded with blocked words — or keep a constant list in code for MVP.

---

## 8. Form / portfolio content schema

Same content shape as before; now owned by a logged-in user.

```json
{
  "userRoute": "alex-rivera",
  "templateSlug": "minimal",
  "personal": {
    "fullName": "Alex Rivera",
    "headline": "Full-stack developer",
    "bio": "I build web products...",
    "email": "alex@example.com",
    "location": "Colombo, Sri Lanka",
    "avatarUrl": "https://..."
  },
  "socials": {
    "github": "https://github.com/...",
    "linkedin": "https://linkedin.com/in/...",
    "website": "https://...",
    "twitter": ""
  },
  "skills": ["React", "Node.js", "MySQL"],
  "projects": [
    {
      "title": "ERP System",
      "description": "Hotel operations platform",
      "tech": ["React", "Node"],
      "link": "https://...",
      "imageUrl": ""
    }
  ],
  "theme": {
    "primaryColor": "#0F766E",
    "mode": "light"
  }
}
```

**Limits:** skills ≤ 20, projects ≤ 8, bio ≤ ~800 chars. Image URLs only in early MVP.

---

## 9. Pipelines

### Save (always)

1. Auth required.
2. Validate payload + `userRoute` rules.
3. Upsert `portfolios` for `user_id`.
4. Return saved portfolio + public URL preview (`/portfolio/{userRoute}` only live if published).

### Publish / Host

1. Require `user_route` set and unique.
2. Set `is_published = true`, `published_at = now()`.
3. Public route starts resolving.

### Unpublish

1. Set `is_published = false`.
2. `/portfolio/:userRoute` returns 404 (route can stay reserved for that user).

### Download ZIP

1. Load portfolio from MySQL for current user.
2. Insert `download_jobs` (`processing`).
3. Render disk template with portfolio data → temp dir → zip → `storage/zips/`.
4. Mark job `ready`; return download URL.
5. TTL cleanup for old zips (portfolio data stays).

### Public hosted page

1. `GET /portfolio/:userRoute` (frontend route or API-backed page).
2. API: `GET /api/public/portfolios/:userRoute` → portfolio JSON **only if** `is_published`.
3. Render template component with that JSON (same visual system as zip templates where possible).

---

## 10. API surface

### Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | `{ username, password }` → create user (+ empty portfolio) |
| POST | `/api/auth/login` | `{ username, password }` → token/session |
| POST | `/api/auth/logout` | Clear session (if cookie auth) |
| GET | `/api/auth/me` | Current user + portfolio summary |

### Portfolio (auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/portfolio` | My saved portfolio |
| PUT | `/api/portfolio` | Save / update details |
| POST | `/api/portfolio/publish` | Host: set published |
| POST | `/api/portfolio/unpublish` | Take offline |
| GET | `/api/routes/check` | Is `userRoute` available? |
| POST | `/api/portfolio/download` | Generate zip |
| GET | `/api/downloads/:id` | Zip job status |
| GET | `/api/downloads/:id/file` | Stream zip |

### Public

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/public/portfolios/:userRoute` | Published portfolio JSON |
| GET | `/api/templates` | Template list (disk/config) |
| GET | `/api/health` | Health |

Rate limit: register, login, download, public reads.

---

## 11. Frontend pages

| Page | Path | SEO |
|------|------|-----|
| Home | `/` | **Index** — marketing, titles/meta |
| Register | `/register` | `noindex` (app) |
| Login | `/login` | `noindex` (app) |
| Dashboard | `/dashboard` | `noindex` (app) |
| Builder | `/builder` | `noindex` (app) |
| Result / actions | (on dashboard) | `noindex` |
| Public portfolio | `/portfolio/:userRoute` | **`noindex, nofollow`** (hosted on our site) |

UX rules:

- Register is minimal: username + password only.
- `userRoute` picker with live availability check.
- After publish, show shareable link prominently.
- Download never requires publish (can download draft).
- Dashboard copy can note: “For SEO, download and host on your own domain; our `/portfolio/...` link is for sharing only.”

---

## 12. Auth details (keep simple)

- Register: username 3–32 chars (`[a-zA-Z0-9_]`), password min 8 chars.
- `username` ≠ `userRoute` necessarily (login vs public URL). Optionally default `userRoute` from username if free.
- JWT in httpOnly cookie preferred; Bearer token OK for MVP.
- Protect all `/api/portfolio*` and download routes.
- Public portfolio endpoint is read-only and published-only.

---

## 13. Repo structure (cPanel-friendly)

Keep **two independent apps** (no monorepo tooling required on the server). Build locally or in CI, then upload clear folders that map 1:1 to cPanel.

```
portfolio_generator_tool/
  frontend/                 # React + Vite (SPA)
    src/
    public/
    public/.htaccess        # SPA rewrite rules for Apache (cPanel)
    dist/                   # build output → upload to public_html
    package.json
    .env.example            # VITE_API_URL=https://api.yourdomain.com

  backend/                  # Node API only
    src/
    templates/              # packs used for zip generation
      minimal/
      developer/
    storage/                # gitignored; zips at runtime (must be writable)
      zips/
    dist/                   # compiled JS → what Node app runs
    package.json            # "start": "node dist/index.js"
    .env.example

  sql/
    schema.sql              # import via phpMyAdmin on cPanel
    seed.sql                # optional

  docs/
    MVP_PLAN.md
    CPANEL_DEPLOY.md        # step-by-step upload notes

  docker-compose.yml        # LOCAL MySQL only (not used on cPanel)
  README.md
```

### Why this layout (not `apps/` monorepo)

| Concern | Approach |
|---------|----------|
| cPanel Node selector | Needs one clear **Application root** → `backend/` |
| cPanel document root | Needs static files → `frontend/dist/` → `public_html/` |
| MySQL on cPanel | Import `sql/schema.sql` in phpMyAdmin; no Docker on server |
| Uploads | Zip/FTP-friendly: upload frontend build and backend separately |
| Dependencies | Each folder has its own `package.json`; `npm install` only in `backend` on server |
| Paths | Templates + storage live **inside** `backend/` so relative paths work after upload |

### How it maps on the server

```
cPanel account
├── public_html/                 ← contents of frontend/dist/
│   ├── index.html
│   ├── assets/
│   └── .htaccess                ← React Router: /portfolio/:userRoute, /login, etc.
│
└── portfolio-api/               ← contents of backend/ (Application root)
    ├── dist/
    ├── templates/
    ├── storage/zips/            ← chmod writable
    ├── package.json
    ├── node_modules/            ← npm install via cPanel / SSH
    └── .env                     ← production secrets (not in git)
```

**Recommended domains (simplest on cPanel):**

| Piece | URL |
|-------|-----|
| Frontend SPA | `https://yourdomain.com` |
| API (Node app) | `https://api.yourdomain.com` (Setup Node.js App subdomain) |

Frontend calls API via `VITE_API_URL`. CORS allows the frontend origin.

**Alternative (same domain):** reverse-proxy `/api` to the Node app if the host supports it. Prefer **subdomain API** for fewer Apache headaches on shared hosting.

### Frontend `.htaccess` (required for SPA + `/portfolio/:userRoute`)

Ship this inside `frontend/public/.htaccess` so Vite copies it into `dist/`:

```apache
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Without this, refreshing `/portfolio/alex-rivera` or `/dashboard` returns 404 on Apache/cPanel.

### Backend start script (cPanel Node.js App)

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

In cPanel → **Setup Node.js App**:

1. Application root = `portfolio-api` (uploaded `backend/`)
2. Application URL = `api.yourdomain.com`
3. Startup file / start script = `dist/index.js` or `npm start`
4. Set env vars in the UI (same as `.env`)
5. Run npm install → Restart

### What NOT to require for cPanel MVP

- pnpm workspaces / Turborepo on the server
- Docker / Redis on shared hosting
- Long-running workers beyond the Node app itself
- Storing zips outside the account home directory

---

## 14. Environment

### Local (`backend/.env`)

```env
PORT=4000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=portfolio
MYSQL_PASSWORD=...
MYSQL_DATABASE=portfolio_generator
JWT_SECRET=...
STORAGE_PATH=./storage
TEMPLATES_PATH=./templates
ZIP_TTL_DAYS=7
PUBLIC_APP_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Production (cPanel)

```env
PORT=4000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpaneluser_portfoliodb
MYSQL_PASSWORD=...
MYSQL_DATABASE=cpaneluser_portfoliodb
JWT_SECRET=long-random-secret
STORAGE_PATH=./storage
TEMPLATES_PATH=./templates
ZIP_TTL_DAYS=7
PUBLIC_APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

Frontend build-time:

```env
VITE_API_URL=https://api.yourdomain.com
```

Use cPanel MySQL username/database naming (`cpaneluser_dbname`). `MYSQL_HOST` is usually `localhost`.

---

## 15. cPanel deploy checklist

1. Create MySQL DB + user in cPanel; import `sql/schema.sql` via phpMyAdmin.
2. Upload `backend/` → e.g. `~/portfolio-api/`; create Node.js App; set env; `npm install`; ensure `storage/zips` is writable.
3. Build frontend locally: `npm run build` with production `VITE_API_URL`.
4. Upload `frontend/dist/*` into `public_html/` (include `.htaccess`).
5. Confirm: register/login, save portfolio, public `/portfolio/:userRoute`, zip download.
6. Enable HTTPS (AutoSSL) for main domain and API subdomain.

Local Docker Compose is **only** for developer MySQL — production DB is cPanel MySQL.

---

## 16. Security & abuse

- Hash passwords; never log them.
- Escape/sanitize all portfolio text before HTML render.
- Validate `userRoute` strictly; reject reserved slugs.
- Rate limit register / login / download / public API.
- Only owner can edit/publish/download their portfolio.
- Public API returns data only when `is_published = true`.
- Do not commit `.env` or `storage/`.
- On cPanel: keep API on HTTPS; lock down `.env` permissions; do not expose `storage/` via the web document root.

---

## 17. Scope split (ship in order)

### MVP Phase 1 — Auth + save + download

- Register / login (username + password)
- Save portfolio details to MySQL
- Claim `userRoute` (reserved, unique)
- Download ZIP from saved data
- Templates on disk under `backend/templates/`

### MVP Phase 2 — Host at `/portfolio/:userRoute`

- Publish / unpublish
- Public page renders from MySQL
- Dashboard share link
- SPA `.htaccess` so cPanel Apache serves deep links

### Phase 3 — Harden + cPanel-ready

- Rate limits, zip TTL, reserved slug list
- Second template
- `docs/CPANEL_DEPLOY.md` with exact upload steps
- Verify deploy on a real cPanel account

### Explicit non-goals (for now)

- Email verification / OAuth
- Custom domains (`alex.com`)
- Multi-page sites / drag-drop builder
- Image uploads (URLs only)
- Payments / premium templates
- Multiple portfolios per user
- Docker-based production hosting

---

## 18. Success criteria

1. User registers with username + password only.
2. User saves portfolio details in MySQL and can edit later.
3. User claims a unique `userRoute`.
4. **Download:** zip generates from saved data and runs as documented.
5. **Host:** published portfolio is live at `/portfolio/:userRoute`.
6. Unpublish hides the public page; route remains reserved for them.
7. Edits after publish appear on the live URL without re-download.
8. System can be deployed on **cPanel**: static frontend in `public_html` + Node API app + MySQL.
9. **SEO:** our marketing site is indexable; ZIP templates are SEO-ready; `/portfolio/:userRoute` is `noindex` + disallowed in `robots.txt`.

---

## 19. Suggested first vertical slices

**Slice 1:** register/login → save portfolio row in MySQL → load it back in builder.

**Slice 2:** download zip from that saved row.

**Slice 3:** publish flag + public `/portfolio/:userRoute` page reading MySQL.

**Slice 4:** build frontend `dist` + run backend with `npm start`; confirm layout matches cPanel upload.

Do not polish landing marketing until those work.

---

## 20. Later backlog

- Email optional + password reset
- Avatar / project image upload
- Live preview iframe in builder
- Custom domain mapping
- AI bio assist
- More templates / themes
- Analytics on public page views
- Object storage if zip disk fills on shared hosting

---

## 21. Decision summary

| Decision | Choice |
|----------|--------|
| Product | Single-page portfolio: **save once → download and/or host** |
| Auth | Simple **username + password** register/login |
| MySQL | Users + portfolio content + `userRoute` + publish flag |
| Hosting (product) | Dynamic `/portfolio/:userRoute` from MySQL |
| **Deploy target** | **cPanel** (static SPA + Node.js App + cPanel MySQL) |
| Repo shape | Separate `frontend/` + `backend/` + `sql/` (easy upload) |
| Download | On-demand zip from MySQL data |
| Templates / zips | Inside `backend/` for correct server paths |
| **SEO** | Our site + **downloaded** portfolios: yes; **hosted** `/portfolio/:userRoute`: **noindex** |

**Flow users feel:** register → fill details → save → download code **or** publish to `/portfolio/your-name` (or both).

**Flow you deploy:** build frontend → upload to `public_html` → upload backend → Setup Node.js App → import SQL.
