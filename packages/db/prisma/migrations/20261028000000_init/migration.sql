-- CreateExtension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'SITTER', 'ADMIN');
CREATE TYPE "ServiceType" AS ENUM ('BOARDING', 'HOUSE_SITTING', 'DROP_IN', 'DAY_CARE', 'WALKING');
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'PAID_HELD', 'IN_PROGRESS', 'COMPLETED', 'PAYOUT_RELEASED', 'CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER', 'DISPUTED', 'REFUNDED');
CREATE TYPE "PetSpecies" AS ENUM ('DOG', 'CAT');
CREATE TYPE "SitterVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');
CREATE TYPE "CancellationPolicyType" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');
CREATE TYPE "HomeType" AS ENUM ('HOUSE', 'APARTMENT', 'CONDO');
CREATE TYPE "YardSize" AS ENUM ('NONE', 'SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "LedgerEntryType" AS ENUM ('CHARGE', 'OWNER_SERVICE_FEE', 'SITTER_PAYABLE', 'SITTER_COMMISSION', 'REFUND_OWNER', 'PAYOUT_SITTER');
CREATE TYPE "DisputeStatus" AS ENUM ('OPENED', 'UNDER_INVESTIGATION', 'RESOLVED_REFUND', 'RESOLVED_PAYOUT', 'DISMISSED');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'ACTIONED', 'DISMISSED');
CREATE TYPE "ReportReason" AS ENUM ('OFF_PLATFORM_PAYMENT_REQUEST', 'HARASSMENT_OR_ABUSE', 'SAFETY_CONCERN', 'FRAUD_OR_IMPERSONATION', 'ANIMAL_WELFARE', 'OTHER');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phoneNumber" TEXT,
    "roles" "UserRole"[] DEFAULT ARRAY['OWNER']::"UserRole"[],
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Profile
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable SitterProfile
CREATE TABLE "SitterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 1,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "approxLatitude" DOUBLE PRECISION NOT NULL,
    "approxLongitude" DOUBLE PRECISION NOT NULL,
    "approxRadiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "cancellationPolicy" "CancellationPolicyType" NOT NULL DEFAULT 'MODERATE',
    "status" "SitterVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "ratingBayesian" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMinutes" INTEGER NOT NULL DEFAULT 15,
    "responseRatePercent" INTEGER NOT NULL DEFAULT 100,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "instantBookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxPetCapacity" INTEGER NOT NULL DEFAULT 2,
    "acceptedSpecies" "PetSpecies"[] DEFAULT ARRAY['DOG', 'CAT']::"PetSpecies"[],
    "hasMedicationExperience" BOOLEAN NOT NULL DEFAULT false,
    "hasPuppyExperience" BOOLEAN NOT NULL DEFAULT false,
    "hasSeniorExperience" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectAccountId" TEXT,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "safetyQuizPassed" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable SitterVerification
CREATE TABLE "SitterVerification" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "status" "SitterVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "idDocumentType" TEXT,
    "idDocumentFrontUrl" TEXT,
    "idDocumentBackUrl" TEXT,
    "selfieUrl" TEXT,
    "identityCheckStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "backgroundCheckStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "backgroundCheckRef" TEXT,
    "adminNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitterVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable HomeProfile
