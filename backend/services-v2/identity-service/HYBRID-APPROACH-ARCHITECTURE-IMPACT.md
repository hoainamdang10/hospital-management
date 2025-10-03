# 🏗️ HYBRID APPROACH - ARCHITECTURAL IMPACT ANALYSIS

**Ngày phân tích:** 2025-01-XX  
**Context:** Identity Service - Clean Architecture + DDD + CQRS  
**Question:** Hybrid approach có ảnh hưởng gì tới thiết kế và patterns?

---

## 📊 1. KIẾN TRÚC HIỆN TẠI

### **Clean Architecture - 4 Layers**

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                     │
│  Controllers, Routes, DTOs, Middleware                  │
│  (Currently in main.ts - needs refactoring)             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
│  Use Cases: AuthenticateUserUseCase                     │
│  Services: Business orchestration                       │
│  Handlers: Command/Query handlers (CQRS)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                         │
│  Aggregates: User (AggregateRoot)                       │
│  Value Objects: Email, UserId, PersonalInfo             │
│  Entities: HealthcareRole, UserSession                  │
│  Domain Events: UserCreatedEvent, UserAuthenticatedEvent│
│  Business Rules: Vietnamese healthcare compliance       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                    │
│  Repositories: SupabaseUserRepository                   │
│  External Services: Supabase client                     │
│  Resilience: Circuit Breaker, Graceful Degradation      │
│  Monitoring: Health checks, Metrics                     │
└─────────────────────────────────────────────────────────┘
```

### **DDD Patterns Hiện Tại**

```typescript
// Aggregate Root
User extends HealthcareAggregateRoot
  - Encapsulates business logic
  - Publishes domain events
  - Enforces invariants

// Value Objects
Email, UserId, PersonalInfo
  - Immutable
  - Self-validating
  - No identity

// Entities
HealthcareRole, UserSession
  - Has identity
  - Mutable state

// Domain Events
UserCreatedEvent, UserAuthenticatedEvent, UserRoleChangedEvent
  - Captures business events
  - Enables event-driven architecture
```

### **Repository Pattern**

```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  // Domain-focused interface
}

class SupabaseUserRepository implements IUserRepository {
  // Infrastructure implementation
  // Hides Supabase details from domain
}
```

---

## 🎯 2. HYBRID APPROACH - ARCHITECTURAL CHANGES

### **2.1. Domain Layer - MINIMAL IMPACT** ✅

**Changes Required:**

```typescript
// BEFORE (Current - WRONG)
export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  passwordHash: string; // ❌ Remove this
  healthcareRole: HealthcareRole;
  isActive: boolean;
  isEmailVerified: boolean;
  // ...
}

// AFTER (Hybrid Approach - CORRECT)
export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  // ✅ No passwordHash - handled by Supabase Auth
  healthcareRole: HealthcareRole;
  isActive: boolean;
  isEmailVerified: boolean;
  // ✅ Add missing fields from database
  username?: string;
  avatarUrl?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: Date;
  // ...
}

// User Aggregate - Business Logic UNCHANGED
class User extends HealthcareAggregateRoot<UserProps> {
  // ✅ All business logic stays the same
  public changeRole(newRole: HealthcareRole): void {
    this.props.healthcareRole = newRole;
    this.addDomainEvent(new UserRoleChangedEvent(...));
  }
  
  public updatePersonalInfo(info: PersonalInfo): void {
    this.props.personalInfo = info;
    this.props.updatedAt = new Date();
  }
  
  // ✅ Domain events still work
  // ✅ Business invariants still enforced
  // ✅ Healthcare compliance still validated
}
```

**Impact:** ⚠️ **LOW** - Chỉ xóa 1 field, thêm vài fields mới. Business logic KHÔNG đổi.

---

### **2.2. Application Layer - NEW ADAPTER** 🔧

**New Component: SupabaseAuthService (Infrastructure Adapter)**

```typescript
// NEW: Infrastructure adapter for Supabase Auth
// Location: src/infrastructure/auth/SupabaseAuthService.ts

export interface IAuthenticationService {
  // Domain-focused interface (Dependency Inversion)
  signUp(email: string, password: string, metadata: any): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  resetPassword(email: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
}

export class SupabaseAuthService implements IAuthenticationService {
  constructor(private supabaseClient: SupabaseClient) {}
  
  async signUp(email: string, password: string, metadata: any): Promise<AuthResult> {
    // Delegate to Supabase Auth
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    
    if (error) throw new AuthenticationError(error.message);
    
    return {
      userId: data.user!.id,
      email: data.user!.email!,
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token
    };
  }
  
