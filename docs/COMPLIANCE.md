# KidsMentor Legal Compliance & Child Privacy Architecture
## Statutory Compliance: India DPDP Act 2023 & US COPPA

KidsMentor is engineered to adhere strictly to statutory child data protection standards, primarily:
1. **India Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** — specifically Section 9 (*Processing of personal data of children*).
2. **United States Children's Online Privacy Protection Act (COPPA)** — 16 CFR Part 312.
3. **General Data Protection Regulation (GDPR-K)** — Article 8.

---

## 1. Verifiable Parental Consent (DPDP Act Section 9(1))
- **Statutory Mandate**: Data fiduciaries must obtain verifiable consent of the parent or lawful guardian before processing any personal data of a child.
- **KidsMentor Implementation**:
  - The onboarding flow is strictly parent-facing.
  - Parents register using verifiable email authentication and explicit, non-pre-ticked affirmative consent checkboxes acknowledging:
    1. Ollie is an artificial intelligence tutor and NOT a human instructor.
    2. No human teacher is monitoring the chat in real time.
    3. The child's nickname and interactions are processed solely for educational delivery and safety screening.
  - Every consent grant is logged in the `consents` table with timestamp, IP address, user agent, and terms version (`2026.1`).

---

## 2. Radical Data Minimization (DPDP Act Section 6 & 9)
- **Zero Child Contact Collection**:
  - We **never** collect, request, or store a child's email address, telephone number, full surname, school name, or residential address.
  - Child profiles store only: `nickname` (first name or moniker), `age_band` (6-8, 9-12, 13-16), `grade` (1-10), and educational `board` (CBSE/ICSE/State/IB).
- **Authentication Without Credentials Fatigue**:
  - Children log in via a simple 4-digit PIN managed by the parent, eliminating passwords, emails, or phone SMS OTPs for children.
- **Automated PII Redaction at the Edge (Layer 1 Guardrail)**:
  - If a child accidentally types a phone number, address, or email into chat, regex filters instantly redact it before persisting to the database.

---

## 3. Ban on Behavioral Tracking & Targeted Profiling (DPDP Act Section 9(2) & 9(3))
- **Statutory Mandate**: Data fiduciaries shall not undertake tracking or behavioral monitoring of children or targeted advertising directed at children.
- **KidsMentor Implementation**:
  - **Zero Ads**: KidsMentor is 100% ad-free and tracker-free. Zero third-party ad SDKs or trackers exist in our codebase.
  - **No Cross-Platform Tracking**: No pixels, fingerprinting scripts, or cross-site cookies.
  - **Structured Memory Isolation**: AI memory stores only educational mastery state (BKT parameters) and recent values missions. No psychological profiles or commercial behavioral markers are constructed.

---

## 4. Zero Data Retention & No-Training LLM Agreements
- **Model Provider Data Protection**:
  - All LLM API calls (Anthropic Claude, etc.) utilize enterprise zero-data-retention (ZDR) endpoints.
  - Model providers are contractually and technically prohibited from using any KidsMentor prompts, child inputs, or transcripts to train or fine-tune public models.
- **Ephemeral Media Storage**:
  - Uploaded homework photos and voice recordings are stored in KMS-encrypted S3 buckets with an automated 24-hour lifecycle deletion rule. Once transcribed or processed, raw media is purged.

---

## 5. Parental Rights: 1-Click Export & Right to Erasure
- Under Section 11 and 12 of the DPDP Act 2023, parents have the sovereign right to inspect, export, and delete all personal data.
- **1-Click JSON Data Export**:
  - Available on the Parent Dashboard. Instantly packages all profile details, mastery states, Character Garden items, and full session transcripts into a portable JSON document.
- **1-Click Permanent Deletion (Right to Erasure)**:
  - Accessible directly in the Parent Zone. Clicking "Permanently Delete" cascades a database purge deleting the child profile, all messages, attempts, memories, and safety logs irrevocably.

---

## 6. Child Protection & Mandatory Reporting (POCSO / Childline India 1098)
- Under Indian child protection frameworks (POCSO Act 2012 / Juvenile Justice Act), disclosures of abuse, sexual harassment, or physical harm require immediate safe escalation.
- **Safety Escalation Protocol**:
  1. If a child reveals abuse, grooming, or suicidal distress, Ollie immediately provides a scripted, compassionate message and supplies **Childline India 1098** (toll-free 24x7 helpline).
  2. The incident is logged with severity `CRISIS`.
  3. An automated emergency notification is dispatched to the parent.
  4. The record is flagged in the offline Admin Safety Queue for immediate human reviewer action.