CREATE TABLE "HomeProfile" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "homeType" "HomeType" NOT NULL DEFAULT 'HOUSE',
    "hasFencedYard" BOOLEAN NOT NULL DEFAULT false,
    "yardSize" "YardSize" NOT NULL DEFAULT 'NONE',
    "hasOtherPetsInHome" BOOLEAN NOT NULL DEFAULT false,
    "otherPetsDetails" TEXT,
    "hasChildrenInHome" BOOLEAN NOT NULL DEFAULT false,
    "isSmokingFree" BOOLEAN NOT NULL DEFAULT true,
    "allowsPetsOnFurniture" BOOLEAN NOT NULL DEFAULT true,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable Service
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baseRateMinor" INTEGER NOT NULL,
    "additionalPetRateMinor" INTEGER NOT NULL DEFAULT 2000,
    "holidaySurchargeMinor" INTEGER NOT NULL DEFAULT 1500,
    "puppySurchargeMinor" INTEGER NOT NULL DEFAULT 1000,
    "extendedStayDiscountPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable Availability
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isRecurringRule" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable Pet
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" "PetSpecies" NOT NULL DEFAULT 'DOG',
    "breed" TEXT NOT NULL,
    "ageYears" INTEGER NOT NULL,
    "weightLbs" DOUBLE PRECISION NOT NULL,
    "isSpayedNeutered" BOOLEAN NOT NULL DEFAULT true,
    "temperamentFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medications" TEXT,
    "feedingSchedule" TEXT NOT NULL,
    "allergies" TEXT,
    "vetName" TEXT NOT NULL,
    "vetPhone" TEXT NOT NULL,
    "vetClinic" TEXT,
    "microchipId" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "vaccinationUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrl" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable Booking
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "unitsCount" INTEGER NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "baseAmountMinor" INTEGER NOT NULL,
    "additionalPetsSurchargeMinor" INTEGER NOT NULL DEFAULT 0,
    "holidaySurchargeMinor" INTEGER NOT NULL DEFAULT 0,
    "puppySurchargeMinor" INTEGER NOT NULL DEFAULT 0,
    "extendedStayDiscountMinor" INTEGER NOT NULL DEFAULT 0,
    "subtotalMinor" INTEGER NOT NULL,
    "ownerServiceFeeMinor" INTEGER NOT NULL,
    "ownerTotalMinor" INTEGER NOT NULL,
    "sitterCommissionMinor" INTEGER NOT NULL,
    "sitterNetPayoutMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "specialInstructions" TEXT,
    "vetEmergencyLimitMinor" INTEGER NOT NULL DEFAULT 50000,
    "cancellationPolicy" "CancellationPolicyType" NOT NULL DEFAULT 'MODERATE',
    "paidAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "payoutReleasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "cancellationRefundMinor" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable BookingPet
CREATE TABLE "BookingPet" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPet_pkey" PRIMARY KEY ("id")
);

-- CreateTable PaymentIntent
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "rawEvent" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable Charge
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "providerChargeId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "feeMinor" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable Payout
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "providerPayoutId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledReleaseAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable Refund
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable LedgerEntry
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "debitAccount" TEXT NOT NULL,
    "creditAccount" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "idempotencyKey" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable Conversation
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "ownerId" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "maskedText" TEXT,
    "hasOffPlatformAttempt" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable Review
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "authorRole" "UserRole" NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "cleanlinessRating" INTEGER,
    "communicationRating" INTEGER,
    "timelinessRating" INTEGER,
    "careQualityRating" INTEGER,
    "isRecommended" BOOLEAN NOT NULL DEFAULT true,
    "isBlind" BOOLEAN NOT NULL DEFAULT true,
    "revealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable UpdatePost
CREATE TABLE "UpdatePost" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sitterId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "peeCount" INTEGER DEFAULT 0,
    "poopCount" INTEGER DEFAULT 0,
    "fedMeal" BOOLEAN DEFAULT false,
    "medsAdministered" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdatePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable Dispute
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requestedRefundMinor" INTEGER,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPENED',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable Report
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "conversationId" TEXT,
    "bookingId" TEXT,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldState" JSONB,
    "newState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable PlatformSetting
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable Coupon
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "maxDiscountMinor" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- Constraints, Indices, Foreign Keys
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

CREATE UNIQUE INDEX "SitterProfile_userId_key" ON "SitterProfile"("userId");
CREATE INDEX "SitterProfile_status_city_idx" ON "SitterProfile"("status", "city");
CREATE INDEX "SitterProfile_latitude_longitude_idx" ON "SitterProfile"("latitude", "longitude");
CREATE INDEX "SitterProfile_ratingBayesian_reviewCount_idx" ON "SitterProfile"("ratingBayesian", "reviewCount");

