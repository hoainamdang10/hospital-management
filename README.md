# 🏥 Hospital Management System V2

**Clean Architecture | Microservices | Vietnamese Healthcare Compliance**

## 📊 **PROJECT STATUS**

**Version**: 2.0.0-alpha  
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven  
**Status**: 🚧 In Active Development (40-50% Complete)

### **✅ Completed Services (3/7)**
- **Identity Service** - Authentication & Authorization (Port 3021)
- **Patient Registry** - Patient management with HIPAA compliance (Port 3023)
- **Provider/Staff** - Doctor/Staff management (Port 3022)

### **🔄 In Development (4/7)**
- **Scheduling Service** - Appointments & Queue Management (Port 3024)
- **Clinical EMR Service** - Medical Records & FHIR compliance (Port 3027)
- **Billing Service** - Payments & Insurance (Port 3029)
- **Notifications Service** - Multi-channel alerts (Port 3031)

### **❌ Not Started**
- **API Gateway V2** - Unified entry point (Port 3101)

---

## 🏗️ **ARCHITECTURE**

### **Clean Architecture Principles**
```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  ← Controllers, Routes, DTOs
├─────────────────────────────────────────┤
│         Application Layer               │  ← Use Cases, CQRS Handlers
├─────────────────────────────────────────┤
│         Domain Layer                    │  ← Aggregates, Entities, Value Objects, Events
├─────────────────────────────────────────┤
│         Infrastructure Layer            │  ← Repositories, External Services, DB
└─────────────────────────────────────────┘
```

### **Project Structure**
```
hospital-management-V2/
├── backend/
│   └── services-v2/              # 🎯 Clean Architecture V2 Services
│       ├── identity-service/           # ✅ Auth & User Management
│       ├── patient-registry-service/   # ✅ Patient Management
│       ├── provider-staff-service/     # ✅ Doctor/Staff Management
│       ├── scheduling-service/         # 🔄 Appointments & Scheduling
│       ├── clinical-emr-service/       # 🔄 Medical Records & FHIR
│       ├── billing-service/            # 🔄 Payments & Billing
│       ├── notifications-service/      # 🔄 Notifications
│       ├── identity-service-consolidated/ # 🔄 Consolidated Identity (In Progress)
│       ├── shared/                     # Shared domain primitives
│       ├── scripts/                    # Deployment & validation scripts
│       └── docker-compose.v2.yml       # V2 orchestration
│
├── frontend/                     # Next.js 15 + React 18 + TypeScript
│   ├── app/                     # Next.js App Router
│   ├── components/              # React components
│   ├── lib/                     # Frontend utilities (⚠️ Still connects to V1)
│   └── middleware.ts            # Auth middleware
│
├── AGENTS.md                    # 🤖 Coding agent guidelines
├── DEVELOPMENT_RULES.md         # 📋 Development standards
├── V2-QUICK-START.md           # 🚀 Quick start guide (See this first!)
└── README.md                    # 📖 This file
```

---

## 🚀 **QUICK START**

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker Desktop (for running services)
- Supabase account (for database)

### **1. Environment Setup**
```bash
# Clone repository
git clone <repository-url>
cd hospital-management-V2

# Install dependencies
cd backend/services-v2
npm install
```

### **2. Configure Environment**
Create `.env` file in `backend/services-v2/` with:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Service Configuration
NODE_ENV=development
JWT_SECRET=your_jwt_secret_for_services

# Redis & RabbitMQ (auto-configured in docker-compose)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
```

### **3. Start V2 Services**
```bash
cd backend/services-v2

# Start infrastructure (Redis, RabbitMQ)
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Start core services (Identity, Patient, Provider)
docker-compose -f docker-compose.v2.yml --profile core up -d

# Check service health
docker-compose ps
```

### **4. Access Services**
- **Identity Service**: http://localhost:3021/health
- **Patient Registry**: http://localhost:3023/health  
- **Provider/Staff**: http://localhost:3022/health
- **Redis**: localhost:6380
- **RabbitMQ UI**: http://localhost:15673 (admin/admin)

### **5. Frontend (Still V1 - Needs Migration)**
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:3000
```

⚠️ **Note**: Frontend still connects to V1 endpoints. API Gateway V2 needed before frontend migration.

---

## 📚 **DOCUMENTATION**

### **Essential Reading**
1. **[V2-QUICK-START.md](./V2-QUICK-START.md)** - Start here! Step-by-step setup guide
2. **[AGENTS.md](./AGENTS.md)** - Guidelines for coding agents
3. **[DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)** - Code quality standards

