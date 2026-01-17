# Production Rollback Strategy
## Dr Amal Clinical OS v2.0

**Last Updated:** 2026-01-17  
**Owner:** DevOps Lead / CTO

---

## Rollback Philosophy

**"Every deployment must be reversible within 5 minutes"**

- Rollback is NOT failure - it's risk management
- Fast rollback > slow debugging in production
- Always have a "last known good" version
- Database rollbacks are dangerous - avoid when possible

---

## Rollback Decision Tree

```
Is production broken? ────NO──→ Monitor and investigate
       │
       YES
       │
       ↓
Can it be hotfixed in <5 min? ────YES──→ Apply hotfix + monitor
       │
       NO
       │
       ↓
ROLLBACK IMMEDIATELY
```

### Rollback Triggers (Automatic Decision)

**MUST Rollback:**
- ❌ Auth completely broken (users cannot sign in)
- ❌ Database writes failing (data cannot be saved)
- ❌ 5xx error rate >25% for >2 minutes
- ❌ Critical security vulnerability discovered

**SHOULD Rollback:**
- ⚠️ New feature causing >10% error rate
- ⚠️ Performance degraded >50% (P95 latency)
- ⚠️ Rate limiting completely broken (DDoS vulnerability)

**MAY Rollback (case-by-case):**
- 🟡 UI bug affecting minority of users
- 🟡 AI features returning poor quality suggestions
- 🟡 Non-critical API endpoint errors

---

## Code Rollback Procedures

### 1. Application Rollback (Frontend + Backend)

**Platform:** Vercel (Next.js deployment)

**Procedure:**
```bash
# Via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select project: dr-amal-clinical-os
3. Click "Deployments" tab
4. Find last successful deployment (before current)
5. Click "..." menu → "Promote to Production"
6. Confirm rollback

# Time to complete: 2-3 minutes
```

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Identify last good deployment URL
# Example: dr-amal-clinical-os-abc123.vercel.app

# Promote to production
vercel promote dr-amal-clinical-os-abc123 --prod

# Verify
curl https://dr-amal.com/api/health
```

**Rollback Verification:**
```bash
# Check deployed version
curl https://dr-amal.com/api/version

# Expected response:
{
  "version": "1.9.0",  # Previous version
  "commit": "a1b2c3d",
  "deployedAt": "2026-01-16T10:30:00Z"
}
```

**Time to Execute:** 2-5 minutes  
**Data Loss:** None (stateless application)

---

### 2. Git Revert (Code-Level Rollback)

**When to Use:** Vercel rollback didn't work OR need to rollback specific commit

**Procedure:**
```bash
# Identify problematic commit
git log --oneline -10

# Example:
# b90de38 feat(ai): Add AI features (CURRENT - BROKEN)
# b7920c6 feat: Complete Phase 2 frontend (LAST GOOD)

# Option A: Revert specific commit (keeps history)
git revert b90de38 --no-edit
git push origin main

# Option B: Reset to last good (WARNING: rewrites history)
git reset --hard b7920c6
git push origin main --force

# Trigger new deployment
vercel --prod
```

**Recommendation:** Use `git revert` (Option A) to preserve history  
**Time to Execute:** 5-10 minutes

---

## Database Rollback Procedures

### ⚠️ WARNING: Database Rollbacks Are Risky

**Problems:**
- Data created after deployment will be lost
- User actions during broken period may be lost
- Audit trail gaps
- Compliance issues (HIPAA requires data retention)

**Alternatives to Database Rollback:**
1. **Forward Fix:** Deploy schema change to fix issue
2. **Manual Data Repair:** SQL scripts to fix corrupted data
3. **Feature Flag:** Disable broken feature without rollback

### Schema Migration Rollback

**Only if:** Destructive migration deleted critical column/table

**Procedure:**
```bash
# 1. Identify problematic migration
npx prisma migrate status

# Example output:
# Applied: 20260117_add_ai_features (CURRENT - BROKEN)
# Applied: 20260114_add_clinical_tables (LAST GOOD)

# 2. Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20260117_add_ai_features

# 3. Manually revert schema changes
# WARNING: This may lose data!

# If column was added, drop it:
psql $DATABASE_URL -c 'ALTER TABLE "ClinicalNote" DROP COLUMN "aiGenerated"'

# If table was created, drop it:
psql $DATABASE_URL -c 'DROP TABLE "NewTable"'

