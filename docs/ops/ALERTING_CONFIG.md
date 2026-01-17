# Alerting Configuration

**System:** Dr Amal – Clinical OS v2.0  
**Last Updated:** January 14, 2026

---

## Alert Philosophy

- **Actionable:** Every alert must have a clear action
- **Owned:** Every alert must have an owner
- **Documented:** Every alert must have a runbook
- **Non-noisy:** Alerts fire only when human intervention is required

---

## Critical Alerts

### 1. Auth Abuse Spike

**Trigger:**  
Auth failure rate > 50% over 5 minutes

**Severity:** HIGH  
**Owner:** Security Team  
**Channel:** #security-alerts

**Runbook:**

1. Check metrics endpoint: `/api/metrics`
2. Look for `auth.signin.failure` spike
3. Check logs for pattern: `grep "auth.signin.failure" logs.json`
4. If brute force attack detected:
   - Identify attacking IPs (check `ip` field in logs)
   - Add IPs to rate limit blocklist
   - Consider temporary lockout for affected accounts
5. If credential stuffing detected:
   - Force password reset for affected accounts
   - Notify users of suspicious activity

**Escalation:**  
If attack persists > 15 minutes → Page on-call engineer

---

### 2. Write Operation Failure Spike

**Trigger:**  
Write operation error rate > 20% over 5 minutes

**Severity:** CRITICAL  
**Owner:** Backend Team  
**Channel:** #backend-alerts

**Runbook:**

1. Check metrics endpoint: `/api/metrics`
2. Look for spike in:
   - `write.notes.error`
   - `write.prescriptions.error`
   - `write.sessions.error`
3. Check database health: `/api/health/readiness`
4. If database is down:
   - Check database connection string
   - Verify database service status
   - Restart database if necessary
5. If database is slow:
   - Check for long-running queries
   - Check disk space
   - Consider scaling database
6. If validation errors:
   - Check logs for specific error messages
   - Fix validation logic if bug detected

**Escalation:**  
If error rate > 50% → Declare incident → Page CTO

---

### 3. Audit Logging Failure Spike

**Trigger:**  
Audit log failure rate > 10% over 5 minutes

**Severity:** CRITICAL (Compliance Risk)  
**Owner:** Compliance Team  
**Channel:** #compliance-alerts

**Runbook:**

1. Check logs: `grep "Audit log failed" logs.json`
2. Identify failure reason:
   - Database connection issue?
   - Disk full?
   - Permission denied?
3. **CRITICAL:** If audit logs are failing, user operations are NOT blocked
   - This is by design (user safety)
   - But compliance risk is HIGH
4. Fix audit logging immediately:
   - Restore database connectivity
   - Free up disk space
   - Fix permissions
5. After fix:
   - Verify audit logs are being written
   - Review audit log gaps (if any)
   - Document gap in incident report

**Escalation:**  
If audit logging fails > 30 minutes → Declare incident → Notify legal team

---

### 4. AI Error Spike

**Trigger:**  
AI error rate > 30% over 5 minutes

**Severity:** MEDIUM  
**Owner:** AI Team  
**Channel:** #ai-alerts

**Runbook:**

1. Check metrics endpoint: `/api/metrics`
2. Look for spike in:
   - `ai.generate_note.error`
   - `ai.explain_lab.error`
   - `ai.suggest_diagnosis.error`
3. Check AI service health:
   - Is AI service responding?
   - Are API keys valid?
   - Are rate limits exceeded?
4. **CRITICAL:** AI is optional, system continues without it
   - User workflows are NOT blocked
   - AI returns `refused: true` on failure
5. If AI service is down:
   - Notify AI service provider
   - Monitor for recovery
   - Document downtime in incident report
6. If cost limits exceeded:
   - Review AI usage patterns
   - Consider increasing rate limits
   - Notify finance team

**Escalation:**  
If AI error rate > 80% → Disable AI temporarily (see OPERATIONAL_PLAYBOOK.md)

---

## Warning Alerts

### 5. High Rate Limit Hit Rate

**Trigger:**  
Rate limit rejection rate > 30% over 10 minutes

**Severity:** MEDIUM  
**Owner:** Backend Team  
**Channel:** #backend-alerts

**Runbook:**

1. Check metrics endpoint: `/api/metrics`
2. Identify which endpoint is being rate limited:
   - Auth endpoints: Possible attack
   - Write endpoints: Possible bot or script
   - AI endpoints: Possible abuse
3. Check logs for patterns:
   - Is it a single user?
   - Is it a single IP?
4. If legitimate traffic:
   - Consider increasing rate limits
   - Notify users of rate limit policy
5. If abuse detected:
   - Block offending IPs
   - Disable offending accounts
   - Document abuse in incident report

