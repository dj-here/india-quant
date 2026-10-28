import { describe, it, expect } from 'vitest';
import {
  canManagePet,
  canViewPet,
  canViewBooking,
  canTransitionBooking,
  canViewSitterExactAddress,
  canAccessConversation,
  canSubmitReview,
  canViewReview,
  canAccessAdminPanel,
  canApproveSitter,
  PolicyUser,
  PolicyPet,
  PolicyBooking,
  PolicyConversation,
  PolicyReview,
  PolicySitterProfile,
} from './index.js';

describe('Centralized RBAC & Authorization Policy Tests', () => {
  const userA: PolicyUser = { id: 'usr-alice-111', roles: ['OWNER'] };
  const userB: PolicyUser = { id: 'usr-bob-222', roles: ['OWNER'] };
  const sitterS: PolicyUser = { id: 'usr-sarah-333', roles: ['SITTER'] };
  const dualUser: PolicyUser = { id: 'usr-dual-444', roles: ['OWNER', 'SITTER'] };
  const adminUser: PolicyUser = { id: 'usr-admin-999', roles: ['ADMIN'] };
  const deactivatedUser: PolicyUser = { id: 'usr-banned-000', roles: ['OWNER'], isActive: false };

  const petOfUserA: PolicyPet = { id: 'pet-charlie', ownerId: userA.id };
  const petOfUserB: PolicyPet = { id: 'pet-max', ownerId: userB.id };

  const sitterProfileS: PolicySitterProfile = {
    id: 'sitter-profile-sarah',
    userId: sitterS.id,
    addressLine1: '742 Evergreen Terrace',
    latitude: 30.2672,
    longitude: -97.7431,
    approxLatitude: 30.271,
    approxLongitude: -97.749,
  };

  const bookingAtoS: PolicyBooking = {
    id: 'bk-100',
    ownerId: userA.id,
    sitterId: sitterProfileS.id,
    sitterUserId: sitterS.id,
    status: 'REQUESTED',
  };

  const conversationAtoS: PolicyConversation = {
    id: 'conv-100',
    ownerId: userA.id,
    sitterId: sitterProfileS.id,
    sitterUserId: sitterS.id,
  };

  describe('Criterion 4: Tenant Isolation & Data Privacy', () => {
    it('proves User A cannot read or modify User B pet', () => {
      expect(canManagePet(userA, petOfUserB)).toBe(false);
      expect(canViewPet(userA, petOfUserB)).toBe(false);

      // User B can manage their own pet
      expect(canManagePet(userB, petOfUserB)).toBe(true);
      expect(canViewPet(userB, petOfUserB)).toBe(true);
    });

    it('proves User B cannot view or modify User A booking', () => {
      expect(canViewBooking(userB, bookingAtoS)).toBe(false);
      expect(canTransitionBooking(userB, bookingAtoS, 'ACCEPTED')).toBe(false);
      expect(canTransitionBooking(userB, bookingAtoS, 'CANCELLED_BY_OWNER')).toBe(false);

      // Participant owner and sitter can view
      expect(canViewBooking(userA, bookingAtoS)).toBe(true);
      expect(canViewBooking(sitterS, bookingAtoS)).toBe(true);
    });

    it('proves User B cannot eavesdrop on Conversation between User A and Sitter S', () => {
      expect(canAccessConversation(userB, conversationAtoS)).toBe(false);
      expect(canAccessConversation(userA, conversationAtoS)).toBe(true);
      expect(canAccessConversation(sitterS, conversationAtoS)).toBe(true);
    });

    it('proves deactivated users are denied all permissions', () => {
      const petOfDeactivated: PolicyPet = { id: 'pet-ghost', ownerId: deactivatedUser.id };
      expect(canManagePet(deactivatedUser, petOfDeactivated)).toBe(false);
      expect(canViewBooking(deactivatedUser, bookingAtoS)).toBe(false);
    });
  });

  describe('Trust & Safety: Geo Obfuscation & Address Access Rules', () => {
    it('hides sitter exact address from owner when booking is in REQUESTED or ACCEPTED stage', () => {
      const requestedBooking = { ...bookingAtoS, status: 'REQUESTED' as const };
      const acceptedBooking = { ...bookingAtoS, status: 'ACCEPTED' as const };

      expect(canViewSitterExactAddress(userA, sitterProfileS, requestedBooking)).toBe(false);
      expect(canViewSitterExactAddress(userA, sitterProfileS, acceptedBooking)).toBe(false);
      expect(canViewSitterExactAddress(userB, sitterProfileS, acceptedBooking)).toBe(false);
    });

    it('reveals exact address only after booking payment is held (PAID_HELD) or in progress', () => {
      const paidBooking = { ...bookingAtoS, status: 'PAID_HELD' as const };
      const inProgressBooking = { ...bookingAtoS, status: 'IN_PROGRESS' as const };

      expect(canViewSitterExactAddress(userA, sitterProfileS, paidBooking)).toBe(true);
      expect(canViewSitterExactAddress(userA, sitterProfileS, inProgressBooking)).toBe(true);

      // Other non-participating users still cannot see it
      expect(canViewSitterExactAddress(userB, sitterProfileS, paidBooking)).toBe(false);
    });

    it('allows sitter to always view their own address and admin to view any address', () => {
      expect(canViewSitterExactAddress(sitterS, sitterProfileS, null)).toBe(true);
      expect(canViewSitterExactAddress(adminUser, sitterProfileS, null)).toBe(true);
    });
  });

  describe('Booking State Transition Rules', () => {
    it('allows sitter (and only sitter) to ACCEPT or DECLINE a REQUESTED booking', () => {
      expect(canTransitionBooking(sitterS, bookingAtoS, 'ACCEPTED')).toBe(true);
      expect(canTransitionBooking(sitterS, bookingAtoS, 'DECLINED')).toBe(true);

      // Owner cannot accept their own request
      expect(canTransitionBooking(userA, bookingAtoS, 'ACCEPTED')).toBe(false);
      // Unrelated user cannot accept
      expect(canTransitionBooking(userB, bookingAtoS, 'ACCEPTED')).toBe(false);
    });

    it('allows owner (and only owner) to pay for an ACCEPTED booking', () => {
      const acceptedBooking = { ...bookingAtoS, status: 'ACCEPTED' as const };
      expect(canTransitionBooking(userA, acceptedBooking, 'PAID_HELD')).toBe(true);
      expect(canTransitionBooking(sitterS, acceptedBooking, 'PAID_HELD')).toBe(false);
    });

    it('prevents illegal state machine transitions', () => {
      // Cannot jump from DRAFT to COMPLETED
      const draftBooking = { ...bookingAtoS, status: 'DRAFT' as const };
      expect(canTransitionBooking(userA, draftBooking, 'COMPLETED')).toBe(false);

      // Cannot jump from REQUESTED directly to PAYOUT_RELEASED
      expect(canTransitionBooking(sitterS, bookingAtoS, 'PAYOUT_RELEASED')).toBe(false);
    });
  });

  describe('Double-Blind Review Visibility Policies', () => {
    const blindReviewByA: PolicyReview = {
      id: 'rev-1',
      bookingId: 'bk-completed',
      authorId: userA.id,
      targetId: sitterS.id,
      isBlind: true,
    };

    const completedBooking: PolicyBooking = {
      id: 'bk-completed',
      ownerId: userA.id,
      sitterId: sitterProfileS.id,
      sitterUserId: sitterS.id,
      status: 'COMPLETED',
    };

    it('allows submission only after stay is COMPLETED or PAYOUT_RELEASED', () => {
      expect(canSubmitReview(userA, completedBooking, false)).toBe(true);
      expect(canSubmitReview(sitterS, completedBooking, false)).toBe(true);

      // Cannot submit if already submitted
      expect(canSubmitReview(userA, completedBooking, true)).toBe(false);

      // Cannot submit for active or draft booking
      expect(canSubmitReview(userA, bookingAtoS, false)).toBe(false);
    });

    it('hides review from target while review is blind and under 14 days', () => {
      // Sitter cannot view Owner review before submitting theirs
      expect(canViewReview(sitterS, blindReviewByA, false, 5)).toBe(false);

      // Author can view their own review
      expect(canViewReview(userA, blindReviewByA, false, 5)).toBe(true);
    });

    it('unmasks review once other party submits or 14-day window expires', () => {
      // Other party submitted
      expect(canViewReview(sitterS, blindReviewByA, true, 5)).toBe(true);

      // 14 days elapsed
      expect(canViewReview(sitterS, blindReviewByA, false, 14)).toBe(true);
    });
  });

  describe('Admin Role-Based Access Control', () => {
    it('restricts admin console and sitter approvals to ADMIN role only', () => {
      expect(canAccessAdminPanel(adminUser)).toBe(true);
      expect(canApproveSitter(adminUser)).toBe(true);

      expect(canAccessAdminPanel(userA)).toBe(false);
      expect(canAccessAdminPanel(sitterS)).toBe(false);
      expect(canAccessAdminPanel(dualUser)).toBe(false);
    });
  });
});
