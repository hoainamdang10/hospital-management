# Department Service V2

Simple CRUD microservice for hospital departments management.

## 📋 Overview

**Service Type**: Reference Data Service (Master Data)  
**Pattern**: Simple CRUD (following Microsoft's data-driven microservice pattern)  
**Port**: 3025  
**Database Schema**: `departments_schema`  
**Status**: ✅ Production-Ready

## 🏗️ Architecture

### Clean Architecture Layers

```
department-service/
├── src/
│   ├── domain/              # Business entities (no dependencies)
│   │   ├── entities/        # Department entity
│   │   └── repositories/    # Repository interfaces
│   ├── infrastructure/      # External integrations
│   │   ├── persistence/     # Supabase repository
│   │   └── cache/           # Redis cache
│   └── presentation/        # API layer
│       ├── controllers/     # HTTP controllers
│       └── routes/          # Express routes
└── tests/
    ├── unit/                # Unit tests
    └── integration/         # Integration tests
```

### Design Pattern

Following **Microsoft's Simple CRUD Microservice Pattern**:
- ✅ No Use Cases (simple CRUD operations)
- ✅ No CQRS (simple queries)
- ✅ No Domain Events (reference data rarely changes)
- ✅ Entity Framework pattern (Supabase ORM)
- ✅ RESTful API

## 🗄️ Database Schema

**Schema**: `departments_schema`  
**Table**: `departments`

**8 Departments**:
1. CARD - Cardiology (Tim mạch)
2. ORTH - Orthopedics (Chấn thương chỉnh hình)
3. PEDI - Pediatrics (Nhi khoa)
4. INTE - Internal Medicine (Nội tổng quát)
5. EMER - Emergency (Cấp cứu)
6. RADI - Radiology (Chẩn đoán hình ảnh)
7. LABO - Laboratory (Xét nghiệm)
8. ADMI - Administration (Hành chính)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
```

### Development

```bash
# Start in development mode
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📡 API Endpoints

### Public Endpoints (Read-Only)

```
GET    /health                      # Health check
GET    /api/departments             # List all departments
GET    /api/departments/:id         # Get department by ID
GET    /api/departments/code/:code  # Get department by code
GET    /api/departments/stats       # Get statistics
```

### Examples

```bash
# List all active departments
curl http://localhost:3025/api/departments

# Get department by code
curl http://localhost:3025/api/departments/code/CARD

# Get statistics
curl http://localhost:3025/api/departments/stats
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "CARD",
      "nameEn": "Cardiology",
      "nameVi": "Tim mạch",
      "description": "Chuyên khoa tim mạch",
      "isActive": true,
      "createdAt": "2025-01-07T10:00:00.000Z",
      "updatedAt": "2025-01-07T10:00:00.000Z"
    }
  ],
  "total": 8,
  "source": "cache"
}
```

## 🔧 Configuration

### Environment Variables

```env
# Service Configuration
NODE_ENV=development
PORT=3025
SERVICE_NAME=department-service

# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_JWT_SECRET=your_secret_here

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📊 Caching Strategy

**Redis Cache** - 24 hour TTL (departments rarely change):
- ✅ Cache all departments list
- ✅ Cache individual departments by ID
- ✅ Auto-invalidation on updates
- ✅ Fallback to database if cache miss

## 🔒 Security

- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **Rate Limiting** - 100 requests per 15 minutes
- ✅ **Row Level Security (RLS)** - Enabled on Supabase
- ✅ **Input Validation** - Department code format validation

## 🐳 Docker

```bash
# Build image
docker build -t department-service:2.0.0 .

# Run container
docker run -p 3025:3025 \
  -e SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE_KEY=xxx \
  department-service:2.0.0
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3025/health
```

Response:
```json
{
  "status": "healthy",
  "service": "department-service",
  "version": "2.0.0",
  "timestamp": "2025-01-07T10:00:00.000Z",
  "environment": "development"
}
```

## 🧪 Testing

### Unit Tests
- Department entity validation
- Repository interface contracts

### Integration Tests
- Supabase repository operations
- Redis cache operations
- API endpoint responses

## 📚 References

- **Microsoft Pattern**: [Creating a simple data-driven CRUD microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/data-driven-crud-microservice)
- **Clean Architecture**: [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- **Supabase Docs**: https://supabase.com/docs

## 📝 License

MIT

## 👥 Authors

Hospital Management Team

