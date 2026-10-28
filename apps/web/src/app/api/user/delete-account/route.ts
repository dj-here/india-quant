import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'User requested account deletion';

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownerBookings: {
          where: {
            status: { in: ['PAID_HELD', 'IN_PROGRESS', 'DISPUTED'] },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Guard: Cannot delete account if active stays or pending disputes exist
    if (user.ownerBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete account with active or in-progress stays. Please complete or cancel upcoming stays first.',
        },
        { status: 400 }
      );
    }

    // Anonymize user records to comply with GDPR Art. 17 while retaining financial ledger integrity
    const anonymizedEmail = `deleted_${userId.slice(0, 8)}@deleted.pawstay.com`;
    const anonymizedName = 'Former PawStay Member';

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          name: anonymizedName,
          phoneNumber: null,
          avatarUrl: null,
          passwordHash: null,
          isActive: false,
        },
      }),
      prisma.pet.updateMany({
        where: { ownerId: userId },
        data: { isArchived: true },
      }),
      prisma.auditLog.create({
        data: {
          userId,
          action: 'GDPR_RIGHT_TO_ERASURE_ACCOUNT_ANONYMIZED',
          entityType: 'User',
          entityId: userId,
          metadata: {
            reason,
            timestamp: new Date().toISOString(),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account successfully anonymized and deleted according to GDPR Right to Erasure.',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
