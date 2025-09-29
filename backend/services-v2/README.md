# Hospital Management System - Services V2

## 🏗️ **Clean Architecture Implementation**

Đây là implementation mới của 7 core services sử dụng **Clean Architecture + DDD + CQRS + Event-Driven** patterns.

## 📋 **7 Core Services**

### **1. Identity & Access Service** (Port 3001)
- **Domain**: User identity, roles, permissions, sessions
- **Schema**: `identity_schema`
- **Patterns**: Strategy Pattern (auth methods), Decorator Pattern (audit)

### **2. Patient Registry Service** (Port 3003)  
- **Domain**: Patient demographics, contact info, registration
- **Schema**: `patient_schema`
- **Patterns**: Repository Pattern, Domain Events, CQRS

### **3. Provider/Staff Service** (Port 3002)
- **Domain**: Doctors, nurses, departments, schedules
- **Schema**: `provider_schema` 
- **Patterns**: Aggregate Pattern, Event Sourcing, Saga Pattern

### **4. Scheduling Service** (Port 3004)
- **Domain**: Appointments, slots, availability, queues
- **Schema**: `scheduling_schema`
- **Patterns**: Command Pattern, Event-Driven workflows

### **5. Clinical/EMR Service** (Port 3007)
- **Domain**: Medical records, encounters, diagnoses, prescriptions
- **Schema**: `clinical_schema`
- **Patterns**: Medical Workflow Pattern, FHIR compliance

### **6. Billing Service** (Port 3009)
- **Domain**: Invoices, payments, insurance claims
- **Schema**: `billing_schema`
- **Patterns**: Strategy Pattern (payment methods), Outbox Pattern

### **7. Notifications Service** (Port 3011)
- **Domain**: Email, SMS, push notifications, templates
- **Schema**: `notification_schema`
- **Patterns**: Observer Pattern, Template Method, Circuit Breaker

## 🏛️ **Clean Architecture Structure**

```
services-v2/
├── shared/                          # Shared kernel
│   ├── domain/                      # Domain layer
│   │   ├── base/                    # Base classes
│   │   ├── events/                  # Domain events
│   │   ├── value-objects/           # Value objects
│   │   └── interfaces/              # Domain interfaces
│   ├── application/                 # Application layer
│   │   ├── use-cases/               # Use cases
│   │   ├── services/                # Application services
│   │   └── interfaces/              # Application interfaces
│   ├── infrastructure/              # Infrastructure layer
│   │   ├── persistence/             # Database
│   │   ├── messaging/               # Event bus, queues
│   │   ├── external/                # External services
│   │   └── di/                      # Dependency injection
│   └── presentation/                # Presentation layer
│       ├── controllers/             # API controllers
│       ├── middleware/              # Middleware
│       └── dto/                     # Data transfer objects
│
├── identity-service/                # Identity & Access Service
│   ├── src/
│   │   ├── domain/                  # Service-specific domain
│   │   ├── application/             # Service-specific use cases
│   │   ├── infrastructure/          # Service-specific infrastructure
│   │   └── presentation/            # Service-specific API
│   ├── Dockerfile
│   └── package.json
│
├── patient-registry-service/        # Patient Registry Service
├── provider-staff-service/          # Provider/Staff Service
├── scheduling-service/              # Scheduling Service
├── clinical-emr-service/            # Clinical/EMR Service
├── billing-service/                 # Billing Service
├── notifications-service/           # Notifications Service
│
└── docker-compose.v2.yml           # New orchestration
```

## 🎯 **Advanced Patterns Implementation**

### **Tier 1: Foundation Patterns**
- ✅ **Clean Architecture**: Layer separation, dependency inversion
- ✅ **Domain-Driven Design**: Aggregates, value objects, domain events
- ✅ **Dependency Injection**: IoC container, service lifetimes
- ✅ **Repository Pattern**: Data access abstraction

### **Tier 2: Core Patterns**
- ✅ **CQRS**: Command/query separation, read models
- ✅ **Event-Driven**: Domain events, integration events
- ✅ **Use Cases**: Application layer orchestration
- ✅ **Strategy Pattern**: Payment methods, notification channels

### **Tier 3: Advanced Patterns**
- ✅ **Outbox Pattern**: Transactional consistency
- ✅ **Saga Pattern**: Long-running workflows
- ✅ **Circuit Breaker**: Service resilience
- ✅ **Medical Workflow Pattern**: Healthcare-specific processes

## 🚀 **Implementation Roadmap**

### **Week 1: Foundation (Current)**
- [x] Clean Architecture template
- [ ] DI Container setup
- [ ] Base patterns implementation
- [ ] Service generator script

### **Week 2: Core Services**
- [ ] Identity & Access Service
- [ ] Patient Registry Service  
- [ ] Provider/Staff Service

### **Week 3: Business Services**
- [ ] Scheduling Service
- [ ] Clinical/EMR Service

### **Week 4: Supporting Services**
- [ ] Billing Service
- [ ] Notifications Service
- [ ] Integration testing

## 🔧 **Development Commands**

```bash
# Generate new service
npm run generate:service <service-name>

# Start development
cd services-v2
docker-compose -f docker-compose.v2.yml --profile dev up -d

# Run tests
npm run test:services

# Build for production
npm run build:all
```

## 📊 **Quality Metrics**

- **Code Coverage**: >90%
- **API Response Time**: <200ms
- **FHIR Compliance**: >85%
- **HIPAA Compliance**: 100%
- **Event Processing**: <100ms
- **Service Availability**: >99.9%

## 🏥 **Healthcare Compliance**

- **HIPAA**: Audit logging, encryption, access controls
- **FHIR R4**: Resource mapping, validation
- **ICD-10**: Diagnosis coding
- **HL7**: Message standards
- **Vietnamese Healthcare**: Local regulations compliance

---

**Note**: Đây là implementation mới song song với hệ thống hiện tại. Migration sẽ được thực hiện từng service một cách an toàn.