### **V2 Architecture Docs**
- **[backend/services-v2/README.md](./backend/services-v2/README.md)** - V2 overview & services
- **[backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md](./backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md)** - Detailed audit of 3 completed services
- **[backend/services-v2/STRATEGIC_DEVELOPMENT_PLAN.md](./backend/services-v2/STRATEGIC_DEVELOPMENT_PLAN.md)** - 4-week completion roadmap
- **[backend/services-v2/PORT-MAPPING.md](./backend/services-v2/PORT-MAPPING.md)** - Service port configuration

### **Service-Specific Docs**
Each service has its own README:
- `backend/services-v2/identity-service/README.md`
- `backend/services-v2/patient-registry-service/README.md`
- `backend/services-v2/provider-staff-service/README.md`

---

## 🎯 **DEVELOPMENT ROADMAP**

### **Phase 1: Foundation (Weeks 1-2)** ✅ COMPLETED
- [x] Identity Service with Clean Architecture
- [x] Patient Registry Service with DDD patterns
- [x] Provider/Staff Service
- [x] Database schema-per-service design
- [x] Event-driven architecture foundation

### **Phase 2: Core Services (Weeks 3-5)** 🔄 IN PROGRESS
- [ ] API Gateway V2 implementation
- [ ] Scheduling Service completion
- [ ] Clinical EMR Service with FHIR compliance
- [ ] Identity Service consolidation

### **Phase 3: Business Services (Weeks 6-7)** ⏳ PLANNED
- [ ] Billing Service with BHYT/BHTN integration
- [ ] Notifications Service with multi-channel delivery
- [ ] Service integration testing

### **Phase 4: Frontend Migration (Week 8)** ⏳ PLANNED
- [ ] Frontend migration to V2 API Gateway
- [ ] Update all API calls from V1 to V2
- [ ] End-to-end testing

---

## 🔧 **TECH STACK**

### **Backend**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Architecture**: Clean Architecture + DDD + CQRS
- **Database**: Supabase (PostgreSQL) with schema-per-service
- **Caching**: Redis 7
- **Messaging**: RabbitMQ 3
- **Containerization**: Docker & Docker Compose

### **Frontend**
- **Framework**: Next.js 15 + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Lucide React
- **State Management**: React Hooks + Context API

### **Infrastructure**
- **Monitoring**: Prometheus + Grafana (planned)
- **API Gateway**: Custom Express-based gateway (planned)
- **Service Discovery**: Docker network + environment variables

---

## 🧪 **TESTING**

### **Service Health Checks**
```bash
# Check all V2 services
cd backend/services-v2
docker-compose ps

# Individual service health
curl http://localhost:3021/health  # Identity
curl http://localhost:3023/health  # Patient
curl http://localhost:3022/health  # Provider
```

### **Run Tests** (⚠️ Not fully implemented yet)
```bash
cd backend/services-v2
npm run test
```

---

## 🤝 **CONTRIBUTING**

### **Coding Standards**
- Follow Clean Architecture principles (See [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md))
- Write tests for domain logic (target: 90%+ coverage)
- Use TypeScript strict mode
- Follow Vietnamese healthcare compliance standards

### **Commit Guidelines**
```bash
# Good commit messages
git commit -m "feat(identity): add password reset use case"
git commit -m "fix(patient): resolve PAT-ID generation bug"
git commit -m "docs(readme): update V2 quick start guide"
```

---

## 📝 **LICENSE**

This project is developed for educational purposes as part of a graduation thesis.

---

## 🆘 **SUPPORT**

### **For Developers**
1. Check **[V2-QUICK-START.md](./V2-QUICK-START.md)** for setup issues
2. Review **[AGENTS.md](./AGENTS.md)** for coding guidelines
3. Read service-specific READMEs in `backend/services-v2/<service>/`

### **For Coding Agents**
- **MUST READ**: [AGENTS.md](./AGENTS.md) before any code changes
- Follow Clean Architecture patterns established in completed services
- Review [ARCHITECTURE_AUDIT_REPORT.md](./backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md) for patterns to replicate

---

## 📈 **PROJECT METRICS**

- **Services Completed**: 3/7 (43%)
- **Code Coverage**: ~60% (Target: 90%+)
- **Documentation**: Comprehensive architecture docs available
- **HIPAA Compliance**: 100% (for completed services)
- **FHIR R4 Support**: Planned for Clinical EMR service
- **Vietnamese Standards**: Full compliance

---

**Last Updated**: October 1, 2025  
**Project Lead**: Hospital Management System V2 Team  
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven Microservices
