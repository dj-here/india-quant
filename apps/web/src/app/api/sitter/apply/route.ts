import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import {
  evaluateSafetyQuiz,
  MockGeoProvider,
  MockIdentityVerifier,
  MockBackgroundCheckAdapter,
  SitterOnboardingSchema,
  SafetyQuizSubmissionSchema,
  CancellationPolicyType,
} from '@pawstay/shared';
import { z } from 'zod';

const ApplyPayloadSchema = z.object({
  sitterData: SitterOnboardingSchema,
  quizAnswers: SafetyQuizSubmissionSchema.shape.answers,
  documentType: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'STATE_ID']).default('DRIVERS_LICENSE'),
  documentFrontUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to apply as a sitter.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = ApplyPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid application payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { sitterData, quizAnswers, documentType, documentFrontUrl, selfieUrl } = parseResult.data;

    // 1. Evaluate Safety Quiz
    const quizEvaluation = evaluateSafetyQuiz(quizAnswers);
    if (!quizEvaluation.passed) {
      return NextResponse.json(
        {
          error: 'Safety quiz passing threshold not met (Requires >= 80% and 100% on mandatory safety protocols).',
          quizEvaluation,
        },
        { status: 400 }
      );
    }

    // 2. Geocode & Obfuscate Address
    const geoProvider = new MockGeoProvider();
    const fullAddress = `${sitterData.addressLine1}, ${sitterData.city}, ${sitterData.state} ${sitterData.postalCode}`;
    const geocoded = await geoProvider.geocode(fullAddress);
    const obfuscated = geoProvider.obfuscateCoordinates(geocoded.latitude, geocoded.longitude, 0.75);

    // 3. Initiate Verification Adapters
    const identityVerifier = new MockIdentityVerifier();
    const idSession = await identityVerifier.createSession(session.user.id, '/sitter/dashboard');
    const idResult = await identityVerifier.getSessionResult(idSession.sessionId);

    const bgAdapter = new MockBackgroundCheckAdapter();
    const bgResult = await bgAdapter.initiateCheck(session.user.id, {
      firstName: session.user.name?.split(' ')[0] || 'Applicant',
      lastName: session.user.name?.split(' ').slice(1).join(' ') || 'Sitter',
      email: session.user.email || 'applicant@pawstay.local',
      address: fullAddress,
      postalCode: sitterData.postalCode,
    });

    // 4. Prisma Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create sitter profile
      const sitterProfile = await tx.sitterProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          headline: sitterData.headline,
          bio: sitterData.bio,
          yearsOfExperience: sitterData.yearsOfExperience,
          addressLine1: sitterData.addressLine1,
          addressLine2: sitterData.addressLine2,
          city: sitterData.city,
          state: sitterData.state,
          postalCode: sitterData.postalCode,
          country: sitterData.country,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          approxLatitude: obfuscated.approxLat,
          approxLongitude: obfuscated.approxLng,
          approxRadiusMiles: obfuscated.radiusMiles,
          cancellationPolicy: sitterData.cancellationPolicy as CancellationPolicyType,
          status: 'PENDING',
          acceptedSpecies: sitterData.acceptedPetSpecies,
          maxPetCapacity: sitterData.maxPetCapacity,
          hasMedicationExperience: sitterData.hasExperienceWithMedication,
          hasPuppyExperience: sitterData.hasExperienceWithPuppies,
          hasSeniorExperience: sitterData.hasExperienceWithSeniors,
          instantBookEnabled: sitterData.instantBookEnabled,
          safetyQuizPassed: true,
        },
        update: {
          headline: sitterData.headline,
          bio: sitterData.bio,
          yearsOfExperience: sitterData.yearsOfExperience,
          addressLine1: sitterData.addressLine1,
          addressLine2: sitterData.addressLine2,
          city: sitterData.city,
          state: sitterData.state,
          postalCode: sitterData.postalCode,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          approxLatitude: obfuscated.approxLat,
          approxLongitude: obfuscated.approxLng,
          cancellationPolicy: sitterData.cancellationPolicy as CancellationPolicyType,
          acceptedSpecies: sitterData.acceptedPetSpecies,
          maxPetCapacity: sitterData.maxPetCapacity,
          hasMedicationExperience: sitterData.hasExperienceWithMedication,
          hasPuppyExperience: sitterData.hasExperienceWithPuppies,
          hasSeniorExperience: sitterData.hasExperienceWithSeniors,
          instantBookEnabled: sitterData.instantBookEnabled,
          safetyQuizPassed: true,
          status: 'PENDING',
        },
      });

      // Update User roles to include SITTER
      const currentUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { roles: true },
      });
      const currentRoles = currentUser?.roles || ['OWNER'];
      if (!currentRoles.includes('SITTER')) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { roles: [...currentRoles, 'SITTER'] },
        });
      }

      // Upsert HomeProfile
      await tx.homeProfile.upsert({
        where: { sitterProfileId: sitterProfile.id },
        create: {
          sitterProfileId: sitterProfile.id,
          homeType: sitterData.homeProfile.homeType,
          hasFencedYard: sitterData.homeProfile.hasFencedYard,
          yardSize: sitterData.homeProfile.yardSize,
          hasOtherPetsInHome: sitterData.homeProfile.hasOtherPetsInHome,
          otherPetsDetails: sitterData.homeProfile.otherPetsDetails,
          hasChildrenInHome: sitterData.homeProfile.hasChildrenInHome,
          isSmokingFree: sitterData.homeProfile.isSmokingFree,
          allowsPetsOnFurniture: sitterData.homeProfile.allowsPetsOnFurniture,
          photos: sitterData.homeProfile.photos,
        },
        update: {
          homeType: sitterData.homeProfile.homeType,
          hasFencedYard: sitterData.homeProfile.hasFencedYard,
          yardSize: sitterData.homeProfile.yardSize,
          hasOtherPetsInHome: sitterData.homeProfile.hasOtherPetsInHome,
          otherPetsDetails: sitterData.homeProfile.otherPetsDetails,
          hasChildrenInHome: sitterData.homeProfile.hasChildrenInHome,
          isSmokingFree: sitterData.homeProfile.isSmokingFree,
          allowsPetsOnFurniture: sitterData.homeProfile.allowsPetsOnFurniture,
          photos: sitterData.homeProfile.photos,
        },
      });

      // Upsert Services
      for (const s of sitterData.services) {
        await tx.service.upsert({
          where: {
            sitterProfileId_serviceType: {
              sitterProfileId: sitterProfile.id,
              serviceType: s.serviceType,
            },
          },
          create: {
            sitterProfileId: sitterProfile.id,
            serviceType: s.serviceType,
            isActive: s.isActive,
            baseRateMinor: s.baseRateMinor,
            additionalPetRateMinor: s.additionalPetRateMinor,
            holidaySurchargeMinor: s.holidaySurchargeMinor,
            puppySurchargeMinor: s.puppySurchargeMinor,
            extendedStayDiscountPercent: s.extendedStayDiscountPercent,
          },
          update: {
            isActive: s.isActive,
            baseRateMinor: s.baseRateMinor,
            additionalPetRateMinor: s.additionalPetRateMinor,
            holidaySurchargeMinor: s.holidaySurchargeMinor,
            puppySurchargeMinor: s.puppySurchargeMinor,
            extendedStayDiscountPercent: s.extendedStayDiscountPercent,
          },
        });
      }

      // Upsert SitterVerification
      const verification = await tx.sitterVerification.upsert({
        where: { sitterProfileId: sitterProfile.id },
        create: {
          sitterProfileId: sitterProfile.id,
          status: 'PENDING',
          idDocumentType: documentType,
          idDocumentFrontUrl: documentFrontUrl || idResult.documentFrontUrl,
          selfieUrl: selfieUrl || idResult.selfieUrl,
          identityCheckStatus: idResult.status,
          backgroundCheckStatus: bgResult.status,
          backgroundCheckRef: bgResult.checkId,
        },
        update: {
          status: 'PENDING',
          idDocumentType: documentType,
          idDocumentFrontUrl: documentFrontUrl || idResult.documentFrontUrl,
          selfieUrl: selfieUrl || idResult.selfieUrl,
          identityCheckStatus: idResult.status,
          backgroundCheckStatus: bgResult.status,
          backgroundCheckRef: bgResult.checkId,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'SITTER_APPLICATION_SUBMITTED',
          entityType: 'SitterProfile',
          entityId: sitterProfile.id,
          newState: {
            status: 'PENDING',
            quizScore: quizEvaluation.score,
            quizTotal: quizEvaluation.total,
            idCheckStatus: idResult.status,
            bgCheckStatus: bgResult.status,
          },
        },
      });

      return { sitterProfile, verification };
    });

    return NextResponse.json({
      success: true,
      sitterProfileId: result.sitterProfile.id,
      status: result.sitterProfile.status,
      quizEvaluation,
    });
  } catch (error: any) {
    console.error('Error submitting sitter application:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing sitter application', details: error.message },
      { status: 500 }
    );
  }
}
