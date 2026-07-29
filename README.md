# Adawwa

Create a single-page portfolio: **register → save details → download a source zip and/or host at `/portfolio/:userRoute`**.

## Local setup

### 1. MySQL

```bash
docker compose up -d
```

MySQL: `127.0.0.1:3307` / user `portfolio` / password `portfolio` / db `portfolio_generator`

### 2. API

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API: http://localhost:4000

### 3. Web

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Flow

1. Register (username + password)
2. Fill builder → Save
3. Dashboard → **Download ZIP** and/or **Publish**
4. Live page: `/portfolio/:userRoute` (**noindex** — sharing only)
5. ZIP templates are static HTML (SEO-friendly on your own domain)
