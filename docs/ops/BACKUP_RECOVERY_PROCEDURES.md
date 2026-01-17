# Backup & Recovery Procedures
## Dr Amal Clinical OS v2.0

**Last Updated:** 2026-01-17  
**Owner:** Database Administrator / DevOps Lead

---

## Executive Summary

**Database:** Neon PostgreSQL (managed cloud service)  
**Backup Strategy:** Continuous Point-in-Time Recovery (PITR)  
**Retention:** 30 days (Neon Pro plan default)  
**RTO (Recovery Time Objective):** <30 minutes  
**RPO (Recovery Point Objective):** <1 minute (continuous backups)

---

## Neon Backup Architecture

### Automatic Backups

Neon provides **continuous backup** through Write-Ahead Log (WAL) archiving:

✅ **Automatic:** No configuration required  
✅ **Continuous:** Every database transaction backed up  
✅ **Incremental:** Only changed data stored (storage efficient)  
✅ **Point-in-Time:** Restore to any second within retention window

**Status Verification:**
```bash
# Check Neon console
https://console.neon.tech/app/projects/<project-id>/settings

# Confirm:
# - PITR enabled: YES
# - Retention period: 30 days
# - Last backup: <should be "Continuous">
```

### Storage Location

- **Provider:** Neon (managed by Neon team)
- **Region:** US East (Virginia) - Same as primary database
- **Redundancy:** Multi-AZ within AWS
- **Encryption:** At rest (AES-256)

### What is Backed Up

✅ **Database Schema:** All tables, indexes, constraints  
✅ **Clinical Data:** Patients, sessions, notes, prescriptions, labs  
✅ **User Data:** Users, roles, refresh tokens  
✅ **Audit Logs:** Full audit trail  
✅ **State Machines:** Current states of all entities

❌ **NOT Backed Up:**
- Application code (use Git)
- Environment variables (store in secure vault)
- Frontend assets (rebuild from code)
- Server logs (stream to external service)

---

## Recovery Scenarios

### Scenario 1: Data Corruption (Soft Delete Gone Wrong)

**Problem:** Accidental bulk delete or incorrect update

**Detection:**
- User reports missing data
- Audit logs show unexpected DELETE/UPDATE
- Metrics show sudden drop in record counts

**Recovery Steps:**

1. **Identify Corruption Time:**
   ```sql
   -- Query audit log
   SELECT action, tableName, recordId, timestamp
   FROM "AuditLog"
   WHERE action = 'DELETE'
   ORDER BY timestamp DESC
   LIMIT 100;
   ```

2. **Determine Recovery Point:**
   - Example: Data was correct at 2026-01-17 14:30:00 UTC
   - Corruption occurred at 2026-01-17 14:35:00 UTC
   - Recovery point: 2026-01-17 14:29:59 UTC

3. **Create Recovery Branch in Neon:**
   ```bash
   # Via Neon Console:
   1. Go to https://console.neon.tech
   2. Select project: Dr Amal Clinical OS
   3. Click "Branches" tab
   4. Click "New Branch"
   5. Name: "recovery-2026-01-17-1430"
   6. Select restore point: 2026-01-17 14:29:59 UTC
   7. Create branch
   ```

4. **Verify Recovered Data:**
   ```bash
   # Connect to recovery branch
   CONNECTION_STRING="postgresql://user:pass@recovery-branch.neon.tech/neondb"
   
   # Query to verify data exists
   psql $CONNECTION_STRING -c "SELECT COUNT(*) FROM \"ClinicalNote\""
   ```

5. **Export Missing Data:**
   ```sql
   -- Export data that needs to be restored
   \copy (SELECT * FROM "ClinicalNote" WHERE "createdAt" >= '2026-01-17 14:00:00' AND "createdAt" < '2026-01-17 14:30:00') TO '/tmp/recovery_notes.csv' CSV HEADER;
   ```

6. **Import to Production:**
   ```sql
   -- Connect to production
   \copy "ClinicalNote" FROM '/tmp/recovery_notes.csv' CSV HEADER;
   ```

**Time to Recover:** 15-30 minutes  
**Data Loss:** 0 minutes (recover to exact second)

---

### Scenario 2: Complete Database Loss

**Problem:** Neon service outage, account compromise, or catastrophic failure

**Detection:**
- All API requests return 500 errors
- Database connection completely fails
- Neon console shows database unavailable

**Recovery Steps:**

