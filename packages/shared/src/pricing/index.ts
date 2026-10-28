import {
  DEFAULT_CURRENCY,
  DEFAULT_OWNER_SERVICE_FEE_BPS,
  DEFAULT_SITTER_COMMISSION_BPS,
} from '../constants/index.js';

export interface PricingInput {
  baseRateMinor: number;
  unitsCount: number; // e.g. nights for boarding/house sitting, visits for drop-in, walks for walking
  petCount: number;
  additionalPetRateMinor?: number;
  holidayDaysCount?: number;
  holidaySurchargeMinor?: number;
  hasPuppy?: boolean;
  puppySurchargeMinor?: number;
  extendedStayDiscountPercent?: number; // 0 to 50
  extendedStayThresholdUnits?: number; // default 7 units
  ownerFeeBps?: number; // default 700 bps (7%)
  sitterCommissionBps?: number; // default 1200 bps (12%)
  currency?: string;
  coupon?: {
    discountPercent?: number;
    fixedDiscountMinor?: number;
    maxDiscountMinor?: number;
  } | null;
}

export interface PricingLineItem {
  code: string;
  label: string;
  amountMinor: number;
}

export interface PriceBreakdown {
  baseRateMinor: number;
  unitsCount: number;
  petCount: number;
  baseAmountMinor: number;
  additionalPetsMinor: number;
  holidaySurchargeMinor: number;
  puppySurchargeMinor: number;
  extendedStayDiscountMinor: number;
  couponDiscountMinor: number;
  subtotalMinor: number;
  ownerServiceFeeMinor: number;
  ownerTotalMinor: number;
  sitterCommissionMinor: number;
  sitterNetPayoutMinor: number;
  currency: string;
  lineItems: PricingLineItem[];
}

/**
 * Pure, deterministic pricing engine for PawStay bookings.
 * Strictly adheres to integer minor units (zero floating point currency math).
 */
