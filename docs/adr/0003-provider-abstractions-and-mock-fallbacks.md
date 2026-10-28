# ADR 0003: Provider Abstractions and Deterministic Mock Fallbacks

## Status
Accepted

## Context
A production marketplace relies on multiple third-party infrastructure providers:
- Payment processor (Stripe Connect Express)
- Object storage (AWS S3 / Cloudflare R2 / MinIO)
- Realtime messaging (Ably / Pusher)
- Transactional email (Resend / AWS SES)
- SMS & notifications (Twilio)
- Geocoding and map rendering (Mapbox / Google Maps)
- Identity verification and background checks (Stripe Identity / Persona / Checkr)

Hardcoding provider SDKs directly into business routes prevents clean testing, breaks offline developer workflow, and locks the company to specific vendors.

## Decision
We enforce strict TypeScript interfaces for every external dependency:
- `PaymentProvider`: `createPaymentIntent()`, `capturePayment()`, `transferPayout()`, `refundPayment()`.
- `FileStorage`: `getPresignedUploadUrl()`, `deleteFile()`, `processAndUpload()`.
- `Realtime`: `publish()`, `subscribe()`, `triggerTyping()`.
- `Emailer`: `sendBookingConfirmation()`, `sendPayoutNotice()`, etc.
- `Notifier`: `sendSms()`, `sendWhatsApp()`.
- `GeoProvider`: `geocode()`, `reverseGeocode()`, `calculateDistanceMiles()`.
- `IdentityVerifier`: `createVerificationSession()`, `getVerificationResult()`.

Each provider interface has:
1. A production implementation configured by environment variables.
2. A deterministic mock implementation with comprehensive in-memory simulation for local development and CI unit/integration testing without external network calls or API keys.

## Consequences
- 100% offline developer workflow with `docker-compose` or local mocks.
- Vendor portability: switching from Stripe to another provider requires only a new adapter implementation.
