# Production Alert Definitions
## Dr Amal Clinical OS v2.0

**Last Updated:** 2026-01-17  
**Owner:** DevOps / On-Call Engineer

---

## Alert Philosophy

**Alert only on actionable, customer-impacting issues**

- Each alert must have a clear response playbook
- Alerts indicate production is degraded or at risk
- No alerts for normal operations
- Silence during planned maintenance

---

## Critical Alerts (Page Immediately)

### 1. Database Connectivity Loss

**Trigger:** Database connection fails for >30 seconds

**Signal:**
```
metric: error.database.connection_failed
threshold: count > 3 in 30s
```

**Impact:** All API requests will fail (500 errors)

**Response Playbook:**
1. Check Neon database status: https://console.neon.tech
2. Verify DATABASE_URL environment variable is set
3. Check network connectivity to Neon endpoint
4. Review application logs for connection errors
5. If Neon is down: Check status page, contact support
6. If app issue: Restart application pods/containers

**Escalation:** If not resolved in 5 min → Page database admin

---

### 2. Auth Endpoint 5xx Spike

**Trigger:** Auth endpoints return 5xx errors at >10% rate

**Signal:**
```
metric: auth.*.error.5xx
threshold: rate > 10% over 2 minutes
```

**Impact:** Users cannot sign in, system unusable

**Response Playbook:**
1. Check application logs for auth errors
2. Verify JWT secrets are set correctly
3. Check database connectivity (auth queries fail)
4. Review recent deployments (rollback if recent)
5. Check rate limit store (memory issues?)

**Escalation:** If not resolved in 3 min → Page CTO

---

### 3. Write Endpoint Total Failure

**Trigger:** No successful writes for >2 minutes during business hours

**Signal:**
```
metric: write.*.success
threshold: count == 0 in 2 minutes (8am-6pm)
```

**Impact:** Clinical data cannot be saved (critical for patient care)

**Response Playbook:**
1. Check application logs for write errors
2. Verify database write permissions
3. Check Neon connection pool exhaustion
4. Review Prisma client errors
5. Test manual database write via psql

**Escalation:** Immediate page to CTO + database admin

---

## High Priority Alerts (Notify Slack)

### 4. Auth Abuse Pattern Detected

**Trigger:** Single IP exceeds auth rate limit repeatedly

**Signal:**
```
metric: auth.*.rate_limit_exceeded
threshold: count > 20 from same IP in 5 minutes
```

**Impact:** Potential brute force attack, credential stuffing

**Response Playbook:**
1. Identify attacking IP from logs (`logger.info` includes IP)
2. Check if legitimate user (contact them) or attack
3. If attack: Block IP at load balancer/firewall level
4. Review failed login attempts for compromised accounts
5. Force password reset for targeted accounts if needed

**Escalation:** If attack continues >10 min → Page security team

---

### 5. AI Refusal Spike

**Trigger:** AI endpoints refuse >50% of requests

**Signal:**
```
metric: ai.*.refused
threshold: rate > 50% over 5 minutes
```

**Impact:** AI features degraded, user frustration

**Response Playbook:**
1. Check application logs for refusal reasons
2. Verify session data quality (missing data causes refusals)
3. Check AI service backend (if external LLM API)
4. Review recent AI prompt changes
5. If persistent: Disable AI features temporarily (graceful degradation)

**Escalation:** Not customer-critical, can wait for business hours

---

### 6. Elevated 4xx Error Rate

**Trigger:** 4xx errors exceed 25% of total requests

**Signal:**
```
metric: error.4xx
threshold: rate > 25% over 10 minutes
```

**Impact:** Possible client bug, API contract mismatch

**Response Playbook:**
1. Check which endpoints have 4xx spikes
2. Review application logs for validation errors
3. Check if recent frontend deployment introduced bug
4. Verify API contract changes didn't break frontend
5. If frontend bug: Rollback frontend, notify eng team

**Escalation:** If blocking user workflows → Page on-call

---

## Low Priority Alerts (Log Only)

### 7. Slow API Response Time

**Trigger:** P95 latency exceeds 2 seconds

**Signal:**
```
metric: api.duration.p95
threshold: > 2000ms for 5 minutes
```

**Impact:** Poor user experience, slow page loads

**Response:**
- Log for later investigation
- Review slow queries in database
- Check for N+1 query patterns
- Optimize if pattern persists

---

### 8. High Memory Usage

**Trigger:** Application memory usage >80%

**Signal:**
```
metric: system.memory.percent
threshold: > 80% for 10 minutes
```

**Impact:** Potential crash, OOM errors