1. **Confirm Neon Outage:**
   ```bash
   # Check Neon status page
   https://neonstatus.com
   
   # Try direct connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Contact Neon Support (CRITICAL):**
   - Email: support@neon.tech
   - Slack: Neon customer workspace (if available)
   - Priority: URGENT - Production database down

3. **Restore from Latest Backup:**
   ```bash
   # Via Neon Console:
   1. Navigate to project
   2. Click "Restore from backup"
   3. Select: "Latest available point"
   4. Confirm restore
   5. Wait for restoration (typically 5-15 minutes)
   ```

4. **Verify Data Integrity:**
   ```sql
   -- Check record counts
   SELECT 'ClinicalNote' as table, COUNT(*) as count FROM "ClinicalNote"
   UNION ALL
   SELECT 'Patient', COUNT(*) FROM "Patient"
   UNION ALL
   SELECT 'User', COUNT(*) FROM "User"
   UNION ALL
   SELECT 'Prescription', COUNT(*) FROM "Prescription";
   
   -- Check latest records
   SELECT MAX("createdAt") as latest_record FROM "ClinicalNote";
   ```

5. **Reconnect Application:**
   ```bash
   # Update DATABASE_URL if endpoint changed
   # Restart application pods
   kubectl rollout restart deployment dr-amal-app
   
   # Or Vercel redeploy
   vercel --prod
   ```

6. **Notify Users:**
   - Post to status page: "Database restored, service operational"
   - Send email to active users
   - Document incident in post-mortem

**Time to Recover:** 20-45 minutes  
**Data Loss:** 0-5 minutes (depending on when last WAL was archived)

---

### Scenario 3: Schema Migration Gone Wrong

**Problem:** Destructive migration deleted column or table

**Detection:**
- Application errors: "Column does not exist"
- 500 errors on all endpoints using affected table
- Prisma query errors in logs

**Recovery Steps:**

1. **Immediately Rollback Application:**
   ```bash
   # Revert to previous Git commit
   git revert HEAD
   git push origin main
   
   # Redeploy
   vercel --prod
   ```

2. **Restore Schema (DO NOT restore data):**
   ```sql
   -- If column was dropped, re-add it
   ALTER TABLE "ClinicalNote" 
   ADD COLUMN "deletedColumn" TEXT;
   
   -- If table was dropped, recreate
   CREATE TABLE "DroppedTable" AS 
   SELECT * FROM <recovery_branch>."DroppedTable";
   ```

3. **Run Prisma Migration Fix:**
   ```bash
   # Mark problematic migration as rolled back
   npx prisma migrate resolve --rolled-back <migration-name>
   
   # Re-generate Prisma client
   npx prisma generate
   ```

4. **Test Application:**
   ```bash
   # Run integration tests
   npm test
   
   # Smoke test endpoints
   curl -X POST /api/auth/signin -d '{"email":"test@example.com","password":"test123"}'
   ```

**Time to Recover:** 10-20 minutes  
**Data Loss:** 0 (schema change only)

---

## Backup Verification

### Weekly Backup Test (Every Monday)

**Procedure:**
1. Create test recovery branch in Neon
2. Restore data from 24 hours ago
3. Query sample data to verify integrity
4. Delete test branch after verification

**Script:**
```bash
#!/bin/bash
# backup-test.sh

# Create recovery branch
neon branches create \
  --project-id $NEON_PROJECT_ID \
  --name "backup-test-$(date +%Y-%m-%d)" \
  --restore-point "24 hours ago"

# Wait for branch creation
sleep 10

# Get branch connection string
RECOVERY_URL=$(neon connection-string --branch backup-test-$(date +%Y-%m-%d))

# Verify data
psql $RECOVERY_URL -c "SELECT COUNT(*) as patients FROM \"Patient\"" > /tmp/backup-test-result.txt

# Check result
if grep -q "Error" /tmp/backup-test-result.txt; then
  echo "❌ BACKUP TEST FAILED"
  # Send alert
  exit 1
else
  echo "✅ BACKUP TEST PASSED"
fi

# Cleanup
neon branches delete --branch backup-test-$(date +%Y-%m-%d)
```

**Expected Output:**
```
✅ Backup test passed
   - Patients: 150
   - Clinical Notes: 423
   - Recovery branch created successfully
   - Data verified, branch deleted
