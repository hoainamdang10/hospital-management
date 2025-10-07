# Hospital Management System - Services V2

**Version**: 2.0.0  
**Status**: 🚧 In Development (40-50% Complete)  
**Architecture**: Clean Architecture + DDD + CQRS + Event-Driven

---

## 🎯 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Docker & Docker Compose
- Supabase account (for database)

### Setup

1. **Clone and install dependencies**
```bash
cd backend/services-v2
npm install
```

2. **Configure environment**
```bash
# Create .env file
cp .env.example .env

# Add your Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

3. **Start infrastructure**
```bash
# Start Redis and RabbitMQ
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d
```

4. **Start core services**
```bash
# Start Identity, Patient Registry, Provider/Staff services
docker-compose -f docker-compose.v2.yml --profile core up -d
```

5. **Verify services**
```bash
# Check health
curl http://localhost:3021/health  # Identity Service
curl http://localhost:3023/health  # Patient Registry
curl http://localhost:3022/health  # Provider/Staff
```

---

## 📚 Documentation

**📖 [Complete Documentation](docs/README.md)**

### Quick Links
- **[Services Overview](docs/architecture/SERVICES_OVERVIEW.md)** - Architecture and patterns
- **[Role Boundaries & Use Cases](docs/design/ROLE_BOUNDARIES_AND_USE_CASES.md)** - User roles and workflows
- **[Implementation Summary](docs/architecture/IMPLEMENTATION_SUMMARY.md)** - Current status

---

## 🏗️ Architecture

### 7 Core Services

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Identity Service** | 3021 | ✅ Ready | Authentication, authorization, user management |
| **Patient Registry** | 3023 | ✅ Ready | Patient demographics, registration |
| **Provider/Staff** | 3022 | ✅ Ready | Doctor, nurse, staff management |
| **Scheduling** | 3024 | 🔄 In Dev | Appointments, slots, availability |
| **Clinical/EMR** | 3027 | 🔄 In Dev | Medical records, prescriptions |
| **Billing** | 3029 | 🔄 In Dev | Invoices, payments, insurance |
| **Notifications** | 3031 | 🔄 In Dev | Email, SMS, push notifications |

### Infrastructure

| Component | Port | Description |
|-----------|------|-------------|
| Redis V2 | 6380 | Caching and session storage |
| RabbitMQ V2 | 5673 | Message queue for events |
| RabbitMQ Management | 15673 | RabbitMQ admin UI |

---

## 🚀 Development

### Run Individual Service

```bash
cd identity-service
npm install
npm run dev
```

### Run All Services

```bash
# Development mode
docker-compose -f docker-compose.v2.yml --profile dev up -d

# Production mode
docker-compose -f docker-compose.v2.yml --profile prod up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f identity-service
```

### Stop Services

```bash
# Stop all
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## 🧪 Testing

### Run Tests

```bash
# All services
npm run test:all

# Specific service
cd identity-service
npm test

# With coverage
npm run test:coverage
```

### Integration Tests

```bash
cd identity-service
npm run test:integration
```

---

## 📦 Project Structure

```
services-v2/
├── docs/                           # 📚 Documentation
│   ├── architecture/               # Architecture docs
│   ├── design/                     # Design specs
│   ├── api/                        # API docs
│   └── workflows/                  # Workflow diagrams
│
├── shared/                         # Shared kernel
│   ├── domain/                     # Domain primitives
│   ├── application/                # Application services
│   ├── infrastructure/             # Infrastructure utilities
│   └── events/                     # Domain events
│
├── identity-service/               # ✅ Identity & Access
├── patient-registry-service/       # ✅ Patient Management
├── provider-staff-service/         # ✅ Staff Management
├── scheduling-service/             # 🔄 Appointments
├── clinical-emr-service/           # 🔄 Medical Records
├── billing-service/                # 🔄 Billing
├── notifications-service/          # 🔄 Notifications
│
├── docker-compose.v2.yml          # Service orchestration
├── package.json                    # Root package
└── README.md                       # This file
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Service Config
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Infrastructure (Auto-configured)
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101
```

### Database Setup

Run in Supabase SQL Editor:

```sql
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS provider_schema;
CREATE SCHEMA IF NOT EXISTS scheduling_schema;
CREATE SCHEMA IF NOT EXISTS clinical_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 🐛 Troubleshooting

### Common Issues

**Port conflicts**
```bash
# Check if ports are in use
netstat -ano | findstr :3021
netstat -ano | findstr :6380

# Kill process if needed
taskkill /PID <process_id> /F
```

**Docker issues**
```bash
# Restart Docker Desktop
# Then clean restart
docker-compose down -v
docker-compose --profile core up -d
```

**Database connection**
```bash
# Verify Supabase credentials in .env
# Check network connectivity
curl https://your-project.supabase.co
```

---

## 📊 Service Status

### ✅ Completed Services (3/7)

1. **Identity Service** - Authentication, authorization, RBAC
2. **Patient Registry** - Patient management, demographics
3. **Provider/Staff** - Doctor, nurse, staff management

### 🔄 In Development (4/7)

4. **Scheduling Service** - Appointment booking, calendar
5. **Clinical/EMR Service** - Medical records, prescriptions
6. **Billing Service** - Invoices, payments
7. **Notifications Service** - Email, SMS, push

---

## 🎯 Roadmap

### Phase 1: Core Services (Completed)
- [x] Identity Service
- [x] Patient Registry Service
- [x] Provider/Staff Service

### Phase 2: Clinical Services (In Progress)
- [ ] Scheduling Service
- [ ] Clinical/EMR Service

### Phase 3: Support Services (Planned)
- [ ] Billing Service
- [ ] Notifications Service

### Phase 4: Integration (Planned)
- [ ] API Gateway
- [ ] Frontend Integration
- [ ] Mobile App Support

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Implement feature following Clean Architecture
3. Write tests (unit + integration)
4. Update documentation
5. Create pull request

### Code Standards

- Follow Clean Architecture principles
- Write tests for all business logic
- Use TypeScript strict mode
- Follow Vietnamese healthcare standards
- Document public APIs

---

## 📞 Support

- **Documentation**: [docs/README.md](docs/README.md)
- **Issues**: Create GitHub issue
- **Questions**: Contact development team

---

## 📄 License

[Your License Here]

---

**Maintained By**: Hospital Management Team  
**Last Updated**: 2025-01-06

