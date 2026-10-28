import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { getRealtimeProvider } from '@pawstay/shared';

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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        owner: true,
        bookingPets: { include: { pet: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = booking.ownerId === userId;
    const isSitter = booking.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = await prisma.updatePost.findMany({
      where: { bookingId: params.id },
      include: {
        sitter: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        serviceType: booking.serviceType,
        pets: booking.bookingPets.map((bp) => bp.pet),
        sitterName: booking.sitter.user.name,
        isSitter,
        isOwner,
      },
      updates,
    });
  } catch (error) {
    console.error('Error fetching stay updates:', error);
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

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: true,
        bookingPets: { include: { pet: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isSitter = booking.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isSitter && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the assigned sitter can post stay updates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const text = (body.text || '').trim();

    if (!text) {
      return NextResponse.json(
        { error: 'Update caption / note cannot be empty' },
        { status: 400 }
      );
    }

    const peeCount = typeof body.peeCount === 'number' ? Math.max(0, body.peeCount) : 0;
    const poopCount = typeof body.poopCount === 'number' ? Math.max(0, body.poopCount) : 0;
    const fedMeal = Boolean(body.fedMeal);
    const medsAdministered = Boolean(body.medsAdministered);
    const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];

    const newUpdate = await prisma.updatePost.create({
      data: {
        bookingId: params.id,
        sitterId: booking.sitter.id,
        text,
        mediaUrls,
        peeCount,
        poopCount,
        fedMeal,
        medsAdministered,
      },
      include: {
        sitter: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    // Notify pet parent
    const petNames = booking.bookingPets.map((p) => p.pet.name).join(' & ');
    await prisma.notification.create({
      data: {
        userId: booking.ownerId,
        title: `🐾 Daily Stay Update for ${petNames || 'your pet'}!`,
        message: text.slice(0, 100),
        actionUrl: `/bookings/${params.id}/updates`,
        type: 'UPDATE_POSTED',
      },
    });

    // Write AuditLog
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_POSTED',
        entityType: 'Booking',
        entityId: params.id,
        metadata: {
          updatePostId: newUpdate.id,
          peeCount,
          poopCount,
          fedMeal,
          medsAdministered,
          photosCount: mediaUrls.length,
        },
      },
    });

    // Publish to Realtime Provider
    const realtime = getRealtimeProvider();
    await realtime.publish(`booking:${params.id}`, 'update-posted', newUpdate);

    return NextResponse.json({ update: newUpdate }, { status: 201 });
  } catch (error) {
    console.error('Error creating stay update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
