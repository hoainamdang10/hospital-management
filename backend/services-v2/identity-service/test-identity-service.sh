#!/bin/bash
# IDENTITY SERVICE - CURL TEST SCRIPT

echo " IDENTITY SERVICE - CURL TEST SUITE"
echo "======================================"
echo ""

BASE_URL="http://localhost:3021"
TEST_EMAIL="testuser_$(date +%Y%m%d%H%M%S)@example.com"
TEST_PASSWORD="TestPassword123!"

echo " Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Test Email: $TEST_EMAIL"
echo "  Test Password: $TEST_PASSWORD"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "-------------------"
curl -X GET $BASE_URL/health | jq '.'
echo ""

# Test 2: User Registration
echo "Test 2: User Registration"
echo "------------------------"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"fullName\": \"Test User\",
    \"roleType\": \"patient\",
    \"phoneNumber\": \"0123456789\",
    \"dateOfBirth\": \"1990-01-01\",
    \"gender\": \"male\",
    \"address\": \"123 Test Street, Hanoi\"
  }")

echo $REGISTER_RESPONSE | jq '.'
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.userId')
echo "User ID: $USER_ID"
echo ""

# Test 3: User Login
echo "Test 3: User Login"
echo "-----------------"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo $LOGIN_RESPONSE | jq '.'
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
SESSION_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.sessionToken')
echo "Access Token: $ACCESS_TOKEN"
echo ""

# Test 4: Forgot Password
echo "Test 4: Forgot Password"
echo "----------------------"
curl -s -X POST $BASE_URL/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }" | jq '.'
echo ""

# Test 5: Logout
echo "Test 5: User Logout"
echo "------------------"
curl -s -X POST $BASE_URL/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"sessionId\": \"$SESSION_TOKEN\"
  }" | jq '.'
echo ""

echo "======================================"
echo " TEST SUITE COMPLETE"
echo "======================================"
echo ""
echo " Test Summary:"
echo "  Test Email: $TEST_EMAIL"
echo "  User ID: $USER_ID"
echo ""
