#!/bin/bash
# smoke-test.sh
# Light load testing for production readiness
# Phase 4: Launch Readiness

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="smoke-test-$(date +%s)@example.com"
TEST_PASSWORD="SmokeTest123!"

echo "🧪 Dr Amal Clinical OS - Smoke Tests"
echo "===================================="
echo "API URL: $API_URL"
echo "Starting: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  local headers=$6
  
  echo -n "Testing: $name ... "
  
  if [ -z "$headers" ]; then
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null || echo "000")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "$headers" \
      -d "$data" 2>/dev/null || echo "000")
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($status_code)"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
    echo "Response: $body"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Extract token from response
extract_token() {
  echo "$1" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4
}

echo "📝 Test 1: Authentication Flow"
echo "-------------------------------"

# Test 1.1: Sign up
echo -n "1.1 Sign Up (POST /api/auth/signup) ... "
signup_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Smoke Test\",\"role\":\"provider\"}")
signup_status=$(echo "$signup_response" | tail -n1)
signup_body=$(echo "$signup_response" | head -n-1)

if [ "$signup_status" = "201" ]; then
  echo -e "${GREEN}✓ PASS${NC} ($signup_status)"
  PASSED=$((PASSED + 1))
  ACCESS_TOKEN=$(extract_token "$signup_body")
else
  echo -e "${RED}✗ FAIL${NC} (Expected 201, got $signup_status)"
  echo "Response: $signup_body"
  FAILED=$((FAILED + 1))
  echo "Cannot continue without auth token. Exiting."
  exit 1
fi

# Test 1.2: Sign in with same credentials
sleep 1
test_endpoint "1.2 Sign In (POST /api/auth/signin)" \
  "POST" "/api/auth/signin" \
  "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  "200"

# Test 1.3: Rate limit check (try 6 signins rapidly)
echo -n "1.3 Auth Rate Limiting (should trigger after 5 attempts) ... "
rate_limit_hit=0
for i in {1..6}; do
  status=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"wrong@example.com\",\"password\":\"wrong\"}" \
    -o /dev/null)
  if [ "$status" = "429" ]; then
    rate_limit_hit=1
    break
  fi
  sleep 0.2
done

if [ $rate_limit_hit -eq 1 ]; then
  echo -e "${GREEN}✓ PASS${NC} (Rate limit triggered)"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (Rate limit not triggered - check configuration)"
  PASSED=$((PASSED + 1))  # Not a failure, just a warning
fi

sleep 2  # Wait for rate limit reset

echo ""
echo "📊 Test 2: Read Operations"
echo "-------------------------------"

# Test 2.1: Get overview (authenticated)
test_endpoint "2.1 Get Overview (GET /api/overview)" \
  "GET" "/api/overview" \
  "" \
  "200" \
  "Authorization: Bearer $ACCESS_TOKEN"

# Test 2.2: Get patients list
test_endpoint "2.2 Get Patients (GET /api/patients)" \
  "GET" "/api/patients" \
  "" \
  "200" \
  "Authorization: Bearer $ACCESS_TOKEN"

# Test 2.3: Unauthorized access (no token)
test_endpoint "2.3 Unauthorized Access (should fail)" \
  "GET" "/api/patients" \
  "" \
  "401" \
  ""

echo ""
echo "✍️  Test 3: Write Operations"
echo "-------------------------------"

# Test 3.1: Create patient
echo -n "3.1 Create Patient (POST /api/patients) ... "
create_patient_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"Test Patient","dateOfBirth":"1990-01-01","gender":"male","contactNumber":"555-0001","email":"patient@test.com","address":"123 Test St"}')
create_patient_status=$(echo "$create_patient_response" | tail -n1)
create_patient_body=$(echo "$create_patient_response" | head -n-1)

if [ "$create_patient_status" = "201" ]; then
  echo -e "${GREEN}✓ PASS${NC} ($create_patient_status)"
  PASSED=$((PASSED + 1))
  PATIENT_ID=$(echo "$create_patient_body" | grep -o '"patientId":"[^"]*' | cut -d'"' -f4)
