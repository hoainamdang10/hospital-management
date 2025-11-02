# Giải Pháp Rate Limiting cho Integration Tests

## ❌ Vấn Đề

### Hiện Trạng
Integration tests đang **fail do Supabase rate limiting** với các lỗi:
```
Failed to sign in after 3 attempts: Request rate limit reached
Expected: 200, Received: 401
```

### Nguyên Nhân
1. **Double Login cho mỗi user:**
   ```typescript
   // Step 1: createTestUser đã gọi signInWithPassword
   const user = await createTestUser(...);
   
   // Step 2: Test lại gọi /auth/login API ❌
   const loginResponse = await request(app)
     .post('/auth/login')
     .send({ email, password });
   ```
   → **2 login calls cho 1 user!**

2. **Tạo user mới trong mỗi test:**
   ```typescript
   it('should lock user account', async () => {
     const newUser = await createTestUser(...); // Mỗi test = thêm login calls
   });
   ```

3. **Tổng số login calls:**
   - `beforeAll`: 3 users × 2 login = **6 calls**
   - Tests tạo user riêng: ~20 tests × 2 = **~40 calls**
   - **TỔNG: ~46 calls** trong vài giây → **Vượt rate limit!**

---

## ✅ Giải Pháp: Test User Pool Pattern

### Concept
1. **Seed users MỘT LẦN** trong `beforeAll`
2. **Reuse users** cho tất cả tests
3. **Token có sẵn** từ `createTestUser`, không cần login lại

### Implementation

#### 1. Tạo Test User Pool Helper
**File:** `tests/helpers/test-user-pool.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestUser, TestUser } from './integrationHelpers';

export interface TestUserPool {
  admin: TestUser;
  doctor: TestUser;
  nurse: TestUser;
  patient: TestUser;
  patient2: TestUser;
}

export async function seedTestUserPool(
  supabaseClient: SupabaseClient
): Promise<TestUserPool> {
  console.log('🌱 Seeding test user pool...');

  const timestamp = Date.now();
  
  // Tạo 5 users SONG SONG (nhanh hơn)
  const [admin, doctor, nurse, patient, patient2] = await Promise.all([
    createTestUser(
      supabaseClient,
      `pool-admin-${timestamp}@hospital.vn`,
      'AdminPool123!',
      'ADMIN',
      { /* ... */ }
    ),
    // ... other users
  ]);

  return { admin, doctor, nurse, patient, patient2 };
}

export async function cleanupTestUserPool(
  supabaseClient: SupabaseClient,
  pool: TestUserPool
): Promise<void> {
  const emails = [
    pool.admin.email,
    pool.doctor.email,
    pool.nurse.email,
    pool.patient.email,
    pool.patient2.email
  ];
  
  await cleanupTestUsers(supabaseClient, emails);
}
```

#### 2. Cập Nhật Test File

**Trước:**
```typescript
describe('User Routes Integration Tests', () => {
  let patientUser: { userId: string; email: string; password: string; accessToken: string };
  let adminUser: { userId: string; email: string; password: string; accessToken: string };

  beforeAll(async () => {
    // Tạo patient user
    const patient = await createTestUser(...);
    
    // ❌ Login lại (double login!)
    const loginResponse = await request(app).post('/auth/login').send(...);
    
    patientUser = {
      userId: patient.userId,
      accessToken: loginResponse.body.accessToken
    };
    
    // Tương tự cho admin...
  });
  
  it('should get user profile', async () => {
    await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${patientUser.accessToken}`);
  });
});
```

**Sau:**
```typescript
import { seedTestUserPool, cleanupTestUserPool, TestUserPool } from '../helpers/test-user-pool';

