# 🗄️ Database Setup Guide - Patient Registry Service

Hướng dẫn chi tiết để kết nối và setup database Supabase cho Patient Registry Service.

## 📋 Mục Lục

1. [Kiểm Tra Cấu Hình](#1-kiểm-tra-cấu-hình)
2. [Tạo Database Schema](#2-tạo-database-schema)
3. [Test Kết Nối](#3-test-kết-nối)
4. [Seed Sample Data (Optional)](#4-seed-sample-data-optional)
5. [Start Service](#5-start-service)
6. [Verify Service](#6-verify-service)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Kiểm Tra Cấu Hình

### ✅ File `.env` đã có sẵn

File `.env` nằm ở: `backend/services-v2/.env`

```bash
# Kiểm tra file .env
cat backend/services-v2/.env
```

**Nội dung cần có:**

```env
# Supabase Configuration
SUPABASE_URL=https://ciasxktujslgsdgylimv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Other configs...
NODE_ENV=development
RABBITMQ_URL=amqp://admin:admin@rabbitmq-v2:5672
REDIS_URL=redis://redis-v2:6379
```

### 🔑 Lấy Supabase Credentials (nếu chưa có)

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Tạo Database Schema

### Bước 2.1: Mở Supabase SQL Editor

1. Truy cập: https://supabase.com/dashboard
2. Chọn project: **ciasxktujslgsdgylimv**
3. Click **SQL Editor** (icon database ở sidebar)

### Bước 2.2: Copy Schema SQL

```bash
# Mở file schema.sql
cat backend/services-v2/patient-registry-service/database/schema.sql
```

Hoặc xem trực tiếp trong VS Code:
```
backend/services-v2/patient-registry-service/database/schema.sql
```

### Bước 2.3: Run Schema SQL

1. Trong Supabase SQL Editor, click **New query**
2. Paste toàn bộ nội dung từ `schema.sql`
3. Click **Run** (hoặc Ctrl+Enter)

**Schema sẽ tạo:**
- ✅ `patient_schema` schema
- ✅ `patients` table
- ✅ `insurance_info` table
- ✅ `emergency_contacts` table
- ✅ `patient_consents` table
- ✅ `patient_links` table
- ✅ Indexes và constraints

### Bước 2.4: Verify Schema

Chạy query này trong SQL Editor để verify:

```sql
-- Check if schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'patient_schema';

-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'patient_schema';
```

**Kết quả mong đợi:**
```
schema_name: patient_schema

table_name:
- patients
- insurance_info
- emergency_contacts
- patient_consents
- patient_links
```

---

## 3. Test Kết Nối

### Chạy Test Script

```bash
cd backend/services-v2/patient-registry-service

# Install dependencies (nếu chưa có)
npm install

# Run connection test
npm run test:connection
```

### Kết Quả Mong Đợi

```
🔍 Testing Patient Registry Service Database Connection

============================================================

1️⃣  Testing Environment Variables...
   ✅ Environment Variables: All required environment variables are set

2️⃣  Testing Supabase Connection...
   ✅ Supabase Connection: Successfully connected to Supabase

3️⃣  Verifying patient_schema...
   ✅ Schema Verification: patient_schema exists and is accessible

4️⃣  Verifying Required Tables...
   ✅ Tables Verification: All required tables exist

5️⃣  Checking Database Data...
   ✅ Database Data: Database is empty (run seed script to add sample data)

============================================================

📊 Test Summary

✅ Passed: 5/5
❌ Failed: 0/5

🎉 All tests passed! Database is ready to use.
```

### Nếu Test Fail

Xem phần [Troubleshooting](#7-troubleshooting) bên dưới.

---

## 4. Seed Sample Data (Optional)

### Tại Sao Cần Seed Data?

- 🧪 **Testing**: Test API với dữ liệu thực tế
- 🎨 **Development**: Phát triển UI với dữ liệu mẫu
- 📊 **Demo**: Show features cho stakeholders

### Chạy Seed Script

```bash
cd backend/services-v2/patient-registry-service

# Seed database với 5 patients mẫu
npm run db:seed
```

### Sample Data Bao Gồm

- **5 Patients**:
  - PAT-202501-001: Nguyễn Văn Minh (BHYT)
  - PAT-202501-002: Trần Thị Lan (BHTN)
  - PAT-202501-003: Lê Hoàng Nam (Private Insurance)
  - PAT-202501-004: Phạm Thị Hương (No Insurance)
  - PAT-202501-005: Võ Minh Tuấn (Inactive)

- **Insurance Records**: BHYT, BHTN, Private
- **Emergency Contacts**: 6 contacts
- **Patient Consents**: Treatment, Data Sharing, Research

### Verify Seed Data

```bash
# Run test again to see patient count
npm run test:connection
```

Hoặc query trong Supabase SQL Editor:

```sql
-- Count patients
SELECT COUNT(*) as total_patients 
FROM patient_schema.patients;

-- List patients
SELECT 
  patient_id,
  personal_info->>'fullName' as full_name,
  status,
  created_at
FROM patient_schema.patients
ORDER BY patient_id;
```

### Clean Seed Data (nếu cần)

```bash
# Remove all seed data
npm run db:seed:clean

# Clean and reseed
npm run db:seed:reset
```

---

## 5. Start Service

### Bước 5.1: Start Infrastructure (nếu chưa chạy)

```bash
cd backend/services-v2

# Start Redis và RabbitMQ
docker-compose -f docker-compose.v2.yml --profile infrastructure up -d
```

### Bước 5.2: Start Patient Registry Service

**Option A: Development Mode (Recommended)**

```bash
cd backend/services-v2/patient-registry-service

# Start with hot reload
npm run dev
```

**Option B: Docker Mode**

```bash
cd backend/services-v2

# Start patient registry service
docker-compose -f docker-compose.v2.yml up patient-registry-service -d

# View logs
docker-compose logs -f patient-registry-service
```

### Bước 5.3: Check Logs

```
[INFO] 2025-01-04T10:00:00.000Z - Starting patient-registry-service v2.0.0...
[INFO] 2025-01-04T10:00:00.100Z - Initializing dependencies...
[INFO] 2025-01-04T10:00:00.200Z - Configuration validated successfully
[INFO] 2025-01-04T10:00:00.300Z - Dependencies initialized successfully
[INFO] 2025-01-04T10:00:00.400Z - Setting up middleware...
[INFO] 2025-01-04T10:00:00.500Z - Middleware setup complete
[INFO] 2025-01-04T10:00:00.600Z - Setting up routes...
[INFO] 2025-01-04T10:00:00.700Z - Routes setup complete
[INFO] 2025-01-04T10:00:00.800Z - patient-registry-service is running
  port: 3023
  environment: development
  version: 2.0.0
```

---

## 6. Verify Service

### Test 1: Health Check

```bash
curl http://localhost:3023/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "service": "patient-registry-service",
  "version": "2.0.0",
  "timestamp": "2025-01-04T10:00:00.000Z"
}
```

### Test 2: Get Patient Profile (nếu đã seed data)

```bash
curl http://localhost:3023/api/v1/patients/PAT-202501-001
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "patientId": "PAT-202501-001",
    "personalInfo": {
      "fullName": "Nguyễn Văn Minh",
      "dateOfBirth": "1980-05-15",
      "gender": "male",
      "nationalId": "001080012345"
    },
    "contactInfo": {
      "primaryPhone": "0901234567",
      "email": "nguyenvanminh@email.com"
    },
    "status": "active"
  }
}
```

### Test 3: Search Patients

```bash
curl "http://localhost:3023/api/v1/patients/search?term=Nguyễn"
```

---

## 7. Troubleshooting

### ❌ Error: "relation does not exist"

**Nguyên nhân**: Schema chưa được tạo

**Giải pháp**:
1. Chạy lại `schema.sql` trong Supabase SQL Editor
2. Verify schema exists:
   ```sql
   SELECT schema_name FROM information_schema.schemata 
   WHERE schema_name = 'patient_schema';
   ```

### ❌ Error: "Missing required environment variables"

**Nguyên nhân**: File `.env` không có hoặc thiếu variables

**Giải pháp**:
1. Check file exists: `ls backend/services-v2/.env`
2. Verify content có `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`
3. Restart service sau khi update .env

### ❌ Error: "Failed to connect to Supabase"

**Nguyên nhân**: 
- Sai credentials
- Network issues
- Supabase project bị pause

**Giải pháp**:
1. Verify credentials trong Supabase Dashboard
2. Check project status (active/paused)
3. Test connection: `npm run test:connection`

### ❌ Error: "duplicate key value"

**Nguyên nhân**: Seed data đã tồn tại

**Giải pháp**:
```bash
# Clean and reseed
npm run db:seed:reset
```

### ❌ Error: "permission denied"

**Nguyên nhân**: Service role key không có quyền

**Giải pháp**:
1. Verify đang dùng **service_role key** (không phải anon key)
2. Check RLS policies trong Supabase Dashboard

### ❌ Service không start

**Giải pháp**:
```bash
# Check logs
docker-compose logs patient-registry-service

# Restart service
docker-compose restart patient-registry-service

# Clean restart
docker-compose down
docker-compose --profile core up -d
```

---

## 📚 Tài Liệu Tham Khảo

- **Database Schema**: `database/schema.sql`
- **Seed Data**: `database/seed.sql`
- **Database README**: `database/README.md`
- **Service README**: `README.md`
- **Architecture**: `ARCHITECTURE_AUDIT_REPORT.md`

---

## 🎯 Next Steps

Sau khi setup xong database:

1. ✅ **Test API Endpoints**: Xem `openapi.yaml` để biết các endpoints
2. ✅ **Run Integration Tests**: `npm run test:integration`
3. ✅ **Connect Frontend**: Update frontend để connect với service
4. ✅ **Setup Other Services**: Identity Service, Provider Service, etc.

---

## 💡 Tips

- **Development**: Dùng `npm run dev` để có hot reload
- **Testing**: Dùng seed data để test nhanh
- **Production**: Nhớ update JWT_SECRET và các sensitive configs
- **Monitoring**: Check logs thường xuyên để catch errors sớm

---

**Last Updated**: 2025-01-04  
**Maintained By**: Hospital Management Team

