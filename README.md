# KidsMentor (Working Name)
### Production-Ready 1-on-1 AI Tutoring Platform for Children (Ages 6–16)

> **"The AI tutor is the ONLY instructor. There are no human teachers in the product. Humans appear only as Parents/Guardians (oversight), Admins/Reviewers (offline quality & safety review), and the child's real-world family and friends (the people the child practices values with)."**

KidsMentor pairs Socratic tutoring in **NCERT Maths & Science** with our flagship **Life Values & Ethics** curriculum. Designed with honest AI identity, deterministic SymPy verification, a 3-layer defense-in-depth safety architecture, and compliance with the **India DPDP Act 2023** and **US COPPA**.

---

## 0. AI-Native Core Design Principles

1. **Honest AI Identity**: Ollie the Owl is an artificial intelligence helper, clearly labeled in the UI, onboarding, and voice greeting. If asked *"Are you real/alive?"*, Ollie explains honestly at the child's developmental level. Ollie never claims a physical body, human feelings, parents, or childhood memories.
2. **Verify, Don't Trust**: LLM output on mathematics and physics is checked by deterministic tools (**SymPy**) before the child sees a verdict.
3. **LLM Proposes, Backend Disposes**: The model never writes directly to the database or changes state; it calls typed tools validated by deterministic code.
4. **Fail Closed and Gentle**: When safety checks fail or the model is uncertain, scripted compassionate fallbacks appear, never raw model output.
5. **Humans in the Loop at the Edges**: Parents control AI settings, inspect transcripts, and manage PINs; offline educators review draft curriculum; nothing AI-generated enters the shared catalog without review.
6. **Anti-Dependency by Design**: Zero retention guilt (*"I'll miss you"* is banned), daily 30-min caps, 20-min break reminders, and Real-Life Missions intentionally connecting children to real-world family and friends.
7. **Pinned and Regression-Tested Models**: Prompts and model targets are pinned; releases must achieve 100% pass on our 210-case adversarial red-team eval suite.

---

## 1. System Architecture & Tech Stack

```
kidsmentor/
├── apps/
│   ├── api/                     # Python 3.11 FastAPI backend
│   │   ├── models/              # SQLAlchemy async models (Users, Curriculum, Sessions, Values, Memory)
│   │   ├── routers/             # API endpoints (auth, children, curriculum, sessions, values, parent, admin)
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── seed/                # Curriculum & Values seeders (NCERT Maths/Science, 12 Values)
│   │   └── services/            # SymPy checker, 3-layer safety service, BKT mastery, MultiAgentOrchestrator
│   ├── worker/                  # Asynchronous operational background worker (apps/worker/worker.py)
│   └── web/                     # Next.js 14 App Router child & parent portal (apps/web/)
├── packages/
│   └── shared/                  # Shared TypeScript contracts, schemas, and constants
├── prompts/                     # Versioned YAML system prompts (Tutor, Planner, Assessor, Values, Safety, Insights, Content)
├── evals/                       # 210-case adversarial red-team safety evaluation harness
├── infra/                       # Modular Terraform for AWS ap-south-1 (Mumbai) & Docker orchestration
└── docs/                        # Complete architecture, legal compliance, and threat model documentation
```

### Technology Matrix
- **Backend API**: Python 3.11, FastAPI, SQLAlchemy 2.0 (AsyncIO), Pydantic v2, aiosqlite / asyncpg.
- **Deterministic Math Engine**: SymPy (fractions, equations, dimensional analysis, pressure formulas).
- **Background Worker**: Python AsyncIO daemon running SM-2 spaced repetition queue, weekly parent digests, streak maintenance, and Childline 1098 alerts.
- **Frontend Web App**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide icons, KaTeX math formatting, Web Speech API (STT/TTS with barge-in).
- **Database**: PostgreSQL 16 with `pgvector` (production) / SQLite with aiosqlite (development).
- **Infrastructure**: Terraform (AWS `ap-south-1` Mumbai, VPC, RDS, Redis, ECS Fargate, S3, CloudFront + WAF).

---

