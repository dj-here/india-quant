/**
 * Core domain types and interfaces for PawStay
 */

export type UserRole = 'OWNER' | 'SITTER' | 'ADMIN';

export type ServiceType =
  | 'BOARDING'
  | 'HOUSE_SITTING'
  | 'DROP_IN'
  | 'DAY_CARE'
  | 'WALKING';

export type BookingStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'PAID_HELD'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYOUT_RELEASED'
  | 'CANCELLED_BY_OWNER'
  | 'CANCELLED_BY_SITTER'
  | 'DISPUTED'
  | 'REFUNDED';

export type PetSpecies = 'DOG' | 'CAT';

export type PetWeightClass = 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';

export type SitterVerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED';

export type CancellationPolicyType = 'FLEXIBLE' | 'MODERATE' | 'STRICT';

export type DisputeStatus =
  | 'OPENED'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_PAYOUT'
  | 'DISMISSED';

export type ReportStatus = 'PENDING' | 'ACTIONED' | 'DISMISSED';

export type LedgerEntryType =
  | 'CHARGE'
  | 'OWNER_SERVICE_FEE'
  | 'SITTER_PAYABLE'
  | 'SITTER_COMMISSION'
  | 'REFUND_OWNER'
  | 'PAYOUT_SITTER';

export interface MoneyMinor {
  amount: number; // Integer minor units (e.g., 2500 for $25.00)
  currency: string; // ISO 4217, e.g. "USD"
}

export interface PriceBreakdown {
  currency: string;
  unitPriceMinor: number;
  units: number; // days or visits or walks
  baseAmountMinor: number;
  additionalPetsCount: number;
  additionalPetsSurchargeMinor: number;
  holidaySurchargeMinor: number;
  puppySurchargeMinor: number;
  extendedStayDiscountMinor: number;
  subtotalMinor: number; // sitter base before platform fee
  ownerServiceFeeMinor: number;
  ownerTotalMinor: number; // Total charged to pet owner
  sitterCommissionMinor: number;
  sitterNetPayoutMinor: number; // Total paid to sitter
}

export interface SitterRankingComponents {
  relevanceScore: number; // 0..1
  bayesianRatingScore: number; // 0..1
  responseQualityScore: number; // 0..1
  reliabilityScore: number; // 0..1
  completenessScore: number; // 0..1
  priceScore: number; // 0..1
  timeDecayNewSitterBoost: number; // 0..1 boost factor
  finalCompositeScore: number; // 0..1
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ObfuscatedLocation {
  approximateLatitude: number;
  approximateLongitude: number;
  city: string;
  state: string;
  postalCode: string;
  radiusMiles: number; // Radius within which sitter resides (typically 0.5 - 1.0 mi)
}

export interface SitterSearchFilters {
  latitude: number;
  longitude: number;
  radiusMiles?: number;
  serviceType: ServiceType;
  startDate: string; // ISO date
  endDate: string; // ISO date
  petSpecies: PetSpecies[];
  petCount: number;
  fencedYardOnly?: boolean;
  noOtherPets?: boolean;
  hasMedicationExperience?: boolean;
  hasPuppyExperience?: boolean;
  hasSeniorExperience?: boolean;
  instantBookOnly?: boolean;
  verifiedOnly?: boolean;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
  limit?: number;
  offset?: number;
}
