# Rollback Strategy & Procedures
# Dr Amal Clinical OS v2.0

## Rollback Criteria

### Automatic Rollback Triggers
- Error rate >15% for 10 minutes
- Auth success rate <80% for 5 minutes
- Database connection failures >5/minute
- Critical security vulnerability detected

### Manual Rollback Triggers
- User-reported critical bugs
- Performance degradation (>50% slower)
- Data integrity issues
- Compliance violations

## Rollback Methods

### Blue-Green Deployment (Preferred)
1. **Current**: Production traffic on v2.0
2. **Rollback**: Switch traffic to v1.x in <5 minutes
3. **Why**: Zero downtime, instant rollback

### Database Rollback
1. **If schema changes**: Restore from backup (see BACKUP_RECOVERY.md)
2. **If data corruption**: Point-in-time recovery
3. **If migration issues**: Rollback migration scripts

### Application Rollback
1. **Via Vercel/Netlify**: Deploy previous version
2. **Via Docker**: Rollback container image
3. **Via Kubernetes**: Rollback deployment

## Rollback Steps

### Emergency Rollback Procedure
1. **Assess Impact**
   - Check error rates and user reports
   - Confirm rollback criteria met

2. **Execute Rollback**
   - Deploy previous stable version
   - Monitor for 15 minutes
   - Verify functionality

3. **Post-Rollback**
   - Investigate root cause
   - Fix issues in staging
   - Plan next deployment

### Database Rollback Procedure
1. **Stop Application Traffic**
   - Enable maintenance mode
   - Wait for active requests to complete

2. **Restore Database**
   - Create new database from backup
   - Update connection strings
   - Run data validation

3. **Resume Traffic**
   - Deploy application
   - Disable maintenance mode
   - Monitor closely

## Backward Compatibility

### API Compatibility
- All v1.x APIs remain functional
- New endpoints are additive only
- Response formats unchanged

### Database Compatibility
- Schema migrations are backward compatible
- No destructive changes without migration path
- Data migration scripts tested in staging

## Testing Rollbacks

### Pre-Production Testing
- Monthly rollback drills in staging
- Automated rollback testing in CI/CD
- Chaos engineering for failure simulation

### Validation After Rollback
```bash
# Health checks
curl https://api.dramal.com/health

# Auth test
curl -X POST https://api.dramal.com/api/auth/signin \
  -d '{"email":"test@example.com","password":"test"}'

# Data integrity
curl -H "Authorization: Bearer <token>" \
  https://api.dramal.com/api/patients | jq 'length'
```

## Rollback Timeline

| Action | Time | Owner |
|--------|------|-------|
| Detect issue | Immediate | Monitoring |
| Assess impact | <5 min | SRE/DevOps |
| Execute rollback | <15 min | DevOps |
| Verify functionality | <30 min | QA/DevOps |
| Full recovery | <1 hour | Team |

## Communication

### During Rollback
- Update status page
- Notify stakeholders
- Post in incident channel

### After Rollback
- Send incident report
- Schedule post-mortem
- Update runbooks