/**
 * Payment Provider Abstraction, Mock Implementation, and Double-Entry Ledger Engine
 */

export interface PaymentIntentResult {
  providerIntentId: string;
  clientSecret: string;
  amountMinor: number;
  currency: string;
  status: 'REQUIRES_PAYMENT_METHOD' | 'REQUIRES_CONFIRMATION' | 'REQUIRES_CAPTURE' | 'SUCCEEDED' | 'CANCELED';
  idempotencyKey: string;
}

export interface CaptureResult {
  providerChargeId: string;
  status: 'SUCCEEDED' | 'FAILED';
  capturedAmountMinor: number;
  idempotencyKey: string;
}

export interface PayoutResult {
  providerPayoutId: string;
  destinationAccountId: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  idempotencyKey: string;
}

export interface RefundResult {
  providerRefundId: string;
  amountMinor: number;
  currency: string;
  status: 'SUCCEEDED' | 'FAILED';
  idempotencyKey: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: Record<string, any>;
}

export interface PaymentProvider {
  createPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<PaymentIntentResult>;

  captureHold(paymentIntentId: string, idempotencyKey: string): Promise<CaptureResult>;

  releasePayout(params: {
    destinationAccountId: string;
    amountMinor: number;
    currency: string;
    bookingId: string;
    idempotencyKey: string;
  }): Promise<PayoutResult>;

  refundPayment(params: {
    paymentIntentId: string;
    amountMinor: number;
    reason?: string;
    idempotencyKey: string;
  }): Promise<RefundResult>;

  verifyWebhookSignature(payload: string, signature: string, secret: string): WebhookEvent;
}

/**
 * Deterministic Mock Payment Provider for dev, test, and container environments.
 */
export class MockPaymentProvider implements PaymentProvider {
  private executedIdempotencyKeys = new Set<string>();

