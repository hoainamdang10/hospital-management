# Infrastructure Services Unit Tests

## Overview

Unit tests cho các infrastructure services trong Identity Service V2.

## Test Files

### SupabaseMFAService.test.ts

**Coverage:** 91.03% statements, 81.25% branches, 100% functions, 93.28% lines

**Test Cases:** 38 tests covering:

#### 1. enableMFA (5 tests)
- ✅ Enable MFA with 2FA app method successfully
- ✅ Enable MFA with SMS method
- ✅ Enable MFA with email method
- ✅ Use local backup codes when RPC fails (fallback mechanism)
- ✅ Throw error when upsert fails

#### 2. disableMFA (2 tests)
- ✅ Disable MFA successfully
- ✅ Throw error when disable fails

#### 3. verifyCode (3 tests)
- ✅ Verify valid TOTP code
- ✅ Return false when MFA settings not found
- ✅ Return false when secret key is missing

#### 4. generateBackupCodes (4 tests)
- ✅ Generate backup codes via RPC
- ✅ Fallback to local generation when RPC fails
- ✅ Fallback to local generation when RPC throws
- ✅ Use local generation when RPC returns null data

#### 5. validateBackupCode (5 tests)
- ✅ Validate backup code successfully
- ✅ Return false for invalid backup code
- ✅ Return false when RPC fails
- ✅ Return false when RPC throws
- ✅ Return false when data is null

#### 6. isMFAEnabled (3 tests)
- ✅ Return true when MFA is enabled
- ✅ Return false when MFA is disabled
- ✅ Return false when query fails

#### 7. getMFASettings (3 tests)
- ✅ Get MFA settings successfully
- ✅ Return null when settings not found
- ✅ Return null on error

#### 8. updateMFASettings (3 tests)
- ✅ Update MFA settings successfully
- ✅ Update partial settings
- ✅ Throw error when update fails

#### 9. checkRateLimit (3 tests)
- ✅ Allow when under rate limit (< 5 attempts)
- ✅ Deny when rate limit exceeded (≥ 5 attempts)
- ✅ Allow on error (fail open for availability)

#### 10. recordFailedAttempt (2 tests)
- ✅ Record failed attempt
- ✅ Handle insert errors gracefully

#### 11. clearFailedAttempts (2 tests)
- ✅ Clear failed attempts
- ✅ Handle delete errors gracefully

#### 12. Edge Cases and Error Handling (3 tests)
- ✅ Handle empty user ID gracefully
- ✅ Generate unique secrets for each enableMFA call
- ✅ Generate valid QR code URLs

## Running Tests

### Run all infrastructure service tests
```bash
npm test tests/unit/infrastructure/services/
```

### Run specific test file
```bash
npm test SupabaseMFAService.test.ts
```

### Run with coverage
```bash
npx jest tests/unit/infrastructure/services/SupabaseMFAService.test.ts --coverage
```

### Run in watch mode
```bash
npm test -- --watch SupabaseMFAService.test.ts
```

## Test Patterns

### 1. Mock Setup
```typescript
beforeEach(() => {
  // Mock console.error để log sạch
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Mock Supabase Client
  mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
    // ... other methods
  } as any;

  logger = TestUtils.createMockLogger();
  mfaService = new SupabaseMFAService(mockSupabaseClient, logger);
});
```

### 2. Testing Success Cases
```typescript
it('should enable MFA successfully', async () => {
  mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
    data: testBackupCodes,
    error: null,
  });

  const result = await mfaService.enableMFA(testUserId, method);

  expect(result).toHaveProperty('secret');
  expect(result).toHaveProperty('qrCodeUrl');
  expect(result).toHaveProperty('backupCodes');
});
```

### 3. Testing Error Cases
```typescript
it('should throw error when operation fails', async () => {
  mockSupabaseClient.from = jest.fn().mockImplementation(() => {
    throw new Error('Database error');
  });

  await expect(mfaService.enableMFA(testUserId, method))
    .rejects.toThrow('Lỗi lưu cài đặt MFA');
  expect(logger.error).toHaveBeenCalled();
});
```

### 4. Testing Fallback Mechanisms
```typescript
it('should use fallback when RPC fails', async () => {
  mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
    data: null,
    error: { message: 'RPC error' },
  });

  const result = await mfaService.generateBackupCodes(testUserId);

  expect(result).toHaveLength(10); // Local generation
  expect(logger.warn).toHaveBeenCalled();
});
```

## Key Features Tested

### ✅ MFA Operations
- Enable/disable MFA for users
- Support multiple methods (2FA app, SMS, email)
- Generate TOTP secrets and QR codes
- Backup code generation and validation

### ✅ Error Handling
- Database errors
- RPC failures
- Missing data scenarios
- Network errors

### ✅ Fallback Mechanisms
- Local backup code generation when RPC fails
- Graceful degradation on errors

### ✅ Rate Limiting
- Track failed attempts
- Enforce rate limits (5 attempts per 15 minutes)
- Fail open on errors for availability

### ✅ Security
- TOTP verification with time window
- Backup code validation and marking as used
- Failed attempt tracking

## Coverage Goals

- **Statements:** ≥ 90% ✅ (91.03%)
- **Branches:** ≥ 80% ✅ (81.25%)
- **Functions:** ≥ 90% ✅ (100%)
- **Lines:** ≥ 90% ✅ (93.28%)

## Uncovered Lines

Lines 362, 362, 368-369 trong SupabaseMFAService.ts:
- Private TOTP verification logic (edge cases)
- Có thể thêm tests cho các edge cases này nếu cần

## Best Practices

1. **Mock console.error** để log sạch trong tests
2. **Use TestUtils.createMockLogger()** cho consistent logger mocking
3. **Test both success and error paths** cho mọi method
4. **Test fallback mechanisms** khi external services fail
5. **Verify logger calls** để đảm bảo error tracking
6. **Test edge cases** như empty strings, null values
7. **Use descriptive test names** theo pattern "should [expected behavior] when [condition]"

## Maintenance

- Update tests khi thêm features mới vào SupabaseMFAService
- Maintain coverage ≥ 90% cho statements, functions, lines
- Maintain coverage ≥ 80% cho branches
- Review và update mocks khi Supabase client API changes

## Related Files

- **Implementation:** `src/infrastructure/services/SupabaseMFAService.ts`
- **Interface:** `src/application/services/IMFAService.ts`
- **Test Setup:** `tests/setup.ts`
- **Jest Config:** `jest.config.js`