export function calculateBookingPrice(input: PricingInput): PriceBreakdown {
  if (input.unitsCount < 1) {
    throw new Error('unitsCount must be at least 1');
  }
  if (input.petCount < 1) {
    throw new Error('petCount must be at least 1');
  }
  if (input.baseRateMinor <= 0) {
    throw new Error('baseRateMinor must be positive');
  }

  const baseRateMinor = Math.round(input.baseRateMinor);
  const unitsCount = Math.floor(input.unitsCount);
  const petCount = Math.floor(input.petCount);

  const currency = input.currency || DEFAULT_CURRENCY;
  const sym = currency === 'INR' ? '₹' : '$';

  // 1. Base amount for the primary pet
  const baseAmountMinor = baseRateMinor * unitsCount;
  const lineItems: PricingLineItem[] = [
    {
      code: 'BASE_RATE',
      label: `Base rate (${sym}${(baseRateMinor / 100).toFixed(0)} × ${unitsCount} unit${unitsCount > 1 ? 's' : ''})`,
      amountMinor: baseAmountMinor,
    },
  ];

  // 2. Additional pets surcharge
  let additionalPetsMinor = 0;
  if (petCount > 1 && input.additionalPetRateMinor && input.additionalPetRateMinor > 0) {
    const extraPets = petCount - 1;
    additionalPetsMinor = Math.round(input.additionalPetRateMinor * extraPets * unitsCount);
    lineItems.push({
      code: 'ADDITIONAL_PETS',
      label: `Additional pet surcharge (${extraPets} pet${extraPets > 1 ? 's' : ''} × ${sym}${(input.additionalPetRateMinor / 100).toFixed(0)})`,
      amountMinor: additionalPetsMinor,
    });
  }

  // 3. Holiday surcharge
  let holidaySurchargeMinor = 0;
  if (input.holidayDaysCount && input.holidayDaysCount > 0 && input.holidaySurchargeMinor && input.holidaySurchargeMinor > 0) {
    const days = Math.min(input.holidayDaysCount, unitsCount);
    holidaySurchargeMinor = Math.round(input.holidaySurchargeMinor * days * petCount);
    lineItems.push({
      code: 'HOLIDAY_SURCHARGE',
      label: `Holiday peak season surcharge (${days} day${days > 1 ? 's' : ''})`,
      amountMinor: holidaySurchargeMinor,
    });
  }

  // 4. Puppy surcharge
  let puppySurchargeMinor = 0;
  if (input.hasPuppy && input.puppySurchargeMinor && input.puppySurchargeMinor > 0) {
    puppySurchargeMinor = Math.round(input.puppySurchargeMinor * unitsCount);
    lineItems.push({
      code: 'PUPPY_SURCHARGE',
      label: `Puppy high-attention surcharge (${sym}${(input.puppySurchargeMinor / 100).toFixed(0)}/day)`,
      amountMinor: puppySurchargeMinor,
    });
  }

  // Gross before discounts
  const grossSubtotalMinor = baseAmountMinor + additionalPetsMinor + holidaySurchargeMinor + puppySurchargeMinor;

  // 5. Extended stay discount
  let extendedStayDiscountMinor = 0;
  const threshold = input.extendedStayThresholdUnits ?? 7;
  const discountPct = input.extendedStayDiscountPercent ?? 0;
  if (unitsCount >= threshold && discountPct > 0) {
    const validPct = Math.min(50, Math.max(0, discountPct));
    extendedStayDiscountMinor = Math.round((grossSubtotalMinor * validPct) / 100);
    lineItems.push({
      code: 'EXTENDED_STAY_DISCOUNT',
      label: `Extended stay discount (${validPct}%)`,
      amountMinor: -extendedStayDiscountMinor,
    });
  }

  // Sitter Subtotal after extended stay discount
  const subtotalAfterStayDiscount = Math.max(0, grossSubtotalMinor - extendedStayDiscountMinor);

  // 6. Coupon discount
  let couponDiscountMinor = 0;
  if (input.coupon) {
    if (input.coupon.fixedDiscountMinor && input.coupon.fixedDiscountMinor > 0) {
      couponDiscountMinor = Math.min(subtotalAfterStayDiscount, input.coupon.fixedDiscountMinor);
    } else if (input.coupon.discountPercent && input.coupon.discountPercent > 0) {
      const pct = Math.min(100, Math.max(0, input.coupon.discountPercent));
      couponDiscountMinor = Math.round((subtotalAfterStayDiscount * pct) / 100);
    }

    if (input.coupon.maxDiscountMinor && input.coupon.maxDiscountMinor > 0) {
      couponDiscountMinor = Math.min(couponDiscountMinor, input.coupon.maxDiscountMinor);
    }

    if (couponDiscountMinor > 0) {
      lineItems.push({
        code: 'COUPON_DISCOUNT',
        label: 'Promotional coupon discount',
        amountMinor: -couponDiscountMinor,
      });
    }
  }

  const subtotalMinor = Math.max(0, subtotalAfterStayDiscount - couponDiscountMinor);

  // 7. Platform Fees (in Basis Points: 700 = 7%, 1200 = 12%)
  const ownerBps = input.ownerFeeBps ?? DEFAULT_OWNER_SERVICE_FEE_BPS;
  const sitterBps = input.sitterCommissionBps ?? DEFAULT_SITTER_COMMISSION_BPS;

  // Owner Service Fee (7%)
  const ownerServiceFeeMinor = Math.round((subtotalMinor * ownerBps) / 10000);
  lineItems.push({
    code: 'OWNER_SERVICE_FEE',
    label: `PawStay trust & safety fee (${(ownerBps / 100).toFixed(1)}%)`,
    amountMinor: ownerServiceFeeMinor,
  });

  // Total charged to the pet owner
  const ownerTotalMinor = subtotalMinor + ownerServiceFeeMinor;

  // Sitter commission deducted by platform (12%)
  const sitterCommissionMinor = Math.round((subtotalMinor * sitterBps) / 10000);

  // Net payout released to sitter
  const sitterNetPayoutMinor = Math.max(0, subtotalMinor - sitterCommissionMinor);

  return {
    baseRateMinor,
    unitsCount,
    petCount,
    baseAmountMinor,
    additionalPetsMinor,
    holidaySurchargeMinor,
    puppySurchargeMinor,
    extendedStayDiscountMinor,
    couponDiscountMinor,
    subtotalMinor,
    ownerServiceFeeMinor,
    ownerTotalMinor,
    sitterCommissionMinor,
    sitterNetPayoutMinor,
    currency,
    lineItems,
  };
}
