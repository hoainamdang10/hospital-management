# 🚀 Hospital Management System V2 - Quick Start Guide

**Complete step-by-step guide to get V2 up and running in 15 minutes**

---

## 📋 **Prerequisites Check**

Before starting, ensure you have:

```bash
# Check Node.js version (need >= 18.0.0)
node --version

# Check npm version (need >= 9.0.0)
npm --version

# Check Docker is running
docker --version
docker ps

# Check Git
git --version
```

✅ **All good?** Let's proceed!

---

## 🛠️ **STEP 1: Environment Setup**

### **1.1 Clone Repository**
```bash
git clone <repository-url>
cd hospital-management-V2
```

### **1.2 Project Structure Overview**
```
hospital-management-V2/
├── backend/services-v2/     # 🎯 This is where V2 services live
├── frontend/                # Frontend (still needs V2 migration)
├── README.md               # Project overview
├── V2-QUICK-START.md      # 👈 You are here
└── AGENTS.md              # Coding guidelines
```

---

## 🗄️ **STEP 2: Database Setup (Supabase)**

### **2.1 Create Supabase Project**
1. Go to https://supabase.com
2. Create new project
3. Note down:
   - `Project URL` → This is your `SUPABASE_URL`
   - `Project API Key` (service_role) → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT Secret` → This is your `SUPABASE_JWT_SECRET`

### **2.2 Create V2 Database Schemas**

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create V2 schemas (schema-per-service architecture)
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS provider_schema;
CREATE SCHEMA IF NOT EXISTS scheduling_schema;
CREATE SCHEMA IF NOT EXISTS clinical_schema;
CREATE SCHEMA IF NOT EXISTS billing_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT USAGE ON SCHEMA auth_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA patient_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA provider_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA scheduling_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA clinical_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA billing_schema TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA notification_schema TO postgres, anon, authenticated, service_role;
```

✅ **Schemas created successfully!**

---

## ⚙️ **STEP 3: Backend Configuration**

### **3.1 Navigate to V2 Services**
```bash
cd backend/services-v2
```

### **3.2 Create Environment File**

Create `.env` file in `backend/services-v2/`:

```env
# ==============================================
# SUPABASE CONFIGURATION
# ==============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# ==============================================
# SERVICE CONFIGURATION
# ==============================================
NODE_ENV=development
JWT_SECRET=your_jwt_secret_for_services_here

# ==============================================
# INFRASTRUCTURE (Auto-configured by Docker)
# ==============================================
REDIS_URL=redis://redis-v2:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672

# ==============================================
# CORS & SECURITY
# ==============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3101
```

### **3.3 Install Dependencies**
```bash
# Install root dependencies
npm install

# Install dependencies for each service (optional, Docker will do this)
cd identity-service && npm install && cd ..
cd patient-registry-service && npm install && cd ..
cd provider-staff-service && npm install && cd ..
```

---

## 🐳 **STEP 4: Start V2 Services with Docker**

### **4.1 Start Infrastructure Services**
```bash
cd backend/services-v2

# Start Redis + RabbitMQ
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d

# Verify infrastructure
docker-compose ps
```

Expected output:
```
NAME                          STATUS    PORTS
hospital-redis-v2             Up        0.0.0.0:6380->6379/tcp
hospital-rabbitmq-v2          Up        0.0.0.0:5673->5672/tcp, 0.0.0.0:15673->15672/tcp
```

### **4.2 Start Core Services**
```bash
# Start Identity + Patient + Provider services
docker-compose -f docker-compose.v2.yml --profile core up -d

# Check all services
docker-compose ps
```

Expected output:
```
NAME                              STATUS    PORTS
hospital-redis-v2                 Up        0.0.0.0:6380->6379/tcp
hospital-rabbitmq-v2              Up        0.0.0.0:5673->5672/tcp
hospital-identity-service-v2      Up        0.0.0.0:3021->3001/tcp
hospital-patient-registry-v2      Up        0.0.0.0:3023->3003/tcp
hospital-provider-staff-v2        Up        0.0.0.0:3022->3002/tcp
```

### **4.3 View Service Logs**
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f identity-service
docker-compose logs -f patient-registry-service
docker-compose logs -f provider-staff-service
```

---

## ✅ **STEP 5: Verify Services**

### **5.1 Health Check Endpoints**

```bash
# Identity Service
curl http://localhost:3021/health
# Expected: {"status":"ok","service":"identity-service"}

# Patient Registry Service
curl http://localhost:3023/health
# Expected: {"status":"ok","service":"patient-registry-service"}

