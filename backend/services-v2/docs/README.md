# Hospital Management System V2 - Documentation

**Last Updated**: 2025-01-06  
**Version**: 2.0.0  
**Status**: 🚧 In Development (40-50% Complete)

---

## 📚 Documentation Structure

```
docs/
├── README.md                           # This file
├── architecture/                       # Architecture & Design Documents
│   ├── SERVICES_OVERVIEW.md           # 7 Core Services Overview
│   ├── IMPLEMENTATION_SUMMARY.md      # Implementation Status
│   └── CLEAN_ARCHITECTURE.md          # Clean Architecture Guide (TODO)
├── design/                            # Design Specifications
│   ├── ROLE_BOUNDARIES_AND_USE_CASES.md  # Role Definitions & Use Cases
│   ├── AUTHENTICATION_DESIGN.md       # Auth System Design (TODO)
│   └── DATABASE_SCHEMA.md             # Database Schema (TODO)
├── api/                               # API Documentation
│   ├── IDENTITY_SERVICE_API.md        # Identity Service API (TODO)
│   ├── PATIENT_REGISTRY_API.md        # Patient Registry API (TODO)
│   └── PROVIDER_STAFF_API.md          # Provider/Staff API (TODO)
└── workflows/                         # Workflow Diagrams
    ├── PATIENT_JOURNEY.md             # Patient Journey Workflow (TODO)
    ├── APPOINTMENT_FLOW.md            # Appointment Booking Flow (TODO)
    └── MEDICAL_RECORD_FLOW.md         # Medical Record Workflow (TODO)
```

---

## 🏗️ Architecture Documents

### 1. [Services Overview](architecture/SERVICES_OVERVIEW.md)
**Status**: ✅ Complete  
**Description**: Overview of 7 core microservices, Clean Architecture structure, and patterns implementation.

**Key Topics**:
- 7 Core Services (Identity, Patient Registry, Provider/Staff, Scheduling, Clinical/EMR, Billing, Notifications)
- Clean Architecture layers (Domain, Application, Infrastructure, Presentation)
- Advanced patterns (CQRS, Event-Driven, DDD)
- Service ports and schemas

### 2. [Implementation Summary](architecture/IMPLEMENTATION_SUMMARY.md)
**Status**: ✅ Complete  
**Description**: Current implementation status, completed features, and roadmap.

**Key Topics**:
- Completed services (Identity, Patient Registry, Provider/Staff)
- In-development services (Scheduling, Clinical, Billing, Notifications)
- Technology stack
- Deployment status

### 3. Clean Architecture Guide
**Status**: 📋 TODO  
**Description**: Detailed guide on implementing Clean Architecture in services.

**Planned Topics**:
- Layer responsibilities
- Dependency rules
- Entity vs Value Object
- Use Case patterns
- Repository patterns

---

## 🎨 Design Documents

### 1. [Role Boundaries & Use Cases](design/ROLE_BOUNDARIES_AND_USE_CASES.md)
**Status**: ✅ Complete  
**Description**: Comprehensive document defining 5 core user roles, their boundaries, responsibilities, and use cases.

**Key Topics**:
- 5 Core Roles (Admin, Doctor, Nurse, Receptionist, Patient)
- Role boundaries (CAN DO / CANNOT DO)
- 15+ Use Cases with detailed flows
- 4 Main Workflows (Patient registration, Appointment booking, Medical record update, Lab test)
- Permission Matrix (50+ permissions)
- Service Interactions
- UI/UX Requirements for each dashboard

**Why This Document is Important**:
- Defines clear separation of concerns
- Prevents role overlap and confusion
- Guides implementation priorities
- Serves as reference for developers and stakeholders

### 2. Authentication System Design
**Status**: 📋 TODO  
**Description**: Detailed design of authentication and authorization system.

**Planned Topics**:
- Patient self-registration flow
- Staff registration by HR/Admin
- MFA implementation (TOTP, SMS, Email)
- Session management
- JWT token structure
- Password policies
- Account lockout mechanism

### 3. Database Schema
**Status**: 📋 TODO  
**Description**: Complete database schema for all services.

**Planned Topics**:
- Schema per service (auth_schema, patient_schema, etc.)
- Entity relationships
- Indexes and constraints
- Migration strategy
- Data retention policies

---

## 📡 API Documentation

### 1. Identity Service API
**Status**: 📋 TODO  
**Description**: REST API documentation for Identity & Access Service.

