/**
 * Test Setup Configuration
 * Global test setup and configuration for Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.TZ = 'Asia/Ho_Chi_Minh'; // Vietnamese timezone

// Use real Supabase credentials from .env.test
// Don't override if already set in .env.test
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';
}
if (!process.env.SUPABASE_JWT_SECRET) {
  process.env.SUPABASE_JWT_SECRET = 'test_secret';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'test_jwt_secret';
}

// Redis test configuration
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6380/1';

// RabbitMQ test configuration
process.env.RABBITMQ_URL = process.env.TEST_RABBITMQ_URL || 'amqp://localhost:5673';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test timeout
jest.setTimeout(30000);

// Don't mock Date for integration tests - causes issues with Supabase client
// Mock Date for consistent testing (DISABLED for integration tests)
const mockDate = new Date('2025-10-01T10:00:00.000Z');
// const originalDate = Date; // Disabled for integration tests

// Don't mock Date in integration tests - it breaks Supabase client
// beforeAll(() => {
//   // Mock Date constructor
//   global.Date = jest.fn((dateString?: string | number | Date) => {
//     if (dateString) {
//       return new originalDate(dateString);
//     }
//     return mockDate;
//   }) as any;
//
//   // Mock Date.now()
//   global.Date.now = jest.fn(() => mockDate.getTime());
//
//   // Mock Date.UTC()
//   global.Date.UTC = originalDate.UTC;
//
//   // Copy other Date methods
//   Object.setPrototypeOf(global.Date, originalDate);
//   Object.getOwnPropertyNames(originalDate).forEach(name => {
//     if (name !== 'length' && name !== 'name' && name !== 'prototype') {
//       (global.Date as any)[name] = (originalDate as any)[name];
//     }
//   });
// });
//
// afterAll(() => {
//   // Restore original Date
//   global.Date = originalDate;
// });

// Test utilities
export class TestUtils {
  /**
   * Generate random user ID
   */
  static generateRandomUserId(): string {
    return `user-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate random email
   */
  static generateRandomEmail(): string {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  }

  /**
   * Generate random session token
   */
  static generateRandomSessionToken(): string {
    return `session-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Sleep utility for async tests
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create mock logger
   */
  static createMockLogger() {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }

  /**
   * Create mock Supabase client
   */
  static createMockSupabaseClient() {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn()
    };
  }

  /**
   * Create mock Redis cache service
   */
  static createMockCacheService() {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      deletePattern: jest.fn().mockResolvedValue(0),
      exists: jest.fn().mockResolvedValue(false),
      getTTL: jest.fn().mockResolvedValue(-1),
      clear: jest.fn().mockResolvedValue(0),
      getStats: jest.fn().mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        hitRate: 0
      }),
      resetStats: jest.fn(),
      isReady: jest.fn().mockReturnValue(true)
    };
  }
}

// Test data factories
export class TestDataFactory {
  /**
   * Create valid user data
   */
  static createValidUserData() {
    return {
      id: TestUtils.generateRandomUserId(),
      email: TestUtils.generateRandomEmail(),
      fullName: 'Test User',
      roleType: 'patient',
      isActive: true,
      isVerified: false,
      citizenId: '001234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phoneNumber: '0901234567',
      address: '123 Test Street, Hanoi',
      emergencyContactName: 'Emergency Contact',
      emergencyContactPhone: '0987654321',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create valid session data
   */
  static createValidSessionData() {
    return {
      id: TestUtils.generateRandomUserId(),
      userId: TestUtils.generateRandomUserId(),
      sessionToken: TestUtils.generateRandomSessionToken(),
      deviceInfo: { browser: 'Chrome', os: 'Windows' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
      isActive: true,
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };
  }

  /**
   * Create valid registration request
   */
  static createValidRegistrationRequest() {
    return {
      email: TestUtils.generateRandomEmail(),
      password: 'Test@123456',
      fullName: 'Test User',
      roleType: 'patient',
      phoneNumber: '0901234567',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      citizenId: '001234567890'
    };
  }

  /**
   * Create valid authentication request
   */
  static createValidAuthenticationRequest() {
    return {
      email: TestUtils.generateRandomEmail(),
      password: 'Test@123456',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      deviceInfo: { browser: 'Chrome', os: 'Windows' }
    };
  }

  /**
   * Create valid MFA enable request
   */
  static createValidMFAEnableRequest() {
    return {
      userId: TestUtils.generateRandomUserId(),
      method: '2fa_app' as const,
      phoneNumber: '0901234567',
      email: TestUtils.generateRandomEmail()
    };
  }

  /**
   * Create valid MFA verify request
   */
  static createValidMFAVerifyRequest() {
    return {
      userId: TestUtils.generateRandomUserId(),
      code: '123456',
      attemptType: 'login' as const,
      method: '2fa_app' as const,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };
  }
}

// Export for use in tests
export { mockDate };

