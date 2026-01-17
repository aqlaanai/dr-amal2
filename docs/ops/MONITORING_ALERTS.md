# Monitoring & Alerting Configuration
# Dr Amal Clinical OS v2.0

# This file documents alert thresholds and monitoring configuration
# Integrate with your monitoring platform (DataDog, New Relic, Prometheus, etc.)

---

## Alert Definitions

### 1. Auth Abuse Detection
**Name:** `auth_abuse_detected`
**Condition:** >50 failed signin attempts from single IP in 5 minutes
**Severity:** P1 (High)
**Owner:** Security Team
**Action:** 
- Automatically block IP
- Investigate for credential stuffing
- Review affected accounts

**Query (Log-based):**
```
level="error" AND message="Auth signin failed" AND error.message="Invalid credentials"
| count by context.ip
| where count > 50
| timeframe 5m
```

**Notification:**
- Slack: #security-alerts
- PagerDuty: Security Team rotation
- Email: security@dramal.com

---

### 2. Error Rate Spike
**Name:** `error_rate_spike`
**Condition:** >10% error rate for 5 consecutive minutes
**Severity:** P2 (Medium)
**Owner:** On-Call Engineer
**Action:**
- Check recent deployments
- Review error logs
- Rollback if from new deployment

**Query (Metric-based):**
```
(sum(rate(http_requests_total{status=~"5.."}[5m])) 
 / 
 sum(rate(http_requests_total[5m]))) * 100 > 10
```

**Notification:**
- PagerDuty: Engineering rotation
- Slack: #incidents

---

### 3. Database Connectivity Issues
**Name:** `db_connection_failure`
**Condition:** >3 connection failures in 1 minute
**Severity:** P1 (High)
**Owner:** DevOps Team
**Action:**
- Check Neon status
- Verify connection string
- Check connection pool limits

**Query (Log-based):**
```
level="error" AND error.message contains "Prisma" AND error.message contains "connect"
| count
| where count > 3
| timeframe 1m
```

**Notification:**
- PagerDuty: DevOps rotation (immediate)
- Slack: #incidents
- Email: devops@dramal.com

---

### 4. Audit Log Write Failure
**Name:** `audit_log_failure`
**Condition:** Any audit log write fails
**Severity:** P2 (Medium - Compliance Risk)
**Owner:** On-Call Engineer
**Action:**
- Check database permissions
- Verify storage quota
- Document for compliance audit

**Query (Log-based):**
```
level="error" AND message contains "AuditService" AND message contains "Failed to log"
```

**Notification:**
- Slack: #incidents
- Email: compliance@dramal.com
- PagerDuty: Engineering rotation

---

### 5. High API Latency
**Name:** `api_latency_high`
**Condition:** p95 latency >2 seconds for 10 minutes
**Severity:** P3 (Low)
**Owner:** Engineering Team
**Action:**
- Review slow query logs
- Check database performance
- Investigate N+1 queries

**Query (Metric-based):**
```
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket[10m])) > 2
```

**Notification:**
- Slack: #engineering (no page)

---

### 6. JWT Token Validation Errors
**Name:** `jwt_validation_errors`
**Condition:** >100 invalid token errors in 5 minutes
**Severity:** P2 (Medium)
**Owner:** Security Team
**Action:**
- Check if JWT_SECRET was rotated
- Investigate token tampering
- Verify token expiration times

**Query (Log-based):**
```
level="error" AND error.message contains "Invalid or expired"
| count
| where count > 100
| timeframe 5m
```

**Notification:**
- Slack: #security-alerts
- Email: security@dramal.com

---

### 7. Rate Limit Excessive Hits
**Name:** `rate_limit_abuse`
**Condition:** >1000 rate limit rejections (429) in 10 minutes
**Severity:** P3 (Low)
**Owner:** Product Team
**Action:**
- Identify user/IP hitting limits
- Determine if legitimate or abuse
- Adjust limits if needed