  async createPaymentIntent(params: {
    amountMinor: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<PaymentIntentResult> {
    this.executedIdempotencyKeys.add(params.idempotencyKey);
    const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      providerIntentId: mockId,
      clientSecret: `${mockId}_secret_mock_sec`,
      amountMinor: params.amountMinor,
      currency: params.currency || 'USD',
      status: 'REQUIRES_CAPTURE', // Authorized hold ready for stay start
      idempotencyKey: params.idempotencyKey,
    };
  }

  async captureHold(paymentIntentId: string, idempotencyKey: string): Promise<CaptureResult> {
    this.executedIdempotencyKeys.add(idempotencyKey);
    return {
      providerChargeId: `ch_mock_${paymentIntentId}`,
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
    this.executedIdempotencyKeys.add(params.idempotencyKey);
    return {
      providerPayoutId: `po_mock_${params.bookingId}_${Date.now()}`,
      destinationAccountId: params.destinationAccountId,
      amountMinor: params.amountMinor,
      currency: params.currency || 'USD',
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
    this.executedIdempotencyKeys.add(params.idempotencyKey);
    return {
      providerRefundId: `re_mock_${params.paymentIntentId}_${Date.now()}`,
      amountMinor: params.amountMinor,
      currency: 'USD',
      status: 'SUCCEEDED',
      idempotencyKey: params.idempotencyKey,
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): WebhookEvent {
    if (!signature || signature === 'invalid_sig') {
      throw new Error('Invalid webhook signature verification');
    }
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return {
      id: parsed.id || `evt_mock_${Date.now()}`,
      type: parsed.type || 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: parsed.data || {},
    };
  }
}

// -----------------------------------------------------------------------------
// Double-Entry Ledger Engine
// -----------------------------------------------------------------------------

export type LedgerAccount = 'STRIPE_CLEARING' | 'PLATFORM_REVENUE' | 'SITTER_PAYABLE' | 'OWNER_REFUND';

export interface LedgerTransactionEntry {
  bookingId: string;
  entryType: 'CHARGE' | 'OWNER_SERVICE_FEE' | 'SITTER_PAYABLE' | 'SITTER_COMMISSION' | 'REFUND_OWNER' | 'PAYOUT_SITTER';
  debitAccount: LedgerAccount;
  creditAccount: LedgerAccount;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  description: string;
  referenceId?: string;
}

export interface BookingLedgerPlan {
  bookingId: string;
  totalDebitsMinor: number;
  totalCreditsMinor: number;
  isBalanced: boolean;
  entries: LedgerTransactionEntry[];
}

/**
 * Builds double-entry ledger transactions when funds are held at booking authorization (PAID_HELD).
 * Reconciles:
 * Debit STRIPE_CLEARING = ownerTotalMinor
 * Credit SITTER_PAYABLE = sitterNetPayoutMinor
 * Credit PLATFORM_REVENUE = ownerServiceFeeMinor + sitterCommissionMinor
 */
export function buildAuthorizationLedgerEntries(params: {
  bookingId: string;
  ownerTotalMinor: number;
  sitterNetPayoutMinor: number;
  ownerServiceFeeMinor: number;
  sitterCommissionMinor: number;
  paymentIntentId: string;
  idempotencyPrefix: string;
}): BookingLedgerPlan {
  const {
    bookingId,
    ownerTotalMinor,
    sitterNetPayoutMinor,
    ownerServiceFeeMinor,
    sitterCommissionMinor,
    paymentIntentId,
    idempotencyPrefix,
  } = params;

  const entries: LedgerTransactionEntry[] = [
    // 1. Sitter Payable liability recognized
    {
      bookingId,
      entryType: 'SITTER_PAYABLE',
      debitAccount: 'STRIPE_CLEARING',
      creditAccount: 'SITTER_PAYABLE',
      amountMinor: sitterNetPayoutMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_sitter_payable`,
      description: `Held escrow funds allocated to sitter net payout for booking ${bookingId}`,
      referenceId: paymentIntentId,
    },
    // 2. Owner service fee revenue recognized
    {
      bookingId,
      entryType: 'OWNER_SERVICE_FEE',
      debitAccount: 'STRIPE_CLEARING',
      creditAccount: 'PLATFORM_REVENUE',
      amountMinor: ownerServiceFeeMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_owner_fee`,
      description: `Platform 7% trust & safety fee recognized for booking ${bookingId}`,
      referenceId: paymentIntentId,
    },
    // 3. Sitter commission revenue recognized
    {
      bookingId,
      entryType: 'SITTER_COMMISSION',
      debitAccount: 'STRIPE_CLEARING',
      creditAccount: 'PLATFORM_REVENUE',
      amountMinor: sitterCommissionMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_sitter_commission`,
      description: `Platform 12% commission recognized for booking ${bookingId}`,
      referenceId: paymentIntentId,
    },
  ];

  const totalDebitsMinor = entries.reduce((acc, e) => acc + e.amountMinor, 0);
  const totalCreditsMinor = entries.reduce((acc, e) => acc + e.amountMinor, 0);
  const isBalanced = totalDebitsMinor === ownerTotalMinor && totalCreditsMinor === ownerTotalMinor;

  return {
    bookingId,
    totalDebitsMinor,
    totalCreditsMinor,
    isBalanced,
    entries,
  };
}

/**
 * Builds double-entry ledger transactions when a sitter payout is released (PAYOUT_RELEASED).
 * Debit SITTER_PAYABLE = sitterNetPayoutMinor
 * Credit STRIPE_CLEARING = sitterNetPayoutMinor
 */
export function buildPayoutLedgerEntries(params: {
  bookingId: string;
  sitterNetPayoutMinor: number;
  providerPayoutId: string;
  idempotencyPrefix: string;
}): BookingLedgerPlan {
  const { bookingId, sitterNetPayoutMinor, providerPayoutId, idempotencyPrefix } = params;

  const entries: LedgerTransactionEntry[] = [
    {
      bookingId,
      entryType: 'PAYOUT_SITTER',
      debitAccount: 'SITTER_PAYABLE',
      creditAccount: 'STRIPE_CLEARING',
      amountMinor: sitterNetPayoutMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_payout_released`,
      description: `Escrow payout released to sitter account for booking ${bookingId}`,
      referenceId: providerPayoutId,
    },
  ];

  return {
    bookingId,
    totalDebitsMinor: sitterNetPayoutMinor,
    totalCreditsMinor: sitterNetPayoutMinor,
    isBalanced: true,
    entries,
  };
}

/**
 * Builds double-entry ledger transactions when a cancellation refund is executed (REFUNDED).
 */
export function buildRefundLedgerEntries(params: {
  bookingId: string;
  refundAmountMinor: number;
  sitterDeductionMinor: number;
  platformFeeRefundMinor: number;
  providerRefundId: string;
  idempotencyPrefix: string;
}): BookingLedgerPlan {
  const {
    bookingId,
    refundAmountMinor,
    sitterDeductionMinor,
    platformFeeRefundMinor,
    providerRefundId,
    idempotencyPrefix,
  } = params;

  const entries: LedgerTransactionEntry[] = [];

  if (sitterDeductionMinor > 0) {
    entries.push({
      bookingId,
      entryType: 'REFUND_OWNER',
      debitAccount: 'SITTER_PAYABLE',
      creditAccount: 'STRIPE_CLEARING',
      amountMinor: sitterDeductionMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_refund_sitter_share`,
      description: `Stay refund returned to owner from sitter escrow for booking ${bookingId}`,
      referenceId: providerRefundId,
    });
  }

  if (platformFeeRefundMinor > 0) {
    entries.push({
      bookingId,
      entryType: 'REFUND_OWNER',
      debitAccount: 'PLATFORM_REVENUE',
      creditAccount: 'STRIPE_CLEARING',
      amountMinor: platformFeeRefundMinor,
      currency: 'USD',
      idempotencyKey: `${idempotencyPrefix}_refund_platform_share`,
      description: `Platform fee refund returned to owner for booking ${bookingId}`,
      referenceId: providerRefundId,
    });
  }

  const totalDebits = entries.reduce((acc, e) => acc + e.amountMinor, 0);

  return {
    bookingId,
    totalDebitsMinor: totalDebits,
    totalCreditsMinor: totalDebits,
    isBalanced: totalDebits === refundAmountMinor,
    entries,
  };
}

/**
 * Audit and reconciliation check for any set of ledger entries.
 * Returns drift error if debits !== credits.
 */
export function reconcileLedgerEntries(entries: { debitAccount: string; creditAccount: string; amountMinor: number }[]): {
  isBalanced: boolean;
  totalDebitsMinor: number;
  totalCreditsMinor: number;
  driftMinor: number;
  accountBalances: Record<string, number>;
} {
  const accountBalances: Record<string, number> = {};

  let totalDebitsMinor = 0;
  let totalCreditsMinor = 0;

  for (const e of entries) {
    totalDebitsMinor += e.amountMinor;
    totalCreditsMinor += e.amountMinor;

    accountBalances[e.debitAccount] = (accountBalances[e.debitAccount] || 0) + e.amountMinor;
    accountBalances[e.creditAccount] = (accountBalances[e.creditAccount] || 0) - e.amountMinor;
  }

  const driftMinor = Math.abs(totalDebitsMinor - totalCreditsMinor);

  return {
    isBalanced: driftMinor === 0,
    totalDebitsMinor,
    totalCreditsMinor,
    driftMinor,
    accountBalances,
  };
}