# 4. Regenerate Prisma client
npx prisma generate

# 5. Deploy application rollback (code expects old schema)
git revert <migration-commit>
git push origin main
vercel --prod
```

**Time to Execute:** 15-30 minutes  
**Data Loss:** HIGH RISK - new data in dropped columns/tables is LOST

---

## Rollback Testing (Pre-Launch)

### Rollback Simulation Checklist

Before production launch, verify rollback procedures work:

- [ ] **Test Application Rollback:**
  - Deploy test version to production
  - Trigger rollback via Vercel dashboard
  - Verify previous version is live
  - Time the process (should be <5 min)

- [ ] **Test Git Revert:**
  - Create test commit on feature branch
  - Revert commit
  - Verify branch is in clean state

- [ ] **Test Schema Migration Rollback:**
  - Run migration on staging database
  - Roll back migration
  - Verify schema reverted correctly
  - Check no data loss occurred

- [ ] **Test Backup Restoration (see BACKUP_RECOVERY_PROCEDURES.md):**
  - Restore from 24-hour-old backup
  - Verify data integrity

---

## Last Known Good Versions

### Current Production State (Pre-Phase 4)

**Git Commit:** `b90de38` (Phase 3: AI Features)  
**Deployed:** 2026-01-17  
**Status:** ✅ Stable  
**Version:** 2.0.0-beta

**Features:**
- All Phase 1-3 features (auth, CRUD, frontend, AI)
- Rate limiting enabled
- Logging/metrics enabled
- JWT secrets: Rotated 2026-01-17

### Previous Stable Versions

| Version | Git Commit | Date | Notes |
|---------|------------|------|-------|
| 2.0.0-beta | `b90de38` | 2026-01-17 | Phase 3: AI features |
| 1.9.0 | `b7920c6` | 2026-01-16 | Phase 2: Frontend complete |
| 1.5.0 | `05e5fc2` | 2026-01-16 | Phase 1: Backend + tests |

**Rollback Priority:** If Phase 4 fails → Rollback to `b90de38`

---

## Deployment Hygiene (Prevent Rollbacks)

### Pre-Deployment Checklist

**Before deploying to production:**

- [ ] All tests passing (`npm test` shows ≥80% pass rate)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Staging environment tested (smoke tests passed)
- [ ] Database migrations backward compatible (no DROP COLUMN/TABLE)
- [ ] Environment variables set correctly (`.env.production` complete)
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] On-call engineer available during deployment window

### Progressive Rollout (Reduce Blast Radius)

**If possible:**
1. Deploy to staging first (verify functionality)
2. Deploy to production with feature flag OFF
3. Enable feature for 10% of users (canary)
4. Monitor for 30 minutes (check error rates)
5. Gradually increase to 50%, 100%
6. Full rollout after 24h stability

**For Dr Amal (current setup):**
- No canary deployment yet (future: implement feature flags)
- Deploy during low-traffic hours (11 PM - 5 AM ET)
- Monitor closely for first 2 hours post-deployment

---

## Communication During Rollback

### Internal Communication (Team)

**Slack #prod-alerts:**
```
🚨 ROLLBACK IN PROGRESS

Issue: [Brief description]
Trigger: [What broke]
Action: Rolling back to commit b7920c6
ETA: 5 minutes
Owner: @devops-lead
```

**After Rollback:**
```
✅ ROLLBACK COMPLETE

Version: Reverted to 1.9.0 (commit b7920c6)
Status: All systems operational
Next Steps: Post-mortem scheduled for [time]
Incident: [Link to incident ticket]
```

### External Communication (Users)

**Status Page Update:**
```
RESOLVED: Service Degradation

We experienced issues with [feature] between 2:00 PM - 2:15 PM ET.
The issue has been resolved by reverting a recent update.
All systems are now operating normally.
We apologize for any inconvenience.
```

**Email (if outage >15 min):**
```
Subject: Service Update - [Date]

Dear Dr Amal Users,

We recently deployed an update that caused [issue description].
Our team immediately rolled back to the previous stable version.

