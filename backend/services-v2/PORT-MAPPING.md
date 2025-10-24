# Port Mapping - Clean Architecture V2

## 🔄 **Updated Port Configuration (No Conflicts)**

### **✅ Business Services - New Mappings**

| Service | Legacy Port | V2 External | V2 Internal | Status |
|---------|-------------|-------------|-------------|---------|
| Identity Service | 3001 | **3021** | 3001 | ✅ Fixed |
| Provider/Staff Service | 3002 | **3022** | 3002 | ✅ Fixed |
| Patient Registry Service | 3003 | **3023** | 3003 | ✅ Fixed |
| Appointments Service | 3004 | **3024** | 3004 | ✅ Fixed |
| Clinical EMR Service | 3007 | **3027** | 3007 | ✅ Fixed |
| Billing Service | 3009 | **3029** | 3009 | ✅ Fixed |
| Notifications Service | 3011 | **3031** | 3011 | ✅ Fixed |

### **✅ Infrastructure Services (Already OK)**

| Service | Legacy Port | V2 External | V2 Internal | Status |
|---------|-------------|-------------|-------------|---------|
| API Gateway | 3100 | **3101** | 3101 | ✅ Already Fixed |
| Redis | 6379 | **6380** | 6379 | ✅ Already Fixed |
| RabbitMQ | 5672 | **5673** | 5672 | ✅ Already Fixed |
| RabbitMQ UI | 15672 | **15673** | 15672 | ✅ Already Fixed |

## 🚀 **Access URLs**

### **Clean Architecture V2 Services**

```bash
# External Access (from host)
http://localhost:3021  # Identity Service
http://localhost:3022  # Provider/Staff Service
http://localhost:3023  # Patient Registry Service
http://localhost:3024  # Appointments Service
http://localhost:3027  # Clinical EMR Service
http://localhost:3029  # Billing Service
http://localhost:3031  # Notifications Service
http://localhost:3101  # API Gateway V2

# Infrastructure
http://localhost:6380  # Redis V2
http://localhost:5673  # RabbitMQ V2
http://localhost:15673 # RabbitMQ Management UI V2
```

### **Internal Communication (Container-to-Container)**

```bash
# Services communicate using container names + internal ports
http://identity-service:3001
http://provider-staff-service:3002
http://patient-registry-service:3003
http://appointments-service:3004
http://clinical-emr-service:3007
http://billing-service:3009
http://notifications-service:3011
```

## 🔧 **Development Commands**

### **Start Clean Architecture V2 Only**

```bash
cd backend/services-v2
docker-compose -f docker-compose.v2.yml --profile dev up -d
```

### **Start Both Systems (Legacy + V2)**

```bash
# Start Legacy System
cd backend
docker compose --profile core up -d

# Start V2 System (no conflicts now)
cd services-v2
docker-compose -f docker-compose.v2.yml --profile dev up -d
```

### **Port Verification**

```bash
# Check all ports
netstat -tulpn | grep :30

# Check specific V2 ports
curl http://localhost:3021/health  # Identity
curl http://localhost:3022/health  # Provider/Staff
curl http://localhost:3023/health  # Patient Registry
curl http://localhost:3024/health  # Appointments
curl http://localhost:3027/health  # Clinical EMR
curl http://localhost:3029/health  # Billing
curl http://localhost:3031/health  # Notifications
curl http://localhost:3101/health  # API Gateway V2
```

## 📋 **Migration Notes**

### **✅ What Changed**
- External port mappings updated to avoid conflicts
- Documentation updated to reflect new ports
- Service generator script updated

### **✅ What Stayed Same**
- Internal container ports (3001, 3002, etc.)
- Service-to-service communication URLs
- Environment variables in Docker Compose
- Dockerfile EXPOSE statements
- Service source code

### **🔄 Rollback Strategy**

```bash
# If issues occur, restore backup
cd backend/services-v2
cp docker-compose.v2.yml.backup docker-compose.v2.yml
docker-compose down
docker-compose --profile dev up -d
```

---

**✅ Result**: Clean Architecture V2 can now run independently or alongside Legacy system without port conflicts.
