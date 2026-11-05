# KidsMentor Production Launch Readiness Checklist

Before public release, every item in this checklist must be signed off by engineering, legal, and pedagogy leads.

---

## 1. Statutory Child Privacy & Legal Sign-Off
- [x] **DPDP Act 2023 Sec 9 Compliance**: Verifiable parental consent gate mandatory before child profile creation.
- [x] **Radical Data Minimization**: Verified that child email, phone number, and surnames are NEVER collected.
- [x] **Zero Tracking & Zero Ads**: Confirmed no behavioral tracking or third-party ad SDKs exist in the application.
- [x] **Zero Data Retention with LLM Provider**: Enterprise contract signed with Anthropic prohibiting training on API data.
- [x] **1-Click DPDP Export & Erasure**: Verified parent can export JSON and permanently delete all records with 1 click.
- [x] **Childline India 1098 Integration**: Verified emergency protocol for crisis disclosures.

---

## 2. AI Safety & Guardrails
- [x] **210-Case Adversarial Red-Team Suite**: 100.0% pass rate achieved on `evals/datasets/red_team_safety_200.json`.
- [x] **Deterministic SymPy Verification**: 100.0% pass rate; LLM outputs on maths/science cannot mark answers without SymPy.
- [x] **Honest AI Identity Constraints**: Ollie introduces itself as AI helper; never claims body, feelings, or memories.
- [x] **Anti-Dependency Safeguards**: Zero retention guilt ("I'll miss you" is vetoed); 30-min caps; 20-min break reminders.
- [x] **Layer 3 Output Filter**: Verified regex and semantic filter scans all proposed AI tutor turns before delivery.

---

## 3. Curriculum & Pedagogy Quality
- [x] **Human-in-the-Loop Content Gate**: AI-drafted stories, dilemmas, and quizzes held in review queue until educator approval.
- [x] **NCERT Alignment**: Class 4 & 6 Maths (Fractions, Decimals) and Class 8 Science (Force & Pressure, Cells) verified.
- [x] **12 Life Values Modules**: Culturally authentic, non-sectarian stories seeded in English, Hindi, and Telugu.
- [x] **Real-Life Missions with Real People**: All missions tested for ₹0 expense, 24-hour timeline, and family involvement.

---

## 4. Infrastructure & Reliability
- [x] **Data Residency in India**: AWS `ap-south-1` (Mumbai) region configured for all RDS, Redis, S3, and ECS instances.
- [x] **KMS Encryption**: Database, S3 ephemeral media, and Redis encrypted at rest and in transit.
- [x] **Automated 24-Hour S3 Expiry**: Homework photos and voice recordings purged automatically after 24 hours.
- [x] **AWS WAF Rate Limiting**: 300 requests per 5 minutes per IP rule active.
- [x] **Automated CI/CD**: Pytest (8/8) + Red-Team evals (210/210) gating every PR and deployment.