**Escalation:**  
If rate limit hit rate > 50% → Page on-call engineer

---

### 6. Database Slow Queries

**Trigger:**  
Average database query duration > 500ms over 10 minutes

**Severity:** MEDIUM  
**Owner:** Database Team  
**Channel:** #database-alerts

**Runbook:**

1. Check metrics endpoint: `/api/metrics`
2. Look for high duration metrics:
   - `read.patients.duration`
   - `write.notes.duration`
   - etc.
3. Check database performance:
   - Check for missing indexes
   - Check for table scans
   - Check for lock contention
4. Optimize slow queries:
   - Add indexes if needed
   - Rewrite queries if needed
   - Consider caching if needed

**Escalation:**  
If query duration > 2s → Page database engineer

---

## Alert Owners

| Team | Primary Contact | Secondary Contact | Channel |
|------|----------------|-------------------|---------|
| Security | security@dramal.com | cto@dramal.com | #security-alerts |
| Backend | backend@dramal.com | cto@dramal.com | #backend-alerts |
| Compliance | compliance@dramal.com | legal@dramal.com | #compliance-alerts |
| AI | ai@dramal.com | cto@dramal.com | #ai-alerts |
| Database | database@dramal.com | backend@dramal.com | #database-alerts |

---

## Alert Configuration (Example: Datadog)

```yaml
# Auth abuse spike
- name: "Auth Failure Spike"
  query: "avg(last_5m):sum:auth.signin.failure{*} / sum:auth.signin.total{*} > 0.5"
  message: |
    Auth failure rate is {{value}}% over the last 5 minutes.
    This may indicate a brute force attack.
    See runbook: ALERTING_CONFIG.md#1-auth-abuse-spike
  tags:
    - severity:high
    - team:security
  notify:
    - "@slack-security-alerts"
    - "@pagerduty-security"

# Write operation failure spike
- name: "Write Operation Failure Spike"
  query: "avg(last_5m):sum:write.*.error{*} / sum:write.*.total{*} > 0.2"
  message: |
    Write operation error rate is {{value}}% over the last 5 minutes.
    This may indicate a database issue.
    See runbook: ALERTING_CONFIG.md#2-write-operation-failure-spike
  tags:
    - severity:critical
    - team:backend
  notify:
    - "@slack-backend-alerts"
    - "@pagerduty-backend"

# Audit logging failure spike
- name: "Audit Logging Failure Spike"
  query: "avg(last_5m):sum:audit.log.failure{*} / sum:audit.log.total{*} > 0.1"
  message: |
    Audit log failure rate is {{value}}% over the last 5 minutes.
    This is a compliance risk.
    See runbook: ALERTING_CONFIG.md#3-audit-logging-failure-spike
  tags:
    - severity:critical
    - team:compliance
  notify:
    - "@slack-compliance-alerts"
    - "@pagerduty-compliance"

# AI error spike
- name: "AI Error Spike"
  query: "avg(last_5m):sum:ai.*.error{*} / sum:ai.*.total{*} > 0.3"
  message: |
    AI error rate is {{value}}% over the last 5 minutes.
    AI is optional, but should be investigated.
    See runbook: ALERTING_CONFIG.md#4-ai-error-spike
  tags:
    - severity:medium
    - team:ai
  notify:
    - "@slack-ai-alerts"
```

---

## Metrics to Alert Mapping

| Metric Pattern | Alert | Threshold |
|---------------|-------|-----------|
| `auth.signin.failure` / `auth.signin.total` | Auth Abuse Spike | > 50% over 5min |
| `write.*.error` / `write.*.total` | Write Failure Spike | > 20% over 5min |
| `audit.log.failure` / `audit.log.total` | Audit Failure Spike | > 10% over 5min |
| `ai.*.error` / `ai.*.total` | AI Error Spike | > 30% over 5min |
| Rate limit rejections / Total requests | High Rate Limit Hit | > 30% over 10min |
| Database query duration | Slow Queries | > 500ms avg over 10min |

---

## Alert Testing

Before deploying alerts to production:

1. **Verify metrics are being collected:**
   ```bash
   curl https://app.dramal.com/api/metrics
   ```

2. **Simulate alert conditions:**
   - Auth spike: Send invalid login attempts
   - Write failure: Disconnect database temporarily
   - AI error: Disable AI service temporarily

3. **Verify alert delivery:**
   - Check Slack channels
   - Check PagerDuty
   - Verify runbook links work

4. **Test escalation:**
   - Verify on-call rotation
   - Test paging system

---

## Alert Review Schedule

- **Weekly:** Review alert frequency and accuracy
- **Monthly:** Review runbook effectiveness
- **Quarterly:** Review alert thresholds and ownership

**Goal:** Zero noisy alerts, 100% actionable alerts
