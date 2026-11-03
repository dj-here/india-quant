import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.followUpDate !== undefined) {
      updateData.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    }

    const updatedLead = await prisma.collegeLead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error('[API Leads PATCH Error]:', error);
    return NextResponse.json({ error: 'Failed to update lead status.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    await prisma.collegeLead.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Lead deleted.' });
  } catch (error: any) {
    console.error('[API Leads DELETE Error]:', error);
    return NextResponse.json({ error: 'Failed to delete lead.' }, { status: 500 });
  }
}
