import { PrismaClient, UserRole, ServiceType, BookingStatus, PetSpecies, SitterVerificationStatus, CancellationPolicyType, HomeType, YardSize, LedgerEntryType, DisputeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = [
  { city: 'Bengaluru', state: 'KA', postalCode: '560001', lat: 12.9716, lng: 77.5946, benchmark: 100000 },
  { city: 'Mumbai', state: 'MH', postalCode: '400001', lat: 19.0760, lng: 72.8777, benchmark: 120000 },
  { city: 'Delhi-NCR', state: 'DL', postalCode: '110001', lat: 28.6139, lng: 77.2090, benchmark: 100000 },
  { city: 'Pune', state: 'MH', postalCode: '411001', lat: 18.5204, lng: 73.8567, benchmark: 80000 },
  { city: 'Hyderabad', state: 'TS', postalCode: '500001', lat: 17.3850, lng: 78.4867, benchmark: 90000 },
  { city: 'Austin', state: 'TX', postalCode: '78701', lat: 30.2672, lng: -97.7431, benchmark: 6500 },
  { city: 'Seattle', state: 'WA', postalCode: '98101', lat: 47.6062, lng: -122.3321, benchmark: 7500 },
  { city: 'San Francisco', state: 'CA', postalCode: '94102', lat: 37.7749, lng: -122.4194, benchmark: 8500 },
  { city: 'New York', state: 'NY', postalCode: '10001', lat: 40.7128, lng: -74.0060, benchmark: 9000 },
  { city: 'Denver', state: 'CO', postalCode: '80202', lat: 39.7392, lng: -104.9903, benchmark: 6000 },
];

const DOG_BREEDS = [
  'Indian Pariah Dog / Desi', 'Golden Retriever', 'Labrador Retriever', 'German Shepherd',
  'Beagle', 'Shih Tzu', 'Pomeranian', 'Pug', 'Rottweiler', 'Cocker Spaniel', 'Siberian Husky'
];

const CAT_BREEDS = [
  'Indie Cat', 'Persian', 'Siamese', 'Maine Coon', 'Ragdoll', 'British Shorthair', 'Bengal'
];

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Neha', 'Aditya', 'Sneha',
  'Karan', 'Pooja', 'Rahul', 'Divya', 'Arjun', 'Meera', 'Varun', 'Kavya',
  'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Amanda', 'Robert'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Verma', 'Reddy', 'Iyer', 'Joshi', 'Gupta', 'Singh',
  'Nair', 'Kulkarni', 'Deshmukh', 'Chatterjee', 'Banerjee', 'Rao'
];

const PET_NAMES = [
  'Bella', 'Luna', 'Charlie', 'Lucy', 'Cooper', 'Max', 'Daisy', 'Milo', 'Bailey', 'Sadie',
  'Buddy', 'Lola', 'Rocky', 'Stella', 'Oliver', 'Chloe', 'Bear', 'Penny', 'Tucker', 'Zoey',
  'Duke', 'Lily', 'Leo', 'Rosie', 'Jack', 'Ruby', 'Winston', 'Sophie', 'Toby', 'Gracie',
  'Zeus', 'Coco', 'Bentley', 'Lulu', 'Finn', 'Nala', 'Jasper', 'Ellie', 'Buster', 'Mia',
  'Bo', 'Piper', 'Gus', 'Pepper', 'Dexter', 'Harley', 'Marley', 'Roxy', 'Henry', 'Willow'
];

