# CampusEdge Learning Solutions

> **High-impact institutional training and campus placement acceleration platform for Indian engineering colleges.**

CampusEdge partners with engineering colleges, universities, and technical institutes to bridge the gap between academic theory and tier-1 corporate hiring expectations. We deliver intensive on-campus and hybrid training programs covering **Data Structures & Algorithms (DSA)**, **Speed Aptitude**, and **Corporate Soft Skills & Mock Interviews**.

---

## Key Features

- **Institutional B2B Offering & Syllabi**: Comprehensive 16-week zero-to-hero DSA track (160+ coding problems), 60-hour Speed Aptitude curriculum, and 36-hour Soft Skills & Mock Interview prep aligned with NBA Criterion 4/5 and NAAC Criterion 5.1/5.2.
- **TPO Proposal & Demo Request Engine**: High-conversion institutional onboarding flow with anti-spam honeypot protection, sliding-window rate limiting, and automated transactional email briefing.
- **Student Employability Diagnostic Assessment**: 20-question timed diagnostic tool spanning Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Core DSA with instant scoring, readiness band classification (Super-Dream, Mass Recruiter, Foundation), and section breakdown.
- **Administrative CRM Pipeline**: Role-based admin portal to manage institutional leads (New → Contacted → Demo → Pilot → Won/Lost), update follow-up schedules, view assessment submissions, and export CRM-ready CSVs.
- **Sales & Outreach Battlekit**: Complete cold email sequence, WhatsApp scripts, LinkedIn outreach, objection battlecards, MoU template, and print-ready institutional brochure in `/docs/outreach`.

---

## Monorepo Architecture & Folder Structure

```
├── apps/
│   └── web/                     # Next.js 14 App Router application
│       ├── src/
│       │   ├── app/             # Public marketing, demo, assessment & admin routes
│       │   │   ├── admin/       # Protected CRM & content management pages
│       │   │   ├── api/         # Next.js API route handlers (leads, assessment, auth)
│       │   │   ├── assessment/  # Student diagnostic assessment interactive engine
│       │   │   ├── demo/        # College TPO proposal & demo request page
│       │   │   ├── programs/    # Syllabus & curriculum pages
│       │   │   ├── packages/    # Institutional packages & pilot pricing
│       │   │   └── page.tsx     # Homepage with metrics & social proof
│       │   ├── components/      # UI components (Header, Footer, Icons)
│       │   ├── lib/             # Validations (Zod), rate limiter, email, scoring
│       │   └── types/           # NextAuth and custom type declarations
│       └── public/              # Static assets & icons
├── packages/
│   └── db/                      # Database package with Prisma ORM
│       ├── prisma/
│       │   ├── schema.prisma    # SQLite development schema (zero friction)
│       │   └── schema.postgresql.prisma # PostgreSQL production schema
│       └── src/
│           ├── index.ts         # PrismaClient singleton instance
│           └── seed.ts          # 60+ diagnostic questions, admin user, seed data
├── docs/                        # Complete institutional business documentation
│   ├── ASSUMPTIONS.md           # Business model parameters & conventions
│   ├── OFFERING_AND_CURRICULUM.md # Week-by-week DSA, Aptitude & Soft skills syllabi
│   ├── DELIVERY_MODELS.md       # Foundation, Accelerator & Mentorship packages
│   ├── PRICING_AND_COMMERCIALS.md # Per-student & per-batch pricing, GST, pilot offer
│   ├── COLLEGE_VALUE_PROPOSITION.md # Placement metrics, NAAC/NBA alignment, objections
│   ├── PILOT_TO_CONTRACT_FUNNEL.md # 4-stage funnel (Demo -> Pilot -> Contract -> Renewal)
│   ├── OPERATIONS.md            # Trainer SOP, QA audits, MIS formats, risk register
│   ├── ARCHITECTURE.md          # Technical stack, ERD, and security justification
│   ├── DEPLOYMENT_GUIDE.md      # Vercel + Neon and Ubuntu VPS deployment guides
│   └── outreach/                # Cold emails, WhatsApp, LinkedIn, phone scripts, MoU, brochure
├── tests/                       # Automated test suite
│   ├── unit/                    # Zod validation, assessment scoring, and rate limiter tests
│   ├── integration/             # Lead API persistence and security tests
│   └── e2e/                     # Playwright end-to-end user flows
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Containerized orchestration with PostgreSQL
└── vitest.config.ts             # Vitest test runner configuration
```

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js**: v18.13.0 or higher (Node 20 LTS recommended)
- **pnpm**: v9 or v12 (`npm install -g pnpm`)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/campusedge-platform.git
cd campusedge-platform

