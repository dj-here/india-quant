# Starfall Survivors 🌟🚀

> An adrenaline-fueled, neon-lit 2D cosmic arcade survivor game built with **Next.js (App Router)**, **Phaser 3**, **TypeScript**, **Neon Serverless PostgreSQL**, and **Drizzle ORM**, deployed live on **Vercel**.

Playable instantly in the browser on desktop and mobile devices. Zero downloads, zero forced accounts, 100% responsive 60 FPS gameplay.

---

## 🎮 Game Concept & Features

- **Genre**: Top-down arcade survivor (auto-attack, dodge, level up, pick upgrades).
- **Core Loop**: Move only (WASD / Arrows / Dynamic Touch Joystick) $\to$ weapons fire automatically $\to$ destroy cosmic drones & cosmic bosses $\to$ collect XP gems $\to$ level up with 3-choice upgrade cards $\to$ evolve weapons $\to$ harvest Stardust $\to$ unlock permanent meta-upgrades.
- **Launch Content**:
  - **3 Playable Vessels**: Nova Vanguard, Void Reaver, Solaris Priestess.
  - **8 Weapons + 8 Evolutions**: Twin Blaster, Orbital Blades, Solar Flare, Cosmic Swarm, Tesla Arc, Photon Beam, Stardust Mines, Pulse Shield.
  - **12 Passive Upgrades**: Overcharged Capacitor, Gravity Well, Amplifier, Targeting Matrix, Titanium Plating, etc.
  - **10 Enemy Archetypes + 2 Epic Bosses**: The Cosmic Leviathan (Mini-boss) and The Starfall Harbinger (Climax boss).
  - **3 Arenas**: Neon Orbit, Obsidian Void, Solar Flare Matrix.
  - **Meta-Progression Tree**: 25 persistent Stardust nodes across Offense, Defense, Utility, and Mastery.
  - **Daily Challenge**: Shared deterministic UTC date seed with rotating mutators and global daily leaderboards.
  - **30 Unlockable Achievements**: Earning cosmetics, Stardust, and ships.

---

## 🛠️ Architecture & Tech Stack

```
Phaser 3 Canvas (Client-Only WebGL) <---> Typed EventBus <---> React UI Overlay (Tailwind & Framer Motion)
                                               |
                                     Pure TS Simulation Core (/src/sim)
                                               |
                                Next.js App Router API Routes (/api/*)
                                               |
                                Neon Serverless Postgres (Drizzle ORM)
```

- **Next.js 14 (App Router) + TypeScript**: Production web application shell and serverless API handlers.
- **Phaser 3 (Loaded Client-Side, SSR: false)**: WebGL hardware-accelerated rendering, camera shake, hitstop, and particle systems.
- **Pure Deterministic Simulation Core (`/src/sim`)**: Zero Phaser/DOM dependencies. Mulberry32 32-bit PRNG, fixed 60Hz timestep, damage mathematics, spawn budgets, and headless replay verification.
- **Neon Serverless PostgreSQL + Drizzle ORM**: Pooled connection runtime for serverless functions, indexed leaderboard queries, cloud save synchronization.
- **Procedural Graphics & Audio**: Runtime HTML5 canvas vector rendering (<50KB texture footprint), ZzFX arcade SFX generator, and 4-stem Web Audio API dynamic synth music.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (.env)
cp .env.example .env

# 3. Apply Neon migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Start development server
npm run dev
# Open http://localhost:3000
```

---

## 🧪 Testing & Balance Bot

```bash
# Run Vitest unit & determinism simulation tests
npm run test

# Run headless 100-run balance simulation bot
npm run simulate
```

---

## 🚢 Deployment to Vercel

See [docs/DEPLOY.md](docs/DEPLOY.md) for the complete zero-to-live runbook.

```bash
# Push directly to GitHub
git push origin main

# Link and deploy with Vercel CLI
npx vercel link
npx vercel --prod
```
