import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/leads/route';
import { prisma } from '@pawstay/db';

describe('Lead API Integration (/api/leads)', () => {
  const baseLead = {
    collegeName: 'National Institute of Engineering',
    city: 'Mysuru',
    state: 'Karnataka',
    contactPerson: 'Dr. Ramesh Kumar',
    role: 'Placement Officer',
    email: `tpo_${Date.now()}@nie.ac.in`,
    phone: '+91 98450 12345',
    studentStrength: 180,
    targetYears: '3rd Year',
    targetBranches: 'CSE, ISE',
    interestedPrograms: 'DSA, Aptitude',
    preferredMode: 'HYBRID',
    message: 'Need 16-week hybrid accelerator for 2026 batch.',
    website_url_hp: '',
    consentDPDP: true,
  };

  it('persists a valid lead to database and returns 201', async () => {
    const uniqueEmail = `tpo_${Date.now()}@nie.ac.in`;
    const payload = { ...baseLead, email: uniqueEmail };

    const req = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBeDefined();

    // Verify database record
    const saved = await prisma.collegeLead.findUnique({
      where: { id: body.leadId },
    });
    expect(saved).not.toBeNull();
    expect(saved?.collegeName).toBe('National Institute of Engineering');
    expect(saved?.email).toBe(uniqueEmail.toLowerCase());
    expect(saved?.status).toBe('NEW');
    expect(saved?.studentStrength).toBe(180);
  });

  it('rejects invalid inputs with 400 status', async () => {
    const invalidPayload = {
      collegeName: 'AB', // too short (<3)
      email: 'invalid-email',
      studentStrength: 5, // minimum 10
      consentDPDP: false,
    };

    const req = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('drops spam bot submissions when honeypot field is filled', async () => {
    const botPayload = {
      ...baseLead,
      website_url_hp: 'https://spam-seo-booster.ru',
    };

    const req = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify(botPayload),
    });

    const res = await POST(req);
    // Returns 400 because Zod schema catches website_url_hp max(0)
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Spam detected');
  });

  it('enforces rate limits when exceeding allowed requests', async () => {
    const spamIp = '203.0.113.99';
    const payload = { ...baseLead, email: 'rate_test@nie.ac.in' };

    // Send 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': spamIp,
        },
        body: JSON.stringify({ ...payload, email: `ratelimit_${i}@nie.ac.in` }),
      });
      await POST(req);
    }

    // 6th request should hit rate limit (429)
    const blockedReq = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': spamIp,
      },
      body: JSON.stringify(payload),
    });

    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    const body = await blockedRes.json();
    expect(body.error).toContain('Too many requests');
  });
});
