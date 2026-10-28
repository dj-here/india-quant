import { UserRole, BookingStatus } from '../types/index.js';
import { VALID_BOOKING_TRANSITIONS } from '../constants/index.js';

export interface PolicyUser {
  id: string;
  roles: UserRole[];
  isActive?: boolean;
}

export interface PolicyPet {
  id: string;
  ownerId: string;
  isArchived?: boolean;
}

export interface PolicyBooking {
  id: string;
  ownerId: string;
  sitterId: string; // references SitterProfile.id
  sitterUserId?: string; // userId of the sitter
  status: BookingStatus;
  completedAt?: Date | string | null;
  paidAt?: Date | string | null;
}

export interface PolicyConversation {
  id: string;
  ownerId: string;
  sitterId: string;
  sitterUserId?: string;
}

export interface PolicyMessage {
  id: string;
  conversationId: string;
  senderId: string;
}

export interface PolicyReview {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string;
  isBlind: boolean;
  revealedAt?: Date | string | null;
}

export interface PolicyDispute {
  id: string;
  bookingId: string;
  initiatorId: string;
}

export interface PolicySitterProfile {
  id: string;
  userId: string;
  addressLine1: string;
  latitude: number;
  longitude: number;
  approxLatitude: number;
  approxLongitude: number;
}

// -----------------------------------------------------------------------------
// Role Helper
// -----------------------------------------------------------------------------
export function isAdmin(user: PolicyUser | null | undefined): boolean {
  if (!user || user.isActive === false) return false;
  return user.roles.includes('ADMIN');
}

export function isSitter(user: PolicyUser | null | undefined): boolean {
  if (!user || user.isActive === false) return false;
  return user.roles.includes('SITTER');
}

export function isOwner(user: PolicyUser | null | undefined): boolean {
  if (!user || user.isActive === false) return false;
  return user.roles.includes('OWNER');
}

// -----------------------------------------------------------------------------
// Pet Authorization Policies
// -----------------------------------------------------------------------------
export function canManagePet(user: PolicyUser | null | undefined, pet: PolicyPet): boolean {
  if (!user || user.isActive === false) return false;
  if (isAdmin(user)) return true;
  return pet.ownerId === user.id;
}

export function canViewPet(
  user: PolicyUser | null | undefined,
  pet: PolicyPet,
  activeBookingWithSitter?: boolean
): boolean {
  if (!user || user.isActive === false) return false;
  if (isAdmin(user)) return true;
  if (pet.ownerId === user.id) return true;
  // Sitter can view pet only if assigned in an active booking inquiry or stay
  return activeBookingWithSitter === true;
}

// -----------------------------------------------------------------------------
// Booking Authorization Policies
// -----------------------------------------------------------------------------
export function canViewBooking(user: PolicyUser | null | undefined, booking: PolicyBooking): boolean {
  if (!user || user.isActive === false) return false;
  if (isAdmin(user)) return true;
  if (booking.ownerId === user.id) return true;
  if (booking.sitterUserId && booking.sitterUserId === user.id) return true;
  return false;
}

export function canTransitionBooking(
  user: PolicyUser | null | undefined,
  booking: PolicyBooking,
  targetStatus: BookingStatus
): boolean {
  if (!user || user.isActive === false) return false;

  // 1. Enforce state machine transition validity
  const allowedNextStates = VALID_BOOKING_TRANSITIONS[booking.status] ?? [];
  if (!allowedNextStates.includes(targetStatus)) {
    return false;
  }

  // 2. Admin can trigger dispute resolutions and emergency refunds
  if (isAdmin(user)) {
    return true;
  }

  const isBookingOwner = booking.ownerId === user.id;
  const isBookingSitter = booking.sitterUserId === user.id;

  // 3. Role-specific permitted transitions
  switch (targetStatus) {
    case 'REQUESTED':
      return isBookingOwner && booking.status === 'DRAFT';

    case 'ACCEPTED':
    case 'DECLINED':
      return isBookingSitter && booking.status === 'REQUESTED';

    case 'EXPIRED':
      return false; // Only automated background worker or admin can trigger EXPIRED

    case 'PAID_HELD':
      return isBookingOwner && booking.status === 'ACCEPTED';

    case 'IN_PROGRESS':
      // System or either party on start day
      return (isBookingOwner || isBookingSitter) && booking.status === 'PAID_HELD';

    case 'COMPLETED':
      return (isBookingOwner || isBookingSitter) && booking.status === 'IN_PROGRESS';

    case 'PAYOUT_RELEASED':
      return false; // Only automated worker (after 24h) or admin can release payout

    case 'CANCELLED_BY_OWNER':
      return isBookingOwner && ['REQUESTED', 'ACCEPTED', 'PAID_HELD'].includes(booking.status);

    case 'CANCELLED_BY_SITTER':
      return isBookingSitter && ['ACCEPTED', 'PAID_HELD'].includes(booking.status);

    case 'DISPUTED':
      return (
        (isBookingOwner || isBookingSitter) &&
        ['PAID_HELD', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status)
      );

    case 'REFUNDED':
      return false; // Only payment webhooks or admin can mark REFUNDED

    default:
      return false;
  }
}

