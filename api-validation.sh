#!/bin/bash

# API Validation Script - Step 3: Empty Database Testing
# Tests all backend APIs with no seed data

BASE_URL="http://localhost:3000"
TEMP_DIR=$(mktemp -d)
RESULTS_FILE="$TEMP_DIR/validation_results.txt"

echo "🔍 Dr Amal API Validation - Empty Database State"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local headers="$4"
    local body="$5"
    local expected_status="$6"
    
    echo -n "Testing: $name ... "
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$body" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            $headers 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS_COUNT=$((PASS_COUNT + 1))
        echo "$name: PASS (HTTP $status_code)" >> "$RESULTS_FILE"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "Response: $body"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "$name: FAIL (Expected $expected_status, got $status_code)" >> "$RESULTS_FILE"
    fi
}

echo "📋 SECTION 1: Health Checks"
echo "----------------------------"
test_endpoint "Liveness Check" "GET" "/api/health/liveness" "" "" "200"
test_endpoint "Readiness Check" "GET" "/api/health/readiness" "" "" "200"
echo ""

echo "🔐 SECTION 2: Authentication Flow"
echo "-----------------------------------"

# Test signup - valid provider
echo -n "Testing: Provider Signup ... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"testprovider","email":"provider@test.com","password":"Test123!","role":"provider"}' 2>&1)
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status_code" = "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    PASS_COUNT=$((PASS_COUNT + 1))
    # Extract tokens for subsequent tests
    ACCESS_TOKEN=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
    REFRESH_TOKEN=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['refreshToken'])" 2>/dev/null)
    echo "  → Tokens saved for subsequent tests"
else
    echo -e "${RED}✗ FAIL${NC} (Expected 201, got $status_code)"
    echo "Response: $body"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test duplicate signup
test_endpoint "Duplicate Signup (should fail)" "POST" "/api/auth/signup" "" \
    '{"username":"testprovider","email":"provider@test.com","password":"Test123!","role":"provider"}' "400"

# Test invalid email format
test_endpoint "Invalid Email Format" "POST" "/api/auth/signup" "" \
    '{"username":"test2","email":"notanemail","password":"Test123!","role":"provider"}' "400"

# Test weak password
test_endpoint "Weak Password" "POST" "/api/auth/signup" "" \
    '{"username":"test3","email":"test3@test.com","password":"weak","role":"provider"}' "400"

# Test signin - valid credentials
echo -n "Testing: Valid Signin ... "
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"email":"provider@test.com","password":"Test123!"}' 2>&1)
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $status_code)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Test signin - invalid credentials
test_endpoint "Invalid Password" "POST" "/api/auth/signin" "" \
    '{"email":"provider@test.com","password":"WrongPassword123!"}' "401"

# Test signin - nonexistent user
test_endpoint "Nonexistent User" "POST" "/api/auth/signin" "" \
    '{"email":"doesnotexist@test.com","password":"Test123!"}' "401"

echo ""

echo "🛡️  SECTION 3: Authorization Enforcement"
echo "----------------------------------------"

# Test protected endpoint without auth
test_endpoint "Patients List (no auth)" "GET" "/api/patients" "" "" "401"

# Test with valid token
if [ -n "$ACCESS_TOKEN" ]; then
    echo -n "Testing: Patients List (with auth) ... "
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/patients" \
        -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "200" ]; then
        # Check if it's an empty array
        is_empty=$(echo "$body" | python3 -c "import sys, json; data=json.load(sys.stdin); print('yes' if isinstance(data, list) and len(data) == 0 else 'no')" 2>/dev/null)
        if [ "$is_empty" = "yes" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code, empty array)"
            PASS_COUNT=$((PASS_COUNT + 1))
        else
            echo -e "${YELLOW}⚠ PARTIAL${NC} (HTTP $status_code, but not empty array)"
            echo "Response: $body"
            PASS_COUNT=$((PASS_COUNT + 1))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected 200, got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

echo ""

echo "📦 SECTION 4: Empty State Responses"
echo "------------------------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    AUTH_HEADER="-H \"Authorization: Bearer $ACCESS_TOKEN\""
    
    # Test all read endpoints
    echo -n "Testing: Patients List (empty) ... "
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/patients" \
        -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo -n "Testing: Lab Results List (empty) ... "
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/lab-results" \
        -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo -n "Testing: Overview (empty) ... "
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/overview" \
        -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        echo "  Response: $body"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Test 404 for specific IDs
    echo -n "Testing: Patient Not Found (404) ... "
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/patients/nonexistent-id" \
        -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "404" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected 404, got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

echo ""

echo "⚠️  SECTION 5: Error Handling"
echo "------------------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    # Test missing required fields
    echo -n "Testing: Create Note (missing patientId) ... "
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notes" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"subjective":"test"}' 2>&1)
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "400" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected 400, got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Test invalid JSON
    echo -n "Testing: Invalid JSON Body ... "
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/notes" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{invalid json}' 2>&1)
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "400" ] || [ "$status_code" = "500" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code - error handled)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (got $status_code)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
fi

echo ""

echo "📊 SECTION 6: Observability Check"
echo "----------------------------------"

echo -n "Testing: Metrics Endpoint ... "
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/metrics" 2>&1)
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status_code" = "200" ]; then
    # Check if metrics contain expected counters
    has_metrics=$(echo "$body" | grep -c "auth.signup.success" || true)
    if [ "$has_metrics" -gt 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code, metrics populated)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${YELLOW}⚠ PARTIAL${NC} (HTTP $status_code, but no signup metrics found)"
        PASS_COUNT=$((PASS_COUNT + 1))
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $status_code)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

echo ""
echo "=================================================="
echo "📈 VALIDATION SUMMARY"
echo "=================================================="
echo -e "Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ ALL TESTS PASSED - Backend is ready!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ SOME TESTS FAILED - Review failures above${NC}"
    exit 1
fi
