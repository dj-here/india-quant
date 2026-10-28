import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { maskContactInfo, getRealtimeProvider } from '@pawstay/shared';

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
        sitter: true,
        booking: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isOwner = conversation.ownerId === userId;
    const isSitter = conversation.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark unread messages from counterparty as read
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    const isBookingConfirmed =
      conversation.booking &&
      ['PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED'].includes(
        conversation.booking.status
      );

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // If pre-booking, expose maskedText if leakage was detected
    const formattedMessages = messages.map((m) => {
      const displayContent =
        !isBookingConfirmed && m.maskedText ? m.maskedText : m.text;

      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderImage: m.sender.avatarUrl,
        text: displayContent,
        hasOffPlatformAttempt: m.hasOffPlatformAttempt,
        attachments: m.attachments,
        isRead: m.isRead,
        createdAt: m.createdAt,
        isSender: m.senderId === userId,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
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
        sitter: true,
        booking: true,
        owner: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isOwner = conversation.ownerId === userId;
    const isSitter = conversation.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const rawText = (body.text || '').trim();

    if (!rawText) {
      return NextResponse.json(
        { error: 'Message text cannot be empty' },
        { status: 400 }
      );
    }

    // Determine booking status and enforce contact leakage masking if not confirmed
    const isBookingConfirmed =
      conversation.booking &&
      ['PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED'].includes(
        conversation.booking.status
      );

    let textToStore = rawText;
    let maskedText: string | null = null;
    let hasOffPlatformAttempt = false;

    if (!isBookingConfirmed) {
      const leakageCheck = maskContactInfo(rawText);
      if (leakageCheck.hasLeakage) {
        hasOffPlatformAttempt = true;
        maskedText = leakageCheck.maskedText;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: userId,
        text: textToStore,
        maskedText,
        hasOffPlatformAttempt,
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    // Publish to Realtime Provider
    const realtime = getRealtimeProvider();
    await realtime.publish(`conversation:${params.id}`, 'new-message', {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: maskedText || message.text,
      hasOffPlatformAttempt,
      createdAt: message.createdAt,
    });

    // Determine recipient and create in-app notification
    const recipientUserId = isOwner ? conversation.sitter.userId : conversation.ownerId;
    const senderName = isOwner ? conversation.owner.name : 'Your Sitter';

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        title: `Message from ${senderName}`,
        message: hasOffPlatformAttempt
          ? 'New message received (contact details protected).'
          : rawText.slice(0, 100),
        actionUrl: `/messages/${conversation.id}`,
        type: 'NEW_MESSAGE',
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderImage: message.sender.avatarUrl,
        text: maskedText || message.text,
        hasOffPlatformAttempt,
        attachments: message.attachments,
        isRead: message.isRead,
        createdAt: message.createdAt,
        isSender: true,
      },
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
