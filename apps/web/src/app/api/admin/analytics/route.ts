import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.roles?.includes('ADMIN') || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // 1. Booking aggregations
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        status: true,
        ownerId: true,
        ownerTotalMinor: true,
        ownerServiceFeeMinor: true,
        sitterCommissionMinor: true,
        createdAt: true,
        sitter: {
          select: { city: true },
        },
      },
    });

    const nonCancelledBookings = allBookings.filter(
      (b) => !['CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER'].includes(b.status)
    );

    const totalGmvMinor = nonCancelledBookings.reduce((sum, b) => sum + b.ownerTotalMinor, 0);
    const totalPlatformRevenueMinor = nonCancelledBookings.reduce(
      (sum, b) => sum + b.ownerServiceFeeMinor + b.sitterCommissionMinor,
      0
    );

    const takeRatePercent =
      totalGmvMinor > 0 ? (totalPlatformRevenueMinor / totalGmvMinor) * 100 : 19.0;

    const completedCount = allBookings.filter((b) =>
      ['COMPLETED', 'PAYOUT_RELEASED'].includes(b.status)
    ).length;

    const cancelledCount = allBookings.filter((b) =>
      ['CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER'].includes(b.status)
    ).length;

    const disputedCount = allBookings.filter((b) =>
      ['DISPUTED', 'REFUNDED'].includes(b.status)
    ).length;

    // 2. Repeat Owner Rate Calculation
    const ownerBookingCounts = new Map<string, number>();
    for (const b of allBookings) {
      ownerBookingCounts.set(b.ownerId, (ownerBookingCounts.get(b.ownerId) || 0) + 1);
    }

    const totalUniqueOwners = ownerBookingCounts.size;
    const repeatOwners = Array.from(ownerBookingCounts.values()).filter((c) => c > 1).length;
    const repeatRatePercent =
      totalUniqueOwners > 0 ? Math.round((repeatOwners / totalUniqueOwners) * 100) : 0;

    // 3. Sitter Supply & Pipeline
    const sitters = await prisma.sitterProfile.findMany({
      select: {
        id: true,
        status: true,
        city: true,
        ratingBayesian: true,
      },
    });

    const approvedSitters = sitters.filter((s) => s.status === 'APPROVED');
    const pendingSitters = sitters.filter((s) => s.status === 'PENDING');

    const averageRating =
      approvedSitters.length > 0
        ? approvedSitters.reduce((sum, s) => sum + s.ratingBayesian, 0) / approvedSitters.length
        : 4.9;

    // 4. Supply vs Demand by Target Metro
    const targetMetros = ['Bengaluru', 'Mumbai', 'Delhi-NCR', 'Pune', 'Hyderabad', 'Austin'];
    const metroStats = targetMetros.map((city) => {
      const supplyCount = approvedSitters.filter(
        (s) => s.city?.toLowerCase() === city.toLowerCase()
      ).length;
      const demandCount = allBookings.filter(
        (b) => b.sitter?.city?.toLowerCase() === city.toLowerCase()
      ).length;

      return {
        city,
        approvedSitters: supplyCount,
        totalBookings: demandCount,
        liquidityRatio: supplyCount > 0 ? Math.round((demandCount / supplyCount) * 10) / 10 : 0,
      };
    });

    // 5. Leakage & Safety Metrics
    const interceptedMessages = await prisma.message.count({
      where: { hasOffPlatformAttempt: true },
    });
    const totalMessages = await prisma.message.count();

    return NextResponse.json({
      metrics: {
        totalGmvMinor,
        totalPlatformRevenueMinor,
        takeRatePercent: Math.round(takeRatePercent * 10) / 10,
        totalBookings: allBookings.length,
        completedCount,
        cancelledCount,
        disputedCount,
        repeatRatePercent,
        totalSitters: sitters.length,
        approvedSittersCount: approvedSitters.length,
        pendingSittersCount: pendingSitters.length,
        averageRating: Math.round(averageRating * 100) / 100,
        interceptedMessages,
        totalMessages,
        leakageInterceptRatePercent:
          totalMessages > 0
            ? Math.round((interceptedMessages / totalMessages) * 1000) / 10
            : 0,
      },
      metroStats,
    });
  } catch (error) {
    console.error('Error computing analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
