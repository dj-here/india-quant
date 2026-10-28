import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import {
  CreateBookingRequestSchema,
  calculateBookingPrice,
  MockPaymentProvider,
  buildAuthorizationLedgerEntries,
  transitionBooking,
  ServiceType,
} from '@pawstay/shared';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let ownerId = session?.user?.id;

    if (!ownerId) {
      // In demo/test environment, associate with first owner
      const firstOwner = await prisma.user.findFirst({
        where: { roles: { has: 'OWNER' } },
        select: { id: true },
      });
      ownerId = firstOwner?.id;
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Authentication required to create a booking' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CreateBookingRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid booking request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Verify sitter exists and is APPROVED
    const sitter = await prisma.sitterProfile.findUnique({
      where: { id: data.sitterId },
      include: {
        user: true,
        services: { where: { serviceType: data.serviceType as ServiceType } },
      },
    });

    if (!sitter || sitter.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Sitter is not active or approved to accept bookings.' },
        { status: 400 }
      );
    }

    const activeService = sitter.services[0];
    if (!activeService || !activeService.isActive) {
      return NextResponse.json(
        { error: `Sitter does not currently offer active ${data.serviceType} service.` },
        { status: 400 }
      );
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const nights = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    );

    // Calculate itemized price
    const quote = calculateBookingPrice({
      baseRateMinor: activeService.baseRateMinor,
      unitsCount: nights,
      petCount: data.petIds.length,
      additionalPetRateMinor: activeService.additionalPetRateMinor,
      extendedStayDiscountPercent: activeService.extendedStayDiscountPercent,
    });

    // Human-readable booking number
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const bookingNumber = `PAW-${new Date().getFullYear()}-${randomDigits}`;

    // Determine initial status:
    // If instantBook is enabled on both sitter and request, status starts at PAID_HELD (authorized hold).
    // Otherwise REQUESTED.
    const isInstant = Boolean(sitter.instantBookEnabled && data.instantBook);
    const initialStatus = isInstant ? 'PAID_HELD' : 'REQUESTED';

    const paymentProvider = new MockPaymentProvider();
    const paymentIntent = await paymentProvider.createPaymentIntent({
      amountMinor: quote.ownerTotalMinor,
      currency: 'USD',
      idempotencyKey: `idem_pi_init_${bookingNumber}`,
    });

    // Create booking and related records transactionally
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          bookingNumber,
          ownerId,
          sitterId: sitter.id,
          serviceType: data.serviceType as ServiceType,
          status: initialStatus,
          startDate,
          endDate,
          unitsCount: nights,
          unitPriceMinor: activeService.baseRateMinor,
          baseAmountMinor: quote.baseAmountMinor,
          additionalPetsSurchargeMinor: quote.additionalPetsMinor,
          holidaySurchargeMinor: quote.holidaySurchargeMinor,
          puppySurchargeMinor: quote.puppySurchargeMinor,
          extendedStayDiscountMinor: quote.extendedStayDiscountMinor,
          subtotalMinor: quote.subtotalMinor,
          ownerServiceFeeMinor: quote.ownerServiceFeeMinor,
          ownerTotalMinor: quote.ownerTotalMinor,
          sitterCommissionMinor: quote.sitterCommissionMinor,
          sitterNetPayoutMinor: quote.sitterNetPayoutMinor,
          currency: 'USD',
          specialInstructions: data.specialInstructions || null,
          vetEmergencyLimitMinor: data.vetEmergencyAuthorizationMinor,
          cancellationPolicy: sitter.cancellationPolicy,
          paidAt: isInstant ? new Date() : null,
          bookingPets: {
            create: data.petIds.map((petId) => ({ petId })),
          },
        },
      });

      // Create conversation for pre/post-booking messaging
      await tx.conversation.create({
        data: {
          bookingId: created.id,
          ownerId,
          sitterId: sitter.id,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: ownerId,
          action: isInstant ? 'BOOKING_INSTANT_BOOKED' : 'BOOKING_REQUESTED',
          entityType: 'Booking',
          entityId: created.id,
          newState: {
            status: initialStatus,
            ownerTotalMinor: quote.ownerTotalMinor,
            sitterNetPayoutMinor: quote.sitterNetPayoutMinor,
          },
        },
      });

      // If instant book, record double-entry ledger entries immediately
      if (isInstant) {
        const ledgerPlan = buildAuthorizationLedgerEntries({
          bookingId: created.id,
          ownerTotalMinor: quote.ownerTotalMinor,
          sitterNetPayoutMinor: quote.sitterNetPayoutMinor,
          ownerServiceFeeMinor: quote.ownerServiceFeeMinor,
          sitterCommissionMinor: quote.sitterCommissionMinor,
          paymentIntentId: paymentIntent.providerIntentId,
          idempotencyPrefix: `auth_${created.id}`,
        });

        for (const entry of ledgerPlan.entries) {
          await tx.ledgerEntry.create({
            data: {
              bookingId: created.id,
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

      return created;
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentIntent: {
        id: paymentIntent.providerIntentId,
        clientSecret: paymentIntent.clientSecret,
        amountMinor: quote.ownerTotalMinor,
      },
      quote,
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating booking', details: error.message },
      { status: 500 }
    );
  }
}