```

---

## Recovery Contacts

### Primary Contacts

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| **Database Admin** | [TBD] | [Email/Phone] | Execute recovery procedures |
| **DevOps Lead** | [TBD] | [Email/Phone] | Application deployment post-recovery |
| **CTO** | [TBD] | [Email/Phone] | Decision authority for major recovery |
| **Neon Support** | Neon Team | support@neon.tech | Database restoration assistance |

### Escalation Path

1. **Detect Issue:** Monitoring alert fires (DB connectivity loss)
2. **Page On-Call:** Database Admin (PagerDuty)
3. **Assess Severity:** Critical = CTO + DevOps on call immediately
4. **Execute Recovery:** Follow scenario playbook
5. **Verify Success:** Run smoke tests
6. **Communicate:** Notify users, document incident

---

## Data Retention Policy

### Backup Retention

- **PITR Window:** 30 days (Neon Pro plan)
- **Manual Snapshots:** Indefinite (stored in Neon project)
- **Audit Logs:** Retained in database (no automatic deletion)

### Manual Snapshot Policy

**When to Create Snapshots:**
- Before major schema migrations
- Before large data imports/exports
- Before go-live (production launch)
- Monthly (first day of each month)

**How to Create:**
```bash
# Via Neon Console
1. Go to Branches
2. Create new branch from main
3. Name: "snapshot-YYYY-MM-DD-description"
4. Keep branch (do not delete automatically)
```

**Storage Cost:** ~$0.10/GB/month (Neon pricing)

---

## Compliance & Legal

### HIPAA Compliance

✅ **Encryption at Rest:** Neon uses AES-256 encryption  
✅ **Encryption in Transit:** SSL/TLS enforced (`sslmode=require`)  
✅ **Access Controls:** Database credentials stored in secure vault  
✅ **Audit Trail:** Full audit log of all data access  
✅ **BAA with Neon:** Business Associate Agreement signed (required for HIPAA)

### Data Residency

**Primary Region:** US East (Virginia)  
**Backup Region:** US East (multi-AZ within same region)  
**Cross-Region:** NOT enabled (keeps data in US)

### Retention Compliance

**Clinical Notes:** Retain indefinitely (legal requirement)  
**Audit Logs:** Retain for 7 years (HIPAA requirement)  
**User Data:** Retain until account deletion

---

## Disaster Recovery Plan (DRP)

### RTO/RPO Targets

| Service Component | RTO (Recovery Time) | RPO (Data Loss) |
|-------------------|---------------------|-----------------|
| Database | 30 minutes | 1 minute |
| Application | 10 minutes | 0 (stateless) |
| Frontend | 5 minutes | 0 (rebuild from code) |
| **Overall System** | **30 minutes** | **1 minute** |

### DR Testing Schedule

- **Monthly:** Backup verification test
- **Quarterly:** Full disaster recovery simulation
- **Annually:** Multi-region failover test (if implemented)

---

## Monitoring & Alerts

### Backup Health Checks

**Metrics to Monitor:**
- Last backup timestamp (should be < 5 minutes ago)
- Backup size trend (should grow steadily)
- Restore test success rate (should be 100%)

**Alerts:**
- ❌ No backup in >15 minutes → CRITICAL
- ❌ Backup test failed → HIGH
- ⚠️ Backup size dropped >50% → MEDIUM (possible data loss)

---

## Runbook Quick Reference

### Emergency Commands

**Check Database Status:**
```bash
psql $DATABASE_URL -c "SELECT NOW();" && echo "✅ DB OK" || echo "❌ DB DOWN"
```

**View Recent Backups:**
```bash
# Via Neon Console: Branches tab
# Look for automatically created restore points
```

**Create Emergency Snapshot:**
```bash
neon branches create --name "emergency-$(date +%Y%m%d-%H%M%S)"
```

**Restore to 1 Hour Ago:**
```bash
neon branches create --name "recovery-1h-ago" --restore-point "1 hour ago"
```

---

## Post-Recovery Checklist

After any recovery operation:

- [ ] Verify data integrity (run SQL queries)
- [ ] Smoke test all API endpoints
- [ ] Check audit logs for gaps
- [ ] Notify team recovery is complete
- [ ] Document incident in post-mortem
- [ ] Update RTO/RPO estimates if needed
- [ ] Review what caused the need for recovery
- [ ] Implement prevention measures

---

## Next Steps for Phase 4

**Before Launch:**
1. ✅ Verify Neon PITR enabled (check console)
2. ⏳ Test backup restoration process (dry run)
3. ⏳ Document Neon project credentials securely
4. ⏳ Add backup health checks to monitoring
5. ⏳ Schedule first backup test (Week 1 post-launch)
6. ⏳ Assign Database Admin role
7. ⏳ Sign Neon BAA (HIPAA requirement)

---

**Document Version:** 1.0  
**Review Date:** 2026-02-17 (monthly review)  
**Approver:** [CTO/Database Admin]