Downtime: 15 minutes
Impact: [Describe what users couldn't do]
Data Loss: None - all your data is safe

We're conducting a thorough review to prevent similar issues.

Thank you for your patience.
- The Dr Amal Team
```

---

## Post-Rollback Actions

### Immediate (Within 1 Hour)

1. **Verify Production Health:**
   - Check all critical endpoints (auth, read, write)
   - Verify rate limiting working
   - Check database connectivity
   - Review logs for anomalies

2. **Notify Stakeholders:**
   - Update status page
   - Post in Slack #prod-alerts
   - Email CTO/stakeholders

3. **Create Incident Ticket:**
   - Document what broke
   - Include error messages, logs
   - Timeline of events
   - Link to rollback commit

### Short-Term (Within 24 Hours)

4. **Post-Mortem Meeting:**
   - What happened?
   - Why did it happen?
   - How did we detect it?
   - How did we fix it?
   - How do we prevent it?

5. **Update Monitoring:**
   - Add alerts for missed failure mode
   - Improve detection time

6. **Fix Root Cause:**
   - Identify bug in rolled-back code
   - Fix in development environment
   - Add regression test
   - Re-deploy with fix (after thorough testing)

### Long-Term (Within 1 Week)

7. **Improve Deployment Process:**
   - Add more pre-deployment checks
   - Implement canary deployments
   - Improve staging environment accuracy

8. **Document Lessons Learned:**
   - Update rollback procedures if needed
   - Add to incident knowledge base
   - Share with team

---

## Rollback Metrics

### Track These Metrics

- **Rollback Frequency:** Target <1 per month
- **Detection Time:** Time from deployment → issue detected (target <5 min)
- **Rollback Execution Time:** Time from decision → production restored (target <5 min)
- **Data Loss:** Amount of data lost during rollback (target: 0)
- **Downtime:** Total user-facing downtime (target <15 min)

### Current Baseline (Pre-Launch)

- Rollbacks: 0 (new system)
- Fastest rollback test: Not yet tested
- **Action:** Run rollback simulation before launch

---

## Emergency Contacts

### Rollback Authority

| Role | Name | Contact | Authority |
|------|------|---------|-----------|
| **DevOps Lead** | [TBD] | [Phone] | Execute code rollback |
| **Database Admin** | [TBD] | [Phone] | Execute schema rollback (DANGEROUS) |
| **CTO** | [TBD] | [Phone] | Final decision on major rollbacks |

**Decision Matrix:**
- **Code rollback:** DevOps Lead can execute independently
- **Schema rollback:** Requires CTO approval (data loss risk)
- **After-hours:** On-call engineer executes, notify CTO asynchronously

---

## Quick Reference

### Emergency Rollback Commands

**Rollback via Vercel:**
```bash
vercel ls  # List deployments
vercel promote <previous-deployment-url> --prod
```

**Rollback via Git:**
```bash
git log --oneline -5  # Find last good commit
git revert <bad-commit>  # Revert problematic commit
git push origin main  # Trigger redeploy
```

**Check Current Version:**
```bash
curl https://dr-amal.com/api/health
```

**Verify Rollback Success:**
```bash
# Check version endpoint
curl https://dr-amal.com/api/version

# Smoke test critical endpoints
curl -X POST https://dr-amal.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

---

## Appendix: Database Migration Best Practices

### Backward-Compatible Migrations Only

**✅ SAFE (No Rollback Needed):**
- ADD COLUMN (with default value or nullable)
- CREATE TABLE (new table, not referenced by old code)
- CREATE INDEX (performance optimization)
- ADD CONSTRAINT (if data already complies)

**❌ DANGEROUS (Requires Rollback Plan):**
- DROP COLUMN (data loss)
- DROP TABLE (data loss)
- RENAME COLUMN (breaks old code)
- ALTER COLUMN (change type - may fail)

### Two-Phase Migration Strategy

**For breaking changes:**

**Phase 1:** Add new column, keep old column
```sql
ALTER TABLE "ClinicalNote" ADD COLUMN "newField" TEXT;
-- Old code still uses "oldField"
```

**Phase 2:** Migrate data, deprecate old column
```sql
UPDATE "ClinicalNote" SET "newField" = "oldField";
-- Deploy new code that uses "newField"
```

**Phase 3:** Remove old column (after verified)
```sql
ALTER TABLE "ClinicalNote" DROP COLUMN "oldField";
-- Only after 100% of code migrated
```

This allows rollback between any phase without data loss.

---

**Document Version:** 1.0  
**Next Review:** 2026-02-17  
**Approved By:** [CTO]
