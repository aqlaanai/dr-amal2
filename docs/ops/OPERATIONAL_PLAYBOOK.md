# Operational Playbook

**System:** Dr Amal – Clinical OS v2.0  
**Last Updated:** January 14, 2026

---

## On-Call Responsibilities

### Primary On-Call Engineer

**Responsibilities:**
- Monitor alerts (#backend-alerts, #security-alerts, etc.)
- Respond to incidents within 15 minutes
- Execute runbooks for known issues
- Escalate to specialists if needed
- Document all actions in incident report

**Shift:** 7 days rotation  
**Contact:** #on-call channel in Slack

### Escalation Path

1. **Primary On-Call** (responds within 15 minutes)
2. **Secondary On-Call** (if primary doesn't respond in 15 minutes)
3. **Engineering Manager** (if incident severity is CRITICAL)
4. **CTO** (if incident persists > 2 hours)

---

## Incident Severity Levels

### SEV-1: CRITICAL

**Definition:**
- System is down (>50% error rate)
- Data corruption detected
- Security breach detected
- Compliance violation (audit logging down >30 min)

**Response:**
- Page primary on-call immediately
- Create incident channel (#incident-[timestamp])
- Notify engineering manager
- Post hourly updates to #incidents

**SLA:** Acknowledge within 5 minutes, resolve within 4 hours

---

### SEV-2: HIGH

**Definition:**
- Partial outage (>20% error rate)
- Performance degradation (>2x baseline)
- Auth failures spike
- AI service down

**Response:**
- Notify primary on-call
- Create incident channel (#incident-[timestamp])
- Investigate within 15 minutes

**SLA:** Acknowledge within 15 minutes, resolve within 24 hours

---

### SEV-3: MEDIUM

**Definition:**
- Isolated issues affecting <5% of users
- Slow queries (>500ms avg)
- High rate limit hit rate

**Response:**
- Notify primary on-call
- Investigate within 1 hour
- Fix within normal business hours

**SLA:** Acknowledge within 1 hour, resolve within 3 days

---

### SEV-4: LOW

**Definition:**
- Minor bugs not affecting functionality
- Documentation issues
- Non-critical monitoring gaps

**Response:**
- Create ticket in backlog
- Fix in next sprint

**SLA:** No immediate action required

---

## Incident Declaration

### When to Declare an Incident

Declare an incident if:

1. **Any SEV-1 or SEV-2 alert fires**
2. **Multiple users report same issue**
3. **You're unsure if it's an incident** (when in doubt, declare)

### How to Declare an Incident

**Step 1: Create incident channel**

```
/incident create "Brief description of incident"

# Example:
/incident create "Auth failure spike - 60% failure rate"
```

**Step 2: Assess severity**

- SEV-1 → Page engineering manager immediately
- SEV-2 → Notify on-call team
- SEV-3+ → Handle during business hours

**Step 3: Update status page (if public)**

```
# Update status page (future)
Status: Investigating
Message: "We are investigating reports of login issues. Updates in 30 minutes."
```

**Step 4: Investigate**

- Check metrics: `/api/metrics`
- Check health: `/api/health/readiness`
- Check logs: See "Log Access" section below
- Follow runbook if available (see ALERTING_CONFIG.md)

**Step 5: Communicate**

- Post updates every 30 minutes (SEV-1) or 2 hours (SEV-2+)
- Use incident channel for all communication
- Notify affected users if needed

**Step 6: Resolve**

```
/incident resolve "Brief description of resolution"

# Example:
/incident resolve "Database connection pool exhausted - increased pool size"
```

**Step 7: Post-mortem**

- Required for SEV-1 and SEV-2 incidents
- Due within 3 business days
- See "Post-Mortem Template" below

---

## Log Access

### Production Logs

**Location:** Server console (stdout/stderr)

**Access methods:**

1. **Vercel Dashboard** (current deployment)
   - Go to: https://vercel.com/dramal/clinical-os
   - Click "Logs" tab
   - Filter by time range

2. **CLI access** (if Vercel CLI is set up)
   ```bash
   vercel logs dramal/clinical-os --prod
   ```

3. **Log aggregation service** (future: Datadog, Splunk)
   ```bash
   # Query logs by requestId
   grep "requestId\":\"req_123" logs.json
   
   # Query logs by userId
   grep "userId\":\"456" logs.json
   
   # Query logs by endpoint
   grep "endpoint\":\"/api/auth/signin" logs.json
   ```

### Log Format

All logs are structured JSON:

```json
{
  "timestamp": "2026-01-14T10:30:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "context": {
    "requestId": "req_1705228200000_abc123",
    "userId": "user_456",
    "role": "provider",
    "endpoint": "/api/notes",
    "method": "POST",
    "statusCode": 500,
    "duration": 1250
  },
  "error": {
    "message": "Connection timeout",
    "name": "DatabaseError"
  }
}
```

### Log Queries (Common Patterns)

**Find all errors in last hour:**
```bash
jq 'select(.level == "error" and .timestamp > "2026-01-14T09:00:00Z")' logs.json
```

**Find all auth failures:**
```bash
jq 'select(.message | contains("Auth failed"))' logs.json
```

**Find all requests for specific user:**
```bash
jq 'select(.context.userId == "user_456")' logs.json
```

**Find slow requests (>1s):**
```bash
jq 'select(.context.duration > 1000)' logs.json
```

**Find all requests with specific requestId (trace full request):**
```bash
jq 'select(.context.requestId == "req_1705228200000_abc123")' logs.json
```

---

## How to Disable AI Quickly

### Why Disable AI?

- AI service is down (>80% error rate)
- AI cost spike (budget exceeded)
- AI returning harmful suggestions (safety issue)
- AI compliance issue detected

### Disable AI (< 2 minutes)

**Option 1: Environment variable** (recommended)

```bash
# Set environment variable
FEATURE_AI_ENABLED=false

# Redeploy (or wait for next deployment)
vercel deploy --prod
```

**Option 2: Code change** (emergency)

```typescript
// src/services/AIService.ts
// Add at top of each method:

if (true) { // Emergency disable
  return {
    suggestion: null,
    confidence: 'low' as const,
    refused: true,
    reasoning: 'AI temporarily disabled for maintenance',
  };
}
```

**Option 3: Rate limit to zero** (immediate)

```typescript
// src/lib/rate-limit.ts
// Change AI rate limit to 0

export const RateLimits = {
  AUTH: { requests: 5, windowSeconds: 60 },
  WRITE: { requests: 30, windowSeconds: 60 },
  AI: { requests: 0, windowSeconds: 60 }, // Disabled
  READ: { requests: 100, windowSeconds: 60 },
};
```

### Verify AI is Disabled

```bash
# Test AI endpoint (should return 429 or refused: true)
curl -X POST https://app.dramal.com/api/ai/generate-note \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "123"}'

# Expected response:
# { "error": "Too many AI requests" }
# OR
# { "suggestion": null, "refused": true, "reasoning": "AI temporarily disabled" }
```

### Re-enable AI

```bash
# Revert environment variable
FEATURE_AI_ENABLED=true

# Redeploy
vercel deploy --prod

# Verify AI is working
curl -X POST https://app.dramal.com/api/ai/generate-note ...
```

---

## Common Incident Scenarios

### Scenario 1: Database is Down

**Symptoms:**
- `/api/health/readiness` returns 503
- Write operations failing (>90%)
- Read operations failing (>90%)

**Runbook:**

1. **Check database connection**
   ```bash
   # Try to connect to database
   sqlite3 prisma/dev.db "SELECT 1;"
   ```

2. **Check disk space**
   ```bash
   df -h
   # If disk is full → Free up space
   ```

3. **Check database file permissions**
   ```bash
   ls -la prisma/dev.db
   # Should be readable/writable
   ```

4. **Restart database** (if using external database)
   ```bash
   # For PostgreSQL (future)
   sudo systemctl restart postgresql
   ```

5. **If database is corrupted:**
   ```bash
   # Restore from backup
   cp prisma/dev.db.backup prisma/dev.db
   
   # Verify database integrity
   sqlite3 prisma/dev.db "PRAGMA integrity_check;"
   ```

6. **Notify team**
   ```
   /incident update "Database restored from backup. Investigating root cause."
   ```

---

### Scenario 2: Auth Failure Spike

**Symptoms:**
- `auth.signin.failure` metric spiking
- Multiple users unable to sign in
- Possible brute force attack

**Runbook:**

1. **Check metrics**
   ```bash
   curl https://app.dramal.com/api/metrics | jq '.metrics.counters["auth.signin.failure"]'
   ```

2. **Check logs for patterns**
   ```bash
   # Find failed auth attempts
   jq 'select(.message | contains("Auth failed"))' logs.json | head -20
   
   # Group by IP address
   jq 'select(.message | contains("Auth failed")) | .context.ip' logs.json | sort | uniq -c
   ```

3. **If brute force attack detected:**
   ```bash
   # Identify attacking IPs
   # Example output: 100 attempts from 1.2.3.4
   
   # Block IP at load balancer (future)
   # OR
   # Add IP to rate limit blocklist (manual code change)
   ```

4. **If credential stuffing detected:**
   ```bash
   # Force password reset for affected accounts
   # Notify users of suspicious activity
   ```

5. **Verify rate limiting is working**
   ```bash
   # Test rate limit
   for i in {1..10}; do
     curl -X POST https://app.dramal.com/api/auth/signin \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}'
   done
   # Should return 429 after 5 attempts
   ```

---

### Scenario 3: Write Operations Failing

**Symptoms:**
- `write.*.error` metrics spiking
- Users unable to create notes/prescriptions
- Database health check passing

**Runbook:**

1. **Check error logs**
   ```bash
   jq 'select(.level == "error" and (.context.endpoint | contains("/api/notes") or contains("/api/prescriptions")))' logs.json | head -20
   ```

2. **Identify error pattern:**
   - Validation errors → Fix validation logic
   - State transition errors → Check state machine logic
   - Authorization errors → Check role-based access
   - Database errors → Check database health

3. **If validation errors:**
   ```typescript
   // Check recent code changes
   git log --oneline -10
   
   // Rollback if needed (see ROLLBACK_STRATEGY.md)
   vercel rollback --yes
   ```

4. **If state transition errors:**
   ```bash
   # Check database state
   sqlite3 prisma/dev.db "SELECT id, status FROM ClinicalNote WHERE status = 'finalized' LIMIT 10;"
   
   # Check for invalid states
   sqlite3 prisma/dev.db "SELECT status, COUNT(*) FROM ClinicalNote GROUP BY status;"
   ```

5. **Notify team**
   ```
   /incident update "Write operations failing due to [reason]. Investigating fix."
   ```

---

### Scenario 4: AI Service Down

**Symptoms:**
- `ai.*.error` metrics spiking (>80%)
- AI returning `refused: true`
- User workflows continue (AI is optional)

**Runbook:**

1. **Verify AI is actually down**
   ```bash
   curl -X POST https://app.dramal.com/api/ai/generate-note \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"123"}'
   
   # Check response
   jq '.refused' # Should be true
   ```

2. **Check AI service health**
   ```bash
   # If using external AI service
   curl https://api.openai.com/v1/models
   
   # Check API key validity
   # Check rate limits
   # Check billing status
   ```

3. **Decision: Disable AI or wait?**
   - If AI will be down <1 hour → Wait (AI is optional)
   - If AI will be down >1 hour → Disable AI (see "How to Disable AI Quickly")

4. **Communicate to users**
   ```
   # Update status page
   "AI-assisted features are temporarily unavailable. You can continue using the system normally."
   ```

5. **Monitor AI recovery**
   ```bash
   # Check AI metrics every 10 minutes
   watch -n 600 "curl -s https://app.dramal.com/api/metrics | jq '.metrics.counters[\"ai.generate_note.error\"]'"
   ```

---

## Post-Mortem Template

**Required for:** SEV-1 and SEV-2 incidents  
**Due:** Within 3 business days  
**Owner:** Primary on-call engineer

### Template

```markdown
# Post-Mortem: [Incident Title]

**Incident ID:** INC-[timestamp]  
**Date:** [date]  
**Severity:** SEV-[1/2]  
**Duration:** [start time] - [end time] ([total duration])  
**Owner:** [name]

---

## Summary

[One paragraph summary of what happened]

---

## Timeline

| Time | Event |
|------|-------|
| 10:00 | Alert fired: Auth failure spike |
| 10:05 | On-call acknowledged incident |
| 10:10 | Investigation started |
| 10:15 | Root cause identified: Database connection pool exhausted |
| 10:20 | Fix deployed: Increased connection pool size |
| 10:25 | Incident resolved |

---

## Impact

- **Users affected:** [number or percentage]
- **Requests failed:** [number]
- **Error rate:** [percentage]
- **Revenue impact:** [if applicable]
- **Data lost:** [if any]

---

## Root Cause

[Detailed explanation of what caused the incident]

Example:
> Database connection pool was set to 10 connections. During peak traffic (100 req/s), connections were exhausted, causing new requests to timeout. Rate limiting was bypassed due to bug in rate limit middleware.

---

## Resolution

[What was done to resolve the incident]

Example:
> 1. Increased database connection pool from 10 to 50
> 2. Fixed rate limit middleware bug
> 3. Deployed fix to production
> 4. Verified error rate returned to baseline

---

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add connection pool monitoring | Database Team | 2026-01-21 | ☐ |
| Add alert for connection pool exhaustion | On-Call Team | 2026-01-21 | ☐ |
| Fix rate limit middleware bug | Backend Team | 2026-01-15 | ✅ |
| Add load testing to CI/CD | DevOps Team | 2026-01-28 | ☐ |

---

## Lessons Learned

### What Went Well

- Alert fired within 1 minute of issue
- On-call acknowledged within 5 minutes
- Root cause identified quickly (logs were clear)
- Fix deployed and verified within 25 minutes

### What Went Wrong

- Connection pool size was too small (not tested under load)
- Rate limit middleware had bug (not caught in tests)
- No monitoring for connection pool usage

### What We'll Do Differently

- Add load testing to CI/CD pipeline
- Add connection pool metrics to monitoring
- Add more unit tests for rate limiting

---

## References

- Incident channel: #incident-1705228200
- Alert runbook: ALERTING_CONFIG.md#2-write-operation-failure-spike
- Rollback strategy: ROLLBACK_STRATEGY.md
- Code changes: PR #123
```

---

## Monitoring Dashboard (Recommended)

### Metrics to Monitor

**Real-time dashboard:**

1. **Request Rate**
   - Total requests per second
   - Breakdown by endpoint category (auth, read, write, AI)

2. **Error Rate**
   - Overall error rate (%)
   - Breakdown by endpoint
   - Grouped by status code (4xx, 5xx)

3. **Response Time**
   - P50, P95, P99 response times
   - Breakdown by endpoint

4. **Auth Metrics**
   - Signin success/failure rate
   - Active users (last 5 minutes)
   - Token refresh rate

5. **Write Metrics**
   - Notes created/updated/finalized
   - Prescriptions created/issued
   - Sessions transitioned

6. **AI Metrics**
   - AI invocations per minute
   - AI error rate
   - AI confidence distribution

7. **Rate Limiting**
   - Rate limit hit rate (%)
   - Top rate limited IPs
   - Top rate limited users

8. **Database**
   - Query duration (avg, P95, P99)
   - Connection pool usage
   - Database errors

9. **System Health**
   - /health/liveness status
   - /health/readiness status
   - Server uptime

### Dashboard Tools (Future)

- **Grafana:** Visualization
- **Prometheus:** Metrics collection
- **Datadog:** All-in-one monitoring
- **New Relic:** APM + monitoring

---

## Responsibility Matrix

| Incident Type | Primary Owner | Secondary Owner | Escalation |
|---------------|---------------|-----------------|------------|
| Auth failures | Security Team | Backend Team | CTO |
| Write failures | Backend Team | Database Team | Engineering Manager |
| Read failures | Backend Team | Database Team | Engineering Manager |
| AI failures | AI Team | Backend Team | Engineering Manager |
| Database failures | Database Team | DevOps Team | CTO |
| Audit failures | Compliance Team | Backend Team | Legal Team |
| Security breach | Security Team | CTO | Legal Team + Board |

---

## Contact Information

| Role | Name | Email | Phone | Slack |
|------|------|-------|-------|-------|
| CTO | [TBD] | cto@dramal.com | [TBD] | @cto |
| Engineering Manager | [TBD] | eng-mgr@dramal.com | [TBD] | @eng-mgr |
| On-Call (Primary) | Rotating | oncall@dramal.com | [TBD] | @oncall-primary |
| On-Call (Secondary) | Rotating | oncall@dramal.com | [TBD] | @oncall-secondary |
| Security Lead | [TBD] | security@dramal.com | [TBD] | @security-lead |
| Compliance Lead | [TBD] | compliance@dramal.com | [TBD] | @compliance-lead |

---

## Conclusion

**Incidents are inevitable. Chaos is optional.**

- Declare incidents early (when in doubt, declare)
- Follow runbooks (don't improvise under stress)
- Communicate frequently (transparency builds trust)
- Learn from every incident (post-mortems are mandatory)
- Test procedures regularly (rollback drills, incident simulations)

**Remember:** You cannot fix what you cannot see. Observability is not optional.
