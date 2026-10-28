import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { CreatePetSchema } from '@pawstay/shared';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let ownerId = session?.user?.id;

    if (!ownerId) {
      // In demo mode, fetch pets of the first owner in seed
      const firstOwner = await prisma.user.findFirst({
        where: { roles: { has: 'OWNER' } },
        select: { id: true },
      });
      ownerId = firstOwner?.id;
    }

    if (!ownerId) {
      return NextResponse.json({ pets: [] });
    }

    const pets = await prisma.pet.findMany({
      where: { ownerId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pets });
  } catch (error: any) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let ownerId = session?.user?.id;

    if (!ownerId) {
      const firstOwner = await prisma.user.findFirst({
        where: { roles: { has: 'OWNER' } },
        select: { id: true },
      });
      ownerId = firstOwner?.id;
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Authentication required to add a pet' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CreatePetSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid pet data', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const petData = parseResult.data;

    const newPet = await prisma.pet.create({
      data: {
        ownerId,
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        ageYears: petData.ageYears,
        weightLbs: petData.weightLbs,
        isSpayedNeutered: petData.isSpayedNeutered,
        temperamentFlags: petData.temperamentFlags,
        medications: petData.medications || null,
        feedingSchedule: petData.feedingSchedule,
        allergies: petData.allergies || null,
        microchipId: petData.microchipId || null,
        vetName: petData.vetName,
        vetPhone: petData.vetPhone,
        vetClinic: petData.vetClinic || null,
        emergencyContactName: petData.emergencyContactName,
        emergencyContactPhone: petData.emergencyContactPhone,
        vaccinationUrls: petData.vaccinationDocumentUrls,
        photoUrl:
          petData.photoUrl ||
          (petData.species === 'DOG'
            ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'),
      },
    });

    return NextResponse.json({ success: true, pet: newPet }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pet:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
