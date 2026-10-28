import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { canApproveSitter, SitterVerificationStatus } from '@pawstay/shared';
import { z } from 'zod';

const ReviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  adminNotes: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canApproveSitter(session.user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges to review sitter applications.' },
        { status: 403 }
      );
    }

    const sitterId = params.id;
    const body = await req.json();
    const parseResult = ReviewActionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid review payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { action, adminNotes } = parseResult.data;

    // Check if sitter exists
    const existing = await prisma.sitterProfile.findUnique({
      where: { id: sitterId },
      include: { user: true, verification: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sitter profile not found.' }, { status: 404 });
    }

    let targetStatus: SitterVerificationStatus;
    let auditAction: string;
    let notificationTitle: string;
    let notificationMessage: string;

    if (action === 'APPROVE') {
      targetStatus = 'APPROVED';
      auditAction = 'SITTER_APPROVED';
      notificationTitle = '🎉 Your PawStay Sitter Profile is Approved!';
      notificationMessage =
        'Congratulations! Your verification checks and safety quiz were reviewed and approved. Your profile is now live and searchable by pet owners.';
    } else if (action === 'REJECT') {
      targetStatus = 'REJECTED';
      auditAction = 'SITTER_REJECTED';
      notificationTitle = 'Update on your PawStay Sitter Application';
      notificationMessage = `Your application was reviewed and could not be approved at this time. Notes: ${adminNotes || 'Verification criteria not satisfied.'}`;
    } else {
      targetStatus = 'CHANGES_REQUESTED';
      auditAction = 'SITTER_CHANGES_REQUESTED';
      notificationTitle = 'Action Required: Update your PawStay Application';
      notificationMessage = `Our ops team requested additional details before approving your profile. Notes: ${adminNotes || 'Please review your home profile and documents.'}`;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update SitterProfile
      const updatedProfile = await tx.sitterProfile.update({
        where: { id: sitterId },
        data: {
          status: targetStatus,
          approvedAt: action === 'APPROVE' ? new Date() : undefined,
        },
      });

      // 2. Update SitterVerification
      await tx.sitterVerification.upsert({
        where: { sitterProfileId: sitterId },
        create: {
          sitterProfileId: sitterId,
          status: targetStatus,
          adminNotes,
          reviewedByUserId: session.user.id,
          reviewedAt: new Date(),
        },
        update: {
          status: targetStatus,
          adminNotes,
          reviewedByUserId: session.user.id,
          reviewedAt: new Date(),
        },
      });

      // 3. Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: auditAction,
          entityType: 'SitterProfile',
          entityId: sitterId,
          oldState: { status: existing.status },
          newState: { status: targetStatus, adminNotes },
          metadata: {
            reviewedByAdminId: session.user.id,
            adminEmail: session.user.email,
          },
        },
      });

      // 4. Send Notification to Sitter
      await tx.notification.create({
        data: {
          userId: existing.userId,
          title: notificationTitle,
          message: notificationMessage,
          type: 'SITTER_VERIFICATION_UPDATE',
          actionUrl: '/sitter/dashboard',
        },
      });

      return updatedProfile;
    });

    return NextResponse.json({
      success: true,
      sitterId: updated.id,
      status: updated.status,
      actionTaken: action,
    });
  } catch (error: any) {
    console.error('Error in sitter review:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
