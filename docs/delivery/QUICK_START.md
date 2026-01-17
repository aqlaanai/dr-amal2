# 🚀 Quick Start: Test Credentials & Data
## Dr Amal - Clinical OS v2.0

## 🔐 Login Credentials

**All accounts use password:** `Test123!`

```bash
# Provider Account
Email: provider@dramal.com
Role: provider
Status: active ✅

# Admin Account  
Email: admin@dramal.com
Role: admin
Status: active ✅

# Parent Account
Email: parent@dramal.com
Role: parent
Status: active ✅
```

## 📊 Available Test Data

### Patients (5)
- Emma Johnson (4 years old) - active
- Liam Williams (13 years old) - active
- Sophia Davis (21 years old) - active
- Noah Martinez (34 years old) - active
- Olivia Anderson (10 years old) - **archived**

### Sessions (3)
- **Completed:** Emma Johnson (yesterday, 30min)
- **Active:** Liam Williams (ongoing now)
- **Scheduled:** Sophia Davis (tomorrow)

### Clinical Notes (2)
- **Draft** (editable): Liam - headache assessment
- **Finalized** (read-only): Emma - URI assessment

### Prescriptions (2)
- **Draft** (editable): Liam - Ibuprofen 400mg
- **Issued** (immutable): Emma - Acetaminophen (Pediatric)

### Lab Results (3)
- **Pending:** Sophia (awaiting results)
- **Received (Normal):** Emma - CBC all normal
- **Reviewed (Abnormal):** Liam - Low hemoglobin

## 🧪 Quick API Tests

### 1. Get Access Token
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@dramal.com","password":"Test123!"}'
```

### 2. Fetch Patients
```bash
curl http://localhost:3000/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Fetch Overview Dashboard
```bash
curl http://localhost:3000/api/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Re-seed Database

```bash
# Clear and reload all test data
npx prisma db seed

# Idempotent - safe to run multiple times
```

## 📋 Database Counts

- Users: 6 (3 seed accounts active)
- Patients: 5
- Sessions: 3
- Clinical Notes: 2
- Prescriptions: 2
- Lab Results: 3

## ⚙️ Development Workflow

1. Start dev server: `npm run dev`
2. Sign in as provider: `provider@dramal.com` / `Test123!`
3. Access token received → use for all API calls
4. Test APIs with seeded data
5. Re-seed if needed: `npx prisma db seed`
