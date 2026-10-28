/**
 * Contact Leakage Mitigation Engine
 *
 * In pet care marketplaces, preventing disintermediation (taking bookings off-platform)
 * is essential for pet safety, insurance coverage, and business health.
 *
 * This engine detects and masks phone numbers, email addresses, external social handles,
 * off-platform payment methods (Venmo, Zelle, CashApp, PayPal), and external URLs
 * before a booking is confirmed and paid.
 */

export interface LeakageDetectionResult {
  originalText: string;
  maskedText: string;
  hasLeakage: boolean;
  detectedPatterns: string[];
}

export const MASK_REPLACEMENT = '[contact info hidden before confirmed booking]';
export const PAYMENT_MASK_REPLACEMENT = '[off-platform payment hidden]';

// -----------------------------------------------------------------------------
// Pattern Definitions
// -----------------------------------------------------------------------------

// Standard & formatted phone numbers:
// Matches: (555) 123-4567, 555.123.4567, +1-555-123-4567, 555-123-4567, 555 123 4567
// Also catches digits spaced out: 5 5 5 1 2 3 4 5 6 7
const PHONE_REGEX = /(?:\+?(\d{1,3}))?[-.\s]?(?:\(?(\d{3})\)?)[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g;

// Spaced out 10-digit numbers: e.g. "8 3 2 5 5 5 1 2 3 4"
const SPACED_DIGITS_REGEX = /\b(?:\d[\s\-_.]){9,11}\d\b/g;

// Indian mobile numbers (10 digits starting with 6-9, with optional +91 or 0 prefix)
// Matches: +91 98765 43210, +91-9876543210, 09876543210, 9876543210, 98765-43210, 98765 43210
const INDIAN_PHONE_REGEX = /(?:\+?91[\s.-]?|0)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b|(?:\+?91[\s.-]?|0)?[6-9]\d{4}[\s.-]?\d{5}\b/g;

// UPI VPA addresses: e.g. user@okhdfcbank, user@okaxis, user@ybl, user@paytm, user@upi
const UPI_ID_REGEX = /\b[a-zA-Z0-9.\-_]{2,64}@(okhdfcbank|okaxis|oksbi|okicici|paytm|ybl|ibl|axl|upi|kotak|federal|barodampay|idfcbank)\b/gi;

// Spelled-out numbers (common evasion technique, e.g. "five five five one two three four")
const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

const NUMBER_WORDS_REGEX = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:[\s\-_,]+(?:zero|one|two|three|four|five|six|seven|eight|nine)){6,11}\b/gi;

// Email addresses (both standard and obfuscated)
// e.g., user@example.com, user [at] example [dot] com, user(at)example.com, user at gmail dot com
const STANDARD_EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
const OBFUSCATED_EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+(?:\s*\[at\]\s*|\s*\(at\)\s*|\s+at\s+)[A-Za-z0-9.-]+(?:\s*\[dot\]\s*|\s*\(dot\)\s*|\s+dot\s+)[A-Za-z]{2,}\b/gi;

// Social handles & external communication apps
// e.g. @username, instagram: username, ig: username, snapchat: ..., whatsapp: ...
const SOCIAL_HANDLE_PREFIX_REGEX = /(?:(?:ig|insta|instagram|snap|snapchat|telegram|tg|tiktok|fb|facebook|twitter|x)\s*[:=]\s*@?([A-Za-z0-9_.-]+))/gi;
const DIRECT_MESSENGER_LINKS_REGEX = /\b(?:wa\.me|t\.me|instagram\.com|facebook\.com|snapchat\.com|tiktok\.com|discord\.gg|twitter\.com)\/[A-Za-z0-9_.-]+/gi;

// Off-platform payment requests:
// e.g. venmo me, zelle me, cashapp me, paypal me, gpay, phonepe, paytm, upi, cred, pay me offline, cash is fine
const OFF_PLATFORM_PAYMENT_REGEX = /\b(?:venmo(?:\.com)?|zelle|cashapp|cash\s*app|paypal(?:\.me)?|gpay|google\s*pay|phonepe|phone\s*pe|paytm|bhim(?:\s*upi)?|cred|upi)\b/gi;
const OFFLINE_PAYMENT_PHRASES = /\b(?:pay\s+(?:me\s+)?(?:in\s+)?cash|pay\s+(?:me\s+)?directly|pay\s+(?:me\s+)?outside\s+(?:the\s+)?app|off[- ]platform\s+payment|gpay\s+(?:karo|me)|send\s+(?:to\s+)?(?:my\s+)?(?:upi|gpay|phonepe)|pay\s+(?:me\s+)?via\s+upi)\b/gi;

