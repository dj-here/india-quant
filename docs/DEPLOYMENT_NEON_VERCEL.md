# KidsMentor: Git + Neon + Vercel Live Deployment Guide

This guide details the three-step deployment pipeline for **KidsMentor**:
1. **Git**: Codebase committed and pushed to GitHub
2. **Neon**: Serverless PostgreSQL database migration and NCERT/Values seeding
3. **Vercel**: Next.js 14 App Router production deployment

---

## 1. Git (Codebase Repository)

The codebase has already been committed and pushed to the `main` branch:
- **Repository URL**: `https://github.com/dj-here/campusedge-platform.git`
- **Latest Commit**: `cb06125` — `feat: launch KidsMentor - production AI-only 1-on-1 tutoring platform (FastAPI, SymPy, Next.js, Neon, Vercel)`

### If you want to push to a brand-new repository (e.g. `kidsmentor`):
Simply run the included 1-click batch script or PowerShell script:
```bash
.\setup-new-github-repo.bat
```
*(Or in PowerShell: `.\setup-new-github-repo.ps1`)*

The script will ask for your new GitHub repository URL, switch the origin remote, and push the `main` branch automatically.

---

## 2. Neon (Serverless PostgreSQL Database)

KidsMentor is fully compatible with Neon Serverless PostgreSQL with `pgvector`.

### Step 1: Create a Neon Database
1. Go to [Neon Console](https://console.neon.tech).
2. Create a new project named **`kidsmentor`**.
3. Select AWS Region: **`ap-southeast-1`** (Singapore) or **`eu-central-1`** (or Mumbai when available).
4. Copy your database connection string (e.g., `postgresql://alex:AbC123xYz@ep-silent-hill-123456.ap-southeast-1.aws.neon.tech/kidsmentor?sslmode=require`).

### Step 2: One-Click Migration & Seeding
Run the included 1-click setup script:
```bash
.\setup-neon.bat
```
*(Or in PowerShell: `.\setup-neon.ps1`)*

Paste your Neon Database URL when prompted. The automated script (`scripts/neon_migrate_and_seed.py`) will:
1. Connect securely to Neon via asyncpg.
2. Enable `pgvector` extension.
3. Automatically generate all **27 relational tables** (`users`, `curriculum`, `sessions`, `values`, `memory`, etc.).
4. Seed NCERT Classes 4, 6, and 8 curriculum (Maths, Science, Force & Pressure, Cell Biology).
5. Seed all **12 Life Values modules** with stories in English, Hindi, and Telugu, moral dilemmas, and real-life missions.
6. Verify and output counts of all seeded records.

### Step 3: Update Local `.env`
Update your local `.env` with the Neon URL:
```env
DATABASE_URL=postgresql+asyncpg://<username>:<password>@<neon-hostname>/kidsmentor?sslmode=require
```

---

## 3. Vercel (Next.js 14 Web Application)

The Next.js 14 App Router application is located in `apps/web/` and configured for zero-friction Vercel deployment.

### Step 1: Import Project into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository (`campusedge-platform` or `kidsmentor`).
3. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web` *(Important: click Edit and select `apps/web`)*
   - **Build Command**: `next build` (Default)
   - **Output Directory**: `.next` (Default)

### Step 2: Configure Environment Variables on Vercel
In the Vercel **Environment Variables** section, add:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://kidsmentor.vercel.app` | Production URL of your Vercel deployment |
| `NEXT_PUBLIC_API_URL` | `https://api.kidsmentor.app` | URL of your deployed FastAPI backend (or local bridge) |
| `DATABASE_URL` | `postgresql://<user>:<pass>@<host>/kidsmentor?sslmode=require` | Your Neon database URL |
| `NEXTAUTH_SECRET` | `kidsmentor-production-super-secret-key-32-chars` | Random 32+ character key for JWT sessions |
| `NEXTAUTH_URL` | `https://kidsmentor.vercel.app` | Canonical URL for NextAuth callbacks |
| `ADMIN_EMAIL` | `admin@kidsmentor.app` | Admin login email for `/admin` portal |
| `ADMIN_PASSWORD` | `KidsMentor2026!` | Admin login password |

### Step 3: Deploy
Click **Deploy**. Vercel will install dependencies and build the application cleanly.

---

## 4. Live Verification Checklist

Once deployed on Vercel and connected to Neon:
- [ ] Visit `/`: Verify homepage loads with Ollie the Owl mascot and Socratic preview.
- [ ] Visit `/onboarding`: Test parent verifiable consent (DPDP Act 2023) and child profile creation.
- [ ] Visit `/child/login`: Test 4-digit PIN login.
- [ ] Visit `/child/home`: Verify "Today's Plan", streak counter, and Character Garden preview.
- [ ] Visit `/child/tutor`: Test Socratic 1-on-1 tutoring, whiteboard canvas, and voice STT/TTS.
- [ ] Visit `/child/values`: Test Story $\rightarrow$ Reflect $\rightarrow$ Real-Life Mission flow and Character Garden SVG.
- [ ] Visit `/parent/dashboard`: Check BKT mastery heatmaps, weekly digests, and 1-click DPDP data export.
- [ ] Visit `/admin`: Review the educator content review queue, safety moderation, and prompt versions.
