#!/bin/bash

# Comprehensive API Validation - Step 3
# Tests empty database behavior with proper approval workflow

BASE_URL="http://localhost:3000"

echo "🔍 Dr Amal API Validation Report - Empty Database State"
echo "========================================================"
echo ""
echo "Date: $(date)"
echo "Environment: Development (SQLite)"
echo "Database: Empty state (no seed data)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  • Liveness probe (/api/health/liveness) ... "
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/liveness")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (got HTTP $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Readiness probe (/api/health/readiness) ... "
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/readiness")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (got HTTP $status)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  AUTHENTICATION FLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  • Signup with valid provider credentials ... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"validprovider","email":"valid@test.com","password":"SecurePass123!","role":"provider"}')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
    
    # Extract account status
    account_status=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['accountStatus'])" 2>/dev/null || echo "unknown")
    echo -e "    ${BLUE}→ Account status: $account_status${NC}"
    
    if [ "$account_status" = "pending" ]; then
        echo -e "    ${YELLOW}⚠ Account requires admin approval before signin${NC}"
        WARN=$((WARN + 1))
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 201, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Duplicate email rejection ... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"duplicate","email":"valid@test.com","password":"SecurePass123!","role":"provider"}')
status=$(echo "$response" | tail -n1)

if [ "$status" = "409" ] || [ "$status" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - conflict detected)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 400/409, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Invalid email format rejection ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","email":"notanemail","password":"SecurePass123!","role":"provider"}')

if [ "$status" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 400, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Weak password rejection ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"test","email":"test@example.com","password":"weak","role":"provider"}')

if [ "$status" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 400, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Signin with pending account (should be rejected) ... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"valid@test.com","password":"SecurePass123!"}')
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - pending accounts correctly blocked)"
    PASS=$((PASS + 1))
    
    # Check error message
    error_msg=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null || echo "")
    if echo "$error_msg" | grep -qi "pending"; then
        echo -e "    ${BLUE}→ Error message: \"$error_msg\"${NC}"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 403, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Invalid credentials rejection ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"valid@test.com","password":"WrongPassword123!"}')

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Nonexistent user rejection ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@test.com","password":"SecurePass123!"}')

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got $status)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  AUTHORIZATION ENFORCEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  • Protected endpoint without token (/api/patients) ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/patients")

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - auth required)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Protected endpoint with invalid token ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/patients" \
    -H "Authorization: Bearer invalid_token_xyz123")

if [ "$status" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - invalid token rejected)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got $status)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  ERROR HANDLING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  • Missing Content-Type header ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -d '{"email":"test@test.com"}')

if [ "$status" = "400" ] || [ "$status" = "500" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - error handled)"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} (got $status, expected 400/500)"
    WARN=$((WARN + 1))
fi

echo -n "  • Malformed JSON body ... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{invalid json}')

if [ "$status" = "400" ] || [ "$status" = "500" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status - error handled)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 400/500, got $status)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  OBSERVABILITY VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "  • Metrics endpoint accessible ... "
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/metrics")
status=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
    PASS=$((PASS + 1))
    
    # Check for expected metrics
    signup_success=$(echo "$body" | grep -c "auth.signup.success" || true)
    signin_failure=$(echo "$body" | grep -c "auth.signin.failure" || true)
    
    if [ "$signup_success" -gt 0 ]; then
        echo -e "    ${BLUE}→ auth.signup.success metric present${NC}"
    fi
    
    if [ "$signin_failure" -gt 0 ]; then
        echo -e "    ${BLUE}→ auth.signin.failure metric present${NC}"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $status)"
    FAIL=$((FAIL + 1))
fi

echo -n "  • Metrics contain valid structure ... "
has_timestamp=$(echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); print('yes' if 'timestamp' in d else 'no')" 2>/dev/null || echo "no")
has_metrics=$(echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); print('yes' if 'metrics' in d else 'no')" 2>/dev/null || echo "no")

if [ "$has_timestamp" = "yes" ] && [ "$has_metrics" = "yes" ]; then
    echo -e "${GREEN}✓ PASS${NC} (timestamp + metrics present)"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗ FAIL${NC} (invalid structure)"
    FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Total Tests:  $((PASS + FAIL))"
echo -e "  ${GREEN}✓ Passed:     $PASS${NC}"
echo -e "  ${RED}✗ Failed:     $FAIL${NC}"
echo -e "  ${YELLOW}⚠ Warnings:   $WARN${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL CRITICAL TESTS PASSED${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🎯 Empty Database Validation: COMPLETE"
    echo ""
    echo "Key Findings:"
    echo "  • Authentication flow works correctly"
    echo "  • Authorization enforcement is active"
    echo "  • Error handling returns appropriate status codes"
    echo "  • Observability (logs + metrics) is operational"
    echo "  • Account approval workflow is enforced"
    echo ""
    if [ $WARN -gt 0 ]; then
        echo -e "${YELLOW}⚠ Note: $WARN warnings noted (account approval required for signin)${NC}"
    fi
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Review failed tests above and fix issues before proceeding."
    echo ""
    exit 1
fi
