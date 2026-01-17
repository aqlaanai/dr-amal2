# Production Monitoring & Alerting
# Dr Amal Clinical OS v2.0

## Metrics Collected

### Authentication Metrics
- `auth.signin.success` - Successful signins
- `auth.signin.failure` - Failed signin attempts
- `auth.signup.success` - New user registrations
- `auth.signup.failure` - Failed registrations
- `auth.refresh.success` - Token refreshes
- `auth.refresh.failure` - Failed token refreshes

### API Metrics
- `api.read.*` - Read operations (patients, notes, etc.)
- `api.write.*` - Write operations (create/update)
- `api.error.*` - Error responses by endpoint

### Business Metrics
- `audit.log.created` - Audit trail entries
- `state_transition.*` - Clinical note/prescription state changes

## Alert Definitions

### Critical Alerts (Page immediately)
| Alert | Threshold | Owner | Response |
|-------|-----------|-------|----------|
| Auth Failure Rate | >20% in 5min | Security Team | Investigate brute force, disable accounts |
| Database Connection Failed | >1 failure/min | SRE | Check Neon status, failover if needed |
| High Error Rate | >10% 4xx/5xx | DevOps | Rollback deployment, investigate logs |

### Warning Alerts (Monitor closely)
| Alert | Threshold | Owner | Response |
|-------|-----------|-------|----------|
| Rate Limit Hit | >50 hits/min | Security | Monitor for abuse patterns |
| Slow Response Time | >5s average | Performance | Optimize queries, scale if needed |
| Audit Log Failure | >0 failures | Compliance | Ensure audit trail integrity |

### Info Alerts (Track trends)
| Alert | Threshold | Owner | Response |
|-------|-----------|-------|----------|
| User Registration Spike | >100/day | Product | Monitor growth, prepare scaling |
| AI Usage High | >1000 req/day | AI Team | Monitor costs, optimize prompts |

## Log Aggregation

### Structured Logging
- All logs in JSON format
- Include `requestId` for correlation
- Include `userId`, `role` (no sensitive data)
- Exclude PHI, credentials, tokens

### Log Levels
- `ERROR`: System errors, failures
- `WARN`: Unusual conditions
- `INFO`: Normal operations, auth events
- `DEBUG`: Development only (disabled in prod)

## Monitoring Dashboard

### Key Metrics to Monitor
1. **System Health**
   - Uptime
   - Response times (p95, p99)
   - Error rates

2. **Security**
   - Failed auth attempts by IP
   - Rate limit hits
   - Suspicious patterns

3. **Business**
   - Daily active users
   - Clinical note creation rate
   - Prescription issuance rate

4. **Database**
   - Connection pool usage
   - Query performance
   - Backup status

## Alert Response Procedures

### Auth Failure Spike
1. Check logs for attack patterns
2. Enable additional rate limiting if needed
3. Block suspicious IPs
4. Notify security team

### Database Issues
1. Check Neon status page
2. Verify connection strings
3. Scale database if needed
4. Implement read replicas for high load

### Error Rate Spike
1. Check recent deployments
2. Review error logs for patterns
3. Rollback if deployment-related
4. Scale application instances