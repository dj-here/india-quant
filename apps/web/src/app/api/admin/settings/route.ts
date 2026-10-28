import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  OWNER_SERVICE_FEE_BPS: {
    value: '700',
    description: 'Owner platform fee in basis points (700 bps = 7%)',
  },
  SITTER_COMMISSION_BPS: {
    value: '1200',
    description: 'Sitter platform take-rate in basis points (1200 bps = 12%)',
  },
  KENNEL_BENCHMARK_AUSTIN: {
    value: '7500',
    description: 'Typical kennel benchmark cost per night in Austin ($75.00)',
  },
  KENNEL_BENCHMARK_SEATTLE: {
    value: '8500',
    description: 'Typical kennel benchmark cost per night in Seattle ($85.00)',
  },
  KENNEL_BENCHMARK_SF: {
    value: '9500',
    description: 'Typical kennel benchmark cost per night in San Francisco ($95.00)',
  },
  KENNEL_BENCHMARK_NYC: {
    value: '9000',
    description: 'Typical kennel benchmark cost per night in New York City ($90.00)',
  },
  KENNEL_BENCHMARK_DENVER: {
    value: '7000',
    description: 'Typical kennel benchmark cost per night in Denver ($70.00)',
  },
  DEFAULT_CANCELLATION_POLICY: {
    value: 'MODERATE',
    description: 'Default cancellation policy for new host listings (FLEXIBLE | MODERATE | STRICT)',
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.roles?.includes('ADMIN') || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Ensure defaults exist
    for (const [key, meta] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await prisma.platformSetting.findUnique({ where: { key } });
      if (!existing) {
        await prisma.platformSetting.create({
          data: {
            key,
            value: meta.value,
            description: meta.description,
          },
        });
      }
    }

    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error reading platform settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.roles?.includes('ADMIN') || process.env.NODE_ENV === 'development';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const adminUserId = session?.user?.id || 'admin-system';
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof value !== 'string') {
      return NextResponse.json({ error: 'Key and string value required' }, { status: 400 });
    }

    const updatedSetting = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value,
        updatedByUserId: adminUserId,
      },
      create: {
        key,
        value,
        description: DEFAULT_SETTINGS[key]?.description || 'Custom configuration',
        updatedByUserId: adminUserId,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PLATFORM_SETTING_UPDATED',
        entityType: 'PlatformSetting',
        entityId: updatedSetting.id,
        metadata: {
          key,
          newValue: value,
        },
      },
    });

    return NextResponse.json({ setting: updatedSetting });
  } catch (error) {
    console.error('Error updating platform setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
