# PawStay Production Runbook & Operations Manual

This runbook provides technical procedures, disaster recovery drills, and operational playbooks for operators, SREs, and on-call engineers managing PawStay in production.

---

## 1. Production Architecture & Topology

- **Primary Web Cluster**: Fly.io (or AWS ECS Fargate) running `@pawstay/web` (Next.js 14 App Router, Node 20 alpine, unprivileged non-root user).
- **Background Worker Cluster**: Dedicated background containers running BullMQ worker processes (`@pawstay/worker`).
- **Database**: PostgreSQL 15+ with PostGIS extensions enabled (AWS RDS or Supabase/Fly Postgres).
- **In-Memory Cache & Message Broker**: Redis 7+ (AWS ElastiCache or Redis Cloud).
- **Object Storage**: S3-compatible bucket with presigned upload URLs and server-side EXIF scrubbing (AWS S3 or Cloudflare R2).
- **Edge Security & CDN**: Cloudflare with strict SSL/TLS, Turnstile bot protection, and DDOS mitigation.

---

## 2. Daily Database Backup & Restore Drill

### 2.1 Automated Backup Schedule
Nightly full database backups occur at 02:00 UTC via pg_dump, compressed and encrypted with AES-256 before upload to an immutable, versioned offsite S3 backup bucket with a 30-day lifecycle retention policy.

### 2.2 Point-In-Time Restore Drill Procedure
Execute this drill quarterly in a staging sandbox:

```bash
# 1. Download latest encrypted backup from S3
aws s3 cp s3://pawstay-database-backups-encrypted/latest.dump.enc ./latest.dump.enc

# 2. Decrypt backup using KMS master key
aws kms decrypt \
  --ciphertext-blob fileb://latest.dump.enc \
  --output text \
  --query Plaintext | base64 --decode > pawstay_restore.dump

# 3. Create isolated drill database
createdb -h localhost -U pawstay_admin pawstay_drill_restore

# 4. Enable PostGIS extensions
psql -h localhost -U pawstay_admin -d pawstay_drill_restore -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -h localhost -U pawstay_admin -d pawstay_drill_restore -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 5. Restore database dump
pg_restore -h localhost -U pawstay_admin -d pawstay_drill_restore --clean --if-exists --no-owner pawstay_restore.dump

# 6. Verify row count & double-entry ledger balance
psql -h localhost -U pawstay_admin -d pawstay_drill_restore -c "
  SELECT 
    COUNT(*) AS total_bookings,
    SUM(CASE WHEN \"debitAccount\" IS NOT NULL THEN \"amountMinor\" ELSE 0 END) AS total_debits,
    SUM(CASE WHEN \"creditAccount\" IS NOT NULL THEN \"amountMinor\" ELSE 0 END) AS total_credits
  FROM \"LedgerEntry\";
"
```

---

## 3. Financial Ledger Reconciliation & Drift Alerts

PawStay uses a strict internal double-entry accounting ledger (`LedgerEntry` model). Every payment authorization, fee capture, payout release, and cancellation refund must have equal debits and credits:

$$\text{Debit } \text{STRIPE\_CLEARING} = \text{Credit } \text{SITTER\_PAYABLE} + \text{Credit } \text{PLATFORM\_REVENUE}$$

### Nightly Automated Audit Job
The BullMQ `pawstay:ledger-reconciliation` queue executes nightly at 03:00 UTC. It scans all ledger transactions and alerts SRE immediately if $\text{drift} \neq 0$:

```bash
# Manual on-demand reconciliation trigger
pnpm --filter @pawstay/worker exec node -e "
  const { runLedgerReconciliation } = require('./dist/reconciliation.js');
  runLedgerReconciliation().then(r => console.log('Reconciliation result:', r));
"
```

If drift is detected:
1. Payout processing is automatically placed on hold.
2. The offending booking ID is tagged in the admin audit log.
3. On-call engineer inspects raw provider webhook logs vs internal ledger entries.

---

## 4. Emergency Support Response Protocol

When an emergency is triggered via the in-app 24/7 button (`POST /api/bookings/:id/emergency`):

1. **Automated Broadcast**:
   - High-urgency push notification and SMS sent to the Pet Owner and Host.
   - PagerDuty incident spawned for platform operations on-call.
2. **Accessing Emergency Profile**:
   - Access the booking in the Admin Console: `/bookings/:id`.
   - Review primary veterinary hospital contact, phone, and owner-authorized emergency spend limit (`vetEmergencyLimitMinor`).
3. **Escalation Helpline**:
   - Platform Concierge contacts the host family directly to confirm pet safety and authorize veterinary transport if needed.
   - Emergency dispatch helpline: `1-800-555-PAWS`.

---

## 5. Deployment Guide

### 5.1 Primary Deployment (Fly.io)
```bash
# 1. Deploy database migrations
pnpm --filter @pawstay/db push

# 2. Deploy Web application
fly deploy --config fly.toml

# 3. Deploy Background Worker
fly deploy --config apps/worker/fly.toml
```

### 5.2 Alternative Deployment (AWS ECS Fargate)
1. Build and push images to AWS ECR:
   - `pawstay/web:latest`
   - `pawstay/worker:latest`
2. Update ECS Task Definitions with secrets stored in AWS Secrets Manager (`DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `NEXTAUTH_SECRET`).
3. Run ECS service update with zero downtime rolling replacement (`minimumHealthyPercent: 100`, `maximumPercent: 200`).