  async signIn(email: string, password: string): Promise<AuthResult> {
    // Delegate to Supabase Auth
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw new AuthenticationError(error.message);
    
    return {
      userId: data.user!.id,
      email: data.user!.email!,
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token
    };
  }
}
```

**Updated Use Case:**

```typescript
// BEFORE (Current - WRONG)
export class AuthenticateUserUseCase {
  constructor(
    private userRepository: SupabaseUserRepository,
    private degradationService: IdentityServiceDegradation
  ) {}
  
  async execute(request: AuthenticateUserRequest) {
    const user = await this.userRepository.findByEmail(request.email);
    // ❌ Verify password manually (WRONG - no password in DB)
    const isValid = user.authenticate(request.password);
  }
}

// AFTER (Hybrid Approach - CORRECT)
export class AuthenticateUserUseCase {
  constructor(
    private authService: IAuthenticationService, // ✅ New dependency
    private userRepository: IUserRepository,
    private degradationService: IdentityServiceDegradation
  ) {}
  
  async execute(request: AuthenticateUserRequest) {
    // ✅ Delegate authentication to Supabase Auth
    const authResult = await this.authService.signIn(
      request.email,
      request.password
    );
    
    // ✅ Get user profile from repository
    const user = await this.userRepository.findById(authResult.userId);
    
    // ✅ Business logic still in domain
    if (!user.isActive) {
      throw new UserInactiveError();
    }
    
    // ✅ Domain events still published
    user.recordLogin(request.ipAddress, request.userAgent);
    await this.userRepository.update(user);
    
    // ✅ Publish domain event
    await this.eventBus.publish(
      new UserAuthenticatedEvent(user.id, request.ipAddress)
    );
    
    return {
      userId: authResult.userId,
      accessToken: authResult.accessToken,
      roles: user.healthcareRole.getRoles()
    };
  }
}
```

**Impact:** ⚠️ **MEDIUM** - Thêm 1 adapter mới, update use cases. Clean Architecture KHÔNG bị phá vỡ.

---

### **2.3. Infrastructure Layer - NEW ADAPTER** 🔧

**New Structure:**

```
src/infrastructure/
├── auth/                           # ✅ NEW
│   ├── SupabaseAuthService.ts      # Adapter for Supabase Auth API
│   └── IAuthenticationService.ts   # Domain interface
├── repositories/
│   └── SupabaseUserRepository.ts   # ✅ UNCHANGED - still manages user_profiles
├── resilience/
│   ├── CircuitBreaker.ts           # ✅ UNCHANGED
│   └── GracefulDegradation.ts      # ✅ UNCHANGED
└── monitoring/
    └── HealthChecks.ts              # ✅ UNCHANGED
```

**Impact:** ⚠️ **LOW** - Chỉ thêm 1 folder mới. Existing infrastructure KHÔNG đổi.

---

### **2.4. Repository Pattern - UNCHANGED** ✅

```typescript
// Repository vẫn quản lý user_profiles
class SupabaseUserRepository implements IUserRepository {
  // ✅ KHÔNG ĐỔI - vẫn query user_profiles
  async findById(id: string): Promise<User | null> {
    const { data } = await this.supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    return User.fromSupabaseData(data);
  }
  
  // ✅ KHÔNG ĐỔI - vẫn create/update user_profiles
  async create(user: User): Promise<void> {
    await this.supabaseClient
      .from('user_profiles')
      .insert({
        id: user.id.value,
        email: user.email.value,
        full_name: user.personalInfo.fullName,
        // ... other fields
      });
  }
}
```

**Impact:** ✅ **ZERO** - Repository pattern hoàn toàn không đổi.

---

### **2.5. Domain Events - UNCHANGED** ✅

```typescript
// Domain events vẫn hoạt động bình thường
class User extends HealthcareAggregateRoot<UserProps> {
  public static create(...): User {
    const user = new User(...);
    
    // ✅ Domain events vẫn được publish
    user.addDomainEvent(new UserCreatedEvent(user.id, user.email));
    
    return user;
  }
  
