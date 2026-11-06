import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Load .env file manually if not already in process.env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function runMigration() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
  if (!url) {
    console.warn("No DATABASE_URL configured. Skipping database migration.");
    return;
  }

  console.log("Applying Starfall Survivors database schema to Neon...");
  const sql = neon(url);

  try {
    // 1. Players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nickname TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_banned BOOLEAN NOT NULL DEFAULT FALSE
      );
    `;

    // 2. Saves table
    await sql`
      CREATE TABLE IF NOT EXISTS saves (
        player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
        version INT NOT NULL DEFAULT 1,
        data_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 3. Runs table
    await sql`
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID REFERENCES players(id) ON DELETE SET NULL,
        nickname TEXT NOT NULL,
        mode TEXT NOT NULL,
        seed BIGINT NOT NULL,
        character_id TEXT NOT NULL,
        arena_id TEXT NOT NULL,
        score INT NOT NULL,
        duration_ms INT NOT NULL,
        kills INT NOT NULL,
        level_reached INT NOT NULL,
        stardust_earned INT NOT NULL DEFAULT 0,
        build_json JSONB NOT NULL,
        input_log_hash TEXT,
        verified BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 4. Daily Challenges table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_challenges (
        date TEXT PRIMARY KEY,
        seed BIGINT NOT NULL,
        modifiers_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 5. Player Achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS player_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        achievement_key TEXT NOT NULL,
        unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 6. Reports table
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 7. Indexes
    await sql`CREATE INDEX IF NOT EXISTS runs_score_idx ON runs(score);`;
    await sql`CREATE INDEX IF NOT EXISTS runs_mode_idx ON runs(mode);`;
    await sql`CREATE INDEX IF NOT EXISTS runs_created_at_idx ON runs(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS runs_verified_score_idx ON runs(verified, mode, score);`;
    await sql`CREATE INDEX IF NOT EXISTS player_achievement_idx ON player_achievements(player_id, achievement_key);`;

    console.log("Starfall Survivors database tables & indexes migrated successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
