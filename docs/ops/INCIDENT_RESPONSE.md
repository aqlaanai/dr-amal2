# Incident Response & Readiness
# Dr Amal Clinical OS v2.0

## Incident Severity Levels

### SEV-1 (Critical) - Page Immediately
- **Impact**: System completely down, data loss, security breach
- **Examples**: Database outage, auth system failure, data breach
- **Response Time**: <15 minutes
- **Resolution Time**: <4 hours

### SEV-2 (High) - Page Within 30 Minutes
- **Impact**: Major functionality broken, performance issues
- **Examples**: High error rates, slow responses, partial outages
- **Response Time**: <30 minutes
- **Resolution Time**: <12 hours

### SEV-3 (Medium) - Respond Within 2 Hours
- **Impact**: Minor issues, user inconvenience
- **Examples**: Intermittent errors, UI bugs, non-critical failures
- **Response Time**: <2 hours
- **Resolution Time**: <24 hours

### SEV-4 (Low) - Track and Fix
- **Impact**: No user impact, internal issues
- **Examples**: Monitoring alerts, log errors, performance warnings
- **Response Time**: Next business day

## On-Call Responsibilities

### Primary On-Call (SRE/DevOps)
- **24/7 Availability**: Phone + Slack
- **Responsibilities**:
  - Initial triage and assessment
  - Execute runbooks and procedures
  - Coordinate with secondary responders
  - Communicate status updates

### Secondary Responders
- **Security Team**: Security incidents, auth issues
- **Database Team**: Database outages, performance
- **Development Team**: Application bugs, deployments
- **Product Team**: User impact assessment

## Incident Response Procedures

### 1. Detection & Triage
```
Incident Detected → Alert Fires → On-Call Paged
↓
Check Dashboards & Logs
↓
Assess Severity & Impact
↓
Declare Incident & Notify Team
```

### 2. Investigation
```bash
# Check system status
curl https://api.dramal.com/health

# Review recent logs
# Use log aggregation tool (e.g., Datadog, CloudWatch)
# Search by requestId for correlation

# Check metrics
# Auth failure rate, error rates, response times

# Database checks
# Connection count, slow queries, backup status
```

### 3. Containment
- **For Security Issues**: Disable compromised accounts, block IPs
- **For Performance Issues**: Enable rate limiting, scale resources
- **For Data Issues**: Stop writes, enable read-only mode
- **For Application Issues**: Rollback deployment (see ROLLBACK_STRATEGY.md)

### 4. Recovery
- Fix root cause
- Test fixes in staging
- Deploy hotfix or rollback
- Monitor for 1 hour post-recovery

### 5. Post-Mortem
- Document timeline and root cause
- Update runbooks and monitoring
- Implement preventive measures
- Share learnings with team

## Emergency Controls

### Disable AI Features
```bash
# Environment variable
AI_ENABLED=false

# Or feature flag
# Update database flag to disable AI
```

### Limit Traffic
```bash
# Enable maintenance mode
MAINTENANCE_MODE=true

# Or rate limit all requests
GLOBAL_RATE_LIMIT=10
```

### Emergency Access
- **Break-glass procedure**: Override auth for critical access
- **Database direct access**: For data recovery
- **Log access**: Full audit trail inspection

## Communication Plan

### Internal Communication
- **Incident Channel**: Real-time updates
- **Status Page**: Internal status dashboard
- **Escalation Matrix**: Who to notify when

### External Communication
- **User-Facing Status Page**: https://status.dramal.com
- **Email Notifications**: For prolonged outages
- **Social Media**: For major incidents

### Communication Templates
- **Initial**: "We're investigating an issue affecting [feature]"
- **Update**: "Issue identified, rollback in progress"
- **Resolution**: "Issue resolved, monitoring closely"

## Training & Drills

### Required Training
- All team members: Incident response basics
- On-call staff: Detailed runbooks and procedures
- Leadership: Communication and escalation

### Regular Drills
- Monthly incident simulation
- Quarterly full failover test
- Annual disaster recovery test

## Tools & Resources

### Monitoring Tools
- Application: Vercel Analytics, custom metrics
- Infrastructure: Neon monitoring
- Logs: Structured JSON logs
- Alerts: Email/SMS/Slack notifications

### Runbooks Location
- `/docs/` directory in repository
- Internal wiki for procedures
- Shared drive for contact lists

### Contact Information
- **Emergency Hotline**: [Phone number]
- **Security Team**: security@dramal.com
- **SRE Team**: sre@dramal.com
- **Legal/Compliance**: legal@dramal.com