# Integration Tests - Provider/Staff Service

## Overview

Integration tests verify the communication between Provider/Staff Service and external services:
- **Supabase Database** - Data persistence and retrieval
- **RabbitMQ** - Event-driven communication
- **API Endpoints** - HTTP REST API

---

## Test Suites

### 1. API Integration Tests (`api/staff-api.integration.test.ts`)

Tests REST API endpoints with real database:

**POST /api/v1/staff - Register Staff**:
- ✅ Should register new doctor successfully
- ✅ Should register new nurse successfully
- ✅ Should reject registration without authentication
- ✅ Should reject registration with invalid data
- ✅ Should reject duplicate user registration
- ✅ Should reject duplicate license number

**GET /api/v1/staff/:staffId - Get Staff Profile**:
- ✅ Should retrieve staff profile successfully
- ✅ Should reject request without authentication
- ✅ Should return 404 for non-existent staff
- ✅ Should return 400 for invalid staffId format

**GET /api/v1/staff - Search Staff**:
- ✅ Should search staff by type
- ✅ Should search staff by department
- ✅ Should support pagination

### 2. Event Publishing Integration Tests (`events/event-publishing.integration.test.ts`)

Tests event-driven communication with RabbitMQ:

**RabbitMQ Connection**:
- ✅ Should connect to RabbitMQ successfully

**Event Publishing**:
- ✅ Should publish StaffRegistered event
- ✅ Should publish multiple events

---

## Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Start required services
cd backend/services-v2
docker-compose up -d supabase rabbitmq-v2
```

### Environment Variables

Create `.env.test` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RABBITMQ_URL=amqp://admin:admin@localhost:5673
```

---

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test Suite
```bash
npm test -- staff-api.integration.test.ts
npm test -- event-publishing.integration.test.ts
```

### With Coverage
```bash
npm run test:coverage:integration
```

---

## Test Data Management

### Cleanup Strategy
- Tests create temporary data
- `afterAll` hooks cleanup test data
- Uses `cleanupTestData()` helper

### Test Users
```typescript
const { userId, token } = await getOrCreateTestUser(
  supabaseClient,
  'admin@test.com',
  'password123'
);
```

### Test Staff
```typescript
const staffId = await createTestStaffInDb(supabaseClient, staffData);
testStaffIds.push(staffId); // Track for cleanup
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check Supabase is running
curl https://your-project.supabase.co/rest/v1/

# Verify credentials
echo $SUPABASE_SERVICE_ROLE_KEY
```

### RabbitMQ Connection Issues
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check logs
docker logs hospital-rabbitmq-v2

# Test connection
curl http://localhost:15673/api/overview
```

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-10  
**Author**: Hospital Management Team

