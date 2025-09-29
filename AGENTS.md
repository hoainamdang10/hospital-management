# AGENTS.md - Hospital Management System

## Language Requirements

- When a user asks in a language other than English, reiterate the request in English before proceeding
- Always think, answer, and perform in English, answer in Vietnamese

## Code Quality Standards

### Core Principles

- Don't write unused code - ensure everything written is utilized in the project
- Prioritize readability for human understanding over execution efficiency
- Maintain long-term maintainability over short-term optimization
- Avoid unnecessary complexity - implement simple solutions unless complexity is truly required
- Follow Linus Torvalds' clean code principles: keep it simple, make code readable like prose, avoid premature optimization, express intent clearly, minimize abstraction layers

### Documentation Standards

- Comments must explain 'what' (business logic/purpose) and 'why' (reasoning/decisions), not 'how'
- Avoid over-commenting - excessive comments indicate poor code quality
- Function comments must explain purpose and reasoning, placed at function beginnings
- Well-written code should be self-explanatory through meaningful names and clear structure

### Development Process

1. **Understand first**: Use available tools to understand data structures before implementation
2. **Design data structures**: Good data structures lead to good code
3. **Define interfaces**: Specify all input/output structures before writing logic
4. **Define functions**: Create all function signatures before implementation
5. **Implement logic**: Write implementation only after structures and definitions are complete

### Quality Guidelines

- Avoid over-engineering - focus on minimal viable solutions meeting acceptance criteria
- Only create automated tests if explicitly required
- Never add functionality "just in case" - implement only what's needed now

## Decision-Making Framework

Apply these principles systematically:

1. Gather Complete Information
2. Multi-Perspective Analysis
3. Consider All Stakeholders
4. Evaluate Alternatives
5. Assess Impact & Consequences
6. Apply Ethical Framework
7. Take Responsibility
8. Learn & Adapt

## User Guidelines

## Overview

Hospital Management System - Microservices architecture với Node.js/TypeScript backend, Next.js frontend, và Supabase database. Hệ thống quản lý bệnh viện hoàn chỉnh với 13 microservices (8 active, 5 decommissioned), authentication, real-time features, và HIPAA compliance.

**Architecture**: Microservices + API Gateway + GraphQL Gateway
**Tech Stack**: Node.js, TypeScript, Next.js, Docker, Supabase, Redis, RabbitMQ
**Ports**: API Gateway (3100), GraphQL Gateway (3200), Frontend (3000)
**Status**: Production-ready, HIPAA-compliant với comprehensive audit logging

## Setup

### Prerequisites

```bash
# Required
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version
```

### Environment Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd hospital-management
npm install

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `.env` files in:

- `backend/.env`
- `frontend/.env.local`

Required variables:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Application
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Build

### Development Mode

```bash
# Start backend services (recommended)
cd backend
docker compose --profile core up -d

# Start frontend
cd frontend
npm run dev
```

### Production Build

```bash
# Build all services
cd backend
npm run build

# Build frontend
cd frontend
npm run build
npm start
```

### Docker Commands

```bash
# Start core services only
docker compose --profile core up -d

# Start all services including monitoring
docker compose --profile full up -d

# Check service status
docker compose ps

# View logs
docker compose logs [service-name]

# Stop services
docker compose down
```

## Test

### Run Tests

```bash
# Root level tests
npm test

# Backend service tests
cd backend
npm run test:services

# Frontend tests
cd frontend
npm run test

# Integration tests
cd backend
npm run test:integration
```

### Service Health Check

```bash
cd backend
node test-services-status.js
```

### API Testing

```bash
# Test all endpoints
cd backend
node test-api-endpoints.js

# Test specific services
npm run test:patient
npm run test:doctor
npm run test:appointment
```

## Development Workflow

### Service Development

```bash
# Start individual services
cd backend
npm run dev:gateway    # API Gateway
npm run dev:doctor     # Doctor Service
npm run dev:patient    # Patient Service
npm run dev:appointment # Appointment Service

# Start multiple services
npm run dev:core       # Gateway + Core services
```

### Database Operations

```bash
# Setup database tables
cd backend
npm run setup:tables

# Run migrations
npm run migrate:all

# Seed test data
npm run db:seed

# Cleanup test data
npm run db:cleanup
```

### Code Quality

```bash
# Linting
cd backend
npm run lint

cd frontend
npm run lint

# Formatting
npm run format
```

## Conventions

### Naming Standards

- **Database**: snake_case (patient_profiles, medical_records)
- **API Endpoints**: kebab-case (/api/v1/patient-records)
- **TypeScript**: camelCase (variables), PascalCase (types)
- **Environment Variables**: UPPER_SNAKE_CASE

### File Structure

```
hospital-management/
├── backend/                 # Microservices
│   ├── services/           # 13 microservices
│   ├── docker-compose.yml  # Container orchestration
│   └── shared/            # Shared utilities
├── frontend/              # Next.js application
├── schemas/              # Database schemas
└── docs/                # Documentation
```

### API Standards

- **Response Time**: < 200ms target
- **Error Format**: Standardized JSON with Vietnamese messages
- **Authentication**: JWT tokens via Auth Service
- **Rate Limiting**: 100 requests/minute per user

## Dependencies

### Runtime Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: Latest version
- **Docker Compose**: v2+

### Key Dependencies

- **Backend**: Express.js, TypeScript, Supabase client, Redis, RabbitMQ
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Infrastructure**: Docker, Redis, RabbitMQ, Prometheus, Grafana

### Service Ports

```
3000  - Frontend (Next.js)
3100  - API Gateway
3200  - GraphQL Gateway
3001  - Auth Service
3002  - Doctor Service
3003  - Patient Service
3004  - Appointment Service
3005  - Department Service (DECOMMISSIONED - migrated to auth-service)
3006  - Receptionist Service (DECOMMISSIONED - migrated to appointment-service)
3007  - Medical Records Service
3009  - Payment Service
3011  - Notification Service (DECOMMISSIONED - converted to shared library)
3107  - File Service
6379  - Redis
5672  - RabbitMQ
15672 - RabbitMQ Management UI
9090  - Prometheus
9100  - Node Exporter
3010  - Grafana
5432  - PostgreSQL (doctor-db)
```

## Quick Commands

```bash
# Complete development setup
cd backend && docker compose --profile core up -d
cd frontend && npm run dev

# Health check all services
cd backend && node test-services-status.js

# Run all tests
npm test && cd backend && npm run test:services

# Build for production
cd backend && npm run build && cd ../frontend && npm run build

# Clean restart
docker compose down && docker compose --profile core up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 3100, 3200 are available
2. **Docker issues**: Restart Docker Desktop, run `docker compose down -v`
3. **Environment variables**: Verify all required .env files exist
4. **Database connection**: Check Supabase credentials and network

### Debug Commands

```bash
# Check service logs
docker compose logs [service-name]

# Verify environment
cd backend && npm run db:check

# Test database connection
cd backend && node scripts/check-database-status.js
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 3100, 3200 are available
2. **Docker issues**: Restart Docker Desktop, run `docker compose down -v`
3. **Environment variables**: Verify all required .env files exist
4. **Database connection**: Check Supabase credentials and network

### Debug Commands

```bash
# Check service logs
docker compose logs [service-name]

# Verify environment
cd backend && npm run db:check

# Test database connection
cd backend && node scripts/check-database-status.js
```

---

**Note**: Xem README.md để biết thêm chi tiết về architecture và features. File này chỉ chứa essential commands cho coding agents.
