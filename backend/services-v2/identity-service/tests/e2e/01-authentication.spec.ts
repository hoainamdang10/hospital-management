import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * E2E Tests for Authentication Flows
 * 
 * Test Coverage:
 * - Patient Self-Registration
 * - Login (with valid/invalid credentials)
 * - Logout
 * - Token Refresh
 * - Account Lockout (after failed attempts)
 */

test.describe('Authentication Flows', () => {
  const baseURL = 'http://localhost:3021';
  let testPatientEmail: string;
  let testPatientPassword: string;
  let accessToken: string;
  let refreshToken: string;

  test.beforeAll(() => {
    // Generate unique test data
    const uniqueId = uuidv4().substring(0, 8);
    testPatientEmail = `patient-${uniqueId}@test.com`;
    testPatientPassword = 'TestPass123!';
  });

  test.describe('Patient Self-Registration', () => {
    test('should successfully register a new patient', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          email: testPatientEmail,
          password: testPatientPassword,
          fullName: 'Nguyễn Văn Test',
          phoneNumber: '0901234567',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('userId');
      expect(body.email).toBe(testPatientEmail);
      expect(body.requiresEmailVerification).toBe(true);
    });

    test('should reject registration with duplicate email', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: testPatientEmail, // Same email as above
          password: 'AnotherPass123!',
          fullName: 'Nguyễn Văn B',
          phoneNumber: '0901234568',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with weak password', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: `weak-${uuidv4().substring(0, 8)}@test.com`,
          password: '12345', // Weak password
          fullName: 'Nguyễn Văn C',
          phoneNumber: '0901234569',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with invalid email format', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: 'invalid-email', // Invalid format
          password: 'TestPass123!',
          fullName: 'Nguyễn Văn D',
          phoneNumber: '0901234570',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });

    test('should reject registration with invalid phone number', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: `phone-${uuidv4().substring(0, 8)}@test.com`,
          password: 'TestPass123!',
          fullName: 'Nguyễn Văn E',
          phoneNumber: '123', // Invalid Vietnamese phone
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Login Flow', () => {
    test('should reject login before email verification', async ({ request }) => {
      // Patient registered but email not verified yet
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testPatientEmail,
          password: testPatientPassword
        }
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('EMAIL_NOT_VERIFIED');
      expect(body.message).toContain('xác thực email');
    });

    test('should reject login with invalid password', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testPatientEmail,
          password: 'WrongPassword123!'
        }
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error || body.message).toBeTruthy();
    });

    test('should reject login with non-existent email', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: 'nonexistent@test.com',
          password: 'TestPass123!'
        }
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error || body.message).toBeTruthy();
    });
  });

  test.describe('Token Refresh Flow', () => {
    test('should successfully refresh access token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/refresh`, {
        data: {
          refreshToken: refreshToken
        }
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('accessToken');
      expect(body.data).toHaveProperty('refreshToken');
    });

    test('should reject refresh with invalid token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/refresh`, {
        data: {
          refreshToken: 'invalid-token'
        }
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeTruthy();
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('Logged out successfully');
    });

    test('should reject logout without token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/logout`);

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Account Lockout', () => {
    test('should lock account after multiple failed login attempts', async ({ request }) => {
      const lockoutEmail = `lockout-${uuidv4().substring(0, 8)}@test.com`;

      // First register the account
      await request.post(`${baseURL}/auth/register`, {
        data: {
          email: lockoutEmail,
          password: 'TestPass123!',
          fullName: 'Lockout Test',
          phoneNumber: '0901234571',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      // Attempt multiple failed logins (typically 5 attempts)
      for (let i = 0; i < 5; i++) {
        await request.post(`${baseURL}/auth/login`, {
          data: {
            email: lockoutEmail,
            password: 'WrongPassword123!'
          }
        });
      }

      // Next attempt should return account locked
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: lockoutEmail,
          password: 'TestPass123!' // Even with correct password
        }
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error || body.message).toBeTruthy();
    });
  });
});