**Response:**
- Monitor for increasing trend
- Check for memory leaks (rate limit store cleanup running?)
- Review heap dumps if available
- Scale up if legitimate load increase

---

## Alert Routing

### Notification Channels

| Severity | Channel | Format |
|----------|---------|--------|
| **CRITICAL** | PagerDuty | Phone call + SMS |
| **HIGH** | Slack #prod-alerts | @channel mention |
| **LOW** | Slack #eng-logs | Silent notification |

### On-Call Rotation

**Primary:** Engineering team (weekly rotation)  
**Secondary:** CTO (backup escalation)  
**Database:** Neon support (for DB-specific issues)

**Schedule:** 24/7 coverage  
**SLA:** Acknowledge critical alerts within 5 minutes

---

## Alert Metrics Summary

### Metrics to Track

**Auth Metrics:**
- `auth.signin.success` - Count
- `auth.signin.failure` - Count
- `auth.signup.success` - Count
- `auth.rate_limit_exceeded` - Count (by IP)

**Write Metrics:**
- `write.notes.success` - Count
- `write.notes.error` - Count
- `write.prescriptions.success` - Count
- `write.prescriptions.error` - Count

**Read Metrics:**
- `read.patients.success` - Count
- `read.patients.duration` - Duration (ms)
- `read.labs.success` - Count

**AI Metrics:**
- `ai.generate_note.success` - Count
- `ai.generate_note.refused` - Count
- `ai.explain_lab.success` - Count
- `ai.explain_lab.refused` - Count
- `ai.*.confidence.high` - Count (quality indicator)
- `ai.*.confidence.low` - Count (quality indicator)

**State Transition Metrics:**
- `state.note.draft_to_finalized` - Count
- `state.prescription.draft_to_issued` - Count
- `state.session.created` - Count

**Error Metrics:**
- `error.4xx` - Count (by endpoint)
- `error.5xx` - Count (by endpoint)
- `error.database.*` - Count

**Rate Limit Metrics:**
- `rate_limit.auth.exceeded` - Count (by IP)
- `rate_limit.write.exceeded` - Count (by user)
- `rate_limit.ai.exceeded` - Count (by user)

---

## Implementation Guide

### Current State (Phase 4)

✅ **Structured Logging:** Implemented  
- All API endpoints log with `requestId`, `userId`, `duration`
- Errors logged with stack traces
- No secrets logged (verified)

✅ **Metrics Collection:** Implemented  
- Counter metrics: `metrics.incrementCounter()`
- Duration metrics: `metrics.recordDuration()`
- In-memory store (production should use Prometheus/Datadog)

✅ **Rate Limiting:** Implemented  
- Auth: 5 req/min per IP
- Write: 30 req/min per user
- AI: 10 req/min per user
- Read: 100 req/min per user

### To Production (Required Actions)

⏳ **Connect to Monitoring Service:**
1. Deploy Prometheus exporter OR
2. Forward metrics to Datadog/New Relic/Grafana Cloud
3. Endpoint: `GET /api/metrics` (need to create)

⏳ **Configure Alert Rules:**
1. Create alert rules in monitoring service
2. Map rules from this document
3. Test alert delivery (send test page)

⏳ **Set Up Dashboards:**
1. Auth Dashboard: signin/signup rates, failures
2. Performance Dashboard: latency P50/P95/P99, throughput
3. Error Dashboard: 4xx/5xx rates by endpoint
4. AI Dashboard: refusal rates, confidence distribution

---

## Alert Testing Checklist

Before go-live, verify each critical alert triggers correctly:

- [ ] Database connectivity: Stop database → Alert fires within 30s
- [ ] Auth 5xx: Corrupt JWT secret → Alert fires within 2 min
- [ ] Write failure: Revoke DB write permissions → Alert fires within 2 min
- [ ] Auth abuse: Script 100 failed logins → Alert fires within 5 min
- [ ] AI refusal: Mock 100% refusal rate → Alert fires within 5 min

**Test Alerts:** Run `npm run test:alerts` (script to be created)

---

## Silence Periods

**Planned Maintenance:**
- Schedule in PagerDuty
- Notify team 24h in advance
- Silence alerts during maintenance window

**False Positives:**
- Document reason
- Adjust threshold if alert is too sensitive
- Do NOT silence permanently without investigation

---

## Review Schedule

**Weekly:** Review alert volume, false positive rate  
**Monthly:** Tune thresholds based on production patterns  
**Quarterly:** Add new alerts for new features

---

**Next Steps:**
1. Deploy metrics endpoint: `GET /api/metrics`
2. Connect to Datadog/Prometheus
3. Configure alert rules per this document
4. Test critical alerts before launch
5. Add to incident response playbook
