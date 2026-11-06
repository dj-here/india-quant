import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withDbRetry } from "@/db";
import { reports, runs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rateLimit";

const ReportSchema = z.object({
  runId: z.string().uuid(),
  reason: z.string().min(5).max(300),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(`report_${ip}`, 5, 0.1)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const data = ReportSchema.parse(body);

    await withDbRetry(async () => {
      await db.insert(reports).values({
        runId: data.runId,
        reason: data.reason,
      });
    });

    return NextResponse.json({ success: true, message: "Report submitted for moderation." });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || "Invalid input" }, { status: 400 });
    }
    console.error("Report error:", err);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
