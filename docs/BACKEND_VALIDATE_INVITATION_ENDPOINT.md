# Backend: Validate Staff Invitation Endpoint

## ✅ Đã triển khai thành công!

### 📋 Tổng quan

Đã tạo endpoint mới để validate staff invitation token trước khi hiển thị form activation. Endpoint này tuân thủ đúng Clean Architecture và DDD patterns của hệ thống.

---

## 🏗️ Kiến trúc đã tuân thủ

### 1. **Clean Architecture Layers**

```
Presentation Layer (Routes/Controllers)
    ↓
Application Layer (Use Cases)
    ↓
Domain Layer (Aggregates/Entities/Value Objects)
    ↓
Infrastructure Layer (Repositories/External Services)
```

### 2. **Dependency Injection**

Sử dụng `DependencyContainer` để quản lý lifecycle và dependencies của tất cả các use cases.

---

## 📁 Files đã tạo/cập nhật

### 1. **Use Case** ✅
**File:** `src/application/use-cases/ValidateStaffInvitationUseCase.ts`

**Chức năng:**
- Validate invitation token
- Kiểm tra token có hợp lệ và chưa hết hạn
- Trả về thông tin invitation (email, role, fullName, phoneNumber)
- Không tạo user (chỉ validate)

**Input:**
```typescript
{
  invitationToken: string
}
```

**Output:**
```typescript
{
  success: boolean;
  isValid: boolean;
  invitation?: {
    email: string;
    role: string;
    fullName?: string;
    phoneNumber?: string;
    expiresAt: Date;
  };
  error?: string;
  errorCode?: string;
}
```

**Dependencies:**
- `IUserRepository` - Để gọi `verifyStaffInvitation()`
- `ILogger` - Để log operations

---

### 2. **Route Endpoint** ✅
**File:** `src/presentation/routes/auth.routes.ts`

**Endpoint:**
```
GET /api/v1/auth/validate-invitation?token=xxx
```

**Access:** PUBLIC (không cần authentication)

**Query Parameters:**
- `token` (required) - Invitation token từ email

**Response Examples:**

**Success (Valid Token):**
```json
{
  "success": true,
  "isValid": true,
  "invitation": {
    "email": "doctor@hospital.com",
    "role": "DOCTOR",
    "fullName": "Dr. Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "expiresAt": "2024-11-15T12:00:00Z"
  }
}
```

**Invalid/Expired Token:**
```json
{
  "success": true,
  "isValid": false,
  "error": "Liên kết mời không hợp lệ hoặc đã hết hạn",
  "errorCode": "INVALID_INVITATION"
}
```

**Missing Token:**
```json
{
  "success": false,
  "isValid": false,
  "error": "Token không hợp lệ",
  "errorCode": "MISSING_TOKEN"
}
```

**System Error:**
```json
{
  "success": false,
  "isValid": false,
  "error": "Lỗi hệ thống, vui lòng thử lại sau",
  "errorCode": "SYSTEM_ERROR"
}
```

---

### 3. **Type Definitions** ✅
**File:** `src/presentation/routes/types.ts`

**Đã thêm:**
- Import `ValidateStaffInvitationUseCase`
- Thêm `validateStaffInvitationUseCase` vào `RouteDependencies` interface

---

### 4. **Dependency Container** ✅
**File:** `src/bootstrap/dependency-container.ts`

**Đã thêm:**
- Import `ValidateStaffInvitationUseCase`
- Khai báo property `validateStaffInvitationUseCase`
- Khởi tạo use case trong constructor
- Thêm vào route dependencies

---

## 🔄 Luồng hoạt động

```
1. Frontend gọi: GET /api/v1/auth/validate-invitation?token=xxx

2. auth.routes.ts nhận request
   ↓
3. Extract token từ query params
   ↓
4. Validate token không empty
   ↓
5. Gọi validateStaffInvitationUseCase.execute()
   ↓
6. Use Case gọi userRepository.verifyStaffInvitation()
   ↓
7. Repository query Supabase:
   - SELECT * FROM staff_invitations
   - WHERE invitation_token = xxx
   - AND status = 'PENDING'
   ↓
8. Kiểm tra expires_at < NOW()
   ↓
9. Trả về kết quả cho frontend
```

---

## 🗄️ Database Schema

### Bảng: `auth_schema.staff_invitations`

