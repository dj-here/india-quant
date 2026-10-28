import { describe, it, expect, vi } from 'vitest';
import { executeReviewReveal } from './review-reveal';

describe('Review Reveal Worker Job', () => {
  it('reveals reviews when both owner and sitter have submitted for a booking', async () => {
    const mockBlindReviews = [
      {
        id: 'rev-owner-1',
        bookingId: 'booking-10',
        authorRole: 'OWNER',
        targetId: 'sitter-user-1',
        isBlind: true,
        booking: { id: 'booking-10', completedAt: new Date('2026-06-01') },
      },
      {
        id: 'rev-sitter-1',
        bookingId: 'booking-10',
        authorRole: 'SITTER',
        targetId: 'owner-user-1',
        isBlind: true,
        booking: { id: 'booking-10', completedAt: new Date('2026-06-01') },
      },
    ];

    const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
    const mockProfileUpdate = vi.fn().mockResolvedValue({ id: 'sitter-prof-1' });

    const mockPrisma = {
      review: {
        findMany: vi.fn()
          .mockResolvedValueOnce(mockBlindReviews)
          .mockResolvedValueOnce([{ rating: 5 }, { rating: 5 }]),
        updateMany: mockUpdateMany,
      },
      sitterProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'sitter-prof-1', userId: 'sitter-user-1' }),
        update: mockProfileUpdate,
      },
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    const result = await executeReviewReveal(mockPrisma as any, new Date('2026-06-05'));

    expect(result.revealedReviewsCount).toBe(2);
    expect(result.affectedSitterUserIds).toEqual(['sitter-user-1']);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['rev-owner-1', 'rev-sitter-1'] } },
      data: expect.objectContaining({ isBlind: false }),
    });
    expect(mockProfileUpdate).toHaveBeenCalled();
  });

  it('reveals single review if 14 days have passed since stay completion', async () => {
    const mockBlindReviews = [
      {
        id: 'rev-owner-2',
        bookingId: 'booking-20',
        authorRole: 'OWNER',
        targetId: 'sitter-user-2',
        isBlind: true,
        booking: { id: 'booking-20', completedAt: new Date('2026-06-01T00:00:00Z') },
      },
    ];

    const mockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const mockPrisma = {
      review: {
        findMany: vi.fn()
          .mockResolvedValueOnce(mockBlindReviews)
          .mockResolvedValueOnce([{ rating: 5 }]),
        updateMany: mockUpdateMany,
      },
      sitterProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'sitter-prof-2', userId: 'sitter-user-2' }),
        update: vi.fn().mockResolvedValue({ id: 'sitter-prof-2' }),
      },
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'notif-2' }),
      },
    };

    // 15 days later
    const result = await executeReviewReveal(mockPrisma as any, new Date('2026-06-16T00:00:00Z'));

    expect(result.revealedReviewsCount).toBe(1);
    expect(result.affectedSitterUserIds).toEqual(['sitter-user-2']);
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['rev-owner-2'] } },
      data: expect.objectContaining({ isBlind: false }),
    });
  });

  it('does NOT reveal single review if less than 14 days have elapsed', async () => {
    const mockBlindReviews = [
      {
        id: 'rev-owner-3',
        bookingId: 'booking-30',
        authorRole: 'OWNER',
        targetId: 'sitter-user-3',
        isBlind: true,
        booking: { id: 'booking-30', completedAt: new Date('2026-06-01') },
      },
    ];

    const mockUpdateMany = vi.fn();
    const mockPrisma = {
      review: {
        findMany: vi.fn().mockResolvedValueOnce(mockBlindReviews),
        updateMany: mockUpdateMany,
      },
    };

    // Only 5 days later
    const result = await executeReviewReveal(mockPrisma as any, new Date('2026-06-06'));

    expect(result.revealedReviewsCount).toBe(0);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });
});