# Provider/Staff Service
curl http://localhost:3022/health
# Expected: {"status":"ok","service":"provider-staff-service"}
```

### **5.2 Check Redis**
```bash
# Connect to Redis CLI
docker exec -it hospital-redis-v2 redis-cli
# Type: PING
# Expected: PONG
# Type: exit
```

### **5.3 Check RabbitMQ**
Open browser: http://localhost:15673
- Username: `admin`
- Password: `admin`

✅ **All services healthy? Great! V2 Backend is ready!**

---

## 🎨 **STEP 6: Frontend Setup (Optional)**

⚠️ **Note**: Frontend still connects to V1 endpoints. API Gateway V2 needed first.

```bash
# Navigate to frontend
cd ../../frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3100" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env.local

# Start development server
npm run dev
```

Access: http://localhost:3000

---

## 🧪 **STEP 7: Test the System**

### **7.1 Create a Test User (Identity Service)**

```bash
# Register new user
curl -X POST http://localhost:3021/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "full_name": "Test User",
    "role": "patient"
  }'
```

### **7.2 Login**

```bash
# Login
curl -X POST http://localhost:3021/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Save the returned JWT token
```

### **7.3 Create Test Patient**

```bash
# Replace YOUR_JWT_TOKEN with token from login
curl -X POST http://localhost:3023/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "patient@example.com",
    "full_name": "Nguyen Van A",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "phone": "0901234567"
  }'
```

---

## 🛑 **STEP 8: Stop Services**

```bash
# Stop all services
cd backend/services-v2
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## 🔧 **Troubleshooting**

### **Problem: Services won't start**
```bash
# Check Docker logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

### **Problem: Port conflicts**
```bash
# Check if ports are in use
netstat -ano | findstr :3021
netstat -ano | findstr :3023
netstat -ano | findstr :3022

# Kill process if needed or change ports in docker-compose.v2.yml
```

### **Problem: Can't connect to Supabase**
- Verify SUPABASE_URL in .env file
- Check SUPABASE_SERVICE_ROLE_KEY is correct
- Ensure internet connection is stable

### **Problem: Redis/RabbitMQ not accessible**
```bash
# Restart infrastructure services
docker-compose restart redis-v2
docker-compose restart rabbitmq-v2
```

---

## 📚 **Next Steps**

Now that V2 is running, you can:

1. **Read Architecture Docs**
   - `backend/services-v2/README.md` - V2 overview
   - `backend/services-v2/ARCHITECTURE_AUDIT_REPORT.md` - Detailed patterns
   - `backend/services-v2/STRATEGIC_DEVELOPMENT_PLAN.md` - Roadmap

2. **Develop New Features**
   - Follow patterns in completed services (Identity, Patient, Provider)
   - Read `AGENTS.md` for coding guidelines
   - Use Clean Architecture + DDD + CQRS patterns

3. **Complete Remaining Services**
   - Implement API Gateway V2 (Priority 1)
   - Complete Scheduling Service
   - Complete Clinical EMR Service
   - Complete Billing Service
   - Complete Notifications Service

---

## 🎯 **Service URLs Reference**

| Service | External URL | Internal URL | Status |
|---------|-------------|--------------|---------|
| **Identity** | http://localhost:3021 | http://identity-service:3001 | ✅ Ready |
| **Patient Registry** | http://localhost:3023 | http://patient-registry-service:3003 | ✅ Ready |
| **Provider/Staff** | http://localhost:3022 | http://provider-staff-service:3002 | ✅ Ready |
| **Scheduling** | http://localhost:3024 | http://scheduling-service:3004 | 🔄 In Development |
| **Clinical EMR** | http://localhost:3027 | http://clinical-emr-service:3007 | 🔄 In Development |
| **Billing** | http://localhost:3029 | http://billing-service:3009 | 🔄 In Development |
| **Notifications** | http://localhost:3031 | http://notifications-service:3011 | 🔄 In Development |
| **API Gateway V2** | http://localhost:3101 | N/A | ❌ Not Started |
| **Redis** | localhost:6380 | redis://redis-v2:6379 | ✅ Ready |
| **RabbitMQ** | localhost:5673 | amqp://rabbitmq-v2:5672 | ✅ Ready |
| **RabbitMQ UI** | http://localhost:15673 | N/A | ✅ Ready |

---

**🎉 Congratulations! You've successfully set up Hospital Management System V2!**

For questions or issues, check:
- Root `README.md` for project overview
- `AGENTS.md` for development guidelines
- Service-specific READMEs in `backend/services-v2/<service>/`

---

**Last Updated**: October 1, 2025  
**Version**: V2 Alpha
