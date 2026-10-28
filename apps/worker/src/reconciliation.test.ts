import { describe, it, expect, vi } from 'vitest';
import { runLedgerReconciliation } from './reconciliation.js';
import { prisma } from '@pawstay/db';

vi.mock('@pawstay/db', () => ({
  prisma: {
    ledgerEntry: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('Nightly Ledger Reconciliation Worker', () => {
  it('detects 0 drift when balanced ledger entries are processed', async () => {
    const mockEntries = [
      {
        bookingId: 'book_1',
        debitAccount: 'STRIPE_CLEARING',
        creditAccount: 'SITTER_PAYABLE',
        amountMinor: 10000,
      },
      {
        bookingId: 'book_1',
        debitAccount: 'STRIPE_CLEARING',
        creditAccount: 'PLATFORM_REVENUE',
        amountMinor: 2000,
      },
    ];

    vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValueOnce(mockEntries as any);
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({ id: 'audit_recon_1' } as any);

    const report = await runLedgerReconciliation();

    expect(report.isBalanced).toBe(true);
    expect(report.driftMinor).toBe(0);
    expect(report.totalDebitsMinor).toBe(12000);
    expect(report.totalCreditsMinor).toBe(12000);
    expect(report.bookingsWithDrift).toHaveLength(0);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LEDGER_RECONCILIATION_BALANCED',
        }),
      })
    );
  });
});
