import { NextRequest, NextResponse } from "next/server";
import { db, withDbRetry } from "@/db";
import { saves } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("starfall_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const record = await withDbRetry(async () => {
      return await db.select().from(saves).where(eq(saves.playerId, session.playerId)).limit(1);
    });

    if (record.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: record[0].dataJson, version: record[0].version });
  } catch (err) {
    console.error("Save load error:", err);
    return NextResponse.json({ error: "Failed to load cloud save" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("starfall_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const dataJson = body.data;

    await withDbRetry(async () => {
      await db
        .insert(saves)
        .values({
          playerId: session.playerId,
          version: body.version || 1,
          dataJson,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: saves.playerId,
          set: {
            dataJson,
            version: body.version || 1,
            updatedAt: new Date(),
          },
        });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Save sync error:", err);
    return NextResponse.json({ error: "Failed to persist cloud save" }, { status: 500 });
  }
}
