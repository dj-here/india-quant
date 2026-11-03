import { NextResponse } from 'next/server';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalSubmissions = await prisma.assessmentSubmission.count();

    const submissions = await prisma.assessmentSubmission.findMany({
      select: {
        collegeName: true,
        percentage: true,
        readinessBand: true,
        quantScore: true,
        logicalScore: true,
        verbalScore: true,
        dsaScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (submissions.length === 0) {
      return NextResponse.json({
        totalSubmissions: 0,
        averageScore: 0,
        collegeAggregates: [],
        bandCounts: { SUPER_DREAM_READY: 0, PLACEMENT_READY: 0, FOUNDATION_NEEDED: 0 },
      });
    }

    const totalPercentage = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = Math.round((totalPercentage / submissions.length) * 10) / 10;

    const bandCounts = {
      SUPER_DREAM_READY: submissions.filter(s => s.readinessBand === 'SUPER_DREAM_READY').length,
      PLACEMENT_READY: submissions.filter(s => s.readinessBand === 'PLACEMENT_READY').length,
      FOUNDATION_NEEDED: submissions.filter(s => s.readinessBand === 'FOUNDATION_NEEDED').length,
    };

    // Group by College
    const collegeMap = new Map<string, { count: number; totalPct: number; superDream: number }>();
    for (const sub of submissions) {
      const entry = collegeMap.get(sub.collegeName) || { count: 0, totalPct: 0, superDream: 0 };
      entry.count++;
      entry.totalPct += sub.percentage;
      if (sub.readinessBand === 'SUPER_DREAM_READY') entry.superDream++;
      collegeMap.set(sub.collegeName, entry);
    }

    const collegeAggregates = Array.from(collegeMap.entries()).map(([collegeName, stats]) => ({
      collegeName,
      testTakers: stats.count,
      averagePercentage: Math.round((stats.totalPct / stats.count) * 10) / 10,
      superDreamRatio: Math.round((stats.superDream / stats.count) * 100),
    }));

    return NextResponse.json({
      success: true,
      totalSubmissions,
      averageScore,
      bandCounts,
      collegeAggregates,
    });
  } catch (error: any) {
    console.error('[API Assessment Stats GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment stats.' }, { status: 500 });
  }
}