  public changeRole(newRole: HealthcareRole): void {
    this.props.healthcareRole = newRole;
    
    // ✅ Domain events vẫn được publish
    this.addDomainEvent(new UserRoleChangedEvent(this.id, newRole));
  }
}

// Event handlers vẫn hoạt động
class UserCreatedEventHandler {
  async handle(event: UserCreatedEvent): Promise<void> {
    // ✅ Send welcome email
    // ✅ Create audit log
    // ✅ Notify other services
  }
}
```

**Impact:** ✅ **ZERO** - Domain events hoàn toàn không đổi.

---

### **2.6. CQRS Pattern - ENHANCED** 🚀

**Commands (Write Operations):**

```typescript
// ✅ Commands vẫn hoạt động, chỉ thêm auth service
class RegisterUserCommand {
  constructor(
    public email: string,
    public password: string,
    public fullName: string,
    public healthcareRole: string
  ) {}
}

class RegisterUserCommandHandler {
  constructor(
    private authService: IAuthenticationService, // ✅ NEW
    private userRepository: IUserRepository,
    private eventBus: IEventBus
  ) {}
  
  async handle(command: RegisterUserCommand): Promise<void> {
    // ✅ Step 1: Create auth user (Supabase Auth)
    const authResult = await this.authService.signUp(
      command.email,
      command.password,
      { full_name: command.fullName }
    );
    
    // ✅ Step 2: Create domain user (user_profiles)
    const user = User.create(
      Email.create(command.email),
      PersonalInfo.create(command.fullName),
      HealthcareRole.fromString(command.healthcareRole)
    );
    
    await this.userRepository.create(user);
    
    // ✅ Step 3: Publish domain events
    await this.eventBus.publishAll(user.getUncommittedEvents());
  }
}
```

**Queries (Read Operations):**

```typescript
// ✅ Queries KHÔNG ĐỔI - vẫn query user_profiles
class GetUserByIdQuery {
  constructor(public userId: string) {}
}

class GetUserByIdQueryHandler {
  constructor(private userRepository: IUserRepository) {}
  
