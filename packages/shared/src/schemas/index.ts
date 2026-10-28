import { z } from 'zod';

export const UserRoleSchema = z.enum(['OWNER', 'SITTER', 'ADMIN']);
export const ServiceTypeSchema = z.enum([
  'BOARDING',
  'HOUSE_SITTING',
  'DROP_IN',
  'DAY_CARE',
  'WALKING',
]);
export const PetSpeciesSchema = z.enum(['DOG', 'CAT']);
export const PetWeightClassSchema = z.enum(['SMALL', 'MEDIUM', 'LARGE', 'GIANT']);
export const CancellationPolicySchema = z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']);

// Pet Registration & Update Schema
export const PetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50),
  species: PetSpeciesSchema,
  breed: z.string().min(1, 'Breed is required').max(100),
  ageYears: z.number().int().min(0).max(30),
  weightLbs: z.number().positive().max(300),
  isSpayedNeutered: z.boolean(),
  temperamentFlags: z.array(z.string()).default([]),
  medications: z.string().optional().default(''),
  feedingSchedule: z.string().min(1, 'Feeding schedule is required'),
  allergies: z.string().optional().default(''),
  microchipId: z.string().optional(),
  vetName: z.string().min(1, 'Veterinarian name is required'),
  vetPhone: z.string().min(7, 'Valid veterinarian phone number is required'),
  vetClinic: z.string().optional().default(''),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(7, 'Emergency contact phone is required'),
  vaccinationDocumentUrls: z.array(z.string().url()).default([]),
  photoUrl: z.string().url().optional(),
});

export const CreatePetSchema = PetSchema;
export const UpdatePetSchema = PetSchema.partial();

// Sitter Service Rate Schema
export const ServiceRateSchema = z.object({
  serviceType: ServiceTypeSchema,
  isActive: z.boolean().default(true),
  baseRateMinor: z.number().int().positive('Base rate must be positive'),
  additionalPetRateMinor: z.number().int().nonnegative().default(0),
  holidaySurchargeMinor: z.number().int().nonnegative().default(0),
  puppySurchargeMinor: z.number().int().nonnegative().default(0),
  extendedStayDiscountPercent: z.number().int().min(0).max(50).default(0),
});

// Sitter Home Profile Schema
export const HomeProfileSchema = z.object({
  homeType: z.enum(['HOUSE', 'APARTMENT', 'CONDO']),
  hasFencedYard: z.boolean(),
  yardSize: z.enum(['NONE', 'SMALL', 'MEDIUM', 'LARGE']).default('NONE'),
  hasOtherPetsInHome: z.boolean(),
  otherPetsDetails: z.string().optional().default(''),
  hasChildrenInHome: z.boolean(),
  isSmokingFree: z.boolean().default(true),
  allowsPetsOnFurniture: z.boolean().default(true),
  photos: z.array(z.string().url()).default([]),
});

// Sitter Profile Onboarding Schema
export const SitterOnboardingSchema = z.object({
  headline: z.string().min(10, 'Headline must be at least 10 characters').max(120),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(2000),
  yearsOfExperience: z.number().int().min(0).max(60),
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(5, 'Postal code is required'),
  country: z.string().default('USA'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  cancellationPolicy: CancellationPolicySchema.default('MODERATE'),
  services: z.array(ServiceRateSchema).min(1, 'At least one service must be offered'),
  homeProfile: HomeProfileSchema,
  acceptedPetSpecies: z.array(PetSpeciesSchema).min(1),
  maxPetCapacity: z.number().int().min(1).max(10).default(2),
  hasExperienceWithMedication: z.boolean().default(false),
  hasExperienceWithPuppies: z.boolean().default(false),
  hasExperienceWithSeniors: z.boolean().default(false),
  instantBookEnabled: z.boolean().default(false),
});

// Safety Quiz Schema
export const SafetyQuizSubmissionSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionIndex: z.number().int(),
    })
  ),
});

// Sitter Search Schema
export const SitterSearchQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMiles: z.coerce.number().positive().max(100).default(20),
  serviceType: ServiceTypeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  species: z
    .union([PetSpeciesSchema, z.array(PetSpeciesSchema)])
    .transform((val) => (Array.isArray(val) ? val : [val]))
    .default(['DOG']),
  petCount: z.coerce.number().int().min(1).max(10).default(1),
  fencedYardOnly: z.coerce.boolean().optional(),
  noOtherPets: z.coerce.boolean().optional(),
  hasMedicationExperience: z.coerce.boolean().optional(),
  hasPuppyExperience: z.coerce.boolean().optional(),
  hasSeniorExperience: z.coerce.boolean().optional(),
  instantBookOnly: z.coerce.boolean().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  minPriceMinor: z.coerce.number().int().positive().optional(),
  maxPriceMinor: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'distance']).default('relevance'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Booking Quote Calculation Schema
export const PriceQuoteRequestSchema = z.object({
  sitterId: z.string(),
  serviceType: ServiceTypeSchema,
  startDate: z.string(),
  endDate: z.string(),
  petIds: z.array(z.string()).min(1, 'At least one pet must be selected'),
  couponCode: z.string().optional(),
});

// Booking Creation Schema
export const CreateBookingRequestSchema = z.object({
  sitterId: z.string().min(1),
  serviceType: ServiceTypeSchema,
  startDate: z.string(),
  endDate: z.string(),
  petIds: z.array(z.string()).min(1, 'At least one pet is required'),
  specialInstructions: z.string().max(1000).optional().default(''),
  vetEmergencyAuthorizationMinor: z
    .number()
    .int()
    .min(10000, 'Minimum emergency authorization is $100 (10000 cents)')
    .default(50000), // Default $500
  isMeetAndGreetFirst: z.boolean().default(false),
  instantBook: z.boolean().default(false),
});

// Double-Blind Review Submission Schema
export const SubmitReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().min(10, 'Review text must be at least 10 characters').max(2000),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  timelinessRating: z.number().int().min(1).max(5).optional(),
  careQualityRating: z.number().int().min(1).max(5).optional(),
  isRecommended: z.boolean().default(true),
});

// Stay Update Post Schema (Sitter posting photo/video/text)
export const CreateUpdatePostSchema = z.object({
  bookingId: z.string(),
  text: z.string().min(1).max(1000),
  mediaUrls: z.array(z.string().url()).default([]),
  peeBreakCount: z.number().int().min(0).optional(),
  poopBreakCount: z.number().int().min(0).optional(),
  fedMeal: z.boolean().optional(),
  administeredMedication: z.boolean().optional(),
});

// Dispute Creation Schema
export const CreateDisputeSchema = z.object({
  bookingId: z.string(),
  reason: z.string().min(10).max(500),
  description: z.string().min(20).max(2500),
  evidenceUrls: z.array(z.string().url()).default([]),
  requestedRefundMinor: z.number().int().positive().optional(),
});

// User Report Schema
export const CreateReportSchema = z.object({
  reportedUserId: z.string(),
  conversationId: z.string().optional(),
  bookingId: z.string().optional(),
  reason: z.enum([
    'OFF_PLATFORM_PAYMENT_REQUEST',
    'HARASSMENT_OR_ABUSE',
    'SAFETY_CONCERN',
    'FRAUD_OR_IMPERSONATION',
    'ANIMAL_WELFARE',
    'OTHER',
  ]),
  details: z.string().min(10).max(2000),
});