// -----------------------------------------------------------------------------
// Sitter Address Obfuscation Policy
// -----------------------------------------------------------------------------
export function canViewSitterExactAddress(
  user: PolicyUser | null | undefined,
  sitterProfile: PolicySitterProfile,
  booking?: PolicyBooking | null
): boolean {
  if (!user || user.isActive === false) return false;
  if (isAdmin(user)) return true;
  if (sitterProfile.userId === user.id) return true;

  // Owner may ONLY view exact physical address if they have a confirmed booking in PAID_HELD, IN_PROGRESS, or COMPLETED
  if (booking && booking.ownerId === user.id) {
    const paidAndActiveStatuses: BookingStatus[] = [
      'PAID_HELD',
      'IN_PROGRESS',
      'COMPLETED',
      'PAYOUT_RELEASED',
    ];
    return paidAndActiveStatuses.includes(booking.status);
  }

  return false;
}

// -----------------------------------------------------------------------------
// Messaging & Conversation Policies
// -----------------------------------------------------------------------------
export function canAccessConversation(
  user: PolicyUser | null | undefined,
  conversation: PolicyConversation
): boolean {
  if (!user || user.isActive === false) return false;
  if (isAdmin(user)) return true;
  return conversation.ownerId === user.id || conversation.sitterUserId === user.id;
}

export function canSendMessage(
  user: PolicyUser | null | undefined,
  conversation: PolicyConversation
): boolean {
  return canAccessConversation(user, conversation);
}

// -----------------------------------------------------------------------------
// Review Visibility & Submission Policies (Double-Blind)
// -----------------------------------------------------------------------------
export function canSubmitReview(
  user: PolicyUser | null | undefined,
  booking: PolicyBooking,
  hasAlreadySubmitted: boolean
): boolean {
  if (!user || user.isActive === false || hasAlreadySubmitted) return false;
  const isParticipant = booking.ownerId === user.id || booking.sitterUserId === user.id;
  if (!isParticipant) return false;

  // Reviewing is open only after stay enters COMPLETED or PAYOUT_RELEASED
  return ['COMPLETED', 'PAYOUT_RELEASED'].includes(booking.status);
}

export function canViewReview(
  user: PolicyUser | null | undefined,
  review: PolicyReview,
  hasOtherPartySubmitted: boolean,
  daysSinceStayCompleted: number
): boolean {
  if (isAdmin(user)) return true;

  // If review is no longer blind, it is fully public
  if (!review.isBlind) return true;

  // If 14-day review window has elapsed, reviews are unmasked
  if (daysSinceStayCompleted >= 14) return true;

  // If both parties submitted, unmasked
  if (hasOtherPartySubmitted) return true;

  // Otherwise, only the author can see their own draft/blind review
  return user?.id === review.authorId;
}

// -----------------------------------------------------------------------------
// Admin & Ops Policies
// -----------------------------------------------------------------------------
export function canAccessAdminPanel(user: PolicyUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canApproveSitter(user: PolicyUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canManageDispute(user: PolicyUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canIssueManualRefund(user: PolicyUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canReleaseManualPayout(user: PolicyUser | null | undefined): boolean {
  return isAdmin(user);
}
