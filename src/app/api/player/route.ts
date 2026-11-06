import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withDbRetry } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const PlayerSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(3, "Nickname must be at least 3 characters")
    .max(16, "Nickname must be at most 16 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nickname can only contain letters, numbers, hyphens, and underscores"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`player_${ip}`, 10, 1)) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { nickname } = PlayerSchema.parse(body);

    // Basic profanity check
    const vulgarList = ["admin", "root", "system", "moderator", "nazi", "hitler"];
    if (vulgarList.some((v) => nickname.toLowerCase().includes(v))) {
      return NextResponse.json({ error: "Nickname is reserved or disallowed." }, { status: 400 });
    }

    const player = await withDbRetry(async () => {
      // Check existing
      const existing = await db.select().from(players).where(eq(players.nickname, nickname)).limit(1);
      if (existing.length > 0) {
        return existing[0];
      }

      // Create new
      const inserted = await db
        .insert(players)
        .values({ nickname })
        .returning();
      return inserted[0];
    });

    const token = await createSessionToken({
      playerId: player.id,
      nickname: player.nickname,
    });

    const res = NextResponse.json({
      player: {
        id: player.id,
        nickname: player.nickname,
        createdAt: player.createdAt,
      },
    });

    // Set signed HTTP-only cookie
    res.cookies.set("starfall_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return res;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Player creation error:", err);
    return NextResponse.json({ error: "Failed to create player record" }, { status: 500 });
  }
}