```sql
CREATE TABLE auth_schema.staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')),
  department_id VARCHAR,
  invited_by UUID NOT NULL,
  invitation_token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  invitation_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `invitation_token` (UNIQUE)
- `status`
- `expires_at`

---

## 🔐 Security Considerations

### 1. **Token Security**
- ✅ Token được generate bằng `crypto.randomBytes(32)` (64 hex characters)
- ✅ Token stored in database với UNIQUE constraint
- ✅ Token có thời hạn (7 ngày)
- ✅ Token chỉ valid khi status = 'PENDING'

### 2. **Rate Limiting**
- ⚠️ **TODO:** Cần thêm rate limiting cho endpoint này
- Đề xuất: Max 10 requests/minute per IP

### 3. **Input Validation**
- ✅ Validate token không empty
- ✅ Validate token format (string)
- ✅ Check token trong database

### 4. **Error Handling**
- ✅ Không expose sensitive information trong error messages
- ✅ Log errors với context đầy đủ
- ✅ Return generic error cho system errors

---

## 🧪 Testing

### Manual Testing

**1. Valid Token:**
```bash
curl -X GET "http://localhost:3000/api/v1/auth/validate-invitation?token=abc123..."
```

**Expected:** 200 OK với `isValid: true`

**2. Invalid Token:**
```bash
curl -X GET "http://localhost:3000/api/v1/auth/validate-invitation?token=invalid"
```

**Expected:** 200 OK với `isValid: false`

**3. Missing Token:**
```bash
curl -X GET "http://localhost:3000/api/v1/auth/validate-invitation"
```

**Expected:** 400 Bad Request

**4. Expired Token:**
- Tạo invitation với `expires_at` trong quá khứ
- Call endpoint
- **Expected:** 200 OK với `isValid: false`

---

## 📊 Monitoring & Logging

### Log Events

**Success:**
```
INFO: Validating staff invitation token { token: "abc123..." }
INFO: Staff invitation token validated successfully { email: "...", role: "..." }
```

**Invalid Token:**
```
WARN: Invalid or expired invitation token { token: "abc123..." }
```

**Error:**
```
ERROR: Validate staff invitation failed { error: "..." }
```

---

## 🔗 Related Endpoints

### 1. **Create Invitation** (Admin only)
```
POST /api/v1/admin/staff/register
```

### 2. **Validate Invitation** (Public) ✅ NEW
```
GET /api/v1/auth/validate-invitation?token=xxx
```

### 3. **Accept Invitation** (Public)
```
POST /api/v1/auth/activate-staff
```

---

## 📝 Frontend Integration

### Example Usage

```typescript
// Frontend: /staff/activate page

useEffect(() => {
  const validateToken = async () => {
    const token = searchParams.get('token');
    
    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/validate-invitation?token=${token}`
      );
      
      const data = await response.json();
      
      if (data.isValid) {
        // Show activation form
        setEmail(data.invitation.email);
        setRole(data.invitation.role);
        setFullName(data.invitation.fullName);
      } else {
        // Show error message
        setError(data.error);
      }
    } catch (error) {
      setError('Không thể xác thực token');
    }
  };
  
  validateToken();
}, [searchParams]);
```

---

## ✅ Checklist

- [x] Use Case created
- [x] Route endpoint added
- [x] Type definitions updated
- [x] Dependency injection configured
- [x] Error handling implemented
- [x] Logging added
- [x] Documentation created
- [ ] Unit tests (TODO)
- [ ] Integration tests (TODO)
- [ ] Rate limiting (TODO)

---

## 🚀 Next Steps

1. **Testing:**
   - Viết unit tests cho `ValidateStaffInvitationUseCase`
   - Viết integration tests cho endpoint
   - Test với expired tokens
   - Test với invalid tokens

2. **Security:**
   - Thêm rate limiting
   - Add CORS configuration
   - Monitor for abuse

3. **Monitoring:**
   - Setup alerts cho failed validations
   - Track validation success rate
   - Monitor response times

4. **Documentation:**
   - Update API documentation
   - Add Swagger/OpenAPI spec
   - Create troubleshooting guide

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Token có đúng format không?
2. Token có trong database không?
3. Token đã expired chưa?
4. Status có phải 'PENDING' không?
5. Check logs trong Identity Service

---

**Created:** 2024-11-08  
**Author:** Hospital Management Team  
**Version:** 1.0.0
