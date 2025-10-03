# 🚀 IDENTITY SERVICE CONSOLIDATION PLAN

**Generated**: 2025-09-29  
**Project**: Hospital Management System V2  
**Scope**: Merge identity-service và identity-access-service thành 1 service production-ready

---

## 📊 **EXECUTIVE SUMMARY**

### **🎯 Objective**
Consolidate 2 duplicate Identity Service implementations thành 1 service production-ready với:
- ✅ Zero-downtime deployment
- ✅ Best practices từ cả 2 implementations  
- ✅ Clean Architecture + Production infrastructure
- ✅ Vietnamese healthcare compliance

### **📈 Expected Benefits**
- **Resource Optimization**: Giảm 50% memory usage và container count
- **Maintenance Simplification**: 1 codebase thay vì 2
- **Performance Improvement**: Unified database schema và connection pooling
- **Development Velocity**: Faster feature development và testing

---

## 🏗️ **TECHNICAL SPECIFICATION**

### **🎯 Target Architecture**

#### **Consolidated Service Structure**
```
backend/services-v2/identity-service-unified/
├── src/
│   ├── domain/                    # From identity-service (Clean Architecture)
│   │   ├── aggregates/User.ts     # Complete domain model
│   │   ├── value-objects/         # Vietnamese compliance objects
│   │   ├── entities/              # Healthcare roles, sessions
│   │   └── events/                # Domain events
│   ├── application/               # From identity-service (CQRS)
│   │   ├── use-cases/             # Complete CRUD operations
│   │   └── handlers/              # Command/Query handlers
│   ├── infrastructure/            # From identity-access-service (Production)
│   │   ├── repositories/          # Supabase integration
│   │   ├── middleware/            # Security middleware
│   │   └── di/                    # Dependency injection
│   └── presentation/              # From identity-access-service (REST API)
│       ├── controllers/           # Production controllers
│       └── routes/                # Express routes
├── database/                      # Unified auth_schema
├── tests/                         # Comprehensive test suite
├── Dockerfile                     # Production container
└── package.json                   # Merged dependencies
```

