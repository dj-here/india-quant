# Starfall Survivors — Launch Readiness & Infrastructure Cost Guide (LAUNCH_CHECKLIST.md)

This document provides a pre-flight launch verification matrix along with capacity planning, tier limits, and cost projections across Vercel and Neon Serverless PostgreSQL.

---

## 1. Pre-Flight Launch Verification Checklist

- [ ] **Game Loop Locked**: 60 FPS verified across Chrome, Safari, Firefox, Edge, and iOS/Android mobile web.
- [ ] **Instant Playability**: Page load to first control input is under 4 seconds on 4G network emulation.
- [ ] **Deterministic Simulation**: Replaying recorded test input logs reproduces identical scores and kill tallies.
- [ ] **Asset Footprint Budget**: Initial JavaScript bundle < 250 KB gzipped; zero heavy uncompressed audio/image downloads.
- [ ] **Offline Playability**: Game is fully playable offline; service worker caches core assets; scores queue locally for upload.
- [ ] **Database Connection Pooling**: Runtime uses `-pooler` Neon connection strings; direct string used only for Drizzle migrations.
- [ ] **Rate Limiting**: API routes protected against scraping and rapid score submission abuse.
- [ ] **Anti-Cheat Heuristics**: Runs with impossible DPS, abnormal duration-to-score ratios, or illegal upgrades are rejected.
- [ ] **Security Headers**: Content Security Policy (CSP), X-Frame-Options, and Strict-Transport-Security configured.
- [ ] **Accessibility Audit**: Flashes clamped < 3 Hz, colorblind palettes verified, reduced motion toggles operational.

---

## 2. Infrastructure Capacity & Cost Estimation

### Architecture Free-Tier Allowances

| Provider | Service | Free Tier Quota | Estimated Game Capacity |
|---|---|---|---|
| **Vercel** | Hobby Plan | 100 GB Bandwidth / mo | ~400,000 game visits / month |
| | Serverless Functions | 100,000 invocations / day | ~50,000 run submissions + leaderboard views / day |
| | Edge Network & CDN | Global Anycast CDN | Unlimited static procedural asset delivery |
| **Neon** | Free Tier | 0.5 GiB Storage | ~250,000 run records & player profiles |
| | Compute Hours | 100 Active Compute Hours / mo | Auto-suspends after 5 min idle; ~20,000 active sessions |
| **Total Free Cost** | | **$0.00 / month** | Ample for launch, playtesting & early viral growth |

---

## 3. Scale-Up Projections (Paid Tiers at Scale)

When active monthly players exceed 50,000:
1. **Vercel Pro ($20/month)**:
   - 1 TB Bandwidth.
   - 1,000,000 serverless execution seconds.
   - Fast background jobs for headless verification.
2. **Neon Launch Plan ($19/month)**:
   - 10 GiB Storage (~5,000,000 runs).
   - 300 Compute Hours with auto-scaling up to 4 CU.
   - Point-In-Time Restore (PITR) for 7 days.
3. **Total Estimated Production Cost at 100,000 MAU**: **~$39.00 / month**.
