# LLM Monorepo

This repository contains:
- `backend/` — Node.js + Express + Prisma + MySQL
- `frontend/` — Next.js 14 (App Router) + Tailwind CSS

## 1) Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- MySQL database (local or managed)

### Clone and install
```bash
git clone <your-repo-url>
cd LLM

cd backend && npm install
cd ../frontend && npm install
```

### Configure environment variables
```bash
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env.local
```

Update values:
- Backend `.env`:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `REFRESH_SECRET`
  - `CORS_ORIGIN`
  - `COOKIE_DOMAIN`
  - `PORT`
  - `NODE_ENV`
- Frontend `.env.local`:
  - `NEXT_PUBLIC_API_BASE_URL` (example: `http://localhost:4000`)

### Run Prisma migrations and seed
```bash
cd backend
npx prisma migrate dev --name init
npm run seed
```

### Start dev servers
Use two terminals:

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `GET http://localhost:4000/api/health`

---

## 2) Backend Deploy (Render)

### Create Render Web Service
1. Push repo to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Set Root Directory to `backend`.
4. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Environment variables (Render)
Set all backend env vars:
- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `CORS_ORIGIN` (your Vercel frontend URL)
- `COOKIE_DOMAIN`
- `PORT` (Render usually injects this)
- `NODE_ENV=production`

### Run migrations in production
After first deploy, run migration job/command in Render shell:
```bash
npx prisma migrate deploy
```

---

## 3) Frontend Deploy (Vercel)

### Create Vercel project
1. Import repository in Vercel.
2. Set Root Directory to `frontend`.
3. Build settings (defaults are fine for Next.js):
   - Build Command: `npm run build`
   - Output uses Next standalone mode (`output: 'standalone'` in config).

### Environment variables (Vercel)
Set:
- `NEXT_PUBLIC_API_BASE_URL` = your Render backend URL (example: `https://your-backend.onrender.com`)

Deploy and verify auth + API calls.

---

## 4) Database Setup (Aiven MySQL)

1. Create a MySQL service in Aiven.
2. Create database/user credentials from Aiven console.
3. Build your Prisma URL:
```text
mysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>?ssl-mode=REQUIRED
```
4. Put this into backend `DATABASE_URL` (local `.env` and Render env vars).
5. Run Prisma migrations:
```bash
cd backend
npx prisma migrate deploy
```

Optional local check:
```bash
npx prisma studio
```

---

## Notes
- Backend `Procfile` is included for process-based deploy targets.
- Refresh token auth uses HTTP-only cookies, so `CORS_ORIGIN` must match your frontend origin.
