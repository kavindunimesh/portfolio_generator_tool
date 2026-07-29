# cPanel deploy

## 1. Database

1. cPanel → **MySQL Databases** → create DB + user, grant all.
2. phpMyAdmin → Import `sql/schema.sql`.

## 2. Backend (Node.js App)

1. Upload the `backend/` folder (e.g. `~/portfolio-api/`). Include `templates/` and empty `storage/zips/`.
2. cPanel → **Setup Node.js App**
   - Application root: `portfolio-api`
   - Application URL: `api.yourdomain.com` (or chosen subdomain)
   - Startup: `npm start` (after build)
3. Set environment variables (same as `backend/.env.example`, with cPanel MySQL credentials).
4. Run:

```bash
npm install
npm run build
```

5. Ensure `storage/zips` is writable. Restart the app.

## 3. Frontend

1. Locally (or CI):

```bash
cd frontend
# set VITE_API_URL=https://api.yourdomain.com
npm install
npm run build
```

2. Upload **contents** of `frontend/dist/` into `public_html/` (keep `.htaccess` and `robots.txt`).

## 4. Verify

- Home loads with SEO title/description
- Register → builder → save → dashboard
- Download ZIP works
- Publish → `/portfolio/your-route` loads and has `noindex`
- `robots.txt` disallows `/portfolio/`
