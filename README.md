# 🏥 Hospital Management System V2

**Clean Architecture | Microservices | Vietnamese Healthcare Compliance**

## 📊 **PROJECT STATUS**

**Version**: 2.0.0  
**Architecture**: Clean Architecture + 3-Tier + Microservices + Event-Driven  
**Status**: ✅ Production Ready (Deployed to VPS)  
**Last Updated**: 08/12/2024

### **✅ Completed Backend Services (8/8)**
- **API Gateway** - Unified entry point, routing & session management (Port 4000)
- **Identity Service** - Authentication, Authorization, RBAC (Port 3001)
- **Appointments Service** - Booking, Queue Management, Calendar (Port 3002)
- **Staff Service** - Doctor/Staff management, Scheduling (Port 3003)
- **Billing Service** - VNPay/PayOS integration, Invoices, Wallet (Port 3004)
- **Chat Service** - Realtime messaging via Supabase (Port 3005)
- **Patient Registry Service** - Patient demographics, Medical history (Port 3006)
- **Notification Service** - Email notifications, Reminders (Port 3007)

### **✅ Completed Frontend**
- **Patient Portal** - Appointment booking, Payment, Profile management
- **Doctor Portal** - Dashboard, Calendar, Patient consultations
- **Admin Portal** - Staff management, Departments, Reports, Analytics
- **Public Pages** - Landing, Services, Doctors, FAQ, Contact, etc.

### **✅ Deployment**
- Successfully deployed to VPS with Docker Compose
- HTTPS enabled via Nginx reverse proxy
- Production database on Supabase

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
│   └── services-v2/              # 🎯 Microservices Backend
│       ├── api-gateway/              # ✅ API Gateway & Routing
│       ├── identity-service/         # ✅ Auth & User Management
│       ├── appointments-service/     # ✅ Appointments & Calendar
│       ├── staff-service/            # ✅ Doctor/Staff Management
│       ├── billing-service/          # ✅ Payments (VNPay/PayOS)
│       ├── chat-service/             # ✅ Realtime Chat
│       ├── patient-registry-service/ # ✅ Patient Management
│       ├── notification-service/     # ✅ Email Notifications
│       ├── shared/                   # Shared domain primitives
│       └── docker-compose.yml        # Production orchestration
│
├── frontend/                     # Next.js 14 + React 18 + TypeScript
│   ├── app/                     # Next.js App Router (Patient/Doctor/Admin)
│   ├── components/              # React components + Framer Motion
│   ├── lib/                     # API services & utilities
│   └── middleware.ts            # Auth middleware
│
├── docs/                        # 📚 API & Flow Documentation
├── AGENTS.md                    # 🤖 Coding agent guidelines
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
- **Identity Service**: http://localhost:3001/health
- **Patient Registry**: http://localhost:3002/health
- **Provider/Staff**: http://localhost:3003/health
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

### **Service-Specific Docs**
Each service has its own README:
- `backend/services-v2/identity-service/README.md`
- `backend/services-v2/patient-registry-service/README.md`
- `backend/services-v2/provider-staff-service/README.md`

---

## 🎯 **DEVELOPMENT ROADMAP**

### **Phase 1: Foundation** ✅ COMPLETED
- [x] Identity Service with Clean Architecture
- [x] Patient Registry Service with DDD patterns
- [x] Staff/Provider Service
- [x] Database schema-per-service design
- [x] Event-driven architecture foundation

### **Phase 2: Core Services** ✅ COMPLETED
- [x] API Gateway implementation with session management
- [x] Appointments Service with calendar & queue management
- [x] Billing Service with VNPay/PayOS integration
- [x] Chat Service with Supabase Realtime

### **Phase 3: Frontend Development** ✅ COMPLETED
- [x] Patient Portal - Booking, Payments, Profile
- [x] Doctor Portal - Dashboard, Calendar, Consultations
- [x] Admin Portal - Staff, Departments, Reports
- [x] Public Pages - Landing, Services, FAQ, Contact

### **Phase 4: Deployment & Production** ✅ COMPLETED
- [x] Docker containerization for all services
- [x] VPS deployment with Nginx reverse proxy
- [x] HTTPS configuration
- [x] Production database setup on Supabase

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
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # Patient
curl http://localhost:3003/health  # Provider
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

- **Backend Services**: 8/8 (100%) ✅
- **Frontend Pages**: ~80 pages across 3 portals ✅
- **API Endpoints**: ~97 endpoints documented
- **Payment Integration**: VNPay + PayOS ✅
- **Realtime Features**: Chat via Supabase Realtime ✅
- **Vietnamese Standards**: Full compliance ✅

---

**Last Updated**: 08/12/2024  
**Project**: Đồ án Tốt nghiệp - Hệ Thống Quản Lý Bệnh Viện  
**Architecture**: 3-Tier + Clean Architecture + Microservices
