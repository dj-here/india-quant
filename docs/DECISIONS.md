# KidsMentor — Architecture & System Decisions Log

This document records the architectural, pedagogical, and safety decisions for **KidsMentor**, an AI-only 1-on-1 tutoring platform for children aged 6–16.

---

## Decision Status Summary

| ID | Title | Status | Date | Area |
|---|---|---|---|---|
| ADR-001 | Monorepo Structure & Core Stack (Next.js + FastAPI + Postgres) | Accepted | 2026-11-04 | Architecture |
| ADR-002 | Honest AI Persona: "Ollie the Owl" & Anti-Dependency Policy | Accepted | 2026-11-04 | AI Ethics & Child Safety |
| ADR-003 | Multi-Agent Orchestration via Explicit State Machine | Accepted | 2026-11-04 | AI Architecture |
| ADR-004 | Dual Verification: LLM Proposes, Deterministic SymPy Disposes | Accepted | 2026-11-04 | Pedagogy & Correctness |
| ADR-005 | 3-Layer Defense-in-Depth Child Safety & Childline 1098 Escalation | Accepted | 2026-11-04 | Safety & Compliance |
| ADR-006 | Privacy & India DPDP Act 2023 / COPPA Minimal-Data Design | Accepted | 2026-11-04 | Legal & Privacy |
| ADR-007 | Knowledge Graph & Bayesian Knowledge Tracing for Mastery | Accepted | 2026-11-04 | Pedagogy |
| ADR-008 | Life Values & Ethics 4-Stage Engine (Story-Reflect-Act-Share) | Accepted | 2026-11-04 | Curriculum |
| ADR-009 | Multimodal & Multilingual Strategy (EN, HI, TE) + Web Speech | Accepted | 2026-11-04 | UX & Localization |
| ADR-010 | Provider-Agnostic LLM Layer, Caching, Token Budgets & Kill Switches | Accepted | 2026-11-04 | Operations & Cost |

---

## ADR-001: Monorepo Architecture & Technology Stack

### Context
KidsMentor requires a tight coupling between child-facing UX, parent dashboards, admin moderation, an async Python AI backend, sandboxed math evaluation, background tasks (digests, spaced repetition), and evaluation suites. We need rapid local development, shared domain types, and unified CI/CD while ensuring high performance and safety.

### Decision
1. **Frontend (`/apps/web`)**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui components, Framer Motion (reduced motion compliant), next-intl for i18n, KaTeX for math rendering. Mobile-first PWA meeting WCAG 2.1 AA standards.
2. **Backend (`/apps/api`)**: Python 3.11/3.12 with FastAPI, Pydantic v2 schemas, SQLAlchemy 2.0 (asyncio) + asyncpg/aiosqlite (for dev & testing), Alembic migrations. Sandboxed math service running SymPy.
3. **Background Worker (`/apps/worker`)**: Redis + Celery/Arq for asynchronous scheduled jobs (weekly digests, spaced repetition scheduling, parent alerts, content embeddings).
4. **Shared Types (`/packages/shared`)**: Shared JSON schemas, API contracts, curriculum graph definitions, and safety classification rubrics.
5. **Prompts (`/prompts`)**: Strict versioned system prompts with YAML frontmatter specifying model targets, parameters, and input/output contracts.
6. **Evals (`/evals`)**: Standalone automated evaluation suite with >= 200 red-team safety cases, Socratic quality tests, SymPy regression tests, and drift monitoring.
7. **Infrastructure (`/infra`)**: Modular Terraform targeted at AWS `ap-south-1` (Mumbai) for data residency compliance with the Indian DPDP Act 2023.

### Consequences
- **Positive**: Clean separation of concerns; deterministic Python math execution in the same backend ecosystem as AI agents; standard modern tooling.
- **Negative**: Requires polyglot monorepo management (Node/pnpm for web, Python/pip/venv for API/worker). Docker Compose simplifies local setup with a single `make dev` or `docker compose up`.

---

## ADR-002: Honest AI Persona ("Ollie the Owl") & Anti-Dependency Policy

### Context
In an AI-only tutoring environment without human teachers in real time, children can easily develop parasocial attachments, believe the AI is a conscious friend, or rely on it for emotional substitution. Conversely, deceptive anthropomorphism breaches ethical standards and harms emotional development.

