# Identity Service - Documentation

**Version**: 2.0.0
**Last Updated**: 2025-01-08
**Service Port**: 3021

**Supported Roles**: 5 core roles (ADMIN, DOCTOR, NURSE, RECEPTIONIST, PATIENT)

---

## 📚 Documentation Index

### Quick Links
- [Service README](../README.md) - Service overview and quick start
- [API Contract](api/IDENTITY_API_CONTRACT.md) - API endpoints, errors, validation
- [Event Catalog](events/IDENTITY_EVENT_CATALOG.md) - Domain events and integration
- [Operations Runbook](ops/IDENTITY_RUNBOOK.md) - Operations and troubleshooting

---

## 📁 Documentation Structure

```
docs/
├── README.md                           # This file
│
├── api/                                # 📡 API Documentation
│   ├── IDENTITY_API_CONTRACT.md       # ⭐ API contract (errors, validation)
│   ├── API_REFERENCE.md               # REST API endpoints (TODO)
│   └── POSTMAN_COLLECTION.json        # Postman collection (TODO)
│
├── events/                             # 🔄 Event Documentation
│   ├── IDENTITY_EVENT_CATALOG.md      # ⭐ Event catalog (payload, subscribers)
│   └── EVENT_FLOWS.md                 # Event flows and sequences (TODO)
│
├── ops/                                # 🛠️ Operations Documentation
│   ├── IDENTITY_RUNBOOK.md            # ⭐ Operations runbook
│   ├── MONITORING.md                  # Monitoring guide (TODO)
│   └── TROUBLESHOOTING.md             # Troubleshooting guide (TODO)
│
├── architecture/                       # 🏗️ Architecture Documentation
│   ├── ARCHITECTURE_OVERVIEW.md       # Service architecture (TODO)
│   ├── DOMAIN_MODEL.md                # Domain entities, value objects (TODO)
│   └── BOUNDED_CONTEXT.md             # DDD bounded context (TODO)
│
├── database/                           # 💾 Database Documentation
│   ├── SCHEMA.md                      # Database schema (TODO)
│   ├── MIGRATIONS.md                  # Migration guide (TODO)
│   └── SEED_DATA.md                   # Seed data guide (TODO)
│
├── development/                        # 💻 Development Documentation
│   ├── SETUP.md                       # Local setup (TODO)
│   ├── TESTING.md                     # Testing guide (TODO)
│   └── DEBUGGING.md                   # Debugging guide (TODO)
│
└── reports/                            # 📊 Implementation Reports
    └── (To be organized from root)
```

---

## 🎯 Key Documents

### 1. API Contract ⭐
**File**: [api/IDENTITY_API_CONTRACT.md](api/IDENTITY_API_CONTRACT.md)  
**Status**: 📋 Draft  
**Purpose**: Define API contract for service integration

**Contents**:
- HTTP status codes
- Error codes catalog (AUTH_*, REG_*, USER_*, VAL_*)
- Validation rules for each endpoint
- Request/response formats
- Rate limiting rules
- API versioning

**Why Important**:
- Other services need this to integrate with Identity Service
- Frontend needs this for error handling
- QA needs this for test cases
- Reduces integration issues

---

### 2. Event Catalog ⭐
**File**: [events/IDENTITY_EVENT_CATALOG.md](events/IDENTITY_EVENT_CATALOG.md)  
**Status**: 📋 Draft  
**Purpose**: Document all domain events for event-driven architecture

**Contents**:
- Event names and types
- Payload schemas
- Expected subscribers
- Retry behavior
- Event versioning

**Events Documented**:
1. UserRegistered
2. UserActivated
3. UserLoggedIn
4. UserLoggedOut
5. UserAccountLocked
6. UserAccountUnlocked
7. UserPasswordChanged
8. UserRoleChanged

**Why Important**:
- Patient Registry Service needs to subscribe to UserRegistered
- Provider/Staff Service needs to subscribe to UserRegistered
- Notification Service needs to subscribe to all events
- Ensures event-driven architecture works correctly

---

