import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { leadRequestSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendLeadConfirmationEmails } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, { windowMs: 600000, maxRequests: 5 });

    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes before submitting another proposal request.' },
        { status: 429 }
      );
    }

    const body = await req.json();

    // 1. Validate with Zod (includes Honeypot check: website_url_hp must be empty)
    const parseResult = leadRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid form input.';
      return NextResponse.json({ error: firstError, details: parseResult.error.errors }, { status: 400 });
    }

    const data = parseResult.data;

    // 2. Drop silent bot submission if honeypot was populated (returns 200 to confuse bots)
    if (data.website_url_hp && data.website_url_hp.length > 0) {
      return NextResponse.json({ success: true, message: 'Request received.' });
    }

    // 3. Save to database
    const lead = await prisma.collegeLead.create({
      data: {
        collegeName: data.collegeName.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        contactPerson: data.contactPerson.trim(),
        role: data.role.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        studentStrength: data.studentStrength,
        targetYears: data.targetYears.trim(),
        targetBranches: data.targetBranches.trim(),
        interestedPrograms: data.interestedPrograms.trim(),
        preferredMode: data.preferredMode,
        message: data.message ? data.message.trim() : null,
        status: 'NEW',
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    // 4. Send Confirmation & Alert Emails asynchronously
    sendLeadConfirmationEmails({
      collegeName: lead.collegeName,
      city: lead.city,
      state: lead.state,
      contactPerson: lead.contactPerson,
      role: lead.role,
      email: lead.email,
      phone: lead.phone,
      studentStrength: lead.studentStrength,
      interestedPrograms: lead.interestedPrograms,
    }).catch(err => console.error('[Email Error in Lead Handler]:', err));

    return NextResponse.json(
      {
        success: true,
        message: 'Your demo request and proposal briefing have been registered successfully.',
        leadId: lead.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Leads POST Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again or contact us directly on WhatsApp.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (state && state !== 'ALL') {
      where.state = state;
    }
    if (search) {
      where.OR = [
        { collegeName: { contains: search } },
        { city: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const leads = await prisma.collegeLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ leads, count: leads.length });
  } catch (error: any) {
    console.error('[API Leads GET Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch leads.' }, { status: 500 });
  }
}
