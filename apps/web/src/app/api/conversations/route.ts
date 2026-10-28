import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      // In development fallback, get the first user
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Find sitter profile if user is a sitter
    const sitterProfile = await prisma.sitterProfile.findUnique({
      where: { userId },
    });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { ownerId: userId },
          ...(sitterProfile ? [{ sitterId: sitterProfile.id }] : []),
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        sitter: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            startDate: true,
            endDate: true,
            serviceType: true,
            bookingPets: {
              include: {
                pet: {
                  select: { id: true, name: true, species: true, photoUrl: true },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute unread count for each conversation
    const conversationsWithMeta = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        const lastMessage = conv.messages[0] || null;
        const otherParty =
          conv.ownerId === userId
            ? {
                id: conv.sitter.userId,
                name: conv.sitter.user.name,
                image: conv.sitter.user.avatarUrl,
                role: 'SITTER',
                headline: conv.sitter.headline,
              }
            : {
                id: conv.owner.id,
                name: conv.owner.name,
                image: conv.owner.avatarUrl,
                role: 'OWNER',
                headline: 'Pet Parent',
              };

        return {
          id: conv.id,
          bookingId: conv.bookingId,
          booking: conv.booking,
          otherParty,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                text: lastMessage.maskedText || lastMessage.text,
                hasOffPlatformAttempt: lastMessage.hasOffPlatformAttempt,
                createdAt: lastMessage.createdAt,
                isSender: lastMessage.senderId === userId,
                isRead: lastMessage.isRead,
              }
            : null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithMeta });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