CREATE UNIQUE INDEX "SitterVerification_sitterProfileId_key" ON "SitterVerification"("sitterProfileId");
CREATE UNIQUE INDEX "HomeProfile_sitterProfileId_key" ON "HomeProfile"("sitterProfileId");

CREATE UNIQUE INDEX "Service_sitterProfileId_serviceType_key" ON "Service"("sitterProfileId", "serviceType");
CREATE INDEX "Service_serviceType_isActive_baseRateMinor_idx" ON "Service"("serviceType", "isActive", "baseRateMinor");

CREATE UNIQUE INDEX "Availability_sitterProfileId_date_key" ON "Availability"("sitterProfileId", "date");
CREATE INDEX "Availability_sitterProfileId_date_isBlocked_idx" ON "Availability"("sitterProfileId", "date", "isBlocked");

CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");

CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE INDEX "Booking_ownerId_status_idx" ON "Booking"("ownerId", "status");
CREATE INDEX "Booking_sitterId_status_idx" ON "Booking"("sitterId", "status");
CREATE INDEX "Booking_startDate_endDate_idx" ON "Booking"("startDate", "endDate");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

CREATE UNIQUE INDEX "BookingPet_bookingId_petId_key" ON "BookingPet"("bookingId", "petId");

CREATE UNIQUE INDEX "PaymentIntent_providerPaymentId_key" ON "PaymentIntent"("providerPaymentId");
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");
CREATE INDEX "PaymentIntent_bookingId_idx" ON "PaymentIntent"("bookingId");

CREATE UNIQUE INDEX "Charge_providerChargeId_key" ON "Charge"("providerChargeId");
CREATE INDEX "Charge_bookingId_idx" ON "Charge"("bookingId");

CREATE UNIQUE INDEX "Payout_providerPayoutId_key" ON "Payout"("providerPayoutId");
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");
CREATE INDEX "Payout_bookingId_idx" ON "Payout"("bookingId");
CREATE INDEX "Payout_sitterId_status_idx" ON "Payout"("sitterId", "status");
CREATE INDEX "Payout_scheduledReleaseAt_status_idx" ON "Payout"("scheduledReleaseAt", "status");

CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");

CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");
CREATE INDEX "LedgerEntry_bookingId_idx" ON "LedgerEntry"("bookingId");
CREATE INDEX "LedgerEntry_entryType_idx" ON "LedgerEntry"("entryType");

CREATE UNIQUE INDEX "Conversation_bookingId_key" ON "Conversation"("bookingId");
CREATE UNIQUE INDEX "Conversation_ownerId_sitterId_key" ON "Conversation"("ownerId", "sitterId");
CREATE INDEX "Conversation_ownerId_idx" ON "Conversation"("ownerId");
CREATE INDEX "Conversation_sitterId_idx" ON "Conversation"("sitterId");

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

CREATE UNIQUE INDEX "Review_bookingId_authorId_key" ON "Review"("bookingId", "authorId");
CREATE INDEX "Review_targetId_isBlind_idx" ON "Review"("targetId", "isBlind");
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");

CREATE INDEX "UpdatePost_bookingId_createdAt_idx" ON "UpdatePost"("bookingId", "createdAt");
CREATE INDEX "Dispute_bookingId_idx" ON "Dispute"("bookingId");
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");
CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");
CREATE INDEX "PlatformSetting_key_idx" ON "PlatformSetting"("key");
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_code_isActive_idx" ON "Coupon"("code", "isActive");

-- Add Foreign Keys
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SitterProfile" ADD CONSTRAINT "SitterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SitterVerification" ADD CONSTRAINT "SitterVerification_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HomeProfile" ADD CONSTRAINT "HomeProfile_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingPet" ADD CONSTRAINT "BookingPet_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingPet" ADD CONSTRAINT "BookingPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UpdatePost" ADD CONSTRAINT "UpdatePost_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UpdatePost" ADD CONSTRAINT "UpdatePost_sitterId_fkey" FOREIGN KEY ("sitterId") REFERENCES "SitterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
