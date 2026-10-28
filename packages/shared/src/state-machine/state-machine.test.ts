import { describe, it, expect } from 'vitest';
import {
  transitionBooking,
  isValidBookingTransition,
  getAllowedNextBookingStates,
  assertActorCanTransition,
  IllegalStateTransitionError,
  UnauthorizedTransitionError,
  BookingStateContext,
  TransitionActor,
} from './index.js';

describe('Booking State Machine Service', () => {
  const mockBooking: BookingStateContext = {
    id: 'booking_test_123',
    status: 'DRAFT',
    ownerId: 'user_owner_1',
    sitterUserId: 'user_sitter_2',
  };

  const ownerActor: TransitionActor = { id: 'user_owner_1', roles: ['OWNER'] };
  const sitterActor: TransitionActor = { id: 'user_sitter_2', roles: ['SITTER'] };
  const adminActor: TransitionActor = { id: 'user_admin_3', roles: ['ADMIN'] };
  const strangerActor: TransitionActor = { id: 'user_stranger_4', roles: ['OWNER'] };
  const systemActor: TransitionActor = { id: 'system', isSystem: true };

  describe('Core Happy Path Lifecycle', () => {
    it('executes full linear lifecycle: DRAFT -> REQUESTED -> ACCEPTED -> PAID_HELD -> IN_PROGRESS -> COMPLETED -> PAYOUT_RELEASED', () => {
      let currentBooking = { ...mockBooking };

      // 1. DRAFT -> REQUESTED (by Owner)
      const res1 = transitionBooking(currentBooking, 'REQUESTED', ownerActor);
      expect(res1.previousStatus).toBe('DRAFT');
      expect(res1.currentStatus).toBe('REQUESTED');
      expect(res1.auditPayload.action).toBe('BOOKING_REQUESTED');
      expect(res1.auditPayload.userId).toBe('user_owner_1');
      currentBooking.status = 'REQUESTED';

      // 2. REQUESTED -> ACCEPTED (by Sitter)
      const res2 = transitionBooking(currentBooking, 'ACCEPTED', sitterActor);
      expect(res2.previousStatus).toBe('REQUESTED');
      expect(res2.currentStatus).toBe('ACCEPTED');
      expect(res2.auditPayload.action).toBe('BOOKING_ACCEPTED');
      currentBooking.status = 'ACCEPTED';

      // 3. ACCEPTED -> PAID_HELD (by Owner upon payment)
      const res3 = transitionBooking(currentBooking, 'PAID_HELD', ownerActor);
      expect(res3.previousStatus).toBe('ACCEPTED');
      expect(res3.currentStatus).toBe('PAID_HELD');
      currentBooking.status = 'PAID_HELD';

      // 4. PAID_HELD -> IN_PROGRESS (by Sitter/Owner at check-in)
      const res4 = transitionBooking(currentBooking, 'IN_PROGRESS', sitterActor);
      expect(res4.previousStatus).toBe('PAID_HELD');
      expect(res4.currentStatus).toBe('IN_PROGRESS');
      currentBooking.status = 'IN_PROGRESS';

      // 5. IN_PROGRESS -> COMPLETED (by Sitter at checkout)
      const res5 = transitionBooking(currentBooking, 'COMPLETED', sitterActor);
      expect(res5.previousStatus).toBe('IN_PROGRESS');
      expect(res5.currentStatus).toBe('COMPLETED');
      currentBooking.status = 'COMPLETED';

      // 6. COMPLETED -> PAYOUT_RELEASED (by automated Escrow release job after 24h)
      const res6 = transitionBooking(currentBooking, 'PAYOUT_RELEASED', systemActor);
      expect(res6.previousStatus).toBe('COMPLETED');
      expect(res6.currentStatus).toBe('PAYOUT_RELEASED');
      expect(res6.auditPayload.userId).toBeNull(); // System automation
    });
  });

  describe('Side Branches & Expirations', () => {
    it('handles REQUESTED -> DECLINED by sitter', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      const res = transitionBooking(booking, 'DECLINED', sitterActor, { reason: 'Fully booked' });
      expect(res.currentStatus).toBe('DECLINED');
      expect(res.auditPayload.newState.reason).toBe('Fully booked');
    });

    it('handles REQUESTED -> EXPIRED by system worker', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      const res = transitionBooking(booking, 'EXPIRED', systemActor);
      expect(res.currentStatus).toBe('EXPIRED');
    });

    it('handles REQUESTED -> CANCELLED_BY_OWNER', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      const res = transitionBooking(booking, 'CANCELLED_BY_OWNER', ownerActor);
      expect(res.currentStatus).toBe('CANCELLED_BY_OWNER');
    });

    it('handles PAID_HELD -> CANCELLED_BY_OWNER -> REFUNDED', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'PAID_HELD' };
      const resCancel = transitionBooking(booking, 'CANCELLED_BY_OWNER', ownerActor);
      expect(resCancel.currentStatus).toBe('CANCELLED_BY_OWNER');

      const cancelledBooking: BookingStateContext = { ...mockBooking, status: 'CANCELLED_BY_OWNER' };
      const resRefund = transitionBooking(cancelledBooking, 'REFUNDED', adminActor);
      expect(resRefund.currentStatus).toBe('REFUNDED');
    });

    it('handles PAID_HELD -> CANCELLED_BY_SITTER -> REFUNDED', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'PAID_HELD' };
      const resCancel = transitionBooking(booking, 'CANCELLED_BY_SITTER', sitterActor);
      expect(resCancel.currentStatus).toBe('CANCELLED_BY_SITTER');

      const cancelledBooking: BookingStateContext = { ...mockBooking, status: 'CANCELLED_BY_SITTER' };
      const resRefund = transitionBooking(cancelledBooking, 'REFUNDED', systemActor);
      expect(resRefund.currentStatus).toBe('REFUNDED');
    });

    it('handles IN_PROGRESS -> DISPUTED -> REFUNDED', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'IN_PROGRESS' };
      const resDispute = transitionBooking(booking, 'DISPUTED', ownerActor, { reason: 'Pet was neglected' });
      expect(resDispute.currentStatus).toBe('DISPUTED');

      const disputedBooking: BookingStateContext = { ...mockBooking, status: 'DISPUTED' };
      const resRefund = transitionBooking(disputedBooking, 'REFUNDED', adminActor);
      expect(resRefund.currentStatus).toBe('REFUNDED');
    });

    it('handles COMPLETED -> DISPUTED -> PAYOUT_RELEASED', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'COMPLETED' };
      const resDispute = transitionBooking(booking, 'DISPUTED', sitterActor);
      expect(resDispute.currentStatus).toBe('DISPUTED');

      const disputedBooking: BookingStateContext = { ...mockBooking, status: 'DISPUTED' };
      const resRelease = transitionBooking(disputedBooking, 'PAYOUT_RELEASED', adminActor);
      expect(resRelease.currentStatus).toBe('PAYOUT_RELEASED');
    });
  });

  describe('Illegal Transition Rejections (Must Throw)', () => {
    it('throws IllegalStateTransitionError for skipping states (DRAFT -> COMPLETED)', () => {
      expect(() => transitionBooking(mockBooking, 'COMPLETED', adminActor)).toThrow(
        IllegalStateTransitionError
      );
    });

    it('throws IllegalStateTransitionError when transitioning out of terminal states (REFUNDED -> IN_PROGRESS)', () => {
      const refundedBooking: BookingStateContext = { ...mockBooking, status: 'REFUNDED' };
      expect(() => transitionBooking(refundedBooking, 'IN_PROGRESS', adminActor)).toThrow(
        IllegalStateTransitionError
      );
    });

    it('throws IllegalStateTransitionError when transitioning out of PAYOUT_RELEASED', () => {
      const releasedBooking: BookingStateContext = { ...mockBooking, status: 'PAYOUT_RELEASED' };
      expect(() => transitionBooking(releasedBooking, 'DRAFT', adminActor)).toThrow(
        IllegalStateTransitionError
      );
    });

    it('throws IllegalStateTransitionError when transitioning DECLINED -> ACCEPTED', () => {
      const declinedBooking: BookingStateContext = { ...mockBooking, status: 'DECLINED' };
      expect(() => transitionBooking(declinedBooking, 'ACCEPTED', sitterActor)).toThrow(
        IllegalStateTransitionError
      );
    });
  });

  describe('Unauthorized Actor Rejections', () => {
    it('throws UnauthorizedTransitionError when stranger attempts to transition', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      expect(() => transitionBooking(booking, 'ACCEPTED', strangerActor)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when owner attempts to ACCEPT a booking', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      expect(() => transitionBooking(booking, 'ACCEPTED', ownerActor)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when sitter attempts to PAY_HELD a booking', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'ACCEPTED' };
      expect(() => transitionBooking(booking, 'PAID_HELD', sitterActor)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when non-admin/non-system attempts REFUNDED', () => {
      const booking: BookingStateContext = { ...mockBooking, status: 'CANCELLED_BY_OWNER' };
      expect(() => transitionBooking(booking, 'REFUNDED', ownerActor)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when human actor attempts system-only states (EXPIRED, PAYOUT_RELEASED)', () => {
      const requestedBooking: BookingStateContext = { ...mockBooking, status: 'REQUESTED' };
      expect(() => transitionBooking(requestedBooking, 'EXPIRED', ownerActor)).toThrow(
        UnauthorizedTransitionError
      );

      const completedBooking: BookingStateContext = { ...mockBooking, status: 'COMPLETED' };
      expect(() => transitionBooking(completedBooking, 'PAYOUT_RELEASED', sitterActor)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when target status is unrecognized', () => {
      expect(() => assertActorCanTransition(ownerActor, mockBooking, 'NON_EXISTENT' as any)).toThrow(
        UnauthorizedTransitionError
      );
    });

    it('throws UnauthorizedTransitionError when stranger attempts to dispute or check-in', () => {
      const inProgressBooking: BookingStateContext = { ...mockBooking, status: 'IN_PROGRESS' };
      expect(() => transitionBooking(inProgressBooking, 'DISPUTED', strangerActor)).toThrow(
        UnauthorizedTransitionError
      );

      const paidBooking: BookingStateContext = { ...mockBooking, status: 'PAID_HELD' };
      expect(() => transitionBooking(paidBooking, 'IN_PROGRESS', strangerActor)).toThrow(
        UnauthorizedTransitionError
      );
    });
  });

  describe('Helper Functions', () => {
    it('isValidBookingTransition accurately reports legal and illegal moves', () => {
      expect(isValidBookingTransition('DRAFT', 'REQUESTED')).toBe(true);
      expect(isValidBookingTransition('REQUESTED', 'ACCEPTED')).toBe(true);
      expect(isValidBookingTransition('DRAFT', 'PAID_HELD')).toBe(false);
      expect(isValidBookingTransition('REFUNDED', 'DRAFT')).toBe(false);
    });

    it('getAllowedNextBookingStates returns copy of valid transitions', () => {
      const allowed = getAllowedNextBookingStates('REQUESTED');
      expect(allowed).toEqual(['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED_BY_OWNER']);
    });
  });
});