**Query (Log-based):**
```
status=429
| count
| where count > 1000
| timeframe 10m
```

**Notification:**
- Slack: #engineering (no page)

---

## Metric Collection

### Application Metrics (Exported)

```typescript
// src/lib/metrics.ts exports these counters:

// Authentication metrics
auth.signin.success          // Successful logins
auth.signin.failure          // Failed logins
auth.signup.success          // New user registrations
auth.refresh.success         // Token refreshes

// API performance
api.request.duration         // Request latency (histogram)
api.request.total            // Total requests by endpoint
api.error.total              // Errors by endpoint

// Business metrics (optional)
notes.created                // Clinical notes created
prescriptions.issued         // Prescriptions issued
sessions.completed           // Sessions completed
```

### Recommended Dashboards

#### 1. System Health Dashboard
- Request rate (req/sec)
- Error rate (%)
- p50, p95, p99 latency
- Database connection pool usage
- Active users

#### 2. Security Dashboard
- Failed login attempts by IP
- Rate limit hits by endpoint
- JWT validation errors
- Audit log write rate

#### 3. Business Metrics Dashboard
- Daily active users
- Notes created per day
- Prescriptions issued per day
- Session completions

---

## Log Aggregation

### Log Format
All logs are JSON-structured:
```json
{
  "timestamp": "2026-01-16T10:00:00.000Z",
  "level": "info",
  "message": "Auth signin success",
  "context": {
    "requestId": "req_abc123",
    "userId": "user_xyz",
    "role": "provider",
    "duration": 150
  }
}
```

### Important Log Patterns to Monitor

**Successful Authentication:**
```
level="info" AND message="Auth signin success"
```

**Failed Authentication:**
```
level="error" AND message="Auth signin failed"
```

**Database Errors:**
```
level="error" AND error.message contains "Prisma"
```

**Audit Log Writes:**
```
message contains "AuditLog" OR message contains "audit"
```

**Rate Limiting:**
```
status=429
```

---

## Health Checks

### Application Health Endpoint
**URL:** `/api/health`
**Method:** GET
**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-16T10:00:00.000Z",
  "database": "connected",
  "version": "2.0.0"
}
```

**Monitoring:**
- Check every 60 seconds
- Alert if 3 consecutive failures
- Timeout: 5 seconds

### Database Health Check
```sql
-- Run via monitoring tool
SELECT 1;  -- Should return quickly (<100ms)
```

---

## Integration Examples

### DataDog APM
```javascript
// Add to instrumentation
const tracer = require('dd-trace').init({
  service: 'dr-amal-clinical-os',
  env: process.env.NODE_ENV,
  logInjection: true
});
```

### Prometheus Exporter
```javascript
// Add to metrics.ts
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Export at /metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

### Sentry Error Tracking
```javascript
// Add to error handler
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

---

## Alert Escalation Matrix

| Severity | Response Time | Notification | Escalation (if unresolved) |
|----------|---------------|--------------|----------------------------|
| P0 (Critical) | 5 minutes | Page + Call + Slack | CTO after 15 min |
| P1 (High) | 15 minutes | Page + Slack | Engineering Lead after 30 min |
| P2 (Medium) | 1 hour | Slack + Email | Engineering Lead after 4 hours |
| P3 (Low) | 4 hours | Slack | Team standup next day |

---

## Monitoring Checklist for Production

- [ ] DataDog/New Relic agent installed
- [ ] Log aggregation configured (stdout → platform)
- [ ] Alert webhooks configured
- [ ] PagerDuty integration active
- [ ] Slack channels created (#incidents, #security-alerts)
- [ ] On-call rotation scheduled
- [ ] Health check monitoring enabled
- [ ] Dashboards created and shared with team
- [ ] Alert runbooks linked in alert descriptions
- [ ] Test alert sent to verify notification chain

---

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Owner:** DevOps Team