# Install dependencies across all monorepo packages
pnpm install
```

### 2. Configure Environment

Copy the example environment configuration:
```bash
cp .env.example .env
```

For zero-friction local development, SQLite is preconfigured (`DATABASE_URL="file:./dev.db"`).

### 3. Database Initialization & Seeding

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to local SQLite database
pnpm db:push

# Seed initial 60+ diagnostic questions, admin credentials, and sample leads
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

- **Public Website**: `http://localhost:3000`
- **Request Demo Form**: `http://localhost:3000/demo`
- **Readiness Diagnostic**: `http://localhost:3000/assessment`
- **Admin Portal**: `http://localhost:3000/admin/login`
  - Default Admin Email: `admin@campusedge.in`
  - Default Admin Password: `CampusEdgeAdmin2026!`

---

## Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | `pnpm --filter @campusedge/web dev` | Starts local Next.js development server on port 3000 |
| `pnpm build` | `prisma generate && build monorepo` | Compiles database package and builds production Next.js app |
| `pnpm start` | `pnpm --filter @campusedge/web start` | Starts compiled production server |
| `pnpm test` | `vitest run` | Runs all 21 unit and integration tests |
| `pnpm test:e2e` | `playwright test` | Runs Playwright browser end-to-end tests |
| `pnpm typecheck`| `tsc --noEmit` | Validates TypeScript types across the codebase |
| `pnpm db:generate`| `prisma generate` | Generates Prisma Client types |
| `pnpm db:push` | `prisma db push` | Pushes Prisma schema changes to the database |
| `pnpm db:seed` | `node packages/db/dist/seed.js` | Seeds questions, testimonials, FAQs, and admin user |

---

## Testing

The project includes unit, integration, and end-to-end test suites:

```bash
# Run Vitest Unit & Integration Suite
pnpm test

# Run Playwright E2E Suite (requires build or running dev server)
pnpm test:e2e
```

---

## Docker Deployment (Local or VPS)

To spin up the entire application along with PostgreSQL in containers:

```bash
# Build and start services in background
docker compose up -d --build

# View logs
docker compose logs -f web
```

The application will be accessible at `http://localhost:3000`.

---

## Production Deployment

Detailed production setup guides for both **Vercel + Neon** and **Ubuntu VPS + Nginx + SSL** are documented in [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

---

## How to Update Content

1. **Adding Diagnostic Assessment Questions**: Add questions in `packages/db/src/seed.ts` or via the database management client. Each question requires `section` (`QUANT`, `LOGICAL`, `VERBAL`, `DSA_BASIC`), `difficulty`, `options` (array of 4 choices), `correctAnswer` (0-3 index), and a detailed `explanation`.
2. **Modifying Curriculum**: Update `docs/OFFERING_AND_CURRICULUM.md` for institutional proposals and `apps/web/src/app/programs/page.tsx` for the web interface.
3. **Institutional Brochure**: The printable brochure is located at `docs/outreach/BROCHURE.html`. Open in any modern browser and select **Print → Save as PDF** (preconfigured with `@media print` layout).
4. **CRM Prospect Tracker**: Open `docs/outreach/PROSPECT_TRACKING_TEMPLATE.csv` in Excel or Google Sheets to track cold outreach stages.

---

## License

Proprietary © 2026 CampusEdge Learning Solutions. All rights reserved.