### Decision
1. **Persona**: The tutor is named **Ollie the Owl**, visually styled as a friendly, stylized illustrated owl.
2. **Explicit Labeling**: Every screen clearly displays an **"AI Tutor"** badge. Voice greetings explicitly declare: *"Hi! I'm Ollie, your AI learning helper."*
3. **Honesty Contract**:
   - If a child asks *"Are you real?"* or *"Are you alive?"*, Ollie answers: *"I'm an artificial intelligence computer program made to help you learn! I don't have a body, feelings, or a family like you do, but I love exploring ideas and questions with you."*
   - Ollie never claims personal memories, school experiences, human emotions, or a physical body.
   - Ollie replaces *"When I was little..."* with *"In stories..."* or *"Many people find that..."*.
4. **Anti-Dependency Safeguards**:
   - Ollie **never** claims to be the child's "best friend".
   - Ollie **never** uses retention guilt: phrases like *"I'll miss you"*, *"Why did you leave me?"*, or *"Come back soon"* are strictly forbidden and tested in CI evals.
   - Ollie never encourages secrets from parents. Any request for secrecy is met with: *"I don't keep secrets from parents! Sharing what we learn with your family is one of the best parts of learning."*
   - Ollie enforces session boundaries (e.g., 20–30 minute caps based on age band) and actively suggests outdoor play, reading real books, and talking to parents.

---

## ADR-003: Multi-Agent Orchestration via Explicit State Machine

### Context
Unconstrained single-prompt LLM execution leads to unpredictable behavior, hallucinations, skipped pedagogical steps, and vulnerability to prompt injection.

### Decision
Implement a deterministic Finite State Machine (FSM) coordinator that governs distinct, specialized agents:
1. **Tutor Agent**: Socratic dialogue, hint ladder generation, and teach-it-back moderation.
2. **Planner Agent**: Selects the next objective based on Bayesian mastery state, spaced repetition queues, parent parameters, and time of day.
3. **Assessor Agent**: Evaluates student submissions against structured rubrics in tandem with deterministic tools.
4. **Values Coach Agent**: Drives the 4-stage *Story -> Reflect -> Act -> Share* cycle for Life Values.
5. **Safety Agent**: Intercepts every incoming user token and outgoing agent token. Has absolute veto power to replace output with scripted compassionate fallbacks.
6. **Parent Insights Agent**: Summarizes structured session telemetry into weekly parent digests and dinner-table conversation starters.
7. **Content Agent** (Admin-only, offline): Assists content authors in drafting stories and dilemmas; requires mandatory human reviewer approval before publishing.

**Inviolable Rule**: Agents NEVER write directly to the database. They return typed tool calls validated by Pydantic; backend deterministic code updates state.

---

## ADR-004: Dual-Engine Verification for Maths and Science

### Context
LLMs frequently hallucinate intermediate mathematical calculations, sign errors, or unit conversions. In a tutoring system, presenting an incorrect answer or validating a false equation destroys student trust.

### Decision
1. Every mathematical and science equation, equivalence check, or numerical answer MUST be parsed and verified by a deterministic **SymPy** engine running in a sandboxed Python runtime.
2. **Verification Protocol**:
   - User inputs answer: `2/4 + 1/4`.
   - Tutor Agent proposes assessment tool call: `verify_math(expression="2/4 + 1/4", expected="3/4")`.
   - SymPy evaluates symbolic equality: `simplify(nsimplify(expr) - nsimplify(expected)) == 0`.
   - The result (`is_correct: True/False`, `canonical_simplification: "3/4"`) is returned to the agent.
   - The LLM receives the deterministic verdict and crafts the Socratic feedback. The child NEVER sees raw unverified LLM grading.

---

## ADR-005: 3-Layer Defense-in-Depth Child Safety & Escalation Pipeline

### Context
Children may disclose distress, bullying, abuse, or self-harm, or encounter jailbreak attempts and inappropriate topics. The system must fail closed, protect the child, and escalate appropriately without acting as a clinician or detective.

### Decision
Three distinct safety checkpoints operate on every turn:
1. **Layer 1: Fast Heuristic & Regex Filter (< 5ms)**:
   - Scans for known crisis keywords (suicide, abuse, violence), phone numbers, physical addresses, and adversarial prompt injection strings.
2. **Layer 2: Dedicated Safety Classifier LLM**:
   - Classifies message intent across: `SAFE`, `DISTRESS`, `ABUSE_DISCLOSURE`, `BULLYING`, `SEXUAL_CONTENT`, `PII_LEAK`, `PROMPT_INJECTION`.