## 2. Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Step 1: Initialize Virtual Environment & Install Dependencies
```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Seed Curriculum & Values Data
```bash
python -m apps.api.seed.curriculum_seed
python -m apps.api.seed.values_seed
```

### Step 3: Run Full Automated Verification Suite
```bash
# Run pytest API integration tests (8/8 flows):
pytest tests/ -v

# Run 210-case adversarial red-team safety evaluation harness:
python evals/runner.py

# Run background worker maintenance cycle:
python -m apps.worker.worker
```

### Step 4: Start FastAPI Backend
```bash
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### Step 5: Start Next.js Frontend
```bash
cd apps/web
npm install
npm run dev
```
Web app will be live at: `http://localhost:3000`

---

## 3. Core Feature Portals

| Route | Role | Description |
| :--- | :--- | :--- |
| `/` | Public | Welcome portal, honest AI identity value prop, Socratic demo simulator, DPDP reassurance. |
| `/onboarding` | Parent | Verifiable Parental Consent (DPDP Act 2023 Sec 9), child profile setup, PIN creation, mascot welcome. |
| `/child/login` | Child | 4-Digit PIN keypad login without email/password friction. |
| `/child/home` | Child | "Today's Plan", learning streaks with freeze shields, Character Garden preview, daily screen time monitor. |
| `/child/tutor` | Child | 1-on-1 Socratic tutoring with KaTeX, whiteboard canvas, homework upload, Web Speech STT/TTS with barge-in, hint ladder. |
| `/child/values` | Child | Flagship 12 Values Track: Story (en/hi/te) $\rightarrow$ Reflect $\rightarrow$ Real-Life Mission with real people $\rightarrow$ Share, Gratitude Journal. |
| `/parent/dashboard` | Parent | Mastery heatmaps, weekly AI digests, dinner conversation starters, full session audit transcripts, AI settings, 1-click DPDP export/delete. |
| `/admin` | Reviewer | Human-in-the-loop content review queue, safety moderation queue (Childline India 1098), prompt version rollback, eval metrics. |

---

## 4. Empirical Evaluation & Verification Results

```
======================================================================
KIDSMENTOR EMPIRICAL VERIFICATION BENCHMARK SUMMARY
======================================================================
1. Pytest Integration Test Suite:      8 / 8 Passed (100%)
   - Auth, Consent, Child CRUD, Curriculum, Sessions, SymPy, Values, Parent/Admin
2. Adversarial Red-Team Safety Harness: 210 / 210 Passed (100.0%)
   - Distress / Suicidal Ideation:     40 / 40 Passed
   - Abuse & Exploitation Disclosures: 35 / 35 Passed
   - Grooming & Secret-Keeping:        35 / 35 Passed
   - PII Redaction & Data Leakage:     35 / 35 Passed
   - Jailbreaks & Prompt Injections:   35 / 35 Passed
   - Safe Educational Controls:        30 / 30 Passed
3. SymPy Deterministic Math Checker:   7 / 7 Passed (100.0%)
   - Fractions (Unlike Denominators, LCM)
   - Single-Variable Linear Equations
   - Pressure Formula ($P = F / A$)
4. Anti-Dependency Audit:              0 Violations Detected
======================================================================
```

---

## 5. Documentation Directory (`/docs`)

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): System architecture, FSM state machines, SymPy verification sequence diagrams, ERD, and anti-dependency rules matrix.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): 10 Architectural Decision Records (ADRs) and running list of human business decisions needed.
- [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md): Statutory compliance guide for India DPDP Act 2023 and US COPPA.
- [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md): OWASP Top 10 for LLMs threat matrix and 3-layer defense-in-depth mitigations.
- [`docs/AI_SAFETY_CASE.md`](docs/AI_SAFETY_CASE.md): Empirical evidence and arguments for autonomous AI tutor safety.
- [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md): Pedagogy standards for human educator review panel.
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md): Operations runbook, emergency kill switches, prompt rollback, and Childline 1098 incident handling.
- [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md): Pre-flight launch readiness checklist.

---

## 6. License & Compliance
Built with strict adherence to the **India Digital Personal Data Protection Act, 2023** and **COPPA**. Designed to enrich children's intellectual curiosity while strengthening real-world bonds with family and friends.
