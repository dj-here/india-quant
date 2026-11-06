import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import { dailyChallenges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashString } from "@/sim/Mulberry32";
import { getDailyModifiersForDate } from "@/data/dailyModifiers";

export async function GET(req: NextRequest) {
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    const records = await withDbRetry(async () => {
      return await db.select().from(dailyChallenges).where(eq(dailyChallenges.date, todayStr)).limit(1);
    });

    if (records.length > 0) {
      return NextResponse.json({
        date: records[0].date,
        seed: Number(records[0].seed),
        modifiers: records[0].modifiersJson,
      });
    }

    // Auto-create today's challenge if not yet seeded
    const seed = hashString(`starfall-daily-${todayStr}`);
    const modifiers = getDailyModifiersForDate(todayStr);

    await withDbRetry(async () => {
      await db.insert(dailyChallenges).values({
        date: todayStr,
        seed,
        modifiersJson: modifiers,
      }).onConflictDoNothing();
    });

    return NextResponse.json({
      date: todayStr,
      seed,
      modifiers,
    });
  } catch (err) {
    console.error("Daily challenge fetch error:", err);
    // Fallback: return computed deterministically even if DB has cold start
    const fallbackSeed = hashString(`starfall-daily-${todayStr}`);
    return NextResponse.json({
      date: todayStr,
      seed: fallbackSeed,
      modifiers: getDailyModifiersForDate(todayStr),
    });
  }
}