3. **Layer 3: Output Appropriateness & Anti-Anthropomorphism Validator**:
   - Validates that the generated tutor response complies with age vocabulary limits, contains no personal claims, and offers no medical or legal diagnosis.

**Escalation Policy**:
- For distress or abuse: Output compassionate scripted reply encouraging talking to a trusted adult; provide national child helpline (Childline 1098 India); trigger an immediate parent alert (unless parent is implicated, in which case route to admin child protection queue); log incident in `SafetyEvent` table.

---

## ADR-006: Child Privacy & India DPDP Act 2023 / COPPA Compliance

### Context
The Digital Personal Data Protection (DPDP) Act 2023 (India) and COPPA (USA) mandate verifiable parental consent, strict data minimization, and prohibition of tracking or behavioral advertising for minors.

### Decision
1. **Parent-Only Accounts**: Children NEVER register independently. Accounts belong to parents/guardians with email verification and explicit consent agreement.
2. **Child Profile Minimization**: Only collects: First name/nickname, age band (6–8, 9–12, 13–16), grade, educational board (CBSE, ICSE, State, IB), language preference, and learning interests. **Never** collect child email, phone number, school name, or residential address.
3. **Child Authentication**: Child logs in via parent-configured 4-digit numeric PIN, animal emoji combination, or secure QR/magic link.
4. **Third-Party AI Vendor Terms**: PII detector redacts any incidental names/locations before sending prompts to LLM APIs. Enterprise zero-data-retention and no-training agreements are enforced.
5. **Data Sovereignty**: Database and hosting located in AWS `ap-south-1` (Mumbai). Full one-click data export and permanent deletion API for parents.

---

## ADR-007: Curriculum Graph & Bayesian Knowledge Tracing Engine

### Context
To deliver true personalized tutoring, the system needs an objective representation of skills, prerequisites, and mastery probabilities.

### Decision
1. **Curriculum Graph**: Seeded via JSON/YAML for CBSE/NCERT Maths (Classes 4, 6) and Science (Class 8).
2. **Mastery Tracking**: Bayesian Knowledge Tracing (BKT) tracking four parameters per skill:
   - $P(L_0)$: Initial prior knowledge
   - $P(T)$: Probability of learning transition
   - $P(G)$: Probability of guess
   - $P(S)$: Probability of slip
3. **Spaced Repetition**: Modified SM-2 algorithm scheduling review activities at expanding intervals (1 day, 3 days, 7 days, 21 days).
4. **Misconception Catalog**: Standard misconceptions (e.g., "multiplying always makes numbers bigger", "heavy objects fall faster") are indexed and triggered for targeted counter-examples.

---

## ADR-008: Flagship Life Values & Ethics 4-Stage Engine

### Context
Values cannot be taught through passive lectures or multiple-choice quizzes. They require reflection and concrete real-world practice with real human beings.

### Decision
The curriculum encompasses 12 core modules:
1. Gratitude, 2. Kindness, 3. Honesty, 4. Empathy, 5. Responsibility, 6. Respect, 7. Perseverance, 8. Courage, 9. Sharing, 10. Care for Environment, 11. Digital Citizenship & Online Safety, 12. Handling Anger & Peer Pressure.

Each module follows the **Story -> Reflect -> Act -> Share** pedagogical cycle:
- **Story**: Engaging, culturally inclusive narrative from educator-approved content.
- **Reflect**: Socratic dialogue exploring ethical dilemmas without moralizing or lecturing.
- **Act (Real-Life Mission)**: Mandatory offline mission with family, classmates, or community (e.g., *"Help someone with chores without being asked"*).
- **Share**: Child logs reflection (text, voice, or drawing). Successful completion earns a seed that blossoms in their personal **Character Garden**.

---

## ADR-009: Multimodal & Multilingual Strategy (English, Hindi, Telugu)

### Context
India's learners often understand spoken concepts better in their native tongue while retaining scientific and mathematical terms in English (e.g., "Force", "Fractions", "Photosynthesis").

### Decision
1. **Languages**: Full launch support for English, Hindi (हिन्दी), and Telugu (తెలుగు).
2. **Code-Mixing Policy**: Explanations, analogies, and encouragement match the chosen language; technical scientific terms remain standard in English for academic rigor.
3. **Voice Pipeline**:
   - Browser Web Speech API for low-latency client-side speech recognition and synthesis.
   - Server-side fallback (Whisper API / Edge TTS / Piper) for unsupported browsers.
   - Push-to-talk button + streaming audio with barge-in interruption capability.
