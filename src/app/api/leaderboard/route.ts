import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import { runs, players } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "standard";
  const period = searchParams.get("period") || "all";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

  try {
    let dateCutoff: Date | undefined;
    const now = new Date();

    if (period === "daily") {
      dateCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "weekly") {
      dateCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const leaderboard = await withDbRetry(async () => {
      let query = db
        .select({
          id: runs.id,
          nickname: runs.nickname,
          score: runs.score,
          durationMs: runs.durationMs,
          kills: runs.kills,
          levelReached: runs.levelReached,
          characterId: runs.characterId,
          arenaId: runs.arenaId,
          createdAt: runs.createdAt,
        })
        .from(runs)
        .where(
          and(
            eq(runs.verified, true),
            eq(runs.mode, mode),
            dateCutoff ? gte(runs.createdAt, dateCutoff) : undefined
          )
        )
        .orderBy(desc(runs.score))
        .limit(limit);

      return await query;
    });

    return NextResponse.json({
      mode,
      period,
      entries: leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      })),
    });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({
      mode,
      period,
      entries: [],
      error: "Leaderboard temporarily unavailable",
    });
  }
}
