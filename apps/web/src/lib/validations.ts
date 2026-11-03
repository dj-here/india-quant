import { z } from 'zod';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi NCR',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
] as const;

export const leadRequestSchema = z.object({
  collegeName: z.string().min(3, 'College name must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'Please select a valid state'),
  contactPerson: z.string().min(3, 'Contact person name must be at least 3 characters'),
  role: z.string().min(2, 'Please provide your institutional role (e.g. TPO, Principal, HoD)'),
  email: z.string().email('Please enter a valid official email address'),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit phone/WhatsApp number'),
  studentStrength: z.coerce.number().min(10, 'Student strength must be at least 10'),
  targetYears: z.string().min(2, 'Please specify target student years (e.g. 3rd Year, Final Year)'),
  targetBranches: z.string().min(2, 'Please specify branches (e.g. CSE, IT, ECE)'),
  interestedPrograms: z.string().min(2, 'Please specify interested tracks (e.g. DSA, Aptitude, Soft Skills)'),
  preferredMode: z.enum(['ON_CAMPUS', 'HYBRID', 'ONLINE']).default('ON_CAMPUS'),
  message: z.string().optional().default(''),
  // Anti-spam Honeypot field (must remain empty for human users)
  website_url_hp: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
  // Digital Personal Data Protection (DPDP) Act 2023 Consent
  consentDPDP: z.boolean().refine(val => val === true, {
    message: 'Affirmative consent under the DPDP Act 2023 is required to process institutional details.'
  })
});

export type LeadRequestInput = z.infer<typeof leadRequestSchema>;

export const assessmentSubmissionSchema = z.object({
  studentName: z.string().min(2, 'Student name must be at least 2 characters'),
  studentEmail: z.string().email('Please provide a valid email address'),
  studentPhone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please provide a valid phone number'),
  collegeName: z.string().min(2, 'College name must be at least 2 characters'),
  branch: z.string().min(2, 'Branch / Department is required'),
  graduationYear: z.coerce.number().min(2024).max(2030),
  timeTakenSeconds: z.coerce.number().min(0),
  answers: z.record(z.string(), z.number()),
  consentDPDP: z.boolean().refine(val => val === true, {
    message: 'DPDP consent is required.'
  })
});

export type AssessmentSubmissionInput = z.infer<typeof assessmentSubmissionSchema>;
