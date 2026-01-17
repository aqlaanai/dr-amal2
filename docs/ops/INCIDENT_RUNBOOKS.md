# INCIDENT_RUNBOOKS.md
# Incident Response Runbooks
## Dr Amal Clinical OS v2.0

**Purpose:** Quick reference guides for common production incidents

---

## 🔥 RUNBOOK: Authentication Abuse Detected

**Severity:** P1 - High  
**Trigger:** >50 failed auth attempts from same IP in 5 minutes  
**Owner:** Security Team

### Detection
- Alert: "auth.signin.failure" spike in metrics
- Logs show repeated 401 errors from same IP

### Response Steps

1. **Identify Source** (2 min)
   ```bash
   # Find IP with most failures
   grep '"level":"error"' logs.json | grep 'auth.signin.failure' | \
     jq -r '.context.ip' | sort | uniq -c | sort -rn | head -10
   ```

2. **Verify Rate Limiting** (1 min)
   - Check if rate limiting is active: `isRateLimited()` should return 429
   - Verify `RateLimits.AUTH` is set to 5 req/min

3. **Block IP if Persistent** (2 min)
   ```bash
   # Add to blocklist (platform-specific)
   # Vercel: Add to vercel.json firewall rules
   # Cloudflare: Add WAF rule
   ```

4. **Investigate Pattern** (5 min)
   - Check if credential stuffing (list of common passwords)
   - Check if brute force (same username, many passwords)
   - Check if distributed attack (many IPs, same pattern)

5. **Force Password Reset** (if targeted)
   ```sql
   -- If specific account targeted
   UPDATE "User" SET "refreshToken" = NULL WHERE email = 'victim@example.com';
   ```

6. **Document & Report**
   - Log incident in tracking system
   - Report to security team
   - Monitor for 24 hours

---

## 💾 RUNBOOK: Database Connectivity Loss

**Severity:** P0 - Critical  
**Trigger:** Cannot connect to Neon PostgreSQL  
**Owner:** DevOps Team

### Detection
- Alert: "DB Connection Failure"
- App logs show: `PrismaClientInitializationError`
- Health check fails

### Response Steps

1. **Check Neon Status** (1 min)
   - Visit: https://status.neon.tech
   - Check for ongoing incidents

2. **Verify Connection String** (2 min)
   ```bash
   # Test connection manually
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. **Check Connection Pool** (2 min)
   ```bash
   # View active connections in Neon Console
   # Or query:
   SELECT count(*) FROM pg_stat_activity;
   ```

4. **Restart Application** (if connection pool exhausted)
   ```bash
   # Platform-specific restart
   vercel deploy --prod  # Redeploy same version
   ```

5. **Verify Credentials** (if authentication fails)
   - Check DATABASE_URL in environment variables
   - Verify password hasn't been rotated
   - Check Neon user permissions

6. **Failover** (if Neon down >15 min)
   - Switch to backup database (if configured)
   - Or enable read-only mode while Neon recovers

7. **Post-Incident**
   - Review connection pool settings
   - Consider implementing circuit breaker
   - Document root cause

---

## 📝 RUNBOOK: Audit Log Failure

**Severity:** P2 - Medium (Compliance Risk)  
**Trigger:** Cannot write audit logs  
**Owner:** On-Call Engineer

### Detection
- Alert: "Audit Log Failure"
- Logs show: `AuditService Failed to log event`

### Response Steps

1. **Check Database Write Permissions** (2 min)
   ```sql
   -- Test write
   INSERT INTO "AuditLog" ("userId", "action", "details", "timestamp", "ipAddress")
   VALUES ('test-id', 'test', '{}', NOW(), '127.0.0.1');
   ```

2. **Verify AuditLog Table** (1 min)
   ```sql
   SELECT COUNT(*) FROM "AuditLog";
   \d "AuditLog"  -- Show table structure
   ```

3. **Check Storage Quota** (if Neon)
   - View Neon Console for storage usage
   - Free tier: 512 MB limit
   - Paid tier: check quota

4. **Archive Old Logs** (if storage full)
   ```sql
   -- Export logs older than 90 days
   COPY (SELECT * FROM "AuditLog" WHERE "timestamp" < NOW() - INTERVAL '90 days')
   TO '/path/to/archive.csv' CSV HEADER;
   
   -- Delete after export verified
   DELETE FROM "AuditLog" WHERE "timestamp" < NOW() - INTERVAL '90 days';
   ```

5. **Fix Permissions** (if access denied)
   ```sql
   GRANT INSERT, SELECT ON "AuditLog" TO neondb_owner;
   ```

6. **Resume Operations**
   - Verify audit writes succeed
   - Check for any missed audit events
   - Review compliance requirements

7. **CRITICAL:** Audit failures = compliance violation
   - Document incident for audit trail
   - Report to compliance officer
   - Review retention policy

---

## 📊 RUNBOOK: Error Rate Spike

**Severity:** P2 - Medium  
**Trigger:** >10% error rate for 5 minutes  
**Owner:** On-Call Engineer

### Detection
- Alert: "Error Spike"
- Metrics show high error count
- Users reporting issues

### Response Steps

1. **Identify Error Pattern** (3 min)
   ```bash
   # Find most common error
   grep '"level":"error"' logs.json | \
     jq -r '.error.message' | sort | uniq -c | sort -rn | head -10
   ```

2. **Check Recent Deployments** (2 min)
   - Was there a deploy in last 30 minutes?
   - Check git history: `git log --oneline -10`

3. **Review Error Details** (5 min)
   ```bash
   # Get full context of top error
   grep '"level":"error"' logs.json | \
     jq 'select(.error.message == "Most common error") | .'
   ```

4. **Correlate with Metrics** (3 min)
   - Check which endpoints failing
   - Check which user roles affected
   - Check geographic distribution

5. **Decision Point**
   - If **new deployment**: Rollback (see Rollback Runbook)
   - If **database issue**: See DB Connectivity Runbook
   - If **third-party**: Wait for service recovery, communicate status

6. **Mitigate** (if cannot rollback)
   - Disable failing feature
   - Return fallback responses
   - Add circuit breaker

7. **Communicate**
   - Update status page
   - Post in #incidents
   - Email affected users if >15 min outage

---

## 🔄 RUNBOOK: Rollback Deployment

**Severity:** Varies  
**Trigger:** Critical bug or error spike from new deployment  
**Owner:** DevOps Team

### Pre-Rollback Checklist
- ✅ Confirm issue is from new deployment
- ✅ Identify last known good version
- ✅ Check if database migration occurred
- ✅ Notify team in #incidents

### Rollback Steps

#### Code-Only Rollback (5 min)
```bash
# 1. Find previous stable tag
git tag --sort=-creatordate | head -5

