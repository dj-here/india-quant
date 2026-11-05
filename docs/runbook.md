# KidsMentor Operational Runbook & Incident Response
## Production Maintenance, Kill Switches, and Safety Escalations

---

## 1. Emergency Kill Switches

### Global AI Tutor Kill Switch
If an unexpected model regression or safety bypass is detected across the cluster:
1. **API Environment Flag**:
   Set `FEATURE_FLAG_TUTOR_ENABLED=false` in AWS Secrets Manager or ECS environment variables.
2. **Immediate Effect**:
   All active tutoring sessions immediately display a friendly fallback banner:
   > *"Ollie is taking a quick nap to sharpen his owl feathers! Please check back in a few minutes or read one of your favorite books."*
3. **Database Command (Instant Disable via SQLite / Postgres)**:
   ```sql
   UPDATE feature_flags SET is_enabled = false WHERE flag_key = 'AI_TUTOR_ACTIVE';
   ```

---

## 2. Pinned Prompt Rollback Procedure (< 30 Seconds)
If a newly deployed prompt version exhibits higher frustration or unexpected phrasing:
1. Navigate to the **Admin Portal** (`/admin` $\rightarrow$ **Prompt Versions**).
2. Click **Rollback** on the affected agent (e.g., `TutorAgent`).
3. Alternatively, update the version in `prompts/tutor_agent.yaml` to the prior tag and run:
   ```bash
   python -m apps.api.main --reload
   ```
4. Pinned model target tags must never be updated to floating `-latest` aliases. Always pin to immutable model dates (e.g. `claude-3-5-sonnet-20241022`).

---

## 3. Child Crisis & Childline India 1098 Protocol
When a `CRISIS` safety event is logged (suicidal ideation, physical/sexual abuse):
1. **Automated Response**:
   - The child sees: *"I hear how hard things feel right now, but you are not alone. Please talk to a parent or trusted adult immediately, or call Childline India at 1098 (free, confidential, 24x7)."*
2. **On-Call Notification**:
   - PagerDuty alert fires to the Safety Response Team.
   - An automated, high-priority notification email is dispatched to the parent.
3. **Reviewer Verification**:
   - Open `/admin` $\rightarrow$ **Safety Queue**.
   - Review sanitized context (PII is already redacted).
   - Verify parent notification dispatch.
   - Mark incident `REVIEWED` with timestamp and reviewer notes.

---

## 4. Spaced Repetition & Worker Diagnostics
If background digests or spaced repetition tasks fail:
1. Inspect worker logs via ECS CloudWatch (`/ecs/kidsmentor-prod-worker`).
2. Run manual one-shot worker cycle:
   ```bash
   python -m apps.worker.worker
   ```
3. Check Redis connection status:
   ```bash
   redis-cli -u rediss://<endpoint>:6379 ping
   ```

---

## 5. Point-in-Time Recovery (PITR) for PostgreSQL
In the event of accidental data corruption:
1. RDS maintains continuous automated WAL archives for 30 days.
2. Restore to a point in time via AWS CLI:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier kidsmentor-prod-db \
     --target-db-instance-identifier kidsmentor-prod-restored \
     --restore-time "2026-11-04T12:00:00Z" \
     --db-subnet-group-name kidsmentor-prod-db-subnet-group
   ```