  async handle(query: GetUserByIdQuery): Promise<UserDTO> {
    const user = await this.userRepository.findById(query.userId);
    return UserDTO.fromDomain(user);
  }
}
```

**Impact:** ⚠️ **LOW** - Commands thêm auth service, Queries KHÔNG đổi.

---

## 🔍 3. DEPENDENCY INVERSION PRINCIPLE - MAINTAINED ✅

**Clean Architecture Dependency Rule:**

```
┌─────────────────────────────────────────────────────┐
│              APPLICATION LAYER                      │
│                                                     │
│  interface IAuthenticationService {                 │
│    signUp(...): Promise<AuthResult>;                │
│    signIn(...): Promise<AuthResult>;                │
│  }                                                  │
│                                                     │
│  class AuthenticateUserUseCase {                    │
│    constructor(                                     │
│      private authService: IAuthenticationService    │
│    ) {}                                             │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                      ↑
                      │ Depends on abstraction
                      │
┌─────────────────────────────────────────────────────┐
│           INFRASTRUCTURE LAYER                      │
│                                                     │
│  class SupabaseAuthService                          │
│    implements IAuthenticationService {              │
│                                                     │
│    async signUp(...) {                              │
│      // Supabase implementation                     │
│    }                                                │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

**✅ Dependency Inversion vẫn được maintain:**
- Application layer phụ thuộc vào **interface** (IAuthenticationService)
- Infrastructure layer implement **interface**
- Domain layer KHÔNG biết gì về Supabase

---

## 🧪 4. TESTING STRATEGY - IMPROVED ✅

### **Unit Tests - EASIER**

```typescript
// BEFORE: Khó test vì phải mock password hashing
describe('User.authenticate', () => {
  it('should verify password', () => {
    const user = User.create(...);
    // ❌ Phải mock bcrypt, password hashing logic
  });
});

// AFTER: Dễ test vì chỉ test business logic
describe('User', () => {
  it('should change role', () => {
    const user = User.create(...);
    user.changeRole(HealthcareRole.DOCTOR);
    
    // ✅ Test business logic only
    expect(user.healthcareRole.value).toBe('DOCTOR');
    expect(user.getUncommittedEvents()).toHaveLength(1);
  });
});

describe('AuthenticateUserUseCase', () => {
  it('should authenticate user', async () => {
    // ✅ Mock interface, không cần mock Supabase
    const mockAuthService: IAuthenticationService = {
      signIn: jest.fn().mockResolvedValue({
        userId: '123',
        accessToken: 'token'
      })
    };
    
    const useCase = new AuthenticateUserUseCase(mockAuthService, ...);
    const result = await useCase.execute({ email, password });
    
    expect(result.userId).toBe('123');
  });
});
```

**Impact:** ✅ **POSITIVE** - Testing dễ hơn, ít mock hơn.

---

## 📋 5. MIGRATION STRATEGY - STEP BY STEP

### **Phase 1: Add Adapter (No Breaking Changes)**

```typescript
// Step 1: Create interface
export interface IAuthenticationService {
  signUp(...): Promise<AuthResult>;
  signIn(...): Promise<AuthResult>;
}

// Step 2: Implement adapter
export class SupabaseAuthService implements IAuthenticationService {
  // Implementation
}

// Step 3: Register in DI container
container.register('IAuthenticationService', SupabaseAuthService);
```

### **Phase 2: Update Domain (Remove passwordHash)**

```typescript
// Step 1: Update UserProps interface
export interface UserProps {
  // Remove passwordHash
  // Add new fields
}

// Step 2: Update User.fromSupabaseData()
public static fromSupabaseData(data: any): User {
  // Remove passwordHash mapping
  // Add new fields mapping
}
```

### **Phase 3: Update Use Cases**

```typescript
// Step 1: Inject IAuthenticationService
constructor(
  private authService: IAuthenticationService,
  // ... other dependencies
) {}

// Step 2: Use authService instead of manual password verification
const authResult = await this.authService.signIn(email, password);
```

### **Phase 4: Sync Data**

```sql
-- Sync 103 users from auth.users to user_profiles
INSERT INTO auth_schema.user_profiles (id, email, ...)
SELECT id, email, ...
FROM auth.users;
```

---

## ✅ 6. PATTERNS COMPLIANCE CHECKLIST

| Pattern | Before | After | Impact |
|---------|--------|-------|--------|
| **Clean Architecture** | ✅ 4 layers | ✅ 4 layers | ✅ MAINTAINED |
| **DDD Aggregates** | ✅ User | ✅ User | ✅ MAINTAINED |
| **DDD Value Objects** | ✅ Email, UserId | ✅ Email, UserId | ✅ MAINTAINED |
| **DDD Domain Events** | ✅ Events | ✅ Events | ✅ MAINTAINED |
| **Repository Pattern** | ✅ IUserRepository | ✅ IUserRepository | ✅ MAINTAINED |
| **CQRS** | ✅ Commands/Queries | ✅ Commands/Queries | ✅ MAINTAINED |
| **Dependency Inversion** | ✅ Interfaces | ✅ Interfaces | ✅ MAINTAINED |
| **Circuit Breaker** | ✅ Resilience | ✅ Resilience | ✅ MAINTAINED |
| **Event-Driven** | ✅ Domain Events | ✅ Domain Events | ✅ MAINTAINED |

---

## 🎯 7. KẾT LUẬN

### **Impact Summary:**

| Layer | Changes | Impact Level | Breaking Changes |
|-------|---------|--------------|------------------|
| **Domain** | Remove passwordHash, add fields | ⚠️ LOW | ❌ No |
| **Application** | Add IAuthenticationService | ⚠️ MEDIUM | ❌ No |
| **Infrastructure** | Add SupabaseAuthService | ⚠️ LOW | ❌ No |
| **Presentation** | Update DTOs | ⚠️ LOW | ❌ No |

### **Patterns Preserved:**

✅ **Clean Architecture** - Hoàn toàn giữ nguyên  
✅ **DDD** - Aggregates, Value Objects, Events không đổi  
✅ **CQRS** - Commands/Queries vẫn hoạt động  
✅ **Repository Pattern** - Không đổi  
✅ **Dependency Inversion** - Vẫn dùng interfaces  
✅ **Event-Driven** - Domain events vẫn publish  

### **Benefits:**

🚀 **Better Separation of Concerns** - Auth logic tách riêng  
🚀 **Easier Testing** - Mock interfaces thay vì mock Supabase  
🚀 **More Flexible** - Có thể swap auth provider sau  
🚀 **Cleaner Domain** - Domain không biết về password hashing  

### **Khuyến nghị:**

✅ **Hybrid approach KHÔNG phá vỡ architecture patterns**  
✅ **Thậm chí còn cải thiện separation of concerns**  
✅ **Testing trở nên dễ dàng hơn**  
✅ **Domain layer trở nên cleaner**  

---

**Kết luận cuối cùng:** Hybrid approach **KHÔNG ảnh hưởng tiêu cực** đến thiết kế và patterns. Ngược lại, nó còn **cải thiện** architecture bằng cách tách biệt authentication concerns khỏi domain logic.

**Next Steps:** Implement hybrid approach với confidence! 🎯