export async function runSeed() {
  console.log('🌱 Starting PawStay database seeding...');

  const passwordHash = await bcrypt.hash('PawStaySecure2026!', 10);

  // 1. Platform Settings & Benchmarks
  console.log('⚙️ Seeding Platform Settings & Benchmarks...');
  const settings = [
    { key: 'OWNER_SERVICE_FEE_BPS', value: '700', description: 'Owner service fee percentage (7.00%)' },
    { key: 'SITTER_COMMISSION_BPS', value: '1200', description: 'Sitter commission fee percentage (12.00%)' },
    ...CITIES.map(c => ({
      key: `KENNEL_BENCHMARK_${c.city.toUpperCase().replace(/\s+/g, '_')}`,
      value: c.benchmark.toString(),
      description: `Typical commercial kennel nightly price estimate in ${c.city} in minor units`,
    })),
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. Coupons
  console.log('🎟️ Seeding promotional coupons...');
  await prisma.coupon.upsert({
    where: { code: 'PAWFIRST' },
    update: { isActive: true },
    create: {
      code: 'PAWFIRST',
      discountPercent: 15,
      maxDiscountMinor: 3000,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxUses: 1000,
      currentUses: 12,
      isActive: true,
    },
  });

  // 3. Admin & Core Demo Users
  console.log('👥 Seeding core platform users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pawstay.local' },
    update: {},
    create: {
      email: 'admin@pawstay.local',
      name: 'PawStay System Administrator',
      passwordHash,
      roles: [UserRole.ADMIN, UserRole.OWNER],
      isEmailVerified: true,
    },
  });

  const demoOwner = await prisma.user.upsert({
    where: { email: 'owner@pawstay.local' },
    update: {},
    create: {
      email: 'owner@pawstay.local',
      name: 'Alex Rivera (Demo Owner)',
      passwordHash,
      roles: [UserRole.OWNER],
      isEmailVerified: true,
      phoneNumber: '+15125550199',
    },
  });

  const demoSitterUser = await prisma.user.upsert({
    where: { email: 'sitter@pawstay.local' },
    update: {},
    create: {
      email: 'sitter@pawstay.local',
      name: 'Jordan Hayes (Demo Sitter)',
      passwordHash,
      roles: [UserRole.SITTER, UserRole.OWNER],
      isEmailVerified: true,
      phoneNumber: '+15125550188',
    },
  });

  // 4. Seed 50 Sitters
  console.log('🏡 Seeding 50 vetted sitter profiles across 5 metro markets...');
  const sitterProfiles = [];

  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const lastName = LAST_NAMES[i % LAST_NAMES.length]!;
    const cityData = CITIES[i % CITIES.length]!;
    
    // Add realistic jitter (+/- 0.03 deg ~ 1-2 miles)
    const latJitter = (Math.random() - 0.5) * 0.05;
    const lngJitter = (Math.random() - 0.5) * 0.05;
    const exactLat = cityData.lat + latJitter;
    const exactLng = cityData.lng + lngJitter;

    // Obfuscated center point for pre-booking display
    const approxLat = exactLat + (Math.random() - 0.5) * 0.01;
    const approxLng = exactLng + (Math.random() - 0.5) * 0.01;

    const email = i === 0 ? 'sitter@pawstay.local' : `sitter.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@pawstay.local`;
    
    // 3 sitters in PENDING status for admin review testing; rest APPROVED
    const status = i >= 47 ? SitterVerificationStatus.PENDING : SitterVerificationStatus.APPROVED;

    const user = (i === 0) ? demoSitterUser : await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash,
        roles: [UserRole.SITTER, UserRole.OWNER],
        isEmailVerified: true,
        phoneNumber: `+155501${(100 + i).toString().padStart(4, '0')}`,
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?auto=format&fit=crop&w=250&q=80`,
      },
    });

    const sitterProfile = await prisma.sitterProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        headline: `Loving, certified pet care in ${cityData.city} - Large Yard & 24/7 Attention`,
        bio: `Hi there! I am ${firstName}, an experienced pet foster parent and animal lover located in ${cityData.city}. I have over ${(i % 8) + 2} years of dedicated pet care experience. I provide daily photo and video updates, have a clean, smoke-free home with a secure fenced yard, and accommodate special feeding and medication regimens.`,
        yearsOfExperience: (i % 8) + 2,
        addressLine1: `${100 + i * 12} Maple Grove Ave`,
        city: cityData.city,
        state: cityData.state,
        postalCode: cityData.postalCode,
        country: 'USA',
        latitude: exactLat,
        longitude: exactLng,
        approxLatitude: approxLat,
        approxLongitude: approxLng,
        approxRadiusMiles: 0.75,
        cancellationPolicy: i % 3 === 0 ? CancellationPolicyType.FLEXIBLE : i % 3 === 1 ? CancellationPolicyType.MODERATE : CancellationPolicyType.STRICT,
        status,
        ratingBayesian: Number((4.6 + (i % 5) * 0.08).toFixed(2)),
        reviewCount: (i * 3 + 4),
        responseTimeMinutes: 10 + (i % 25),
        responseRatePercent: 96 + (i % 5),
        reliabilityScore: 0.95 + (i % 6) * 0.01,
        instantBookEnabled: i % 2 === 0,
        maxPetCapacity: (i % 3) + 2,
        hasMedicationExperience: i % 2 === 0,
        hasPuppyExperience: i % 3 !== 0,
        hasSeniorExperience: true,
        safetyQuizPassed: true,
        stripeConnectAccountId: `acct_mock_sitter_${i + 1}`,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        approvedAt: status === SitterVerificationStatus.APPROVED ? new Date() : null,
      },
    });

    sitterProfiles.push(sitterProfile);

    // Sitter Verification
    await prisma.sitterVerification.upsert({
      where: { sitterProfileId: sitterProfile.id },
      update: {},
      create: {
        sitterProfileId: sitterProfile.id,
        status,
        idDocumentType: 'DRIVERS_LICENSE',
        idDocumentFrontUrl: 'https://example.com/docs/license-front.jpg',
        selfieUrl: 'https://example.com/docs/selfie.jpg',
        identityCheckStatus: status === SitterVerificationStatus.APPROVED ? 'VERIFIED' : 'PENDING',
        backgroundCheckStatus: status === SitterVerificationStatus.APPROVED ? 'CLEAR' : 'PENDING',
        backgroundCheckRef: `CHK-2026-${1000 + i}`,
        reviewedByUserId: admin.id,
        reviewedAt: status === SitterVerificationStatus.APPROVED ? new Date() : null,
      },
    });

    // Home Profile
    await prisma.homeProfile.upsert({
      where: { sitterProfileId: sitterProfile.id },
      update: {},
      create: {
        sitterProfileId: sitterProfile.id,
        homeType: i % 3 === 0 ? HomeType.HOUSE : i % 3 === 1 ? HomeType.APARTMENT : HomeType.CONDO,
        hasFencedYard: i % 2 === 0,
        yardSize: i % 2 === 0 ? YardSize.LARGE : YardSize.NONE,
        hasOtherPetsInHome: i % 3 === 0,
        otherPetsDetails: i % 3 === 0 ? 'One gentle 5-year-old Golden Retriever' : 'No other pets currently in home',
        hasChildrenInHome: i % 4 === 0,
        isSmokingFree: true,
        allowsPetsOnFurniture: true,
      },
    });

    // Services
    const baseBoardingRate = 4500 + (i % 5) * 500; // $45 - $65
    const services = [
      { serviceType: ServiceType.BOARDING, baseRateMinor: baseBoardingRate },
      { serviceType: ServiceType.HOUSE_SITTING, baseRateMinor: baseBoardingRate + 1000 },
      { serviceType: ServiceType.DROP_IN, baseRateMinor: 2500 + (i % 3) * 300 },
      { serviceType: ServiceType.DAY_CARE, baseRateMinor: 3500 + (i % 4) * 400 },
      { serviceType: ServiceType.WALKING, baseRateMinor: 2200 + (i % 3) * 200 },
    ];

    for (const svc of services) {
      await prisma.service.upsert({
        where: {
          sitterProfileId_serviceType: {
            sitterProfileId: sitterProfile.id,
            serviceType: svc.serviceType,
          },
        },
        update: {},
        create: {
          sitterProfileId: sitterProfile.id,
          serviceType: svc.serviceType,
          isActive: true,
          baseRateMinor: svc.baseRateMinor,
          additionalPetRateMinor: Math.round(svc.baseRateMinor * 0.5),
          holidaySurchargeMinor: 1500,
          puppySurchargeMinor: 1000,
          extendedStayDiscountPercent: 10,
        },
      });
    }
  }

  // 5. Seed 100 Pets across Demo and Additional Owners
  console.log('🐾 Seeding 100 detailed pet profiles...');
  const pets = [];
  const owners = [demoOwner];

  // Create 20 more pet owners
  for (let o = 1; o <= 20; o++) {
    const ownerUser = await prisma.user.upsert({
      where: { email: `owner.${o}@pawstay.local` },
      update: {},
      create: {
        email: `owner.${o}@pawstay.local`,
        name: `Pet Parent ${o}`,
        passwordHash,
        roles: [UserRole.OWNER],
        isEmailVerified: true,
      },
    });
    owners.push(ownerUser);
  }

  for (let p = 0; p < 100; p++) {
    const owner = owners[p % owners.length]!;
    const isDog = p % 4 !== 0; // 75% dogs, 25% cats
    const species = isDog ? PetSpecies.DOG : PetSpecies.CAT;
    const name = PET_NAMES[p % PET_NAMES.length]! + (p >= 50 ? ` II` : '');
    const breed = isDog ? DOG_BREEDS[p % DOG_BREEDS.length]! : CAT_BREEDS[p % CAT_BREEDS.length]!;
    const weightLbs = isDog ? 15 + (p % 65) : 8 + (p % 8);

    const pet = await prisma.pet.create({
      data: {
        ownerId: owner.id,
        name,
        species,
        breed,
        ageYears: (p % 12) + 1,
        weightLbs,
        isSpayedNeutered: true,
        temperamentFlags: isDog
          ? ['friendly', 'potty_trained', 'good_with_dogs', p % 3 === 0 ? 'needs_slow_introduction' : 'energetic']
          : ['indoor_only', 'calm', 'litterbox_trained'],
        feedingSchedule: '1 cup premium dry food at 8:00 AM and 6:00 PM with fresh water bowl',
        medications: p % 5 === 0 ? 'Half tablet joint supplement with breakfast' : null,
        allergies: p % 7 === 0 ? 'Chicken byproduct sensitivity (eats lamb/salmon)' : 'None known',
        vetName: 'Dr. Katherine Wells, DVM',
        vetPhone: '+15125550144',
        vetClinic: 'Central City Animal Hospital',
        microchipId: `98514100${200000 + p}`,
        emergencyContactName: 'Taylor Morgan (Neighbor)',
        emergencyContactPhone: '+15125550145',
        vaccinationUrls: ['https://example.com/records/rabies-certificate.pdf'],
        photoUrl: `https://images.unsplash.com/photo-${1510000000000 + p * 1234}?auto=format&fit=crop&w=300&q=80`,
      },
    });

    pets.push(pet);
  }

  // 6. Seed Bookings in All 13 State Machine Statuses
  console.log('📅 Seeding bookings across all 13 states with ledger and payments...');
  const ALL_STATUSES: BookingStatus[] = [
    BookingStatus.DRAFT,
    BookingStatus.REQUESTED,
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.EXPIRED,
    BookingStatus.PAID_HELD,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
    BookingStatus.PAYOUT_RELEASED,
    BookingStatus.CANCELLED_BY_OWNER,
    BookingStatus.CANCELLED_BY_SITTER,
    BookingStatus.DISPUTED,
    BookingStatus.REFUNDED,
  ];

  for (let b = 0; b < ALL_STATUSES.length * 2; b++) {
    const status = ALL_STATUSES[b % ALL_STATUSES.length]!;
    const sitter = sitterProfiles[b % sitterProfiles.length]!;
    const owner = owners[b % owners.length]!;
    const selectedPet = pets[b % pets.length]!;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (status === BookingStatus.COMPLETED || status === BookingStatus.PAYOUT_RELEASED ? -5 : 5));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // 3 nights

    const unitPriceMinor = 5000; // $50/night
    const unitsCount = 3;
    const baseAmountMinor = 15000;
    const subtotalMinor = 15000;
    const ownerServiceFeeMinor = Math.round(subtotalMinor * 0.07); // 7% = $10.50 -> 1050
    const ownerTotalMinor = subtotalMinor + ownerServiceFeeMinor; // 16050 ($160.50)
    const sitterCommissionMinor = Math.round(subtotalMinor * 0.12); // 12% = $18.00 -> 1800
    const sitterNetPayoutMinor = subtotalMinor - sitterCommissionMinor; // 13200 ($132.00)

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `PAW-2026-${(10000 + b).toString()}`,
        ownerId: owner.id,
        sitterId: sitter.id,
        serviceType: ServiceType.BOARDING,
        status,
        startDate,
        endDate,
        unitsCount,
        unitPriceMinor,
        baseAmountMinor,
        subtotalMinor,
        ownerServiceFeeMinor,
        ownerTotalMinor,
        sitterCommissionMinor,
        sitterNetPayoutMinor,
        specialInstructions: 'Loves evening belly rubs. Please keep harness on during outside walks.',
        vetEmergencyLimitMinor: 50000,
        paidAt: ['PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED', 'REFUNDED'].includes(status) ? new Date() : null,
        startedAt: ['IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED'].includes(status) ? startDate : null,
        completedAt: ['COMPLETED', 'PAYOUT_RELEASED'].includes(status) ? endDate : null,
        payoutReleasedAt: status === BookingStatus.PAYOUT_RELEASED ? new Date() : null,
        cancelledAt: status.startsWith('CANCELLED') ? new Date() : null,
        cancelReason: status === BookingStatus.CANCELLED_BY_OWNER ? 'Travel flight rescheduled' : null,
        cancellationRefundMinor: status.startsWith('CANCELLED') || status === BookingStatus.REFUNDED ? ownerTotalMinor : null,
      },
    });

    // Attach pet to booking
    await prisma.bookingPet.create({
      data: {
        bookingId: booking.id,
        petId: selectedPet.id,
      },
    });

    // Add financial records & double-entry ledger entries for paid bookings
    if (['PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED', 'REFUNDED'].includes(status)) {
      const pi = await prisma.paymentIntent.create({
        data: {
          bookingId: booking.id,
          providerPaymentId: `pi_mock_${booking.id}`,
          clientSecret: `pi_mock_secret_${booking.id}`,
          amountMinor: ownerTotalMinor,
          currency: 'INR',
          status: 'SUCCEEDED',
          idempotencyKey: `idem_pi_${booking.id}`,
        },
      });

      await prisma.charge.create({
        data: {
          bookingId: booking.id,
          paymentIntentId: pi.id,
          providerChargeId: `ch_mock_${booking.id}`,
          amountMinor: ownerTotalMinor,
          currency: 'INR',
          feeMinor: 480, // Stripe processing fee approx
        },
      });

      // Balanced Double-Entry Ledger:
      // Debit: Stripe Clearing
      // Credit: Owner Service Fee (Platform Revenue) & Sitter Payable
      await prisma.ledgerEntry.create({
        data: {
          bookingId: booking.id,
          entryType: LedgerEntryType.CHARGE,
          debitAccount: 'STRIPE_CLEARING',
          creditAccount: 'ESCROW_HOLD',
          amountMinor: ownerTotalMinor,
          currency: 'INR',
          idempotencyKey: `ledger_charge_${booking.id}`,
          description: `Authorized charge hold for booking ${booking.bookingNumber}`,
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          bookingId: booking.id,
          entryType: LedgerEntryType.OWNER_SERVICE_FEE,
          debitAccount: 'ESCROW_HOLD',
          creditAccount: 'PLATFORM_REVENUE',
          amountMinor: ownerServiceFeeMinor,
          currency: 'INR',
          idempotencyKey: `ledger_owner_fee_${booking.id}`,
          description: `Platform 7% service fee revenue for booking ${booking.bookingNumber}`,
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          bookingId: booking.id,
          entryType: LedgerEntryType.SITTER_PAYABLE,
          debitAccount: 'ESCROW_HOLD',
          creditAccount: 'SITTER_PAYABLE',
          amountMinor: sitterNetPayoutMinor,
          currency: 'INR',
          idempotencyKey: `ledger_sitter_payable_${booking.id}`,
          description: `Sitter payable after 12% commission for booking ${booking.bookingNumber}`,
        },
      });

      // If Payout Released, debit Sitter Payable and record transfer
      if (status === BookingStatus.PAYOUT_RELEASED) {
        await prisma.payout.create({
          data: {
            bookingId: booking.id,
            sitterId: sitter.id,
            providerPayoutId: `tr_mock_${booking.id}`,
            amountMinor: sitterNetPayoutMinor,
            currency: 'INR',
            status: 'PAID',
            scheduledReleaseAt: new Date(Date.now() - 3600000),
            releasedAt: new Date(),
            idempotencyKey: `idem_payout_${booking.id}`,
          },
        });

        await prisma.ledgerEntry.create({
          data: {
            bookingId: booking.id,
            entryType: LedgerEntryType.PAYOUT_SITTER,
            debitAccount: 'SITTER_PAYABLE',
            creditAccount: 'STRIPE_TRANSFER_OUT',
            amountMinor: sitterNetPayoutMinor,
            currency: 'INR',
            idempotencyKey: `ledger_payout_${booking.id}`,
            description: `Transferred payout to sitter Stripe Connect account for ${booking.bookingNumber}`,
          },
        });
      }

      // If Refunded, record refund entry
      if (status === BookingStatus.REFUNDED) {
        await prisma.refund.create({
          data: {
            bookingId: booking.id,
            providerRefundId: `re_mock_${booking.id}`,
            amountMinor: ownerTotalMinor,
            currency: 'INR',
            reason: 'Requested by owner within cancellation window',
            idempotencyKey: `idem_refund_${booking.id}`,
          },
        });

        await prisma.ledgerEntry.create({
          data: {
            bookingId: booking.id,
            entryType: LedgerEntryType.REFUND_OWNER,
            debitAccount: 'ESCROW_HOLD',
            creditAccount: 'STRIPE_REFUND_OUT',
            amountMinor: ownerTotalMinor,
            currency: 'INR',
            idempotencyKey: `ledger_refund_${booking.id}`,
            description: `Refunded full booking charge to owner for ${booking.bookingNumber}`,
          },
        });
      }
    }

    // Stay Updates for In-Progress or Completed
    if (['IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED'].includes(status)) {
      await prisma.updatePost.create({
        data: {
          bookingId: booking.id,
          sitterId: sitter.id,
          text: `Great afternoon walk with ${selectedPet.name}! Had lots of fun exploring the park and had a hearty dinner.`,
          mediaUrls: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80'],
          peeCount: 2,
          poopCount: 1,
          fedMeal: true,
          medsAdministered: false,
        },
      });
    }

    // Reviews for Completed Bookings
    if (status === BookingStatus.COMPLETED || status === BookingStatus.PAYOUT_RELEASED) {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          authorId: owner.id,
          targetId: sitter.userId,
          authorRole: UserRole.OWNER,
          rating: 5,
          title: 'Wonderful stay!',
          content: `${sitter.headline} was fantastic! Constant updates, loving care, and our pet came home happy and calm. Highly recommended.`,
          cleanlinessRating: 5,
          communicationRating: 5,
          timelinessRating: 5,
          careQualityRating: 5,
          isRecommended: true,
          isBlind: false,
          revealedAt: new Date(),
        },
      });
    }

    // Dispute sample
    if (status === BookingStatus.DISPUTED) {
      await prisma.dispute.create({
        data: {
          bookingId: booking.id,
          initiatorId: owner.id,
          reason: 'Sitter arrived late for scheduled check-in',
          description: 'Sitter was delayed by 2 hours on check-in day without advance notice. Requesting partial refund for day 1.',
          status: DisputeStatus.OPENED,
          requestedRefundMinor: 5000,
        },
      });
    }
  }

  console.log('✅ PawStay database seeding completed successfully!');
  console.log('========================================================');
  console.log('Admin Demo Login:  admin@pawstay.local  / PawStaySecure2026!');
  console.log('Owner Demo Login:  owner@pawstay.local  / PawStaySecure2026!');
  console.log('Sitter Demo Login: sitter@pawstay.local / PawStaySecure2026!');
  console.log('Dual Demo Login:   dual@pawstay.local   / PawStaySecure2026!');
  console.log('========================================================');
}

if (process.env.NODE_ENV !== 'test') {
  runSeed()
    .catch((e) => {
      console.error('❌ Error during seed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
