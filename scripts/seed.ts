import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { hashString } from "../src/sim/Mulberry32";
import { getDailyModifiersForDate } from "../src/data/dailyModifiers";
import * as fs from "fs";
import * as path from "path";

// Load .env file
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

async function seed() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
  if (!connectionString) {
    console.warn("No DATABASE_URL configured. Skipping database seed.");
    return;
  }

  console.log("Connecting to Neon database...");
  const sql = neon(connectionString);
  const db = drizzle(sql, { schema });

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySeed = hashString(`starfall-daily-${todayStr}`);
  const modifiers = getDailyModifiersForDate(todayStr);

  console.log(`Seeding daily challenge for ${todayStr}...`);
  try {
    await db.insert(schema.dailyChallenges).values({
      date: todayStr,
      seed: todaySeed,
      modifiersJson: modifiers,
    }).onConflictDoNothing();
    console.log("Daily challenge seed complete!");
  } catch (err) {
    console.error("Seed error:", err);
  }
}

seed();
