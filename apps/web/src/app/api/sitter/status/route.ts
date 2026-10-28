import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sitterProfile = await prisma.sitterProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        verification: true,
        homeProfile: true,
        services: true,
        availabilities: {
          take: 30,
          orderBy: { date: 'asc' },
        },
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
            bookingPets: { include: { pet: true } },
          },
        },
      },
    });

    if (!sitterProfile) {
      return NextResponse.json({ hasProfile: false }, { status: 200 });
    }

    return NextResponse.json({
      hasProfile: true,
      sitterProfile,
    });
  } catch (error: any) {
    console.error('Error fetching sitter status:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
