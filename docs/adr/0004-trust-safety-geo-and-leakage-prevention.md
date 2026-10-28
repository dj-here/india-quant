# ADR 0004: Trust, Safety, PostGIS Geo-Obfuscation, and Leakage Prevention

## Status
Accepted

## Context
Two-sided marketplaces face two existential safety and business risks:
1. **Safety & Privacy**: Broadcasting sitters' exact residential addresses to unverified internet visitors compromises sitter safety and privacy.
2. **Platform Leakage**: Pre-booking participants exchanging phone numbers, emails, social handles, or off-platform payment methods (Venmo/CashApp) to evade platform fees and guarantee protections.

## Decision
1. **PostGIS Geography & Geo-Obfuscation**:
   - Sitters provide exact coordinates for radius calculations.
   - For public search results and profile pages before a confirmed, paid booking:
     - The exact latitude and longitude are never returned to the client.
     - An approximate center point offset by a pseudo-random jitter (radius of ~0.5 to 0.75 miles) is generated and returned, displayed as a shaded coverage circle.
     - The exact address is only unlocked in the owner dashboard once the booking enters `PAID_HELD` status.

2. **Chat Leakage Detection & Automated Masking**:
   - In pre-booking messages, regular expressions and pattern matchers scan for phone numbers, email addresses, external URLs, social media handles (@handle), and keywords like "venmo", "zelle", "cashapp".
   - Suspect substrings are redacted (`[Contact information hidden before booking]`), and an inline trust reminder is surfaced to both users.
   - Post-payment, messaging restrictions on contact sharing are lifted for emergency and logistics coordination.

## Consequences
- Protects sitter physical privacy and security.
- Eliminates off-platform leakage vectors while keeping legitimate communication frictionless.