/**
 * Evaluates whether text contains off-platform contact or payment leakage.
 * If detected, returns the text with masked portions and list of violation types.
 */
export function maskContactInfo(text: string): LeakageDetectionResult {
  if (!text || typeof text !== 'string') {
    return {
      originalText: text ?? '',
      maskedText: text ?? '',
      hasLeakage: false,
      detectedPatterns: [],
    };
  }

  const detectedPatterns: Set<string> = new Set();
  let masked = text;

  // 1. Check & mask standard emails
  if (STANDARD_EMAIL_REGEX.test(masked)) {
    detectedPatterns.add('email');
    masked = masked.replace(STANDARD_EMAIL_REGEX, MASK_REPLACEMENT);
  }

  // 2. Check & mask obfuscated emails
  if (OBFUSCATED_EMAIL_REGEX.test(masked)) {
    detectedPatterns.add('email_obfuscated');
    masked = masked.replace(OBFUSCATED_EMAIL_REGEX, MASK_REPLACEMENT);
  }

  // 3. Check & mask direct messenger / social links
  if (DIRECT_MESSENGER_LINKS_REGEX.test(masked)) {
    detectedPatterns.add('messenger_link');
    masked = masked.replace(DIRECT_MESSENGER_LINKS_REGEX, MASK_REPLACEMENT);
  }

  // 4. Check & mask social handle prefixes (e.g. "ig: petlover123")
  if (SOCIAL_HANDLE_PREFIX_REGEX.test(masked)) {
    detectedPatterns.add('social_handle');
    masked = masked.replace(SOCIAL_HANDLE_PREFIX_REGEX, MASK_REPLACEMENT);
  }

  // 5. Check & mask UPI VPAs and off-platform payment providers
  if (UPI_ID_REGEX.test(masked)) {
    detectedPatterns.add('upi_id');
    masked = masked.replace(UPI_ID_REGEX, PAYMENT_MASK_REPLACEMENT);
  }

  if (OFF_PLATFORM_PAYMENT_REGEX.test(masked)) {
    detectedPatterns.add('off_platform_payment');
    masked = masked.replace(OFF_PLATFORM_PAYMENT_REGEX, PAYMENT_MASK_REPLACEMENT);
  }

  if (OFFLINE_PAYMENT_PHRASES.test(masked)) {
    detectedPatterns.add('offline_payment_phrase');
    masked = masked.replace(OFFLINE_PAYMENT_PHRASES, PAYMENT_MASK_REPLACEMENT);
  }

  // 6. Check & mask spelled-out numbers
  if (NUMBER_WORDS_REGEX.test(masked)) {
    detectedPatterns.add('phone_spelled_out');
    masked = masked.replace(NUMBER_WORDS_REGEX, MASK_REPLACEMENT);
  }

  // 7. Check & mask spaced-out digits (e.g., "5 5 5 1 2 3 4 5 6 7")
  if (SPACED_DIGITS_REGEX.test(masked)) {
    detectedPatterns.add('phone_spaced_digits');
    masked = masked.replace(SPACED_DIGITS_REGEX, MASK_REPLACEMENT);
  }

  // 8. Check & mask Indian mobile numbers (+91, 10 digits starting with 6-9)
  if (INDIAN_PHONE_REGEX.test(masked)) {
    detectedPatterns.add('phone_india');
    masked = masked.replace(INDIAN_PHONE_REGEX, MASK_REPLACEMENT);
  }

  // 9. Check & mask standard/formatted phone numbers
  if (PHONE_REGEX.test(masked)) {
    detectedPatterns.add('phone');
    masked = masked.replace(PHONE_REGEX, MASK_REPLACEMENT);
  }

  // Clean up any adjacent duplicate replacements for cleaner UI
  const duplicateMaskRegex = new RegExp(`(?:${escapeRegex(MASK_REPLACEMENT)}[\\s,;]*)+`, 'g');
  masked = masked.replace(duplicateMaskRegex, `${MASK_REPLACEMENT} `).trim();

  const hasLeakage = detectedPatterns.size > 0;

  return {
    originalText: text,
    maskedText: masked,
    hasLeakage,
    detectedPatterns: Array.from(detectedPatterns),
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
