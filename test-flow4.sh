#!/bin/bash

# Flow 4 Manual Test Script
# Tests: Appointment Completion → Invoice → Payment

echo "=========================================="
echo "FLOW 4 TEST: Appointment → Invoice → Payment"
echo "=========================================="
echo ""

# Get environment variables
export SUPABASE_URL="https://ciasxktujslgsdgylimv.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY d:\hospital-management-V2\.env | cut -d '=' -f 2)

echo "1️⃣  CHECKING COMPLETED APPOINTMENTS..."
echo ""

# Query completed appointments
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/get_completed_appointments" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'

echo ""
echo "2️⃣  CHECKING INVOICES WITH APPOINTMENT_ID..."
echo ""

# Query invoices with appointment_id
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/invoices?appointment_id=is.not.null&limit=5" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "3️⃣  CHECKING OUTBOX EVENTS..."
echo ""

# Query outbox events
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/outbox_events?event_type=eq.appointments.completed&limit=5" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
