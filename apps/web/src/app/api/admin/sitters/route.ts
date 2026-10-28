import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { canAccessAdminPanel, SitterVerificationStatus } from '@pawstay/shared';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessAdminPanel(session.user)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const whereClause: any = {};
    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam as SitterVerificationStatus;
    }

    const sitters = await prisma.sitterProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        verification: true,
        homeProfile: true,
        services: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Also get count metrics by status
    const statusCounts = await prisma.sitterProfile.groupBy({
      by: ['status'],
      _count: true,
    });

    const counts: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      CHANGES_REQUESTED: 0,
      REJECTED: 0,
    };
    for (const c of statusCounts) {
      counts[c.status] = c._count;
    }

    return NextResponse.json({
      sitters,
      counts,
    });
  } catch (error: any) {
    console.error('Error fetching admin sitters:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