#### **Database Schema Unification**
```sql
-- Target: auth_schema (from identity-access-service)
-- Add missing tables from identity-service

CREATE SCHEMA IF NOT EXISTS auth_schema;

-- Existing tables (keep from identity-access-service):
-- user_profiles, healthcare_roles, role_permissions
-- user_role_assignments, failed_login_attempts, audit_logs

-- Additional tables needed:
CREATE TABLE auth_schema.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_token VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE auth_schema.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **API Endpoint Consolidation**
```typescript
// Unified API endpoints
POST   /api/v1/auth/login           # From both implementations
POST   /api/v1/auth/register        # From both implementations
POST   /api/v1/auth/logout          # From both implementations
POST   /api/v1/auth/refresh         # From identity-access-service
POST   /api/v1/auth/forgot-password # From identity-access-service
POST   /api/v1/auth/reset-password  # From identity-access-service
GET    /api/v1/users/profile        # From identity-service
PUT    /api/v1/users/profile        # From identity-service
GET    /api/v1/users/:id            # From identity-service
POST   /api/v1/users                # From identity-service
DELETE /api/v1/users/:id            # From identity-service
GET    /api/v1/roles                # From identity-access-service
POST   /api/v1/roles                # From identity-access-service
```

---

## 🔄 **MIGRATION STRATEGY**

### **🎯 Zero-Downtime Deployment Pattern**

#### **Blue-Green Deployment Strategy**
```typescript
interface MigrationPlan {
  phase1: "Deploy consolidated service on port 3001-staging";
  phase2: "Run parallel testing with existing services";
  phase3: "Switch traffic to consolidated service";
  phase4: "Remove old service containers";
  phase5: "Update service registry and documentation";
}
```

#### **Migration Steps**
1. **Prepare Staging Environment**
   - Deploy consolidated service on different port
   - Run comprehensive testing
   - Validate all functionality

2. **Traffic Switch**
   - Update load balancer configuration
   - Monitor metrics và error rates
   - Rollback capability ready

3. **Cleanup**
   - Remove old service containers
   - Update docker-compose.v2.yml
   - Update service references

---

## 📋 **IMPLEMENTATION PHASES**

### **Phase 1: Pre-Migration Analysis & Setup (1 tuần)**
- Analyze code structure differences
- Database schema analysis
- Create migration environment
- Backup current services
- Setup migration tools

### **Phase 2: Domain Layer Migration (1 tuần)**
- Migrate domain aggregates
- Migrate value objects
- Migrate domain events
- Migrate healthcare entities
- Update domain imports

### **Phase 3: Application Layer Integration (1 tuần)**
- Migrate use cases
- Integrate CQRS handlers
- Update application services
- Configure dependency injection
- Test application layer

### **Phase 4: Infrastructure Consolidation (1 tuần)**
- Merge repository implementations
- Unify database schema
- Configure production middleware
- Update environment configuration
- Setup health checks

### **Phase 5: Testing & Validation (1 tuần)**
- Unit testing
- Integration testing
- End-to-end testing
- Performance testing
- Security testing

### **Phase 6: Zero-Downtime Deployment (1 tuần)**
- Prepare blue-green environment
- Deploy to staging
- Run production validation
- Switch traffic to new service
- Monitor production deployment

### **Phase 7: Post-Migration Cleanup (1 tuần)**
- Remove old service containers
- Update Docker compose
- Update service registry
- Update documentation
- Setup monitoring & alerting

---

## 📊 **SUCCESS METRICS**

### **🎯 Technical Metrics**
- **Response Time**: < 200ms (maintained)
- **Memory Usage**: 50% reduction
- **Container Count**: 2 → 1 (50% reduction)
- **Test Coverage**: > 90%
- **Zero Downtime**: 100% uptime during migration

### **🎯 Business Metrics**
- **Development Velocity**: 40% faster feature development
- **Maintenance Cost**: 60% reduction
- **Bug Rate**: 30% reduction
- **Documentation Quality**: Complete API documentation

---

## ⚠️ **RISK MITIGATION**

### **🚨 High-Risk Areas**
1. **Data Loss**: Complete backup strategy
2. **Service Downtime**: Blue-green deployment
3. **Authentication Failure**: Rollback plan ready
4. **Performance Degradation**: Load testing before deployment

### **🛡️ Mitigation Strategies**
- **Comprehensive Testing**: Unit + Integration + E2E
- **Gradual Rollout**: Canary deployment option
- **Monitoring**: Real-time metrics và alerting
- **Rollback Plan**: Automated rollback capability

---

## 📅 **TIMELINE: 7 tuần**

| Week | Phase | Deliverable | Risk Level |
|------|-------|-------------|------------|
| **Week 1** | Pre-Migration Analysis | Migration environment ready | 🟢 Low |
| **Week 2** | Domain Layer Migration | Clean Architecture foundation | 🟡 Medium |
| **Week 3** | Application Layer Integration | CQRS implementation complete | 🟡 Medium |
| **Week 4** | Infrastructure Consolidation | Production-ready service | 🔴 High |
| **Week 5** | Testing & Validation | Comprehensive test suite | 🟡 Medium |
| **Week 6** | Zero-Downtime Deployment | Production deployment | 🔴 High |
| **Week 7** | Post-Migration Cleanup | Project completion | 🟢 Low |

---

## 🎉 **EXPECTED OUTCOMES**

### **✅ Technical Outcomes**
- 1 consolidated Identity Service production-ready
- Clean Architecture với Supabase integration
- Comprehensive test coverage
- Production monitoring và alerting

### **✅ Business Outcomes**
- Simplified maintenance và development
- Reduced infrastructure costs
- Faster feature delivery
- Better code quality và documentation

**Next Step**: Bắt đầu Phase 1 - Pre-Migration Analysis & Setup
