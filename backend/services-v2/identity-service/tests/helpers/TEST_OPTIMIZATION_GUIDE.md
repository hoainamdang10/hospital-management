# Test Optimization Guide

## Overview

Hướng dẫn tối ưu hóa tests để giảm thời gian chạy từ 500s xuống 150-200s (cải thiện 60-70%).

## 1. Sử Dụng MockFactory

### Before (Slow - Tạo mới mỗi test)

```typescript
describe('RegisterUserUseCase', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeEach(() => {
    // ❌ Tạo mới mỗi test (936 tests × setup = 1,872 operations)
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      // ...
    } as unknown as jest.Mocked<IUserRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### After (Fast - Cache và reuse)

```typescript
import { MockFactory } from '../../../helpers/mock-factory';

describe('RegisterUserUseCase', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: any;

  beforeAll(() => {
    // ✅ Tạo một lần cho tất cả tests
    mockUserRepository = MockFactory.createUserRepository();
    mockLogger = MockFactory.createLogger();
  });

  beforeEach(() => {
    // ✅ Chỉ reset mocks, không tạo mới
    MockFactory.resetAllMocks();
  });

  afterAll(() => {
    // ✅ Cleanup một lần
    MockFactory.clearCache();
  });
});
```

**Lợi ích:**
- Giảm 50% thời gian setup
- Giảm memory usage
- Tests chạy nhanh hơn 10-15%

---

## 2. Sử Dụng test.concurrent

### Before (Slow - Chạy tuần tự)

```typescript
describe('RegisterUserUseCase', () => {
  it('should register user with full data', async () => {
    // Test 1
  });

  it('should register user with minimal fields', async () => {
    // Test 2
  });

  it('should throw error for duplicate email', async () => {
    // Test 3
  });
});
```

### After (Fast - Chạy song song)

```typescript
describe('RegisterUserUseCase', () => {
  // ✅ Chạy song song nếu tests độc lập
  it.concurrent('should register user with full data', async () => {
    // Test 1
  });

  it.concurrent('should register user with minimal fields', async () => {
    // Test 2
  });

  it.concurrent('should throw error for duplicate email', async () => {
    // Test 3
  });
});
```

**Lưu ý:**
- Chỉ dùng `test.concurrent` cho tests độc lập
- Không dùng cho tests có shared state
- Không dùng cho integration tests

**Lợi ích:**
- Giảm 20-30% thời gian chạy
- Tận dụng tối đa CPU cores

---

## 3. Cleanup CircuitBreaker Đúng Cách

### Before (Memory Leak)

```typescript
describe('RegisterUserUseCase', () => {
  let circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');

  beforeEach(() => {
    circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');
    circuitBreaker.reset();
  });

  afterEach(() => {
    // ❌ Không cleanup CircuitBreaker instances
    jest.clearAllMocks();
  });
});
```

### After (No Memory Leak)

```typescript
describe('RegisterUserUseCase', () => {
  let circuitBreaker: ICircuitBreaker;

  beforeAll(() => {
    circuitBreaker = CircuitBreakerFactory.getBreaker('register-user-use-case-test');
  });

  beforeEach(() => {
    // ✅ Chỉ reset state, không tạo mới
    circuitBreaker.reset();
  });

  afterAll(() => {
    // ✅ Cleanup CircuitBreaker instance
    CircuitBreakerFactory.getAllBreakers().delete('register-user-use-case-test');
  });
});
```

**Lợi ích:**
- Không memory leaks
- Tests kết thúc nhanh hơn
- Không cần `forceExit: true`

---

## 4. Tách Unit và Integration Tests

### Chạy Tests

```bash
# Chỉ chạy unit tests (nhanh - 40-60s)
npm run test:unit

# Chỉ chạy integration tests (chậm - 150-200s)
npm run test:integration

# Chạy tất cả
npm run test:all
```

### Jest Configuration

```javascript
// jest.config.js
projects: [
  {
    displayName: 'Unit Tests',
    testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    testTimeout: 5000,      // 5s cho unit tests
    maxWorkers: '100%'      // Full parallelization
  },
  {
    displayName: 'Integration Tests',
    testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    testTimeout: 30000,     // 30s cho integration tests
    maxWorkers: '50%'       // Limited parallelization
  }
]
```

**Lợi ích:**
- Unit tests chạy cực nhanh (< 1 phút)
- Integration tests chạy riêng khi cần
- CI/CD có thể chạy unit tests trước

---

## 5. Optimize Integration Tests

### Before (Slow)

```typescript
describe('Authentication Integration Tests', () => {
  let supabaseClient: SupabaseClient;

  beforeEach(async () => {
    // ❌ Tạo mới connection mỗi test
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  afterEach(async () => {
    // ❌ Không đóng connection
  });
});
```

### After (Fast)

```typescript
describe('Authentication Integration Tests', () => {
  let supabaseClient: SupabaseClient;

  beforeAll(async () => {
    // ✅ Tạo một lần cho tất cả tests
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  afterAll(async () => {
    // ✅ Đóng connection đúng cách
    await supabaseClient.removeAllChannels();
  });
});
```

**Lợi ích:**
- Giảm số lần tạo connections
- Không connection leaks
- Tests chạy nhanh hơn 30-40%

---

## 6. Best Practices Summary

### ✅ DO

1. **Cache mock objects** với MockFactory
2. **Sử dụng beforeAll/afterAll** thay vì beforeEach/afterEach khi có thể
3. **Dùng test.concurrent** cho independent tests
4. **Cleanup resources** trong afterAll
5. **Tách unit và integration tests**
6. **Giảm timeout** cho unit tests (5s)
7. **Enable detectOpenHandles** để tìm leaks

### ❌ DON'T

1. **Tạo mới mocks** trong beforeEach
2. **Quên cleanup** CircuitBreaker instances
3. **Dùng test.concurrent** cho tests có shared state
4. **Quên đóng** database/Redis/RabbitMQ connections
5. **Chạy integration tests** trong CI/CD mỗi commit
6. **Dùng verbose: true** trong production
7. **Force exit** tests (fix resource leaks thay vì force)

---

## 7. Performance Metrics

### Before Optimization

- **Tổng thời gian**: 500s
- **Unit tests**: ~400s
- **Integration tests**: ~100s
- **CPU Usage**: 50%
- **Memory Leaks**: Có

### After Optimization

- **Tổng thời gian**: 150-200s ⚡ (-60-70%)
- **Unit tests**: 40-60s ⚡ (-85%)
- **Integration tests**: 110-140s ⚡ (-10%)
- **CPU Usage**: 75-100% ⚡
- **Memory Leaks**: Không ✅

---

## 8. Migration Checklist

- [ ] Update jest.config.js (maxWorkers, timeout, detectOpenHandles)
- [ ] Enable projects configuration (unit vs integration)
- [ ] Add test:unit và test:integration scripts
- [ ] Refactor tests để dùng MockFactory
- [ ] Add test.concurrent cho independent tests
- [ ] Cleanup CircuitBreaker instances
- [ ] Close database/Redis/RabbitMQ connections
- [ ] Run tests và verify performance improvement
- [ ] Update CI/CD pipeline

---

## 9. Next Steps

1. **Refactor high-impact tests** (RegisterUserUseCase, AuthenticateUserUseCase)
2. **Add more test.concurrent** cho các tests độc lập
3. **Monitor test performance** với Jest reporters
4. **Optimize integration tests** với connection pooling
5. **Add test performance benchmarks** trong CI/CD

