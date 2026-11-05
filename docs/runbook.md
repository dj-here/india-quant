# Starfall Survivors — Production Operations Runbook (RUNBOOK.md)

This runbook provides step-by-step procedures for handling database cold starts, Vercel deployments, rollbacks, and leaderboard moderation for **Starfall Survivors**.

---

## 1. Handling Neon Database Cold Starts

Neon serverless Postgres instances automatically scale to zero (suspend compute) when idle to minimize costs.
- **Expected Latency**: The initial wake-up query takes approximately 800ms - 2,000ms.
- **Client Offline-Friendly Resilience**:
  - The client game loop never blocks on database responses.
  - If an API call fails or times out during a cold start, the game saves the run locally and marks it for retry in the background.
- **Server Retry Logic**:
  - All database queries in Next.js API routes use an exponential backoff wrapper (2 retries, 500ms delay) so requests rarely surface a 500 error to the client.

---

## 2. Vercel Deployment & Rollback Strategy

### Standard Deployment
- Pushing to `main` triggers an automatic production deployment on Vercel.
- Pull Requests automatically create isolated preview deployments with dedicated Neon database branches.

### Emergency Rollback Procedure
If a production deployment introduces a critical bug:
1. Open the **Vercel Dashboard -> Deployments**.
2. Locate the previous stable production deployment.
3. Click the three dots `...` and select **Instant Rollback**.
4. Traffic is redirected immediately to the previous immutable serverless build.
5. In Git, revert the commit on `main` and push forward.

---

## 3. Leaderboard Moderation & Anti-Cheat Triage

### Flagging & Banning Suspect Runs
1. Query the `/api/runs` table in Neon or via admin route:
   ```sql
   SELECT id, player_id, score, duration_ms, kills, verified, created_at 
   FROM runs 
   WHERE score > 500000 
   ORDER BY score DESC 
   LIMIT 20;
   ```
2. To hide a suspicious run from public leaderboards without deleting historical telemetry:
   ```sql
   UPDATE runs SET verified = false WHERE id = '<RUN_UUID>';
   ```
3. To blacklist a toxic or abusive player nickname:
   ```sql
   UPDATE players SET is_banned = true WHERE id = '<PLAYER_UUID>';
   ```
4. Leaderboard SQL queries automatically filter with `WHERE runs.verified = true AND players.is_banned = false`.
