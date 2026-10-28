import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { buildRefundLedgerEntries, buildPayoutLedgerEntries } from '@pawstay/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.roles?.includes('ADMIN') || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const adminUserId = session?.user?.id || 'admin-system';

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        booking: {
          include: {
            sitter: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action as 'RESOLVE_REFUND_OWNER' | 'RESOLVE_RELEASE_SITTER' | 'DISMISS';
    const resolutionNotes = (body.notes || '').trim() || 'Resolved by platform operator.';

    if (!['RESOLVE_REFUND_OWNER', 'RESOLVE_RELEASE_SITTER', 'DISMISS'].includes(action)) {
      return NextResponse.json({ error: 'Invalid resolution action' }, { status: 400 });
    }

    const now = new Date();

    if (action === 'RESOLVE_REFUND_OWNER') {
      const refundAmountMinor = dispute.requestedRefundMinor || dispute.booking.ownerTotalMinor;

      // 1. Update dispute status
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: 'RESOLVED_REFUND',
          resolutionNotes,
          resolvedAt: now,
        },
      });

      // 2. Transition booking to REFUNDED
      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data: {
          status: 'REFUNDED',
          cancellationRefundMinor: refundAmountMinor,
        },
      });

      // 3. Record refund in double-entry ledger
      const refundPlan = buildRefundLedgerEntries({
        bookingId: dispute.bookingId,
        refundAmountMinor,
        sitterDeductionMinor: dispute.booking.sitterNetPayoutMinor,
        platformFeeRefundMinor: Math.max(0, refundAmountMinor - dispute.booking.sitterNetPayoutMinor),
        providerRefundId: `re_disp_${dispute.id.slice(0, 8)}`,
        idempotencyPrefix: `disp_ref_${dispute.id}`,
      });

      for (const entry of refundPlan.entries) {
        await prisma.ledgerEntry.create({
          data: {
            bookingId: entry.bookingId,
            entryType: entry.entryType as any,
            debitAccount: entry.debitAccount,
            creditAccount: entry.creditAccount,
            amountMinor: entry.amountMinor,
            currency: entry.currency,
            idempotencyKey: entry.idempotencyKey,
            description: `Dispute Resolution Refund: ${resolutionNotes}`,
          },
        });
      }

      // 4. Record refund entity
      await prisma.refund.create({
        data: {
          bookingId: dispute.bookingId,
          amountMinor: refundAmountMinor,
          reason: `Dispute Resolution: ${resolutionNotes}`,
          idempotencyKey: `disp_ref_${dispute.id}_${Date.now()}`,
        },
      });

      // 5. Notify parties
      await prisma.notification.create({
        data: {
          userId: dispute.booking.ownerId,
          title: 'Dispute Resolved: Refund Approved',
          message: `Your dispute for Booking #${dispute.booking.bookingNumber} was resolved. A refund has been issued.`,
          actionUrl: `/bookings/${dispute.bookingId}`,
          type: 'DISPUTE_RESOLVED',
        },
      });
    } else if (action === 'RESOLVE_RELEASE_SITTER') {
      // 1. Update dispute status
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: 'RESOLVED_PAYOUT',
          resolutionNotes,
          resolvedAt: now,
        },
      });

      // 2. Transition booking to PAYOUT_RELEASED
      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data: {
          status: 'PAYOUT_RELEASED',
          payoutReleasedAt: now,
        },
      });

      // 3. Record payout in double-entry ledger
      const payoutPlan = buildPayoutLedgerEntries({
        bookingId: dispute.bookingId,
        sitterNetPayoutMinor: dispute.booking.sitterNetPayoutMinor,
        providerPayoutId: `tr_disp_${dispute.id.slice(0, 8)}`,
        idempotencyPrefix: `disp_pay_${dispute.id}`,
      });

      for (const entry of payoutPlan.entries) {
        await prisma.ledgerEntry.create({
          data: {
            bookingId: entry.bookingId,
            entryType: entry.entryType as any,
            debitAccount: entry.debitAccount,
            creditAccount: entry.creditAccount,
            amountMinor: entry.amountMinor,
            currency: entry.currency,
            idempotencyKey: entry.idempotencyKey,
            description: `Dispute Resolution Payout Release: ${resolutionNotes}`,
          },
        });
      }

      // 4. Record payout entity
      await prisma.payout.create({
        data: {
          bookingId: dispute.bookingId,
          sitterId: dispute.booking.sitterId,
          amountMinor: dispute.booking.sitterNetPayoutMinor,
          status: 'PAID',
          scheduledReleaseAt: now,
          releasedAt: now,
          idempotencyKey: `disp_pay_${dispute.id}_${Date.now()}`,
        },
      });

      // 5. Notify parties
      await prisma.notification.create({
        data: {
          userId: dispute.booking.sitter.userId,
          title: 'Dispute Resolved: Payout Released',
          message: `The dispute for Booking #${dispute.booking.bookingNumber} has been resolved and your payout released.`,
          actionUrl: `/bookings/${dispute.bookingId}`,
          type: 'DISPUTE_RESOLVED',
        },
      });
    } else if (action === 'DISMISS') {
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: 'DISMISSED',
          resolutionNotes,
          resolvedAt: now,
        },
      });
    }

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `DISPUTE_RESOLVED_${action}`,
        entityType: 'Dispute',
        entityId: dispute.id,
        metadata: {
          bookingId: dispute.bookingId,
          resolutionAction: action,
          resolutionNotes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dispute successfully resolved with action: ${action}`,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
