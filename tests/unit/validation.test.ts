import { describe, it, expect } from 'vitest';
import { leadRequestSchema, assessmentSubmissionSchema } from '@/lib/validations';

describe('Lead Request Schema Validation (Zod)', () => {
  const validLead = {
    collegeName: 'Vidyapeeth Institute of Technology',
    city: 'Pune',
    state: 'Maharashtra',
    contactPerson: 'Prof. Rajesh Shinde',
    role: 'Head - Training & Placement',
    email: 'tpo@vidyapeeth.edu.in',
    phone: '+91 98230 44556',
    studentStrength: 240,
    targetYears: '3rd Year, Final Year',
    targetBranches: 'CSE, IT, ECE',
    interestedPrograms: 'DSA, Aptitude, Soft Skills',
    preferredMode: 'ON_CAMPUS' as const,
    message: 'Need 200h placement accelerator.',
    website_url_hp: '',
    consentDPDP: true,
  };

  it('passes on valid TPO proposal request payload', () => {
    const res = leadRequestSchema.safeParse(validLead);
    expect(res.success).toBe(true);
  });

  it('fails if collegeName is too short', () => {
    const res = leadRequestSchema.safeParse({ ...validLead, collegeName: 'VI' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0]?.message).toContain('at least 3 characters');
    }
  });

  it('fails if email address is malformed', () => {
    const res = leadRequestSchema.safeParse({ ...validLead, email: 'not-an-email' });
    expect(res.success).toBe(false);
  });

  it('fails if student strength is less than 10', () => {
    const res = leadRequestSchema.safeParse({ ...validLead, studentStrength: 5 });
    expect(res.success).toBe(false);
  });

  it('fails if DPDP consent is false (DPDP Act 2023 compliance)', () => {
    const res = leadRequestSchema.safeParse({ ...validLead, consentDPDP: false });
    expect(res.success).toBe(false);
  });

  it('fails if spam honeypot is populated', () => {
    const res = leadRequestSchema.safeParse({
      ...validLead,
      website_url_hp: 'https://spam-bot.site',
    });
    expect(res.success).toBe(false);
  });
});

describe('Student Assessment Submission Schema Validation', () => {
  const validSubmission = {
    studentName: 'Aditya Sharma',
    studentEmail: 'aditya.sharma@college.edu.in',
    studentPhone: '+91 98220 11999',
    collegeName: 'Vidyapeeth Institute of Technology',
    branch: 'Computer Science & Engineering',
    graduationYear: 2026,
    timeTakenSeconds: 950,
    answers: { q1: 1, q2: 2, q3: 0 },
    consentDPDP: true,
  };

  it('passes on valid student assessment data', () => {
    const res = assessmentSubmissionSchema.safeParse(validSubmission);
    expect(res.success).toBe(true);
  });

  it('fails if graduation year is outside standard window', () => {
    const res = assessmentSubmissionSchema.safeParse({
      ...validSubmission,
      graduationYear: 2015,
    });
    expect(res.success).toBe(false);
  });

  it('fails if DPDP consent is omitted', () => {
    const res = assessmentSubmissionSchema.safeParse({
      ...validSubmission,
      consentDPDP: false,
    });
    expect(res.success).toBe(false);
  });
});
