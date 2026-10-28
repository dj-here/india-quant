import { VALID_BOOKING_TRANSITIONS } from '../constants/index.js';
import { BookingStatus, UserRole } from '../types/index.js';

export class IllegalStateTransitionError extends Error {
  public readonly currentStatus: BookingStatus;
  public readonly targetStatus: BookingStatus;
  public readonly bookingId: string;
  public readonly allowedTransitions: BookingStatus[];

  constructor(bookingId: string, currentStatus: BookingStatus, targetStatus: BookingStatus) {
    const allowed = (VALID_BOOKING_TRANSITIONS[currentStatus] || []) as BookingStatus[];
    super(
      `Illegal booking state transition for booking ${bookingId}: Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions from '${currentStatus}': [${allowed.join(', ')}]`
    );
    this.name = 'IllegalStateTransitionError';
    this.bookingId = bookingId;
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
    this.allowedTransitions = allowed;
  }
}

export class UnauthorizedTransitionError extends Error {
  public readonly actorId: string;
  public readonly bookingId: string;
  public readonly targetStatus: BookingStatus;

  constructor(actorId: string, bookingId: string, targetStatus: BookingStatus, reason?: string) {
    super(
      `Actor ${actorId} is not authorized to transition booking ${bookingId} to '${targetStatus}'. ${reason || ''}`
    );
    this.name = 'UnauthorizedTransitionError';
    this.actorId = actorId;
    this.bookingId = bookingId;
    this.targetStatus = targetStatus;
  }
}

export interface BookingStateContext {
  id: string;
  status: BookingStatus;
  ownerId: string;
  sitterUserId: string;
}

export interface TransitionActor {
  id: string;
  roles?: (UserRole | string)[];
  isSystem?: boolean;
}

export interface StateTransitionResult {
  bookingId: string;
  previousStatus: BookingStatus;
  currentStatus: BookingStatus;
  action: string;
  auditPayload: {
    action: string;
    entityType: 'Booking';
    entityId: string;
    userId: string | null;
    oldState: { status: BookingStatus };
    newState: { status: BookingStatus; reason?: string };
    metadata: Record<string, any>;
  };
}

/**
 * Pure check if targetStatus is a legally reachable state from currentStatus.
 */
export function isValidBookingTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): boolean {
  const allowed = (VALID_BOOKING_TRANSITIONS[currentStatus] || []) as BookingStatus[];
  return allowed.includes(targetStatus);
}

/**
 * Returns the list of valid next states from the given status.
 */
export function getAllowedNextBookingStates(currentStatus: BookingStatus): BookingStatus[] {
  return ((VALID_BOOKING_TRANSITIONS[currentStatus] || []) as BookingStatus[]).slice();
}

/**
 * Validates whether the actor has permissions to trigger this transition.
 */
export function assertActorCanTransition(
  actor: TransitionActor,
  booking: BookingStateContext,
  targetStatus: BookingStatus
): void {
  if (actor.isSystem) {
    return; // System automation (e.g. BullMQ worker cron or webhook) is always authorized for valid transitions
  }

  const isAdmin = Boolean(actor.roles?.includes('ADMIN'));
  if (isAdmin) {
    return; // Ops admin is authorized for any valid state transition
  }

  const isOwner = actor.id === booking.ownerId;
  const isSitter = actor.id === booking.sitterUserId;

  switch (targetStatus) {
    case 'REQUESTED':
      if (!isOwner) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the pet owner can submit a booking request.');
      break;

    case 'ACCEPTED':
    case 'DECLINED':
      if (!isSitter) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the assigned sitter can accept or decline this request.');
      break;

    case 'EXPIRED':
      // System or Admin only
      throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only automated system worker can expire booking requests.');

    case 'PAID_HELD':
      if (!isOwner) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the pet owner can pay/authorize funds for a booking.');
      break;

    case 'IN_PROGRESS':
      if (!isSitter && !isOwner) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the sitter, owner, or system can check in to start the stay.');
      break;

    case 'COMPLETED':
      if (!isSitter) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the sitter or system can mark the stay completed.');
      break;

    case 'PAYOUT_RELEASED':
      // Automation or admin only
      throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Payout release is strictly managed by automated escrow delay or admin ops.');

    case 'CANCELLED_BY_OWNER':
      if (!isOwner) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the pet owner can cancel under CANCELLED_BY_OWNER.');
      break;

    case 'CANCELLED_BY_SITTER':
      if (!isSitter) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only the sitter can cancel under CANCELLED_BY_SITTER.');
      break;

    case 'DISPUTED':
      if (!isOwner && !isSitter) throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Only participants of the booking can raise a dispute.');
      break;

    case 'REFUNDED':
      // Admin or system webhook only
      throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Refunds can only be authorized by admin ops or payment webhooks.');

    default:
      throw new UnauthorizedTransitionError(actor.id, booking.id, targetStatus, 'Unrecognized target status.');
  }
}

/**
 * Executes a deterministic state machine transition on a booking.
 * Throws IllegalStateTransitionError if the transition violates the transition table.
 * Throws UnauthorizedTransitionError if the actor lacks permissions.
 * Produces structured AuditLog payload for immutable audit trail.
 */
export function transitionBooking(
  booking: BookingStateContext,
  targetStatus: BookingStatus,
  actor: TransitionActor,
  options: { reason?: string; metadata?: Record<string, any> } = {}
): StateTransitionResult {
  // 1. Enforce transition table
  if (!isValidBookingTransition(booking.status, targetStatus)) {
    throw new IllegalStateTransitionError(booking.id, booking.status, targetStatus);
  }

  // 2. Enforce authorization rules
  assertActorCanTransition(actor, booking, targetStatus);

  // 3. Build AuditLog entry
  const actionName = `BOOKING_${targetStatus}`;
  const auditPayload = {
    action: actionName,
    entityType: 'Booking' as const,
    entityId: booking.id,
    userId: actor.isSystem ? null : actor.id,
    oldState: { status: booking.status },
    newState: {
      status: targetStatus,
      ...(options.reason ? { reason: options.reason } : {}),
    },
    metadata: {
      actorId: actor.id,
      actorRoles: actor.roles || [],
      isSystem: Boolean(actor.isSystem),
      timestamp: new Date().toISOString(),
      ...(options.metadata || {}),
    },
  };

  return {
    bookingId: booking.id,
    previousStatus: booking.status,
    currentStatus: targetStatus,
    action: actionName,
    auditPayload,
  };
}
