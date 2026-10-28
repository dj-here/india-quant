import { describe, it, expect, vi } from 'vitest';
import { executeDailyUpdateNudge } from './update-nudge';

describe('Daily Update Nudge Worker Job', () => {
  it('sends nudge notification when active booking has no update posts in last 24h', async () => {
    const fakeBookings = [
      {
        id: 'booking-1',
        bookingNumber: 'PAW-2026-101',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        sitter: { userId: 'sitter-user-1', user: { name: 'Sarah' } },
        bookingPets: [{ pet: { name: 'Milo' } }],
        updates: [], // No recent updates!
      },
      {
        id: 'booking-2',
        bookingNumber: 'PAW-2026-102',
        status: 'IN_PROGRESS',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-05'),
        sitter: { userId: 'sitter-user-2', user: { name: 'David' } },
        bookingPets: [{ pet: { name: 'Luna' } }],
        updates: [{ id: 'up-1', createdAt: new Date() }], // Has update!
      },
    ];

    const mockCreateNotification = vi.fn().mockResolvedValue({ id: 'notif-1' });

    const mockPrisma = {
      booking: {
        findMany: vi.fn().mockResolvedValue(fakeBookings),
      },
      notification: {
        create: mockCreateNotification,
      },
    };

    const result = await executeDailyUpdateNudge(mockPrisma as any, new Date('2026-06-03'));

    expect(result.scannedBookings).toBe(2);
    expect(result.nudgesSent).toBe(1);
    expect(result.bookingIds).toEqual(['booking-1']);

    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
    expect(mockCreateNotification).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'sitter-user-1',
        title: 'Daily Photo Reminder for Milo',
        actionUrl: '/bookings/booking-1/updates',
        type: 'UPDATE_NUDGE',
      }),
    });
  });

  it('handles zero active bookings cleanly', async () => {
    const mockPrisma = {
      booking: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      notification: {
        create: vi.fn(),
      },
    };

    const result = await executeDailyUpdateNudge(mockPrisma as any, new Date());
    expect(result.scannedBookings).toBe(0);
    expect(result.nudgesSent).toBe(0);
    expect(result.bookingIds).toEqual([]);
  });
});
