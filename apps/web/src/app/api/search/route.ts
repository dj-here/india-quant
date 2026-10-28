import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pawstay/db';
import {
  SitterSearchQuerySchema,
  calculateSitterRank,
  calculateBookingPrice,
  MockGeoProvider,
  ServiceType,
  PetSpecies,
} from '@pawstay/shared';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const rawParams = {
      latitude: searchParams.get('latitude') || '30.2672',
      longitude: searchParams.get('longitude') || '-97.7431',
      radiusMiles: searchParams.get('radiusMiles') || '25',
      serviceType: searchParams.get('serviceType') || 'BOARDING',
      startDate: searchParams.get('startDate') || new Date().toISOString().split('T')[0],
      endDate:
        searchParams.get('endDate') ||
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      species: searchParams.getAll('species').length > 0 ? searchParams.getAll('species') : ['DOG'],
      petCount: searchParams.get('petCount') || '1',
      fencedYardOnly: searchParams.get('fencedYardOnly') === 'true' ? true : undefined,
      noOtherPets: searchParams.get('noOtherPets') === 'true' ? true : undefined,
      hasMedicationExperience: searchParams.get('hasMedicationExperience') === 'true' ? true : undefined,
      hasPuppyExperience: searchParams.get('hasPuppyExperience') === 'true' ? true : undefined,
      hasSeniorExperience: searchParams.get('hasSeniorExperience') === 'true' ? true : undefined,
      instantBookOnly: searchParams.get('instantBookOnly') === 'true' ? true : undefined,
      verifiedOnly: searchParams.get('verifiedOnly') === 'true' ? true : undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    };

    const parseResult = SitterSearchQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const query = parseResult.data;
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

    const geoProvider = new MockGeoProvider();

    // Query sitters with status APPROVED only
    const whereClause: any = {
      status: 'APPROVED',
      services: {
        some: {
          serviceType: query.serviceType as ServiceType,
          isActive: true,
        },
      },
      acceptedSpecies: {
        hasSome: query.species as PetSpecies[],
      },
    };

    if (query.fencedYardOnly) {
      whereClause.homeProfile = { hasFencedYard: true };
    }
    if (query.noOtherPets) {
      whereClause.homeProfile = { ...whereClause.homeProfile, hasOtherPetsInHome: false };
    }
    if (query.hasMedicationExperience) {
      whereClause.hasMedicationExperience = true;
    }
    if (query.hasPuppyExperience) {
      whereClause.hasPuppyExperience = true;
    }
    if (query.hasSeniorExperience) {
      whereClause.hasSeniorExperience = true;
    }
    if (query.instantBookOnly) {
      whereClause.instantBookEnabled = true;
    }

    // Fetch matching sitters
    const candidates = await prisma.sitterProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        homeProfile: true,
        services: { where: { serviceType: query.serviceType as ServiceType } },
        verification: true,
        availabilities: {
          where: {
            date: { gte: start, lte: end },
            isBlocked: true,
          },
        },
      },
      take: 100, // Pre-filter candidates within general metro
    });

    // Post-filter: Distance & Calendar Block filtering
    const results = [];
    const metroBenchmarkRateMinor = 5500; // $55.00 benchmark

    for (const sitter of candidates) {
      // 1. Availability check: if sitter has a blocked date in the range, skip
      if (sitter.availabilities.length > 0) {
        continue;
      }

      // 2. Haversine distance from search origin
      const distanceMiles = geoProvider.haversineDistanceMiles(
        query.latitude,
        query.longitude,
        sitter.latitude,
        sitter.longitude
      );

      if (distanceMiles > query.radiusMiles) {
        continue;
      }

      const activeService = sitter.services[0];
      if (!activeService) continue;

      // 3. Price Quote Calculation
      const quote = calculateBookingPrice({
        baseRateMinor: activeService.baseRateMinor,
        unitsCount: nights,
        petCount: query.petCount,
        additionalPetRateMinor: activeService.additionalPetRateMinor,
        extendedStayDiscountPercent: activeService.extendedStayDiscountPercent,
      });

      // 4. Ranking Score
      const daysSinceCreation = Math.max(
        0,
        Math.round((Date.now() - new Date(sitter.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      );

      const rankResult = calculateSitterRank({
        distanceMiles,
        maxSearchRadiusMiles: query.radiusMiles,
        filterMatchFraction: 1.0,
        averageRating: sitter.ratingBayesian,
        reviewCount: sitter.reviewCount,
        responseRatePercent: sitter.responseRatePercent,
        responseTimeMinutes: sitter.responseTimeMinutes,
        reliabilityScore: sitter.reliabilityScore,
        hasBio: sitter.bio.length > 30,
        photoCount: sitter.homeProfile?.photos.length || 0,
        hasHomeDetails: Boolean(sitter.homeProfile),
        servicesCount: sitter.services.length,
        sitterBaseRateMinor: activeService.baseRateMinor,
        metroBenchmarkRateMinor,
        daysSinceCreation,
      });

      // Crucial: Exact latitude and longitude are NEVER exposed in pre-booking search results!
      // Only obfuscated approx coordinates are sent.
      results.push({
        id: sitter.id,
        name: sitter.user.name,
        avatarUrl: sitter.user.avatarUrl,
        headline: sitter.headline,
        bio: sitter.bio,
        yearsOfExperience: sitter.yearsOfExperience,
        city: sitter.city,
        state: sitter.state,
        approxLocation: {
          approxLatitude: sitter.approxLatitude,
          approxLongitude: sitter.approxLongitude,
          approxRadiusMiles: sitter.approxRadiusMiles,
        },
        distanceMiles,
        service: {
          serviceType: activeService.serviceType,
          baseRateMinor: activeService.baseRateMinor,
        },
        quote,
        rating: sitter.ratingBayesian,
        reviewCount: sitter.reviewCount,
        responseTimeMinutes: sitter.responseTimeMinutes,
        responseRatePercent: sitter.responseRatePercent,
        reliabilityScore: sitter.reliabilityScore,
        instantBookEnabled: sitter.instantBookEnabled,
        homeProfile: sitter.homeProfile,
        badges: {
          identityVerified: sitter.verification?.identityCheckStatus === 'VERIFIED',
          backgroundChecked: sitter.verification?.backgroundCheckStatus === 'CLEAR',
          safetyExamPassed: sitter.safetyQuizPassed,
        },
        rankScore: rankResult.totalScore,
      });
    }

    // Sort Results
    results.sort((a, b) => {
      if (query.sortBy === 'price_asc') {
        return a.quote.ownerTotalMinor - b.quote.ownerTotalMinor;
      }
      if (query.sortBy === 'price_desc') {
        return b.quote.ownerTotalMinor - a.quote.ownerTotalMinor;
      }
      if (query.sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (query.sortBy === 'distance') {
        return a.distanceMiles - b.distanceMiles;
      }
      // Default: relevance (Bayesian composite score)
      return b.rankScore - a.rankScore;
    });

    const paginated = results.slice(query.offset, query.offset + query.limit);

    return NextResponse.json({
      total: results.length,
      limit: query.limit,
      offset: query.offset,
      sitters: paginated,
      searchContext: {
        metroBenchmarkRateMinor,
        unitsCount: nights,
        petCount: query.petCount,
        serviceType: query.serviceType,
      },
    });
  } catch (error: any) {
    console.error('Error executing sitter search:', error);
    return NextResponse.json(
      { error: 'Internal server error while searching sitters', details: error.message },
      { status: 500 }
    );
  }
}
