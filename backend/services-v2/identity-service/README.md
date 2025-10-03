# Identity Service

## 🏥 Overview

**Identity Service** là service quản lý xác thực và phân quyền production-ready với enhanced resilience, monitoring, và anti-pattern mitigation.

### ✨ Key Features

- **🏗️ Clean Architecture + DDD**: Domain-driven design với aggregate roots, value objects, và domain events
- **🔌 Circuit Breaker Pattern**: Tự động fail-fast và graceful degradation
- **📊 Comprehensive Monitoring**: Health checks, metrics, và observability
- **🛡️ Enhanced Security**: HIPAA compliance, audit logging, và Vietnamese healthcare standards
- **🔄 Graceful Degradation**: Fallback mechanisms cho high availability
- **🚀 Production-Ready**: Docker support, environment configuration, và deployment scripts

## 🏗️ Architecture

### Service Structure
```
identity-service/
├── src/
│   ├── domain/                 # Domain layer (Clean Architecture)
│   │   ├── aggregates/         # User aggregate root
│   │   ├── value-objects/      # Email, PersonalInfo, UserId
│   │   ├── entities/           # HealthcareRole, UserSession
│   │   └── events/             # Domain events
│   ├── application/            # Application layer
│   │   └── use-cases/          # AuthenticateUserUseCase
│   ├── infrastructure/         # Infrastructure layer
│   │   ├── repositories/       # SupabaseUserRepository
│   │   ├── resilience/         # Circuit breakers, graceful degradation
│   │   └── monitoring/         # Health checks, metrics
│   └── main.ts                 # Application entry point
├── tests/                      # Comprehensive test suite
├── monitoring/                 # Grafana dashboards
├── scripts/                    # Deployment và validation scripts
└── Dockerfile                  # Production-ready container
```

### Database Integration
- **Schema**: `auth_schema` trên Supabase
- **Tables**: 21 tables với HIPAA compliance
- **Connection**: Circuit breaker protected với connection pooling

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Docker và Docker Compose
- Supabase project với `auth_schema`

### Installation
```bash
# Clone repository
git clone <repository-url>
cd backend/services-v2/identity-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env với Supabase credentials

# Build service
npm run build
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run with Docker
docker-compose -f ../docker-compose.v2.yml --profile consolidated up -d
```

### Production Deployment
```bash
# Deploy với phased approach
chmod +x ../scripts/deploy-consolidated-identity.sh
../scripts/deploy-consolidated-identity.sh deploy

# Validate deployment
chmod +x ../scripts/validate-consolidated-identity.sh
../scripts/validate-consolidated-identity.sh validate
```

## 📊 Monitoring & Observability

### Health Checks
- **Endpoint**: `GET /health`
- **Components**: Database, Authentication, Authorization, Sessions, Audit, Circuit Breakers
- **Status**: HEALTHY, DEGRADED, UNHEALTHY

### Metrics
- **Authentication**: Success rate, response time, failed attempts
- **Performance**: Request rate, error rate, response time distribution
- **Infrastructure**: Database connections, memory usage, circuit breaker status
- **Security**: Audit events, session management, HIPAA compliance

### Grafana Dashboard
Import dashboard từ `monitoring/grafana-dashboard.json` để monitor:
- Service health overview
- Authentication metrics
- Performance indicators
- Error tracking
- Security events

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3001
SERVICE_NAME=identity-service

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_SCHEMA=auth_schema

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30000

# Security
JWT_SECRET=your_secure_jwt_secret
ALLOWED_ORIGINS=http://localhost:3000
```

### Circuit Breaker Configuration
```typescript
{
  failureThreshold: 5,        // Failures before opening
  recoveryTimeout: 30000,     // 30 seconds recovery time
  monitoringWindow: 60000,    // 1 minute monitoring window
  halfOpenMaxCalls: 3         // Max calls in half-open state
}
```

## 🔐 Security Features

### HIPAA Compliance
- **Audit Logging**: Tất cả user actions được log
- **Data Encryption**: PHI data encryption at rest và in transit
- **Access Control**: Role-based permissions với Vietnamese healthcare roles
- **Session Management**: Secure session handling với timeout

### Vietnamese Healthcare Standards
- **BHYT Integration**: Support cho BHYT/BHTN insurance
- **MOH Compliance**: Ministry of Health reporting standards
- **Vietnamese ID**: Citizen ID validation và verification

### Security Headers
- Content Security Policy
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

## 🧪 Testing

### Test Suite
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# Load testing
npm run test:load
```

### Test Categories
- **Unit Tests**: Domain logic, value objects, use cases
- **Integration Tests**: Database connectivity, API endpoints
- **Health Check Tests**: Circuit breakers, graceful degradation
- **Security Tests**: Authentication, authorization, audit logging

## 🔄 Graceful Degradation

### Service Modes
- **FULL_SERVICE**: Normal operation với full database access
- **DEGRADED_SERVICE**: Limited functionality với cached data
- **READ_ONLY**: Emergency read-only access
- **EMERGENCY_ONLY**: Critical healthcare staff access only

### Fallback Mechanisms
- **Cache Fallback**: Cached authentication data
- **Read-Only Mode**: Basic validation without database
- **Emergency Access**: Healthcare staff emergency login

## 📈 Performance

### Benchmarks
- **Response Time**: < 200ms average
- **Throughput**: 1000+ requests/second
- **Availability**: 99.9% uptime target
- **Error Rate**: < 1% under normal load

### Optimization
- Connection pooling
- Circuit breaker protection
- Caching strategies
- Graceful degradation

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker logs hospital-identity-service-v2

# Validate configuration
npm run validate:config

# Check database connectivity
curl http://localhost:3021/health
```

#### Circuit Breakers Open
```bash
# Check circuit breaker status
curl http://localhost:3021/circuit-breakers

# Reset circuit breakers
curl -X POST http://localhost:3021/admin/recovery
```

#### Performance Issues
```bash
# Monitor performance
../scripts/validate-identity.sh performance

# Check resource usage
docker stats hospital-identity-service-v2
```

### Debug Mode
```bash
# Enable debug logging
export DEBUG_MODE=true
export LOG_LEVEL=debug

# Start với debug
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/login
```json
{
  "email": "user@hospital.vn",
  "password": "SecurePassword123!",
  "mfaCode": "123456",
  "platform": "web",
  "browser": "chrome"
}
```

Response:
```json
{
  "success": true,
  "userId": "user-123",
  "sessionToken": "session_token_here",
  "roles": ["doctor"],
  "permissions": ["view_patient_data", "edit_medical_records"],
  "expiresAt": "2024-01-01T12:00:00Z",
  "mode": "FULL_SERVICE"
}
```

#### POST /auth/logout
```bash
curl -X POST http://localhost:3021/auth/logout \
  -H "Authorization: Bearer session_token_here"
```

### Monitoring Endpoints

#### GET /health
Comprehensive health check của tất cả components

#### GET /info
Service information và version

#### GET /circuit-breakers
Circuit breaker status và metrics

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement changes với tests
4. Run validation suite
5. Submit pull request

### Code Standards
- TypeScript strict mode
- Clean Architecture principles
- Comprehensive error handling
- HIPAA compliance requirements
- Vietnamese healthcare standards

## 📄 License

MIT License - Hospital Management Team

## 🆘 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Security**: security@hospital.vn
- **Emergency**: emergency-support@hospital.vn
