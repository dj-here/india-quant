# Starfall Survivors — Zero-to-Live Deployment Guide (DEPLOY.md)

This one-page operational guide takes you from an empty environment to a production deployment of **Starfall Survivors** running on **GitHub + Neon Postgres + Vercel**.

---

## Prerequisites
Ensure the following developer tools are installed or accessible:
- Node.js (v18.17+ or v20+)
- pnpm (`npm install -g pnpm`)
- Git (`git --version`)
- GitHub CLI (`gh auth login`)
- Vercel CLI (`pnpm add -g vercel` or `npx vercel`)
- Neon CLI (`npm install -g neonctl` or via [Neon Console](https://console.neon.tech))

---

## Step 1: Create GitHub Repository & Push Code

```bash
# 1. Initialize git if not already present
git init
git checkout -b main

# 2. Add all project files
git add .
git commit -m "feat: initial commit for Starfall Survivors arcade game"

# 3. Create public or private GitHub repository using gh CLI
gh repo create starfall-survivors --public --source=. --remote=origin --push

# Alternatively via standard git remote:
# git remote add origin https://github.com/<YOUR_USER>/starfall-survivors.git
# git push -u origin main
```

---

## Step 2: Create Neon Serverless PostgreSQL Project

1. Log in to [Neon Console](https://console.neon.tech) or use `neonctl`:
```bash
neonctl auth
neonctl projects create --name starfall-survivors --region ap-southeast-1
```
2. In your Neon Project Dashboard:
   - Copy the **Pooled Connection String** (`ep-...-pooler...`):
     ```
     postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
     ```
   - Copy the **Direct (Unpooled) Connection String** (`ep-...` without `-pooler`):
     ```
     postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```

---

## Step 3: Configure Environment Variables

Create `.env` locally (do NOT commit secrets to Git; keep in `.gitignore`):

```bash
# Neon Database Connections
DATABASE_URL="postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Game Session Security & HMAC Secret
AUTH_SECRET="super-secret-random-32-character-key-here"

# Admin Secret (For /api/admin entry moderation)
ADMIN_SECRET="admin-passcode-for-hiding-cheaters"

# Environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://starfall-survivors.vercel.app"
```

---

## Step 4: Run Database Migrations & Initial Seed

```bash
# Run Drizzle migrations against direct Neon database
pnpm db:push

# Run seed script to populate daily challenge modifier rotators & achievements
pnpm db:seed
```

---

## Step 5: Link & Deploy to Vercel

```bash
# 1. Link project to Vercel
npx vercel link

# 2. Add environment variables to Vercel
npx vercel env add DATABASE_URL production
npx vercel env add DATABASE_URL_UNPOOLED production
npx vercel env add AUTH_SECRET production
npx vercel env add ADMIN_SECRET production

# 3. Trigger initial production build
npx vercel --prod
```

### Alternatively via Vercel Web Dashboard:
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import the `starfall-survivors` GitHub repository.
3. In **Settings -> Integrations**, install the official **Neon Integration** (this automatically populates `DATABASE_URL` and creates preview branches per pull request!).
4. Add `AUTH_SECRET` and `ADMIN_SECRET` under Environment Variables.
5. Click **Deploy**.

---

## Step 6: Post-Deployment Verification Checklist

- [ ] **Home Page Loads**: Open the deployed URL; splash screen and "Play Now" render instantly.
- [ ] **Canvas Boots**: Click "Play Now"; 60 FPS neon cosmic arena canvas renders with zero console errors.
- [ ] **Controls Responsive**: WASD/Arrows on desktop and touch joystick on mobile move the ship smoothly.
- [ ] **Sound Works**: Unmutes upon first click; lasers, pickups, and procedural synth stems play.
- [ ] **Save Persists**: Pick up gems, level up, die, earn Stardust; confirm Stardust is saved on reload.
- [ ] **Leaderboard Connects**: Submit a test run with a nickname; verify entry appears on Global Leaderboard.
- [ ] **Neon Scaling**: Verify Neon connection pooling handles concurrent leaderboard queries cleanly.
