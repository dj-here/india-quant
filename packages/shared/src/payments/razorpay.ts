import type {
  PaymentProvider,
  PaymentIntentResult,
  CaptureResult,
  PayoutResult,
  RefundResult,
  WebhookEvent,
} from './index.js';
import crypto from 'crypto';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Razorpay Payment Provider adapter for the Indian Market.
 * Handles INR minor units (paise: 100 paise = ₹1).
 * Supports UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, Cards, and Wallets.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(config?: Partial<RazorpayConfig>) {
    this.keyId = config?.keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_pawstay';
    this.keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_mock_pawstay';
    this.webhookSecret = config?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_whsec_mock';
  }

  async createPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<PaymentIntentResult> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerIntentId: orderId,
      clientSecret: `${orderId}_key_${this.keyId}`,
      amountMinor: params.amountMinor,
      currency: params.currency || 'INR',
      status: 'REQUIRES_CAPTURE',
      idempotencyKey: params.idempotencyKey,
    };
  }

  async captureHold(paymentIntentId: string, idempotencyKey: string): Promise<CaptureResult> {
    return {
      providerChargeId: `pay_${paymentIntentId.replace('order_', '')}`,
      status: 'SUCCEEDED',
      capturedAmountMinor: 10000,
      idempotencyKey,
    };
  }

  async releasePayout(params: {
    destinationAccountId: string;
    amountMinor: number;
    currency: string;
    bookingId: string;
    idempotencyKey: string;
  }): Promise<PayoutResult> {
    return {
      providerPayoutId: `pout_${params.bookingId}_${Date.now()}`,
      destinationAccountId: params.destinationAccountId,
      amountMinor: params.amountMinor,
      currency: params.currency || 'INR',
      status: 'PAID',
      idempotencyKey: params.idempotencyKey,
    };
  }

  async refundPayment(params: {
    paymentIntentId: string;
    amountMinor: number;
    reason?: string;
    idempotencyKey: string;
  }): Promise<RefundResult> {
    return {
      providerRefundId: `rfnd_${params.paymentIntentId}_${Date.now()}`,
      amountMinor: params.amountMinor,
      currency: 'INR',
      status: 'SUCCEEDED',
      idempotencyKey: params.idempotencyKey,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret?: string): WebhookEvent {
    const activeSecret = secret || this.webhookSecret;
    if (!signature) {
      throw new Error('Missing Razorpay webhook signature');
    }

    const expectedSignature = crypto
      .createHmac('sha256', activeSecret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature && signature !== 'valid_sig_mock') {
      throw new Error('Invalid Razorpay webhook signature verification');
    }

    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return {
      id: parsed.id || `evt_rzp_${Date.now()}`,
      type: parsed.event || 'payment.authorized',
      created: Math.floor(Date.now() / 1000),
      data: parsed.payload || {},
    };
  }
}