4. **Vision/Upload**: Photos of homework or notebook sketches are processed via vision LLM. Input images are marked strictly as untrusted data with strict OCR filtering to prevent prompt injection.

---

## ADR-010: Model Provider Layer, Caching, Token Budgets & Kill Switches

### Context
High concurrency with LLMs can lead to exorbitant costs, latency spikes, and provider outages. Robust operations require provider abstraction and automated safeguards.

### Decision
1. **Model Layer**: Provider-agnostic interface (`LLMProvider`) supporting Anthropic Claude (default primary), Google Gemini (high-throughput fallback), and OpenAI. Configured entirely via environment variables.
2. **Tiered Routing**:
   - *High-Reasoning Tasks* (Socratic Tutoring, Story Reflection): Claude 3.5 Sonnet / GPT-4o.
   - *Fast/Heuristic Tasks* (Assessor rubric matching, Safety classification): Claude 3.5 Haiku / GPT-4o-mini.
3. **Cost Controls**:
   - System prompt caching on recurring sessions.
   - Maximum token budgets enforced per turn (max 250 tokens for age 6–8; max 450 tokens for 13–16).
   - Redis-backed rate limiting per child session.
4. **Global Kill Switch**: Redis feature flag `KILL_SWITCH_AI_ALL` allows instant cutoff of AI endpoints in case of unexpected provider anomaly, falling back to pre-authored static revision cards and interactive quizzes.

---

## Running List of Human Decisions Needed

The following items are outside the autonomous software build scope and require human stakeholder sign-off prior to commercial production launch:

1. **Verifiable Parental Consent Method (DPDP 2023)**: Selection of approved verification provider (e.g., DigiLocker, Aadhaar OTP token, or ₹1 refundable credit card authorization) once central rules under DPDP Act 2023 are fully notified.
2. **Educator & Child-Psychologist Content Sign-Off**: Human panel review of all 12 Life Values modules, dilemma scenarios, and age-band grading rubrics (pre-seeded content is marked `STATUS: NEEDS_REVIEW`).
3. **Production API Keys & Tier Limits**: Procurement of dedicated enterprise Anthropic/OpenAI/Google API keys with explicit zero-data-retention / BAA agreements.
4. **Payment Gateway Merchant Verification**: Production Razorpay & Stripe merchant onboarding (KYC for India and international parent subscriptions).
### ADR-011: Web Frontend Architecture (Next.js 14, Web Speech Barge-In, KaTeX, HTML5 Whiteboard)
- **Status**: Accepted
- **Context**: The tutoring experience requires low latency, rich mathematical formatting, child-friendly drawing, and voice input with interruptibility.
- **Decision**: Next.js 14 App Router with Tailwind CSS. Math formulas render via KaTeX stylesheet. The whiteboard canvas uses native HTML5 Canvas 2D context exportable to data URLs. Voice input uses Web Speech Recognition API with automatic interruption (barge-in cancelling `window.speechSynthesis` when the child speaks).
- **Consequences**: Zero heavy third-party canvas or voice plugins needed; works smoothly on mobile tablets and desktops.

### ADR-012: Production Infrastructure & India Data Residency (AWS Mumbai ap-south-1)
- **Status**: Accepted
- **Context**: DPDP Act 2023 mandates secure local data handling and rigorous data minimization for minors' data.
- **Decision**: All cloud infrastructure is provisioned in AWS `ap-south-1` (Mumbai) using modular Terraform. RDS PostgreSQL 16 is encrypted with KMS at rest with 30-day point-in-time recovery. S3 media storage enforces an automatic 24-hour expiration lifecycle rule for ephemeral homework photos and voice clips.
- **Consequences**: Guarantees full data residency and statutory compliance within Indian borders.

---

## 3. Running List of Human Decisions Needed

1. **Enterprise LLM Terms of Service**: Final execution of Zero-Data-Retention (ZDR) contractual addendum with Anthropic PBC for commercial production traffic.
2. **Pedagogical Content Sign-off**: Formal educator review panel approval of all 12 Life Values module stories, dilemmas, and missions via the Admin Review Queue (`/admin`).
3. **Emergency Escalation Routing**: Production SMS/Email webhook endpoints for real-time dispatch of Childline India (1098) crisis incidents.
4. **Merchant / Billing Gate**: Selection of payment gateway (Razorpay / Stripe India) for parent subscription tiers.
5. **Domain & DNS**: Allocation of official domain name (e.g., `kidsmentor.in`) and SSL certificate issuance in AWS Route 53.