# 2. Checkout previous version
git checkout v2.0.4  # Or commit hash

# 3. Deploy
npm run build
vercel deploy --prod  # Or platform-specific deploy

# 4. Verify
curl https://api.dramal.com/api/health
```

#### Rollback with Database (30 min)

1. **Stop Write Traffic** (2 min)
   - Enable maintenance mode
   - Or set app to read-only

2. **Backup Current State** (5 min)
   ```bash
   # Neon: Create backup in console
   # Or export data
   pg_dump "$DATABASE_URL" > rollback_backup_$(date +%s).sql
   ```

3. **Restore Database** (15 min)
   - See "Database Connectivity Loss" runbook
   - Use Neon point-in-time recovery
   - Select timestamp before deployment

4. **Deploy Compatible Code** (5 min)
   - Deploy app version matching database schema
   - Verify migrations table is correct

5. **Verify Data Integrity** (3 min)
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "ClinicalNote";
   SELECT COUNT(*) FROM "AuditLog";
   ```

6. **Resume Write Traffic**
   - Disable maintenance mode
   - Monitor error rates

### Post-Rollback
- Document root cause
- Plan forward fix
- Review deployment process
- Update runbooks if needed

---

## ⚡ RUNBOOK: Rate Limit Overwhelmed

**Severity:** P3 - Low  
**Trigger:** 90% of users hitting rate limits  
**Owner:** Product Team

### Detection
- Alert: "Rate Limit Exceeded"
- Many 429 responses
- User complaints

### Response Steps

1. **Identify Affected Endpoint** (2 min)
   ```bash
   grep '"status":429' logs.json | \
     jq -r '.context.endpoint' | sort | uniq -c | sort -rn
   ```

2. **Check for Abuse** (3 min)
   - Is it one user/IP? → Likely abuse
   - Is it many users? → Likely legitimate traffic spike

3. **Temporary Relief** (if legitimate)
   ```bash
   # Increase limits temporarily
   export RATE_LIMIT_WRITE_MAX=60  # Double from 30
   # Redeploy
   ```

4. **Long-term Fix**
   - Review traffic patterns
   - Adjust rate limits in `src/lib/rate-limit.ts`
   - Consider tiered limits (free vs paid)
   - Implement burst allowance

5. **Monitor**
   - Watch for abuse after increase
   - Review cost impact
   - Plan capacity upgrade if needed

---

## 📞 EMERGENCY ESCALATION

If incident is:
- **P0 (Critical)** → Escalate to CTO immediately
- **P1 (High)** → Notify security team within 15 min
- **Data breach suspected** → Follow data breach protocol (see SECURITY.md)

**Escalation Contacts:**
- On-Call Engineer: [Phone]
- Security Team: security@dramal.com
- CTO: [Phone]
- Neon Support: support@neon.tech (Enterprise only)

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Next Review:** February 16, 2026
