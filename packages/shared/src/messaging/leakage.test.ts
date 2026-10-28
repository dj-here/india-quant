import { describe, it, expect } from 'vitest';
import { maskContactInfo, MASK_REPLACEMENT, PAYMENT_MASK_REPLACEMENT } from './leakage';

describe('Contact Leakage Mitigation Engine', () => {
  describe('Safe messages (no leakage)', () => {
    it('allows normal conversational text without false positives', () => {
      const safeInputs = [
        'Hi, I have 2 golden retrievers and 1 senior cat.',
        'We will arrive around 5:30pm on Friday.',
        'Milo weighs 45 lbs and is 3 years old.',
        'Can you board dogs for 7 days in July?',
        'He is very friendly and loves going for walks at the park.',
        'Looking forward to meeting you at the meet & greet!',
      ];

      for (const input of safeInputs) {
        const result = maskContactInfo(input);
        expect(result.hasLeakage).toBe(false);
        expect(result.maskedText).toBe(input);
        expect(result.detectedPatterns).toEqual([]);
      }
    });

    it('handles empty or null string gracefully', () => {
      expect(maskContactInfo('').hasLeakage).toBe(false);
      // @ts-expect-error testing invalid input
      expect(maskContactInfo(null).hasLeakage).toBe(false);
    });
  });

  describe('Phone number leakage detection', () => {
    it('detects standard US formatted numbers', () => {
      const inputs = [
        'Call me at (555) 123-4567 to discuss.',
        'My cell is 555-123-4567.',
        'You can reach me at 555.123.4567.',
        'Here is my number: +1 555 123 4567.',
      ];

      for (const input of inputs) {
        const result = maskContactInfo(input);
        expect(result.hasLeakage).toBe(true);
        expect(result.detectedPatterns).toContain('phone');
        expect(result.maskedText).toContain(MASK_REPLACEMENT);
      }
    });

    it('detects spaced-out digits', () => {
      const input = 'My number is 5 5 5 1 2 3 4 5 6 7 text me';
      const result = maskContactInfo(input);
      expect(result.hasLeakage).toBe(true);
      expect(result.detectedPatterns).toContain('phone_spaced_digits');
      expect(result.maskedText).toContain(MASK_REPLACEMENT);
    });

    it('detects spelled-out digits', () => {
      const input = 'Reach me at five five five one two three four five six seven';
      const result = maskContactInfo(input);
      expect(result.hasLeakage).toBe(true);
      expect(result.detectedPatterns).toContain('phone_spelled_out');
      expect(result.maskedText).toContain(MASK_REPLACEMENT);
    });
  });

  describe('Email leakage detection', () => {
    it('detects standard email addresses', () => {
      const input = 'Email me at doglover99@gmail.com for details.';
      const result = maskContactInfo(input);
      expect(result.hasLeakage).toBe(true);
      expect(result.detectedPatterns).toContain('email');
      expect(result.maskedText).not.toContain('doglover99@gmail.com');
      expect(result.maskedText).toContain(MASK_REPLACEMENT);
    });

    it('detects obfuscated [at] and [dot] email patterns', () => {
      const input1 = 'Email me at john [at] paws [dot] com';
      const result1 = maskContactInfo(input1);
      expect(result1.hasLeakage).toBe(true);
      expect(result1.detectedPatterns).toContain('email_obfuscated');
      expect(result1.maskedText).toContain(MASK_REPLACEMENT);

      const input2 = 'My address is jane at domain dot org';
      const result2 = maskContactInfo(input2);
      expect(result2.hasLeakage).toBe(true);
      expect(result2.detectedPatterns).toContain('email_obfuscated');
    });
  });

  describe('Social handles and external links', () => {
    it('detects direct messaging links', () => {
      const input = 'Message me on wa.me/15551234567 or t.me/pawsitter';
      const result = maskContactInfo(input);
      expect(result.hasLeakage).toBe(true);
      expect(result.detectedPatterns).toContain('messenger_link');
      expect(result.maskedText).not.toContain('wa.me');
    });

    it('detects social media prefixes', () => {
      const input = 'Check out my profile ig: best_pet_sitter';
      const result = maskContactInfo(input);
      expect(result.hasLeakage).toBe(true);
      expect(result.detectedPatterns).toContain('social_handle');
      expect(result.maskedText).not.toContain('best_pet_sitter');
    });
  });

  describe('Off-platform payment leakage detection', () => {
    it('detects Venmo, Zelle, CashApp, and PayPal references', () => {
      const inputs = [
        'Can you venmo me instead?',
        'I accept zelle for bookings.',
        'You can pay me via cashapp or paypal.',
        'Let us do off-platform payment to save fees.',
        'Just pay me in cash when you drop off the dog.',
      ];

      for (const input of inputs) {
        const result = maskContactInfo(input);
        expect(result.hasLeakage).toBe(true);
        expect(result.maskedText).toContain(PAYMENT_MASK_REPLACEMENT);
      }
    });

    it('detects Indian payment methods: UPI, GPay, PhonePe, Paytm', () => {
      const inputs = [
        'Pay me via upi directly',
        'Send it to my gpay at 9876543210',
        'You can phonepe me the amount',
        'Do you accept paytm or bhim upi?',
        'Transfer to rahul@okhdfcbank directly',
        'Send to priya@ybl or ananya@paytm',
        'My vpa is sitter@upi',
      ];

      for (const input of inputs) {
        const result = maskContactInfo(input);
        expect(result.hasLeakage).toBe(true);
        expect(result.maskedText).toContain(PAYMENT_MASK_REPLACEMENT);
      }
    });
  });

  describe('Indian mobile number detection', () => {
    it('detects 10-digit Indian mobile numbers and +91 formats', () => {
      const inputs = [
        'Call me at +91 98765 43210 for quick meetup',
        'My number is +91-9876543210',
        'Ping me on 9876543210',
        'You can reach me at 8882143210 anytime',
        'WhatsApp me on 7890123456',
      ];

      for (const input of inputs) {
        const result = maskContactInfo(input);
        expect(result.hasLeakage).toBe(true);
        expect(result.maskedText).toContain(MASK_REPLACEMENT);
        expect(result.detectedPatterns.some(p => p.startsWith('phone'))).toBe(true);
      }
    });
  });
});
