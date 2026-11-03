import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const leads = await prisma.collegeLead.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Lead ID',
      'College Name',
      'City',
      'State',
      'Contact Person',
      'Role',
      'Email',
      'Phone',
      'Student Strength',
      'Target Years',
      'Target Branches',
      'Interested Programs',
      'Preferred Mode',
      'Status',
      'Follow-up Date',
      'Notes',
      'Created Date',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map(l => [
      escapeCsv(l.id),
      escapeCsv(l.collegeName),
      escapeCsv(l.city),
      escapeCsv(l.state),
      escapeCsv(l.contactPerson),
      escapeCsv(l.role),
      escapeCsv(l.email),
      escapeCsv(l.phone),
      escapeCsv(l.studentStrength),
      escapeCsv(l.targetYears),
      escapeCsv(l.targetBranches),
      escapeCsv(l.interestedPrograms),
      escapeCsv(l.preferredMode),
      escapeCsv(l.status),
      escapeCsv(l.followUpDate ? l.followUpDate.toISOString().split('T')[0] : ''),
      escapeCsv(l.notes || ''),
      escapeCsv(l.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="campusedge_leads_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('[API Leads Export Error]:', error);
    return NextResponse.json({ error: 'Failed to export CSV.' }, { status: 500 });
  }
}
