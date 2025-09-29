# 🔐 Authentication Flow Diagram

## Mô tả
Sequence diagram mô tả luồng xác thực người dùng từ đăng ký, đăng nhập đến truy cập các tính năng được bảo vệ.

## Diagram

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend (Next.js)
    participant GW as API Gateway
    participant AUTH as Auth Service
    participant DB as Supabase Database
    participant OTHER as Other Services

    Note over U,OTHER: User Registration Flow
    U->>FE: Access registration page
    FE->>U: Show role selection (Doctor/Patient/Admin)
    U->>FE: Fill registration form + select role
    FE->>GW: POST /api/auth/register/{role}
    GW->>AUTH: Forward registration request
    
    AUTH->>DB: Create profile in profiles table
    DB-->>AUTH: Return profile_id
    
    alt Role is Doctor
        AUTH->>OTHER: Call Doctor Service to create doctor record
        OTHER->>DB: Insert into doctors table
    else Role is Patient
        AUTH->>OTHER: Call Patient Service to create patient record
        OTHER->>DB: Insert into patients table
    else Role is Admin
        AUTH->>DB: Insert into admins table
    end
    
    AUTH-->>GW: Return success + user data
    GW-->>FE: Return registration success
    FE-->>U: Show success message + redirect to login

    Note over U,OTHER: User Login Flow
    U->>FE: Enter credentials
    FE->>GW: POST /api/auth/login
    GW->>AUTH: Forward login request
    AUTH->>DB: Verify credentials
    DB-->>AUTH: Return user profile + role
    
    AUTH->>AUTH: Generate JWT token
    AUTH->>DB: Update last_login, login_count
    AUTH-->>GW: Return token + user data
    GW-->>FE: Return authentication response
    FE->>FE: Store token in secure storage
    FE-->>U: Redirect to role-specific dashboard

    Note over U,OTHER: Protected API Request Flow
    U->>FE: Access protected feature
    FE->>GW: API request with JWT token
    GW->>GW: Extract and validate token
    
    alt Token is valid
        GW->>OTHER: Forward request to appropriate service
        OTHER->>DB: Execute business logic
        DB-->>OTHER: Return data
        OTHER-->>GW: Return response
        GW-->>FE: Return data
        FE-->>U: Display content
    else Token is invalid/expired
        GW-->>FE: Return 401 Unauthorized
        FE->>FE: Clear stored token
        FE-->>U: Redirect to login page
    end

    Note over U,OTHER: Logout Flow
    U->>FE: Click logout
    FE->>GW: POST /api/auth/logout
    GW->>AUTH: Forward logout request
    AUTH->>DB: Update session status
    AUTH-->>GW: Return logout success
    GW-->>FE: Return success
    FE->>FE: Clear all stored tokens
    FE-->>U: Redirect to login page
```

## Luồng hoạt động chính

### **1. User Registration Flow**
1. Người dùng truy cập trang đăng ký
2. Chọn vai trò (Doctor/Patient/Admin)
3. Điền form đăng ký
4. Hệ thống tạo profile trong bảng profiles
5. Tạo record tương ứng trong bảng role-specific
6. Trả về thông báo thành công

### **2. User Login Flow**
1. Người dùng nhập thông tin đăng nhập
2. Hệ thống xác thực credentials
3. Tạo JWT token
4. Cập nhật thông tin đăng nhập
5. Chuyển hướng đến dashboard theo role

### **3. Protected API Request Flow**
1. Người dùng truy cập tính năng được bảo vệ
2. Frontend gửi request kèm JWT token
3. API Gateway validate token
4. Nếu hợp lệ: chuyển tiếp đến service
5. Nếu không hợp lệ: trả về 401 và redirect login

### **4. Logout Flow**
1. Người dùng click logout
2. Hệ thống cập nhật session status
3. Clear tất cả stored tokens
4. Chuyển hướng về trang login

## Security Features

### **JWT Token Management**
- Secure token generation
- Token expiration handling
- Automatic token refresh

### **Role-based Access Control**
- Different dashboards per role
- Role-specific API endpoints
- Permission validation

### **Session Management**
- Login count tracking
- Last login timestamp
- Session invalidation on logout

### **Security Measures**
- Secure token storage
- HTTPS enforcement
- Input validation
- SQL injection prevention
