import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import {
  transitionBooking,
  BookingStatus,
  calculateCancellationRefund,
  MockPaymentProvider,
  buildAuthorizationLedgerEntries,
  buildPayoutLedgerEntries,
  buildRefundLedgerEntries,
} from '@pawstay/shared';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const TransitionSchema = z.object({
  targetStatus: z.enum([
    'REQUESTED',
    'ACCEPTED',
    'DECLINED',
    'EXPIRED',
    'PAID_HELD',
    'IN_PROGRESS',
    'COMPLETED',
    'PAYOUT_RELEASED',
    'CANCELLED_BY_OWNER',
    'CANCELLED_BY_SITTER',
    'DISPUTED',
    'REFUNDED',
  ]),
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parseResult = TransitionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid transition payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { targetStatus, reason } = parseResult.data;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        owner: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Determine actor
    let actorId = session?.user?.id;
    let actorRoles = (session?.user as any)?.roles || ['OWNER'];

    if (!actorId) {
      // In demo mode or fallback, infer based on requested action
      if (targetStatus === 'ACCEPTED' || targetStatus === 'DECLINED' || targetStatus === 'CANCELLED_BY_SITTER' || targetStatus === 'COMPLETED') {
        actorId = booking.sitter.userId;
        actorRoles = ['SITTER'];
      } else {
        actorId = booking.ownerId;
        actorRoles = ['OWNER'];
      }
    }

    const actor = {
      id: actorId,
      roles: actorRoles,
      isSystem: actorRoles.includes('ADMIN') ? false : false,
    };

    const bookingContext = {
      id: booking.id,
      status: booking.status as BookingStatus,
      ownerId: booking.ownerId,
      sitterUserId: booking.sitter.userId,
    };

    // 1. Run State Machine Validation & Guards
    const transitionResult = transitionBooking(bookingContext, targetStatus, actor, { reason });

    const paymentProvider = new MockPaymentProvider();

    // 2. Execute Transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update Booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: targetStatus,
          cancelReason: reason || null,
          cancelledAt: targetStatus.startsWith('CANCELLED') ? new Date() : undefined,
          cancelledByUserId: targetStatus.startsWith('CANCELLED') ? actor.id : undefined,
          paidAt: targetStatus === 'PAID_HELD' ? new Date() : undefined,
          startedAt: targetStatus === 'IN_PROGRESS' ? new Date() : undefined,
          completedAt: targetStatus === 'COMPLETED' ? new Date() : undefined,
          payoutReleasedAt: targetStatus === 'PAYOUT_RELEASED' ? new Date() : undefined,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: transitionResult.auditPayload.userId,
          action: transitionResult.auditPayload.action,
          entityType: 'Booking',
          entityId: booking.id,
          oldState: transitionResult.auditPayload.oldState,
          newState: transitionResult.auditPayload.newState,
          metadata: transitionResult.auditPayload.metadata,
        },
      });

      // 3. Financial Ledger Actions
      if (targetStatus === 'PAID_HELD') {
        // Authorize hold & record double-entry entries
        const intent = await paymentProvider.createPaymentIntent({
          amountMinor: booking.ownerTotalMinor,
          currency: 'USD',
          idempotencyKey: `idem_hold_${booking.id}`,
        });

        const ledgerPlan = buildAuthorizationLedgerEntries({
          bookingId: booking.id,
          ownerTotalMinor: booking.ownerTotalMinor,
          sitterNetPayoutMinor: booking.sitterNetPayoutMinor,
          ownerServiceFeeMinor: booking.ownerServiceFeeMinor,
          sitterCommissionMinor: booking.sitterCommissionMinor,
          paymentIntentId: intent.providerIntentId,
          idempotencyPrefix: `auth_${booking.id}`,
        });

        for (const entry of ledgerPlan.entries) {
          await tx.ledgerEntry.create({
            data: {
              bookingId: booking.id,
              entryType: entry.entryType,
              debitAccount: entry.debitAccount,
              creditAccount: entry.creditAccount,
              amountMinor: entry.amountMinor,
              currency: entry.currency,
              idempotencyKey: entry.idempotencyKey,
              description: entry.description,
              referenceId: entry.referenceId,
            },
          });
        }
      } else if (targetStatus === 'PAYOUT_RELEASED') {
        // Release funds to sitter's Stripe Connect Express account
        const payout = await paymentProvider.releasePayout({
          destinationAccountId: booking.sitter.stripeConnectAccountId || 'acct_mock_express',
          amountMinor: booking.sitterNetPayoutMinor,
          currency: 'USD',
          bookingId: booking.id,
          idempotencyKey: `idem_payout_${booking.id}`,
        });

        const payoutPlan = buildPayoutLedgerEntries({
          bookingId: booking.id,
          sitterNetPayoutMinor: booking.sitterNetPayoutMinor,
          providerPayoutId: payout.providerPayoutId,
          idempotencyPrefix: `po_${booking.id}`,
        });

        for (const entry of payoutPlan.entries) {
          await tx.ledgerEntry.create({
            data: {
              bookingId: booking.id,
              entryType: entry.entryType,
              debitAccount: entry.debitAccount,
              creditAccount: entry.creditAccount,
              amountMinor: entry.amountMinor,
              currency: entry.currency,
              idempotencyKey: entry.idempotencyKey,
              description: entry.description,
              referenceId: entry.referenceId,
            },
          });
        }
      } else if (targetStatus === 'CANCELLED_BY_OWNER' || targetStatus === 'CANCELLED_BY_SITTER') {
        // Calculate refund
        const refundCalc = calculateCancellationRefund({
          policy: booking.cancellationPolicy,
          cancelledBy: targetStatus === 'CANCELLED_BY_OWNER' ? 'OWNER' : 'SITTER',
          bookingStartDate: booking.startDate,
          subtotalMinor: booking.subtotalMinor,
          ownerServiceFeeMinor: booking.ownerServiceFeeMinor,
          ownerTotalPaidMinor: booking.ownerTotalMinor,
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { cancellationRefundMinor: refundCalc.refundAmountMinor },
        });

        if (refundCalc.refundAmountMinor > 0) {
          const refundPlan = buildRefundLedgerEntries({
            bookingId: booking.id,
            refundAmountMinor: refundCalc.refundAmountMinor,
            sitterDeductionMinor: refundCalc.refundAmountMinor - refundCalc.platformFeeRetainedMinor,
            platformFeeRefundMinor: refundCalc.platformFeeRetainedMinor === 0 ? booking.ownerServiceFeeMinor : 0,
            providerRefundId: `re_mock_cancel_${booking.id}`,
            idempotencyPrefix: `cancel_${booking.id}`,
          });

          for (const entry of refundPlan.entries) {
            await tx.ledgerEntry.create({
              data: {
                bookingId: booking.id,
                entryType: entry.entryType,
                debitAccount: entry.debitAccount,
                creditAccount: entry.creditAccount,
                amountMinor: entry.amountMinor,
                currency: entry.currency,
                idempotencyKey: entry.idempotencyKey,
                description: entry.description,
                referenceId: entry.referenceId,
              },
            });
          }
        }
      }

      return updatedBooking;
    });

    return NextResponse.json({
      success: true,
      bookingId: updated.id,
      previousStatus: transitionResult.previousStatus,
      currentStatus: updated.status,
    });
  } catch (error: any) {
    console.error('Error in booking transition:', error);
    return NextResponse.json(
      { error: error.message || 'State transition failed' },
      { status: error.name === 'IllegalStateTransitionError' || error.name === 'UnauthorizedTransitionError' ? 400 : 500 }
    );
  }
}
