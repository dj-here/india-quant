import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pawstay/db';
import { MockPaymentProvider } from '@pawstay/shared';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') || 'valid_test_signature';

    const provider = new MockPaymentProvider();
    const event = provider.verifyWebhookSignature(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');

    // Replay safety: check if event was already recorded in AuditLog
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: 'STRIPE_WEBHOOK_RECEIVED',
        metadata: { path: ['eventId'], equals: event.id },
      },
    });

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Process event
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data?.object;
      const bookingId = intent?.metadata?.bookingId;
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'PAID_HELD',
            paidAt: new Date(),
          },
        });
      }
    }

    // Record event in audit trail
    await prisma.auditLog.create({
      data: {
        action: 'STRIPE_WEBHOOK_RECEIVED',
        entityType: 'WebhookEvent',
        entityId: event.id,
        metadata: {
          eventId: event.id,
          type: event.type,
          data: event.data,
        },
      },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
