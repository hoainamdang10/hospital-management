# Update RegisterUserUseCase to Use Explicit Control

## 🎯 Vấn Đề

`RegisterUserUseCase` hiện đang gọi `authService.signUp()` thay vì `userRepository.createAuthUser()`.

**Current Code (Line 90-101):**
```typescript
// 3. Sign up with Supabase Auth (creates auth.users + trigger creates user_profiles)
const authResult = await this.authService.signUp({
  email: request.email,
  password: request.password,
  fullName: request.fullName,
  roleType: request.roleType,
  phoneNumber: request.phoneNumber,
  citizenId: request.citizenId,
  dateOfBirth: request.dateOfBirth,
  gender: request.gender,
  address: request.address
});
```

**Vấn đề:**
- Comment nói "trigger creates user_profiles" → Dựa vào trigger
- Không có explicit control
- Không có rollback mechanism
- Vi phạm Clean Architecture

---

## ✅ Giải Pháp: Update RegisterUserUseCase

### **Updated Code:**

```typescript
/**
 * Register User Use Case
 * Flow: Explicit user creation via Repository (no trigger dependency)
 */
export class RegisterUserUseCase implements IUseCase<RegisterUserRequest, RegisterUserResponse> {
  private circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case');

  constructor(
    private userRepository: IUserRepository, // Only need repository
    private logger: any
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for RegisterUserUseCase');
        return {
          success: false,
          message: 'Dịch vụ đăng ký tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      this.logger.info('Starting user registration', { 
        email: request.email, 
        roleType: request.roleType 
      });

      // 1. Validate input
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError,
          error: 'VALIDATION_ERROR'
        };
      }

      // 2. Check if user already exists
      const email = Email.create(request.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn('User already exists', { email: request.email });
        return {
          success: false,
          message: 'Email đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          error: 'USER_ALREADY_EXISTS'
        };
      }

      // ✨ 3. Create auth user + profile explicitly (NO TRIGGER)
      const user = await this.userRepository.createAuthUser({
        email: request.email,
        password: request.password,
        fullName: request.fullName,
        roleType: request.roleType,
        phoneNumber: request.phoneNumber,
        citizenId: request.citizenId,
        dateOfBirth: request.dateOfBirth,
        gender: request.gender,
        address: request.address,
        emailConfirm: false // Require email verification
      });

      this.logger.info('User registration completed successfully', {
        userId: user.id.value,
        email: request.email,
        roleType: request.roleType
      });

      // 4. Return success response
      return {
        success: true,
        userId: user.id.value,
        email: user.email.value,
        message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
        requiresEmailVerification: true
      };

    } catch (error) {
      this.logger.error('User registration failed', { 
        email: request.email, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: `Đăng ký thất bại: ${getErrorMessage(error)}`,
        error: 'REGISTRATION_FAILED'
      };
    }
  }

  private validateRequest(request: RegisterUserRequest): string | null {
    if (!request.email || !request.password || !request.fullName || !request.roleType) {
      return 'Thiếu thông tin bắt buộc';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return 'Email không hợp lệ';
    }

    // Password validation
    if (request.password.length < 8) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    // Role validation
    const validRoles = ['patient', 'doctor', 'nurse', 'admin', 'receptionist'];
    if (!validRoles.includes(request.roleType)) {
      return 'Vai trò không hợp lệ';
    }

    return null;
  }
}
```

---

## 📊 So Sánh

| Aspect | Old (authService.signUp) | New (userRepository.createAuthUser) |
|--------|--------------------------|-------------------------------------|
| **Control** | ❌ Dựa vào trigger | ✅ Explicit control |
| **Rollback** | ❌ Không có | ✅ Có rollback mechanism |
| **Audit** | ⚠️ Không rõ | ✅ Rõ ràng |
| **Testing** | ❌ Khó test | ✅ Dễ test |
| **Clean Architecture** | ❌ Vi phạm | ✅ Tuân thủ |
| **Error Handling** | ⚠️ Không đầy đủ | ✅ Đầy đủ |

---

## 🔄 Migration Steps

### **Step 1: Update RegisterUserUseCase**

File: `src/application/use-cases/RegisterUserUseCase.ts`

```bash
# Backup current file
cp src/application/use-cases/RegisterUserUseCase.ts src/application/use-cases/RegisterUserUseCase.ts.backup

# Update file with new code (see above)
```

### **Step 2: Remove AuthService Dependency (Optional)**

Nếu `authService` chỉ được dùng cho registration, có thể remove:

```typescript
// OLD constructor
constructor(
  private authService: IAuthenticationService,
  private userRepository: IUserRepository,
  private logger: any
) {}

// NEW constructor
constructor(
  private userRepository: IUserRepository,
  private logger: any
) {}
```

### **Step 3: Update Dependency Injection**

File: `src/main.ts`

```typescript
// OLD
const registerUserUseCase = new RegisterUserUseCase(
  authService,
  userRepository,
  logger
);

// NEW
const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  logger
);
```

### **Step 4: Run Tests**

```bash
# Run unit tests
npm test -- RegisterUserUseCase

# Run integration tests
npm test -- tests/integration/user-creation

# Run all tests
npm test
```

### **Step 5: Deploy**

```bash
# Build
npm run build

# Deploy
docker-compose -f ../docker-compose.v2.yml --profile core up -d --build identity-service
```

---

## ✅ Benefits

1. **✅ Full Control** - Application có full control over user creation flow
2. **✅ Explicit Rollback** - Nếu profile creation fails, auth user được delete
3. **✅ Clear Audit Trail** - Biết chính xác ai/cái gì tạo user
4. **✅ Testable** - Có thể mock repository và test use case
5. **✅ Clean Architecture** - Logic ở đúng layer
6. **✅ No Trigger Dependency** - Không phụ thuộc vào database trigger

---

## 🧪 Testing

### **Unit Test:**

```typescript
describe('RegisterUserUseCase', () => {
  it('should create user via repository', async () => {
    // Arrange
    const mockRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      createAuthUser: jest.fn().mockResolvedValue(mockUser)
    };

    const useCase = new RegisterUserUseCase(mockRepository, mockLogger);

    // Act
    const result = await useCase.execute(mockRequest);

    // Assert
    expect(mockRepository.createAuthUser).toHaveBeenCalledWith({
      email: mockRequest.email,
      password: mockRequest.password,
      // ... other fields
    });
    expect(result.success).toBe(true);
  });
});
```

---

## 📝 Checklist

- [ ] Backup current RegisterUserUseCase.ts
- [ ] Update RegisterUserUseCase to use userRepository.createAuthUser()
- [ ] Remove authService dependency (if not used elsewhere)
- [ ] Update dependency injection in main.ts
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Build and verify no TypeScript errors
- [ ] Deploy to development environment
- [ ] Test registration flow manually
- [ ] Monitor logs for any issues
- [ ] Deploy to production

---

**Kết luận:** Logic ĐÃ Ở ĐÚNG CHỖ trong Repository, chỉ cần UPDATE Use Case để SỬ DỤNG nó!

