import { v4 as uuidv4 } from 'uuid';

/**
 * Test Data Helpers for E2E Tests
 */

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  role?: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT';
}

export interface TestCredentials {
  email: string;
  password: string;
}

/**
 * Generate unique test patient data
 */
export function generateTestPatient(): TestUser {
  const uniqueId = uuidv4().substring(0, 8);
  return {
    email: `patient-${uniqueId}@test.com`,
    password: 'TestPass123!',
    fullName: `Test Patient ${uniqueId}`,
    phoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
    dateOfBirth: '1990-01-01',
    gender: 'male',
    role: 'PATIENT'
  };
}

/**
 * Generate unique test staff data
 */
export function generateTestStaff(role: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'ADMIN'): TestUser {
  const uniqueId = uuidv4().substring(0, 8);
  return {
    email: `${role.toLowerCase()}-${uniqueId}@hospital.com`,
    password: 'StaffPass123!',
    fullName: `Test ${role} ${uniqueId}`,
    phoneNumber: `090${Math.floor(1000000 + Math.random() * 9000000)}`,
    dateOfBirth: '1985-01-01',
    gender: 'female',
    role
  };
}

/**
 * Pre-seeded admin credentials (should exist in database)
 */
export const ADMIN_CREDENTIALS: TestCredentials = {
  email: 'admin@hospital.com',
  password: 'Admin123!'
};

/**
 * Invalid test data for negative testing
 */
export const INVALID_TEST_DATA = {
  weakPassword: '12345',
  invalidEmail: 'not-an-email',
  invalidPhone: '123',
  shortName: 'A',
  futureDate: '2030-01-01',
  invalidGender: 'UNKNOWN'
};

/**
 * Valid Vietnamese phone numbers for testing
 */
export const VALID_PHONE_NUMBERS = [
  '0901234567',
  '0912345678',
  '0923456789',
  '0934567890',
  '0945678901'
];

/**
 * Generate random Vietnamese phone number
 */
export function generatePhoneNumber(): string {
  const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${suffix}`;
}

/**
 * Generate random email
 */
export function generateEmail(prefix: string = 'test'): string {
  const uniqueId = uuidv4().substring(0, 8);
  return `${prefix}-${uniqueId}@test.com`;
}

/**
 * Wait for a specified time (for rate limiting tests)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Expected error codes for different scenarios
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_MFA_REQUIRED: 'AUTH_MFA_REQUIRED',
  
  // Registration
  REG_EMAIL_EXISTS: 'REG_EMAIL_EXISTS',
  REG_INVALID_EMAIL: 'REG_INVALID_EMAIL',
  REG_WEAK_PASSWORD: 'REG_WEAK_PASSWORD',
  REG_INVALID_ROLE: 'REG_INVALID_ROLE',
  
  // User Management
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_PERMISSION_DENIED: 'USER_PERMISSION_DENIED',
  USER_CANNOT_DELETE_SELF: 'USER_CANNOT_DELETE_SELF',
  
  // Validation
  VAL_REQUIRED_FIELD: 'VAL_REQUIRED_FIELD',
  VAL_INVALID_FORMAT: 'VAL_INVALID_FORMAT'
};

/**
 * Expected HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

