#!/bin/bash

API_URL="http://localhost:3002"

echo "🔍 Testing what user would experience:"
echo ""

# Step 1: Check if dev server is running
echo "1️⃣  Checking if server is running..."
if ! curl -s -f http://localhost:3002 > /dev/null 2>&1; then
  echo "❌ Server not responding on :3002"
  exit 1
fi
echo "✅ Server is running"
echo ""

# Step 2: Check signin endpoint
echo "2️⃣  Testing signin endpoint..."
SIGNIN=$(curl -s -X POST "$API_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@dramal.com","password":"Test123!"}')

ACCESS_TOKEN=$(echo "$SIGNIN" | jq -r '.accessToken // empty')
if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Signin failed - no token received"
  echo "Response: $SIGNIN"
  exit 1
fi
echo "✅ Signin successful"
echo "Token length: ${#ACCESS_TOKEN}"
echo ""

# Step 3: Test creating patient WITH token
echo "3️⃣  Creating patient WITH Authorization header..."
CREATE_WITH_TOKEN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/patients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"firstName":"Jane","lastName":"Doe","dateOfBirth":"2019-06-15"}')

HTTP_CODE=$(echo "$CREATE_WITH_TOKEN" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE=$(echo "$CREATE_WITH_TOKEN" | grep -v "HTTP_CODE:")

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Success! Patient created"
  PATIENT=$(echo "$RESPONSE" | jq -r '.firstName' 2>/dev/null)
  echo "Patient name: $PATIENT"
else
  echo "❌ Failed with status $HTTP_CODE"
  echo "Response: $RESPONSE"
fi
echo ""

# Step 4: Test creating patient WITHOUT token
echo "4️⃣  Creating patient WITHOUT Authorization header..."
CREATE_NO_TOKEN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/patients" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","dateOfBirth":"2018-06-15"}')

HTTP_CODE=$(echo "$CREATE_NO_TOKEN" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE=$(echo "$CREATE_NO_TOKEN" | grep -v "HTTP_CODE:")

echo "HTTP Status: $HTTP_CODE"
echo "Response: $RESPONSE"
if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Correctly rejected"
else
  echo "⚠️  Expected 400, got $HTTP_CODE"
fi