### 3. Operations Runbook ⭐
**File**: [ops/IDENTITY_RUNBOOK.md](ops/IDENTITY_RUNBOOK.md)  
**Status**: 📋 Draft  
**Purpose**: Operational procedures for running the service

**Contents**:
- Service startup/shutdown procedures
- Health check procedures
- Common troubleshooting issues
- Recovery procedures
- Pre-demo checklist

**Why Important**:
- Quick reference for operations
- Helps during demo/presentation
- Reduces downtime
- Helps new team members

---

## 📋 Documentation Status

| Category | Document | Status | Priority |
|----------|----------|--------|----------|
| **API** | API Contract | 📋 Draft | P0 |
| **API** | API Reference | ❌ TODO | P1 |
| **API** | Postman Collection | ✅ Exists | P1 |
| **Events** | Event Catalog | 📋 Draft | P0 |
| **Events** | Event Flows | ❌ TODO | P1 |
| **Ops** | Runbook | 📋 Draft | P0 |
| **Ops** | Monitoring | ❌ TODO | P1 |
| **Ops** | Troubleshooting | ❌ TODO | P1 |
| **Architecture** | Overview | ❌ TODO | P2 |
| **Architecture** | Domain Model | ❌ TODO | P2 |
| **Architecture** | Bounded Context | ❌ TODO | P2 |
| **Database** | Schema | ❌ TODO | P2 |
| **Database** | Migrations | ❌ TODO | P2 |
| **Database** | Seed Data | ❌ TODO | P2 |
| **Development** | Setup | ❌ TODO | P2 |
| **Development** | Testing | ❌ TODO | P2 |
| **Development** | Debugging | ❌ TODO | P2 |

**Legend**:
- ✅ Complete
- 📋 Draft (skeleton created, needs completion)
- ❌ TODO (not started)

---

## 🚀 Next Steps

### Immediate (P0)
1. Complete API Contract with all endpoints
2. Complete Event Catalog with all events
3. Complete Operations Runbook with production procedures

### Short-term (P1)
1. Create API Reference with detailed endpoint documentation
2. Create Event Flows with sequence diagrams
3. Create Monitoring guide
4. Create Troubleshooting guide

### Long-term (P2)
1. Create Architecture Overview
2. Create Domain Model documentation
3. Create Database Schema documentation
4. Create Development guides

---

## 📞 Support

### For Developers
- **Setup Issues**: See [Service README](../README.md)
- **API Questions**: See [API Contract](api/IDENTITY_API_CONTRACT.md)
- **Event Questions**: See [Event Catalog](events/IDENTITY_EVENT_CATALOG.md)

### For Operations
- **Service Issues**: See [Operations Runbook](ops/IDENTITY_RUNBOOK.md)
- **Health Checks**: `curl http://localhost:3021/health`
- **Logs**: `docker-compose logs -f identity-service`

### For QA/Testers
- **API Testing**: See [API Contract](api/IDENTITY_API_CONTRACT.md)
- **Test Data**: See [Seed Data](database/SEED_DATA.md) (TODO)
- **Test Cases**: See [Testing Guide](development/TESTING.md) (TODO)

---

## 🤝 Contributing

### Adding New Documentation

1. Create document in appropriate folder
2. Follow naming convention: `UPPERCASE_WITH_UNDERSCORES.md`
3. Use provided templates
4. Update this README with link
5. Update status table

### Document Template

```markdown
# [Document Title]

**Version**: 1.0.0  
**Last Updated**: YYYY-MM-DD  
**Status**: [Draft/Complete]

---

## Overview

[Brief description]

## [Section 1]

[Content]

---

**Status**: [Status]  
**Next Update**: [What needs to be added]
```

---

## 📝 Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-06 | Initial documentation structure | AI Agent |
| 1.0.0 | 2025-01-06 | Added API Contract skeleton | AI Agent |
| 1.0.0 | 2025-01-06 | Added Event Catalog skeleton | AI Agent |
| 1.0.0 | 2025-01-06 | Added Operations Runbook skeleton | AI Agent |

---

**Maintained By**: Identity Service Team  
**Last Review**: 2025-01-06  
**Next Review**: After completing P0 documents

