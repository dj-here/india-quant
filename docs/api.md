# PawStay REST API Reference

All monetary amounts in request and response payloads are represented strictly as **integer minor units** (e.g. `$45.00` = `4500` cents) with ISO-4217 currency code (default `"USD"`). Zero floats are used for money across the platform.

---

## Authentication & Sessions
- **Session Management**: Auth.js / NextAuth v5 session cookies (`httpOnly`, `Secure`, `SameSite=Lax`).
- **Role-Based Access Control**: `OWNER`, `SITTER`, `ADMIN` (users may hold multiple active roles).

---

## 1. Search & Discovery

### `GET /api/search`
Searches for verified pet care hosts based on geographic coordinates, service type, and filters. Coordinates are obfuscated to approximate radii to protect host physical address privacy.

**Query Parameters:**
- `lat` (float, required): Latitude
- `lng` (float, required): Longitude
- `radiusMiles` (number, default: 10): Search radius
- `serviceType` (string): `BOARDING` | `HOUSE_SITTING` | `DROP_IN` | `DAY_CARE` | `WALKING`
- `startDate` (ISO 8601 string): Check-in date
- `endDate` (ISO 8601 string): Check-out date
- `fencedYard` (boolean): Filter for fenced yards
- `noOtherPets` (boolean): Sitter has no other pets in home
- `hasMedicationExperience` (boolean): Has experience administering oral/topical meds

---

## 2. Bookings & Escrow Payments

### `POST /api/bookings`
Creates a new stay reservation inquiry or instant booking with an itemized quote.

**Request Body:**
```json
{
  "sitterId": "uuid",
  "serviceType": "BOARDING",
  "startDate": "2026-07-01",
  "endDate": "2026-07-05",
  "petIds": ["uuid-pet-1", "uuid-pet-2"],
  "specialInstructions": "Feed Milo at 8am and 6pm with allergy tablet.",
  "vetEmergencyLimitMinor": 50000,
  "isInstantBook": false
}
```

### `POST /api/bookings/:id/transition`
Transitions a booking through the strict state machine.

**Request Body:**
```json
{
  "targetStatus": "PAID_HELD",
  "reason": "Payment authorized by owner",
  "paymentMethodId": "pm_card_visa"
}
```

### `POST /api/webhooks/stripe`
Idempotent, replay-safe Stripe webhook handler verifying signature before processing `payment_intent.succeeded` or `transfer.paid`.

---

## 3. Communication & Stay Lifecycle

### `GET /api/conversations`
Retrieves list of user conversations with unread indicators and counterparty summary.

### `POST /api/conversations/:id/messages`
Sends a message in a conversation. Automatically applies off-platform contact leakage masking (phone numbers, emails, social handles) if booking is in pre-booking status.

### `GET /api/bookings/:id/updates`
Fetches daily stay feed ("Rover Cards") for an in-progress stay.

### `POST /api/bookings/:id/updates`
Sitter posts daily photo, pee/poop tally, meal confirmation, and notes.

### `POST /api/bookings/:id/emergency`
Triggers immediate priority emergency support alert to sitter, owner, emergency contacts, and platform ops.

---

## 4. Double-Blind Reviews

### `GET /api/bookings/:id/reviews`
Fetches review status for a booking (reports whether counterparty has submitted without revealing content prior to mutual completion).

### `POST /api/bookings/:id/reviews`
Submits double-blind review. Automatically unlocks and publishes both reviews once both parties submit, or after 14 days.

---

## 5. Trust & Admin Operations

### `GET /api/admin/sitters`
Admin queue of pending sitter applications with identity documents and safety quiz results.

### `POST /api/admin/sitters/:id/review`
Approve, reject, or request changes on a host application.

### `GET /api/admin/disputes`
List all opened, investigated, or resolved claims under the PawStay Guarantee.

### `POST /api/admin/disputes/:id/resolve`
Adjudicate dispute: issue owner refund, release sitter payout, or dismiss claim.

### `GET /api/admin/analytics`
Platform executive telemetry: GMV, take rate, marketplace liquidity by metro, repeat rate, and off-platform leakage interception rate.