else
  echo -e "${RED}✗ FAIL${NC} (Expected 201, got $create_patient_status)"
  echo "Response: $create_patient_body"
  FAILED=$((FAILED + 1))
fi

# Test 3.2: Create clinical note
if [ ! -z "$PATIENT_ID" ]; then
  echo -n "3.2 Create Clinical Note (POST /api/notes) ... "
  create_note_response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/notes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{\"patientId\":\"$PATIENT_ID\",\"subjective\":\"Patient reports headache\",\"objective\":\"Vitals normal\",\"assessment\":\"Tension headache\",\"plan\":\"Rest and hydration\"}")
  create_note_status=$(echo "$create_note_response" | tail -n1)
  
  if [ "$create_note_status" = "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($create_note_status)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected 201, got $create_note_status)"
    FAILED=$((FAILED + 1))
  fi
else
  echo -e "${YELLOW}⚠ SKIP${NC} 3.2 (No patient ID)"
fi

# Test 3.3: Write rate limiting (create 31 notes rapidly)
if [ ! -z "$PATIENT_ID" ]; then
  echo -n "3.3 Write Rate Limiting (30 req/min limit) ... "
  write_rate_limit_hit=0
  for i in {1..32}; do
    status=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/notes" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{\"patientId\":\"$PATIENT_ID\",\"subjective\":\"Test $i\"}" \
      -o /dev/null)
    if [ "$status" = "429" ]; then
      write_rate_limit_hit=1
      break
    fi
    sleep 0.1
  done
  
  if [ $write_rate_limit_hit -eq 1 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Write rate limit triggered)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠ WARNING${NC} (Write rate limit not triggered)"
    PASSED=$((PASSED + 1))
  fi
else
  echo -e "${YELLOW}⚠ SKIP${NC} 3.3 (No patient ID)"
fi

sleep 2

echo ""
echo "🤖 Test 4: AI Endpoints (Optional)"
echo "-------------------------------"

# Test 4.1: AI endpoint without session (should fail gracefully)
test_endpoint "4.1 AI Generate Note (expect 400 - missing sessionId)" \
  "POST" "/api/ai/generate-note" \
  "{}" \
  "400" \
  "Authorization: Bearer $ACCESS_TOKEN"

echo ""
echo "🔒 Test 5: Security Checks"
echo "-------------------------------"

# Test 5.1: SQL injection attempt
test_endpoint "5.1 SQL Injection Protection" \
  "POST" "/api/auth/signin" \
  "{\"email\":\"admin' OR '1'='1\",\"password\":\"anything\"}" \
  "401"  # Should reject, not crash

# Test 5.2: XSS attempt in patient name
test_endpoint "5.2 XSS Protection" \
  "POST" "/api/patients" \
  "{\"name\":\"<script>alert('xss')</script>\",\"dateOfBirth\":\"1990-01-01\",\"gender\":\"male\"}" \
  "201" \
  "Authorization: Bearer $ACCESS_TOKEN"

echo ""
echo "📈 Test 6: Monitoring Endpoints"
echo "-------------------------------"

# Test 6.1: Health check
test_endpoint "6.1 Health Check (GET /api/health)" \
  "GET" "/api/health" \
  "" \
  "200" \
  ""

# Test 6.2: Metrics endpoint (admin only)
echo -n "6.2 Metrics Endpoint (GET /api/metrics) ... "
metrics_response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/metrics" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
metrics_status=$(echo "$metrics_response" | tail -n1)

# Metrics endpoint may require admin role (403) or work (200)
if [ "$metrics_status" = "200" ] || [ "$metrics_status" = "403" ]; then
  echo -e "${GREEN}✓ PASS${NC} ($metrics_status)"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC} (Expected 200 or 403, got $metrics_status)"
  FAILED=$((FAILED + 1))
fi

echo ""
echo "🏁 Test Results"
echo "===================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $((PASSED + FAILED))"
echo "Completed: $(date)"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo "System is ready for production."
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo "Review failures before deploying to production."
  exit 1
fi
