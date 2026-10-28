import { describe, it, expect } from 'vitest';
import {
  MockPaymentProvider,
  buildAuthorizationLedgerEntries,
  buildPayoutLedgerEntries,
  buildRefundLedgerEntries,
  reconcileLedgerEntries,
} from './index.js';

describe('Payment Provider & Double-Entry Ledger Engine', () => {
  const provider = new MockPaymentProvider();

  describe('MockPaymentProvider', () => {
    it('creates idempotent payment intents with client secrets', async () => {
      const intent = await provider.createPaymentIntent({
        amountMinor: 16050,
        currency: 'USD',
        idempotencyKey: 'idem_pi_123',
      });

      expect(intent.providerIntentId).toMatch(/^pi_mock_/);
      expect(intent.clientSecret).toContain('_secret_mock_sec');
      expect(intent.amountMinor).toBe(16050);
      expect(intent.status).toBe('REQUIRES_CAPTURE');
    });

    it('captures authorized holds', async () => {
      const capture = await provider.captureHold('pi_mock_123', 'idem_cap_123');
      expect(capture.status).toBe('SUCCEEDED');
      expect(capture.providerChargeId).toContain('ch_mock_pi_mock_123');
    });

    it('releases payouts with idempotency keys', async () => {
      const payout = await provider.releasePayout({
        destinationAccountId: 'acct_stripe_express_sitter_1',
        amountMinor: 13200,
        currency: 'USD',
        bookingId: 'book_999',
        idempotencyKey: 'idem_po_123',
      });

      expect(payout.status).toBe('PAID');
      expect(payout.amountMinor).toBe(13200);
      expect(payout.destinationAccountId).toBe('acct_stripe_express_sitter_1');
    });

    it('processes refunds with idempotency keys', async () => {
      const refund = await provider.refundPayment({
        paymentIntentId: 'pi_mock_123',
        amountMinor: 16050,
        reason: 'Customer cancelled prior to cutoff',
        idempotencyKey: 'idem_ref_123',
      });

      expect(refund.status).toBe('SUCCEEDED');
      expect(refund.amountMinor).toBe(16050);
    });

    it('verifies valid webhook signatures and rejects invalid ones', () => {
      const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
      const validEvt = provider.verifyWebhookSignature(payload, 'valid_sig_xyz', 'whsec_secret');
      expect(validEvt.id).toBe('evt_123');
      expect(validEvt.type).toBe('payment_intent.succeeded');

      expect(() => provider.verifyWebhookSignature(payload, '', 'whsec_secret')).toThrow(
        'Invalid webhook signature verification'
      );
      expect(() => provider.verifyWebhookSignature(payload, 'invalid_sig', 'whsec_secret')).toThrow(
        'Invalid webhook signature verification'
      );
    });
  });

  describe('Double-Entry Ledger Engine', () => {
    it('creates perfectly balanced authorization ledger entries where Debits === Credits', () => {
      // Owner paid $160.50 (16050 cents)
      // Sitter net: $132.00 (13200 cents)
      // Owner fee (7%): $10.50 (1050 cents)
      // Sitter commission (12%): $18.00 (1800 cents)
      // Total platform revenue: 1050 + 1800 = 2850 cents ($28.50)
      // 13200 + 2850 = 16050 cents. Perfectly balanced!
      const plan = buildAuthorizationLedgerEntries({
        bookingId: 'book_abc_1',
        ownerTotalMinor: 16050,
        sitterNetPayoutMinor: 13200,
        ownerServiceFeeMinor: 1050,
        sitterCommissionMinor: 1800,
        paymentIntentId: 'pi_mock_abc',
        idempotencyPrefix: 'idem_auth_abc',
      });

      expect(plan.isBalanced).toBe(true);
      expect(plan.totalDebitsMinor).toBe(16050);
      expect(plan.totalCreditsMinor).toBe(16050);
      expect(plan.entries).toHaveLength(3);

      const accountsCheck = reconcileLedgerEntries(plan.entries);
      expect(accountsCheck.isBalanced).toBe(true);
      expect(accountsCheck.driftMinor).toBe(0);
      expect(accountsCheck.accountBalances['STRIPE_CLEARING']).toBe(16050); // Inflow
      expect(accountsCheck.accountBalances['SITTER_PAYABLE']).toBe(-13200); // Liability
      expect(accountsCheck.accountBalances['PLATFORM_REVENUE']).toBe(-2850); // Equity/Revenue
    });

    it('creates balanced payout ledger entries', () => {
      const plan = buildPayoutLedgerEntries({
        bookingId: 'book_abc_1',
        sitterNetPayoutMinor: 13200,
        providerPayoutId: 'po_mock_123',
        idempotencyPrefix: 'idem_po_abc',
      });

      expect(plan.isBalanced).toBe(true);
      expect(plan.totalDebitsMinor).toBe(13200);
      expect(plan.totalCreditsMinor).toBe(13200);

      const accountsCheck = reconcileLedgerEntries(plan.entries);
      expect(accountsCheck.isBalanced).toBe(true);
      expect(accountsCheck.driftMinor).toBe(0);
      expect(accountsCheck.accountBalances['SITTER_PAYABLE']).toBe(13200); // Liability cleared
      expect(accountsCheck.accountBalances['STRIPE_CLEARING']).toBe(-13200); // Outflow
    });

    it('creates balanced refund ledger entries for sitter and platform fee shares', () => {
      const plan = buildRefundLedgerEntries({
        bookingId: 'book_abc_1',
        refundAmountMinor: 16050,
        sitterDeductionMinor: 15000,
        platformFeeRefundMinor: 1050,
        providerRefundId: 're_mock_123',
        idempotencyPrefix: 'idem_ref_abc',
      });

      expect(plan.isBalanced).toBe(true);
      expect(plan.totalDebitsMinor).toBe(16050);
      expect(plan.totalCreditsMinor).toBe(16050);
      expect(plan.entries).toHaveLength(2);
    });

    it('reconciles multi-transaction booking lifecycle with 0 drift', () => {
      const authPlan = buildAuthorizationLedgerEntries({
        bookingId: 'book_full_life',
        ownerTotalMinor: 20000,
        sitterNetPayoutMinor: 16000,
        ownerServiceFeeMinor: 1600,
        sitterCommissionMinor: 2400,
        paymentIntentId: 'pi_full',
        idempotencyPrefix: 'auth',
      });

      const payoutPlan = buildPayoutLedgerEntries({
        bookingId: 'book_full_life',
        sitterNetPayoutMinor: 16000,
        providerPayoutId: 'po_full',
        idempotencyPrefix: 'po',
      });

      const allEntries = [...authPlan.entries, ...payoutPlan.entries];
      const recon = reconcileLedgerEntries(allEntries);

      expect(recon.isBalanced).toBe(true);
      expect(recon.driftMinor).toBe(0);

      // Sitter liability is completely cleared: +16000 debit minus 16000 credit = 0
      expect(recon.accountBalances['SITTER_PAYABLE']).toBe(0);
      // Net stripe clearing remaining is platform earnings: 20000 in minus 16000 paid out = 4000
      expect(recon.accountBalances['STRIPE_CLEARING']).toBe(4000);
      // Platform earned exactly 4000
      expect(recon.accountBalances['PLATFORM_REVENUE']).toBe(-4000);
    });
  });
});
