import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from './index.js';

describe('Pricing Engine: calculateBookingPrice', () => {
  it('throws on invalid inputs (0 or negative units, pets, baseRate)', () => {
    expect(() =>
      calculateBookingPrice({ baseRateMinor: 5000, unitsCount: 0, petCount: 1 })
    ).toThrow('unitsCount must be at least 1');

    expect(() =>
      calculateBookingPrice({ baseRateMinor: 5000, unitsCount: 3, petCount: 0 })
    ).toThrow('petCount must be at least 1');

    expect(() =>
      calculateBookingPrice({ baseRateMinor: 0, unitsCount: 3, petCount: 1 })
    ).toThrow('baseRateMinor must be positive');

    expect(() =>
      calculateBookingPrice({ baseRateMinor: -100, unitsCount: 3, petCount: 1 })
    ).toThrow('baseRateMinor must be positive');
  });

  it('calculates standard single-pet booking correctly with 7% owner fee & 12% commission', () => {
    // 3 nights at $50.00 (5000 cents) = $150.00 (15000 cents)
    // Owner fee 7% = $10.50 (1050 cents) -> Owner pays $160.50 (16050 cents)
    // Sitter commission 12% = $18.00 (1800 cents) -> Sitter receives $132.00 (13200 cents)
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 3,
      petCount: 1,
    });

    expect(quote.baseAmountMinor).toBe(15000);
    expect(quote.additionalPetsMinor).toBe(0);
    expect(quote.holidaySurchargeMinor).toBe(0);
    expect(quote.puppySurchargeMinor).toBe(0);
    expect(quote.extendedStayDiscountMinor).toBe(0);
    expect(quote.subtotalMinor).toBe(15000);
    expect(quote.ownerServiceFeeMinor).toBe(1050);
    expect(quote.ownerTotalMinor).toBe(16050);
    expect(quote.sitterCommissionMinor).toBe(1800);
    expect(quote.sitterNetPayoutMinor).toBe(13200);
    expect(quote.currency).toBe('USD');
  });

  it('correctly calculates additional pets surcharge', () => {
    // 2 nights, 3 pets (1 primary + 2 extra at $25.00/night = 2500 cents)
    // Base: 5000 * 2 = 10000
    // Extra pets: 2 extra * 2500 * 2 nights = 10000 cents ($100.00)
    // Subtotal: 20000 cents ($200.00)
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 2,
      petCount: 3,
      additionalPetRateMinor: 2500,
    });

    expect(quote.baseAmountMinor).toBe(10000);
    expect(quote.additionalPetsMinor).toBe(10000);
    expect(quote.subtotalMinor).toBe(20000);
    expect(quote.ownerServiceFeeMinor).toBe(1400); // 7% of 20000 = 1400 cents ($14.00)
    expect(quote.ownerTotalMinor).toBe(21400); // $214.00
    expect(quote.sitterCommissionMinor).toBe(2400); // 12% of 20000 = 2400 cents ($24.00)
    expect(quote.sitterNetPayoutMinor).toBe(17600); // $176.00
  });

  it('correctly calculates holiday surcharge across multiple pets', () => {
    // 4 nights, 2 pets. 2 holiday days with $15.00/pet surcharge (1500 cents)
    // Holiday: 1500 * 2 days * 2 pets = 6000 cents ($60.00)
    const quote = calculateBookingPrice({
      baseRateMinor: 4000,
      unitsCount: 4,
      petCount: 2,
      additionalPetRateMinor: 2000,
      holidayDaysCount: 2,
      holidaySurchargeMinor: 1500,
    });

    expect(quote.holidaySurchargeMinor).toBe(6000);
  });

  it('correctly calculates puppy surcharge', () => {
    // 5 days with puppy, $10.00/day puppy surcharge (1000 cents)
    // Puppy surcharge = 1000 * 5 = 5000 cents
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 5,
      petCount: 1,
      hasPuppy: true,
      puppySurchargeMinor: 1000,
    });

    expect(quote.puppySurchargeMinor).toBe(5000);
    expect(quote.subtotalMinor).toBe(30000);
  });

  it('correctly applies extended stay discount when units >= threshold', () => {
    // 10 nights at $50 = $500 (50000 cents). Threshold 7 nights, 10% discount.
    // 10% of 50000 = 5000 cents discount
    // Subtotal = 45000 cents
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 10,
      petCount: 1,
      extendedStayDiscountPercent: 10,
      extendedStayThresholdUnits: 7,
    });

    expect(quote.extendedStayDiscountMinor).toBe(5000);
    expect(quote.subtotalMinor).toBe(45000);
  });

  it('does NOT apply extended stay discount when units < threshold', () => {
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 5,
      petCount: 1,
      extendedStayDiscountPercent: 10,
      extendedStayThresholdUnits: 7,
    });

    expect(quote.extendedStayDiscountMinor).toBe(0);
    expect(quote.subtotalMinor).toBe(25000);
  });

  it('correctly applies fixed coupon discount capped at subtotal', () => {
    const quote = calculateBookingPrice({
      baseRateMinor: 5000,
      unitsCount: 2,
      petCount: 1,
      coupon: { fixedDiscountMinor: 2000 }, // $20 off $100
    });

    expect(quote.couponDiscountMinor).toBe(2000);
    expect(quote.subtotalMinor).toBe(8000);
    expect(quote.ownerServiceFeeMinor).toBe(560); // 7% of $80
  });

  it('correctly applies percentage coupon discount with cap', () => {
    // 2 nights at $100 = $200 (20000 cents).
    // Coupon: 20% off capped at $25 (2500 cents). 20% of 20000 is 4000, capped at 2500.
    const quote = calculateBookingPrice({
      baseRateMinor: 10000,
      unitsCount: 2,
      petCount: 1,
      coupon: { discountPercent: 20, maxDiscountMinor: 2500 },
    });

    expect(quote.couponDiscountMinor).toBe(2500);
    expect(quote.subtotalMinor).toBe(17500);
  });

  it('supports custom fee basis points from DB settings', () => {
    // Custom fees: Owner 500 bps (5%), Sitter 1000 bps (10%)
    const quote = calculateBookingPrice({
      baseRateMinor: 10000,
      unitsCount: 1,
      petCount: 1,
      ownerFeeBps: 500,
      sitterCommissionBps: 1000,
    });

    expect(quote.ownerServiceFeeMinor).toBe(500); // 5%
    expect(quote.sitterCommissionMinor).toBe(1000); // 10%
    expect(quote.sitterNetPayoutMinor).toBe(9000);
  });

  it('reconciles: ownerTotal - ownerServiceFee === sitterNetPayout + sitterCommission', () => {
    const quote = calculateBookingPrice({
      baseRateMinor: 4500,
      unitsCount: 7,
      petCount: 2,
      additionalPetRateMinor: 2000,
      holidayDaysCount: 1,
      holidaySurchargeMinor: 1500,
      hasPuppy: true,
      puppySurchargeMinor: 1000,
      extendedStayDiscountPercent: 10,
      coupon: { fixedDiscountMinor: 1500 },
    });

    // Fundamental double-entry accounting reconciliation identity
    const netStaySubtotal1 = quote.ownerTotalMinor - quote.ownerServiceFeeMinor;
    const netStaySubtotal2 = quote.sitterNetPayoutMinor + quote.sitterCommissionMinor;

    expect(netStaySubtotal1).toBe(quote.subtotalMinor);
    expect(netStaySubtotal2).toBe(quote.subtotalMinor);
    expect(netStaySubtotal1).toBe(netStaySubtotal2);
  });
});
