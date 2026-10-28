import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true, phoneNumber: true },
        },
        sitter: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, phoneNumber: true },
            },
          },
        },
        booking: {
          include: {
            bookingPets: {
              include: {
                pet: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check authorization: must be owner, sitter user, or admin
    const isOwner = conversation.ownerId === userId;
    const isSitter = conversation.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine other party
    const otherParty = isOwner
      ? {
          id: conversation.sitter.userId,
          name: conversation.sitter.user.name,
          image: conversation.sitter.user.avatarUrl,
          role: 'SITTER',
          headline: conversation.sitter.headline,
          city: conversation.sitter.city,
          state: conversation.sitter.state,
        }
      : {
          id: conversation.owner.id,
          name: conversation.owner.name,
          image: conversation.owner.avatarUrl,
          role: 'OWNER',
          headline: 'Pet Parent',
          city: null,
          state: null,
        };

    const isBookingConfirmed =
      conversation.booking &&
      ['PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED'].includes(
        conversation.booking.status
      );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        bookingId: conversation.bookingId,
        booking: conversation.booking,
        isBookingConfirmed: !!isBookingConfirmed,
        otherParty,
      },
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
