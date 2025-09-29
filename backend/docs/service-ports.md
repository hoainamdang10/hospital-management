# Hospital Management System - Service Port Mapping

## 🚀 Service Ports (Updated 2025-01-03)

| Service                     | Port | Status    | Description                      |
| --------------------------- | ---- | --------- | -------------------------------- |
| **Frontend**                | 3000 | ✅ Active | Next.js React Application        |
| **Auth Service**            | 3001 | ✅ Active | Authentication & Authorization   |
| **Doctor Service**          | 3002 | ✅ Active | Doctor Management & Profiles     |
| **Patient Service**         | 3003 | ✅ Active | Patient Management & Records     |
| **Appointment Service**     | 3004 | ✅ Active | Appointment Scheduling           |
| **Department Service**      | 3005 | ✅ Active | Departments, Rooms & Specialties |
| **Medical Records Service** | 3006 | ✅ Active | Medical Records & History        |
| **Prescription Service**    | 3007 | ✅ Active | Prescriptions & Medications      |
| **Payment Service**         | 3009 | ✅ Active | PayOS Payment Processing         |
| **Notification Service**    | 3011 | ✅ Active | Notifications & Alerts           |
| **API Gateway**             | 3100 | ✅ Active | Main API Gateway & Routing       |
| **GraphQL Gateway**         | 3200 | ✅ Active | GraphQL API Layer                |

## 🔧 Infrastructure Services

| Service                 | Port  | Status    | Description               |
| ----------------------- | ----- | --------- | ------------------------- |
| **Redis**               | 6379  | ✅ Active | Caching & Session Storage |
| **RabbitMQ**            | 5672  | ✅ Active | Message Queue             |
| **RabbitMQ Management** | 15672 | ✅ Active | RabbitMQ Web UI           |

## 🌐 API Routing

### Through API Gateway (Port 3100):

```
Frontend → API Gateway (3100) → Individual Services
Frontend → API Gateway (3100) → GraphQL Gateway (3200)
```

### Direct Service Access (Development Only):

```
http://localhost:3001 - Auth Service
http://localhost:3002 - Doctor Service
http://localhost:3003 - Patient Service
http://localhost:3004 - Appointment Service
http://localhost:3005 - Department Service (includes Rooms)
http://localhost:3006 - Medical Records Service
http://localhost:3007 - Prescription Service
```

## 📊 Recent Changes (2025-01-03)

### ✅ Fixed Port Conflicts:

1. **Prescription Service**: 3009 → 3007
2. **Department Service**: Confirmed at 3005
3. **Room Service**: REMOVED (integrated into Department Service)

### ✅ Service Registry Updates:

- Updated prescription-service URL to port 3007
- Updated department-service URL to port 3005
- Removed room-service registration
- Added proper service health checks

### ✅ GraphQL Configuration:

- Frontend Apollo Client routes through API Gateway (3100)
- GraphQL Gateway runs on port 3200
- WebSocket subscriptions properly configured

## 🔍 Health Check Endpoints

| Service              | Health Check URL             |
| -------------------- | ---------------------------- |
| API Gateway          | http://localhost:3100/health |
| Auth Service         | http://localhost:3001/health |
| Doctor Service       | http://localhost:3002/health |
| Patient Service      | http://localhost:3003/health |
| Appointment Service  | http://localhost:3004/health |
| Department Service   | http://localhost:3005/health |
| Medical Records      | http://localhost:3006/health |
| Prescription Service | http://localhost:3007/health |
| GraphQL Gateway      | http://localhost:3200/health |

## 🚨 Port Conflict Prevention

### Reserved Ports:

- **3000**: Frontend (Next.js)
- **3001-3011**: Backend Services
- **3100**: API Gateway
- **3200**: GraphQL Gateway

### Avoid These Ports:

- 3010: Previously caused conflicts
- 5000: Often used by other applications
- 8000: Common development server port
- 8080: Common proxy/web server port

## 📝 Notes

1. **Room Management**: Handled by Department Service (port 3005)
2. **Service Discovery**: All services registered in API Gateway service registry
3. **Load Balancing**: API Gateway handles routing and load balancing
4. **Health Monitoring**: All services provide `/health` endpoints
5. **CORS**: Configured for frontend (localhost:3000) access

---

**Last Updated**: 2025-01-03  
**Maintained By**: Hospital Management System Team
