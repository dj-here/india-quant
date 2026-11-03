import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ testimonials });
  } catch (error: any) {
    console.error('[API Testimonials GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const testimonial = await prisma.testimonial.create({
      data: {
        authorName: body.authorName,
        designation: body.designation,
        collegeName: body.collegeName,
        city: body.city,
        quote: body.quote,
        rating: body.rating || 5,
        isFeatured: body.isFeatured ?? true,
        order: body.order || 0,
      },
    });

    return NextResponse.json({ success: true, testimonial }, { status: 201 });
  } catch (error: any) {
    console.error('[API Testimonials POST Error]:', error);
    return NextResponse.json({ error: 'Failed to create testimonial.' }, { status: 500 });
  }
}