**Planned Endpoints**:
- `POST /api/v1/auth/register/patient` - Patient self-registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/mfa/setup` - MFA setup
- `POST /api/v1/admin/staff/register` - Staff registration (Admin only)
- `GET /api/v1/users/:id` - Get user details
- `PUT /api/v1/users/:id` - Update user
- `GET /api/v1/users/:id/permissions` - Get user permissions

### 2. Patient Registry API
**Status**: 📋 TODO  
**Description**: REST API documentation for Patient Registry Service.

**Planned Endpoints**:
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/:id` - Get patient details
- `PUT /api/v1/patients/:id` - Update patient
- `GET /api/v1/patients/search` - Search patients
- `GET /api/v1/patients/:id/medical-records` - Get medical records

### 3. Provider/Staff API
**Status**: 📋 TODO  
**Description**: REST API documentation for Provider/Staff Service.

**Planned Endpoints**:
- `GET /api/v1/providers` - List providers
- `GET /api/v1/providers/:id` - Get provider details
- `GET /api/v1/providers/:id/schedule` - Get provider schedule
- `GET /api/v1/providers/:id/availability` - Check availability

---

## 🔄 Workflow Documents

### 1. Patient Journey Workflow
**Status**: 📋 TODO  
**Description**: End-to-end patient journey from registration to discharge.

**Planned Sections**:
- Patient self-registration online
- First visit workflow
- Follow-up visit workflow
- Emergency visit workflow
- Discharge process

### 2. Appointment Booking Flow
**Status**: 📋 TODO  
**Description**: Detailed appointment booking workflows.

**Planned Sections**:
- Online booking by patient
- Phone booking by receptionist
- Walk-in booking
- Appointment confirmation
- Appointment reminders
- Cancellation/rescheduling

### 3. Medical Record Workflow
**Status**: 📋 TODO  
**Description**: Medical record creation and update workflows.

**Planned Sections**:
- Initial consultation
- Medical record creation
- Record updates by doctor
- Nursing notes
- Lab results integration
- Prescription workflow

---

## 🎯 Quick Links

### For Developers
- [Services Overview](architecture/SERVICES_OVERVIEW.md) - Start here to understand the system
- [Role Boundaries](design/ROLE_BOUNDARIES_AND_USE_CASES.md) - Understand user roles and permissions
- [Implementation Summary](architecture/IMPLEMENTATION_SUMMARY.md) - Check current status

### For Stakeholders
- [Role Boundaries](design/ROLE_BOUNDARIES_AND_USE_CASES.md) - Review user roles and workflows
- [Implementation Summary](architecture/IMPLEMENTATION_SUMMARY.md) - Track progress

### For QA/Testers
- [Role Boundaries](design/ROLE_BOUNDARIES_AND_USE_CASES.md) - Test cases for each role
- API Documentation (Coming soon) - API testing

---

## 📝 Document Status Legend

- ✅ **Complete** - Document is finished and reviewed
- 🚧 **In Progress** - Document is being written
- 📋 **TODO** - Document is planned but not started
- ⚠️ **Needs Review** - Document needs stakeholder review
- 🔄 **Needs Update** - Document is outdated and needs updating

---

## 🤝 Contributing to Documentation

### Adding New Documents

1. Create document in appropriate folder:
   - `architecture/` - System architecture, patterns, design decisions
   - `design/` - Feature designs, specifications, user flows
   - `api/` - API documentation, endpoints, schemas
   - `workflows/` - Process flows, diagrams, user journeys

2. Follow naming convention:
   - Use UPPERCASE_WITH_UNDERSCORES.md
   - Be descriptive: `PATIENT_REGISTRATION_FLOW.md` not `FLOW.md`

3. Update this README:
   - Add entry in appropriate section
   - Update status
   - Add description and key topics

### Document Template

```markdown
# [Document Title]

**Date**: YYYY-MM-DD  
**Author**: [Your Name]  
**Status**: [Complete/In Progress/TODO]  
**Version**: X.Y.Z

---

## Overview

[Brief description of what this document covers]

## [Section 1]

[Content]

## [Section 2]

[Content]

---

**Last Updated**: YYYY-MM-DD  
**Next Review**: YYYY-MM-DD
```

---

## 📞 Contact & Support

For questions about documentation:
- Create an issue in the repository
- Contact the development team
- Review existing documents for examples

---

**Document Maintained By**: Hospital Management Team  
**Last Review**: 2025-01-06  
**Next Review**: 2025-01-13

