import { describe, it, expect } from 'vitest';
import { validateEnv, EnvSchema } from './env.js';
import { VALID_BOOKING_TRANSITIONS } from './constants/index.js';
import { PetSchema } from './schemas/index.js';

describe('Shared Module: Env Validation', () => {
  it('validates a complete environment configuration with valid defaults', () => {
    const env = validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
      NEXTAUTH_SECRET: 'super_secret_test_key_at_least_16_chars',
    });

    expect(env.APP_NAME).toBe('PawStay');
    expect(env.DEFAULT_CURRENCY).toBe('USD');
    expect(env.DEFAULT_OWNER_SERVICE_FEE_BPS).toBe(700);
    expect(env.DEFAULT_SITTER_COMMISSION_BPS).toBe(1200);
    expect(env.PAYMENT_PROVIDER).toBe('mock');
  });

  it('fails if DATABASE_URL is missing', () => {
    expect(() => validateEnv({ DATABASE_URL: '' })).toThrow(/DATABASE_URL is required/);
  });
});

describe('Shared Module: Constants and Schemas', () => {
  it('defines valid booking transition map', () => {
    expect(VALID_BOOKING_TRANSITIONS['DRAFT']).toContain('REQUESTED');
    expect(VALID_BOOKING_TRANSITIONS['REQUESTED']).toContain('ACCEPTED');
    expect(VALID_BOOKING_TRANSITIONS['ACCEPTED']).toContain('PAID_HELD');
    expect(VALID_BOOKING_TRANSITIONS['PAID_HELD']).toContain('IN_PROGRESS');
    expect(VALID_BOOKING_TRANSITIONS['COMPLETED']).toContain('PAYOUT_RELEASED');
  });

  it('validates a correct pet profile schema', () => {
    const validPet = {
      name: 'Barnaby',
      species: 'DOG',
      breed: 'Golden Retriever',
      ageYears: 3,
      weightLbs: 65,
      isSpayedNeutered: true,
      temperamentFlags: ['friendly', 'good_with_cats'],
      feedingSchedule: '2 scoops kibble at 8am and 6pm',
      vetName: 'Dr. Jane Smith',
      vetPhone: '555-019-2834',
      emergencyContactName: 'John Doe',
      emergencyContactPhone: '555-019-2835',
      vaccinationDocumentUrls: ['https://example.com/rabies.pdf'],
    };

    const parsed = PetSchema.safeParse(validPet);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid pet weight and missing vet phone', () => {
    const invalidPet = {
      name: 'Barnaby',
      species: 'DOG',
      breed: 'Golden Retriever',
      ageYears: 3,
      weightLbs: -10, // negative weight
      isSpayedNeutered: true,
      feedingSchedule: 'Kibble',
      vetName: 'Dr. Smith',
      vetPhone: '123', // too short
      emergencyContactName: 'John',
      emergencyContactPhone: '555-1234',
    };

    const parsed = PetSchema.safeParse(invalidPet);
    expect(parsed.success).toBe(false);
  });
});
