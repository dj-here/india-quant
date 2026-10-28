# ADR 0002: Booking State Machine and Double-Entry Financial Ledger

## Status
Accepted

## Context
Pet sitting transactions involve multi-step lifecycles: owner requests, sitter approvals, payment authorizations, stays, updates, completions, disputes, cancellations, and payouts. Ad-hoc boolean status flags (`isPaid`, `isAccepted`, `isCancelled`) inevitably produce illegal state combinations, double charges, or premature payouts. Furthermore, platforms taking commissions must maintain auditable accounting where platform revenue, sitter payables, and customer refunds reconcile to the penny.

## Decision
1. **Explicit Booking State Machine**:
   - States: `DRAFT` -> `REQUESTED` -> `ACCEPTED` / `DECLINED` / `EXPIRED` -> `PAID_HELD` -> `IN_PROGRESS` -> `COMPLETED` -> `PAYOUT_RELEASED`.
   - Side branches: `CANCELLED_BY_OWNER`, `CANCELLED_BY_SITTER`, `DISPUTED`, `REFUNDED`.
   - All state transitions are strictly governed by a centralized transition engine. Any invalid transition throws immediately.
   - Every state transition generates an immutable `AuditLog` record containing before/after snapshots, actor ID, and IP address.

2. **Integer Minor Unit Currency Representation**:
   - Floating-point numbers are strictly forbidden for financial values. All currency values are stored as integers representing minor currency units (e.g. cents in USD: $45.00 = `4500`).

3. **Double-Entry Style Ledger (`LedgerEntry`)**:
   - For every booking payment event, balanced ledger records are generated (e.g., Debit `STRIPE_CLEARING`, Credit `OWNER_SERVICE_FEE` + `SITTER_PAYABLE`).
   - Sitter payouts debit `SITTER_PAYABLE` and credit `SITTER_PAYOUT_TRANSFER`.
   - A nightly reconciliation BullMQ job verifies that `Sum(Debits) == Sum(Credits)` across all accounts, alerting if any drift occurs.

## Consequences
- Guaranteed auditability and mathematical reconciliation.
- Complete protection against race conditions and invalid transitions.
