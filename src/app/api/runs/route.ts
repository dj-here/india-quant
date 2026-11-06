import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withDbRetry } from "@/db";
import { runs, players } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifySessionToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { Verifier } from "@/sim/Verifier";

const RunSubmissionSchema = z.object({
  mode: z.enum(["standard", "daily", "endless"]),
  seed: z.number(),
  characterId: z.string(),
  arenaId: z.string(),
  score: z.number().int().nonnegative(),
  durationMs: z.number().int().min(1000),
  kills: z.number().int().nonnegative(),
  levelReached: z.number().int().min(1),
  stardustEarned: z.number().int().nonnegative(),
  buildJson: z.object({
    weapons: z.array(z.object({ id: z.string(), level: z.number() })),
    passives: z.array(z.object({ id: z.string(), level: z.number() })),
  }),
  inputLog: z.array(
    z.object({
      tick: z.number(),
      dx: z.number(),
      dy: z.number(),
      angle: z.number().optional(),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`run_${ip}`, 15, 1)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const token = req.cookies.get("starfall_token")?.value;
  const session = token ? await verifySessionToken(token) : null;

  try {
    const body = await req.json();
    const data = RunSubmissionSchema.parse(body);

    // 1. Plausibility Envelope Checks
    const maxPlausibleKillsPerSec = 30;
    const durationSec = data.durationMs / 1000;
    if (data.kills > durationSec * maxPlausibleKillsPerSec) {
      return NextResponse.json({ error: "Kill count exceeds physical envelope." }, { status: 400 });
    }

    const maxPlausibleScorePerSec = 8000;
    if (data.score > durationSec * maxPlausibleScorePerSec + 5000) {
      return NextResponse.json({ error: "Score exceeds theoretical maximum." }, { status: 400 });
    }

    // 2. Headless Re-Simulation for High Scores
    let isVerified = true;
    if (data.score > 20000 && data.inputLog && data.inputLog.length > 0) {
      const verResult = Verifier.verifyRun(
        data.seed,
        data.characterId,
        data.arenaId,
        data.inputLog,
        {
          score: data.score,
          durationMs: data.durationMs,
          kills: data.kills,
          levelReached: data.levelReached,
          stardustEarned: data.stardustEarned,
          damageDealt: 0,
          damageTaken: 0,
          weaponsFinal: data.buildJson.weapons,
          passivesFinal: data.buildJson.passives,
        }
      );
      isVerified = verResult.verified;
    }

    const playerNickname = session?.nickname || `Guest_${Math.floor(Math.random() * 9000 + 1000)}`;

    const insertedRun = await withDbRetry(async () => {
      const res = await db
        .insert(runs)
        .values({
          playerId: session?.playerId || null,
          nickname: playerNickname,
          mode: data.mode,
          seed: data.seed,
          characterId: data.characterId,
          arenaId: data.arenaId,
          score: data.score,
          durationMs: data.durationMs,
          kills: data.kills,
          levelReached: data.levelReached,
          stardustEarned: data.stardustEarned,
          buildJson: data.buildJson,
          verified: isVerified,
        })
        .returning();
      return res[0];
    });

    return NextResponse.json({
      runId: insertedRun.id,
      verified: isVerified,
      nickname: playerNickname,
      score: insertedRun.score,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    console.error("Run submission error:", err);
    return NextResponse.json({ error: "Failed to submit run record" }, { status: 500 });
  }
}
