import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export async function GET() {
  try {
    const faqs = await prisma.faqItem.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json({ faqs });
  } catch (error: any) {
    console.error('[API FAQs GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const faq = await prisma.faqItem.create({
      data: {
        category: body.category || 'GENERAL',
        question: body.question,
        answer: body.answer,
        order: body.order || 0,
      },
    });

    return NextResponse.json({ success: true, faq }, { status: 201 });
  } catch (error: any) {
    console.error('[API FAQs POST Error]:', error);
    return NextResponse.json({ error: 'Failed to create FAQ.' }, { status: 500 });
  }
}
