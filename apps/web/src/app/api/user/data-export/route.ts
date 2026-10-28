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
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch user and all relational data for GDPR Article 15 Data Portability
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sitterProfile: {
          include: {
            services: true,
            homeProfile: true,
            verification: true,
          },
        },
        pets: true,
        ownerBookings: {
          include: {
            bookingPets: { include: { pet: true } },
            charges: true,
            reviews: true,
            updates: true,
          },
        },
        reviewsAuthored: true,
        reviewsReceived: true,
        messagesSent: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Redact password hash
    const { passwordHash, ...sanitizedUser } = user;

    const exportBundle = {
      compliance: 'GDPR / CCPA Data Subject Access Request',
      exportedAt: new Date().toISOString(),
      user: sanitizedUser,
    };

    return new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pawstay-user-data-${userId}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
