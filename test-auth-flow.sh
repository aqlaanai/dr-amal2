#!/bin/bash

set -e

API_URL="http://localhost:3002"
EMAIL="provider@dramal.com"
PASSWORD="Test123!"

echo "🔐 Testing Auth Flow"
echo "===================="
echo ""

# Step 1: Sign In
echo "1️⃣  Signing in as $EMAIL..."
SIGNIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Response: $SIGNIN_RESPONSE" | head -c 200
echo ""
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)
REFRESH_TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.refreshToken' 2>/dev/null)
USER=$(echo "$SIGNIN_RESPONSE" | jq -r '.user' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo "✅ Signed in successfully"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo "User: $(echo "$USER" | jq -r '.email')"
echo ""

# Step 2: Create a Patient with Token
echo "2️⃣  Creating patient with valid token..."
PATIENT_DATA='{"firstName":"Test","lastName":"Patient","dateOfBirth":"2020-01-01"}'

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$PATIENT_DATA")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

echo "Status: $HTTP_CODE"
echo "Response: $RESPONSE_BODY" | head -c 300
echo ""
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Patient created successfully (201)"
  PATIENT_ID=$(echo "$RESPONSE_BODY" | jq -r '.id' 2>/dev/null)
  echo "Patient ID: $PATIENT_ID"
else
  echo "❌ Failed to create patient (got $HTTP_CODE)"
  echo "Full response: $RESPONSE_BODY"
  exit 1
fi

echo ""

# Step 3: Try without token
echo "3️⃣  Attempting to create patient WITHOUT token..."
NO_TOKEN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/patients" \
  -H "Content-Type: application/json" \
  -d "$PATIENT_DATA")

NO_TOKEN_CODE=$(echo "$NO_TOKEN_RESPONSE" | tail -n1)
NO_TOKEN_BODY=$(echo "$NO_TOKEN_RESPONSE" | sed '$d')

echo "Status: $NO_TOKEN_CODE"
echo "Response: $NO_TOKEN_BODY" | jq . 2>/dev/null || echo "$NO_TOKEN_BODY"
echo ""

if [ "$NO_TOKEN_CODE" = "400" ]; then
  echo "✅ Correctly rejected without token (400)"
else
  echo "⚠️  Expected 400, got $NO_TOKEN_CODE"
fi

echo ""
echo "🎉 Auth flow test complete!"