describe('User Routes Integration Tests', () => {
  let userPool: TestUserPool; // ✅ Sử dụng pool

  beforeAll(async () => {
    supabaseClient = createTestSupabaseClient();
    const result = await createTestApp();
    app = result.app;
    
    // ✅ Seed pool MỘT LẦN duy nhất
    // Token đã có sẵn từ createTestUser!
    userPool = await seedTestUserPool(supabaseClient);
  });
  
  afterAll(async () => {
    if (userPool) {
      await cleanupTestUserPool(supabaseClient, userPool);
    }
  });
  
  it('should get user profile', async () => {
    await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${userPool.patient.token}`); // ✅ Dùng token có sẵn
  });
  
  it('should allow admin to update user', async () => {
    await request(app)
      .patch(`/api/v1/users/${userPool.patient.userId}`)
      .set('Authorization', `Bearer ${userPool.admin.token}`) // ✅ Reuse admin
      .send({ fullName: 'Updated Name' });
  });
});
```

---

## 📊 So Sánh

### Trước (❌ Bị Rate Limit)
| Action | Số lần gọi Login API | Total |
|--------|---------------------|-------|
| beforeAll: 3 users | 3 × 2 = 6 | 6 |
| Test 1: tạo user mới | 1 × 2 = 2 | 8 |
| Test 2: tạo user mới | 1 × 2 = 2 | 10 |
| ... (20 tests) | ... | **~46 calls** |
| **Kết quả** | **VƯỢT RATE LIMIT** | ❌ |

### Sau (✅ Không Rate Limit)
| Action | Số lần gọi Login API | Total |
|--------|---------------------|-------|
| beforeAll: Seed pool (5 users) | 5 × 1 = 5 | 5 |
| Test 1: reuse pool | 0 | 5 |
| Test 2: reuse pool | 0 | 5 |
| ... (20 tests) | 0 | **5 calls** |
| **Kết quả** | **DƯỚI RATE LIMIT** | ✅ |

**Giảm từ ~46 calls → 5 calls** = **Giảm 90%!** 🎉

---

## 🎯 Migration Checklist

### Bước 1: Tạo User Pool Helper ✅
- [x] Tạo `tests/helpers/test-user-pool.ts`
- [x] Implement `seedTestUserPool()`
- [x] Implement `cleanupTestUserPool()`

### Bước 2: Migrate Test Files
- [ ] `user-routes.integration.test.ts`
  - [ ] Import test-user-pool
  - [ ] Thay `patientUser` → `userPool.patient`
  - [ ] Thay `adminUser` → `userPool.admin`
  - [ ] Xóa double login calls
  - [ ] Update afterAll cleanup

- [ ] `auth-routes.integration.test.ts`
  - [ ] Sử dụng pool cho các test cần existing users
  - [ ] Giữ lại tạo user mới cho test register flow

- [ ] `session-management.integration.test.ts`
  - [ ] Sử dụng pool users
  - [ ] Tránh tạo user mới cho mỗi test

- [ ] `account-lockout.integration.test.ts`
  - [ ] Sử dụng pool users
  - [ ] Test lockout logic với existing users

- [ ] `password-recovery.integration.test.ts`
  - [ ] Sử dụng pool users
  - [ ] Test recovery flow với existing users

- [ ] `email-verification.integration.test.ts`
  - [ ] Sử dụng pool cho test verified users
  - [ ] Tạo mới cho test verification flow

### Bước 3: Test & Verify
- [ ] Chạy integration tests: `npm test`
- [ ] Xác nhận không còn rate limit errors
- [ ] Xác nhận tất cả tests pass
- [ ] Kiểm tra test execution time (nên nhanh hơn)

---

## 💡 Best Practices

### ✅ DO
1. **Reuse pool users** cho hầu hết tests
2. **Seed pool trong beforeAll**, cleanup trong afterAll
3. **Dùng token có sẵn** từ pool: `userPool.admin.token`
4. **Tạo users song song** với `Promise.all()` để tăng tốc
5. **Log rõ ràng** khi seed/cleanup pool

### ❌ DON'T
1. **Không tạo user mới** trong mỗi test (trừ khi test flow tạo user)
2. **Không gọi login API** nếu đã có token
3. **Không modify pool users** (ví dụ: lock/delete) - dùng user riêng cho tests đó
4. **Không seed pool trong beforeEach** - chỉ seed MỘT LẦN

### 🔧 Khi Nào Tạo User Mới?
Chỉ tạo user mới khi:
- Test registration flow
- Test user creation logic
- Test cần modify user (lock/delete/disable)
- Test isolation requirements (user data bị modify không ảnh hưởng tests khác)

**Ví dụ:**
```typescript
it('should register new user', async () => {
  // ✅ Tạo mới vì test registration flow
  const email = generateTestEmail('new-register');
  await request(app).post('/auth/register').send({ email, ... });
});

it('should lock user account', async () => {
  // ✅ Tạo user riêng vì test sẽ modify user (lock)
  const userToLock = await createTestUser(...);
  await request(app).post(`/api/v1/users/${userToLock.userId}/lock`);
});

it('should get user profile', async () => {
  // ✅ Dùng pool vì chỉ đọc data, không modify
  await request(app)
    .get('/api/v1/users/me')
    .set('Authorization', `Bearer ${userPool.patient.token}`);
});
```

---

## 📈 Expected Results

### Trước Migration
```
Test Suites: 7 failed, 92 passed, 99 total
Tests:       55 failed, 1350 passed, 1405 total
Time:        55.249 s

Errors:
- Failed to sign in after 3 attempts: Request rate limit reached
- Expected: 200, Received: 401
```

### Sau Migration
```
Test Suites: 99 passed, 99 total
Tests:       1405 passed, 1405 total
Time:        ~30-40 s (nhanh hơn do ít API calls)

✅ No rate limit errors
✅ All integration tests pass
✅ Faster execution time
```

---

## 🚀 Next Steps

1. **Implement user pool helper** ✅ (Done)
2. **Migrate test files** (In Progress)
3. **Run tests & verify** (Pending)
4. **Document pattern** ✅ (This file)
5. **Apply to other services** (Future)

---

## 📚 References

- [Supabase Rate Limiting Docs](https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting)
- [Integration Test Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Data Management Patterns](https://martinfowler.com/articles/nonDeterminism.html#TestDataManagement)

---

**Author**: Hospital Management System V2 Team  
**Date**: 2025-01-26  
**Version**: 1.0.0

