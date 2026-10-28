import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.roles?.includes('ADMIN') || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        initiator: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        booking: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            sitter: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            bookingPets: {
              include: {
                pet: { select: { name: true, species: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
