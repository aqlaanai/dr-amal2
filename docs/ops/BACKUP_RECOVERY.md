# Production Backup & Recovery Procedures
# Dr Amal Clinical OS v2.0

## Backup Strategy

### Automatic Backups (Neon)
- **Frequency**: Continuous with point-in-time recovery
- **Retention**: 7 days for free tier, 30+ days for paid
- **Coverage**: All data, schema, and configurations
- **Location**: Neon cloud infrastructure (AWS)

### Manual Backups (Optional)
- Export critical data weekly via API
- Store encrypted backups in separate S3 bucket

## Restore Procedures

### Point-in-Time Recovery (Preferred)
1. **Who**: SRE/DevOps Engineer
2. **When**: Data corruption, accidental deletion, compliance requirements
3. **How**:
   - Access Neon Console: https://console.neon.tech
   - Navigate to project → Backups
   - Select restore point (timestamp)
   - Create new database from backup
   - Update application DATABASE_URL
   - Verify data integrity
   - Switch traffic to restored database

### Full Database Restore
1. **Who**: SRE/DevOps Engineer
2. **When**: Complete data loss, migration issues
3. **How**:
   - Create new Neon database
   - Use `pg_restore` or Neon import tools
   - Update connection strings
   - Run data validation tests

## Data Validation After Restore

Run these checks:
```bash
# Check user count
curl -H "Authorization: Bearer <token>" https://api.dramal.com/api/patients | jq '.length'

# Check recent audit logs
curl -H "Authorization: Bearer <token>" https://api.dramal.com/api/audit | jq '.[0]'

# Verify critical patient data
# (Manual inspection required for PHI)
```

## RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 5 minutes (Neon continuous backup)

## Testing
- Monthly restore drills in staging environment
- Automated backup integrity checks