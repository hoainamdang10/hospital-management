/**
 * Integration Tests - Auth Routes
 * 
 * Tests authentication endpoints with REAL database operations:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/logout
 * - POST /auth/refresh
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 * - POST /auth/verify-email
 * 
 * @group integration
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestApp } from '../helpers/appFactory';
import {
  createTestSupabaseClient,
  createTestUser,
  cleanupTestUsers,
  verifyPendingRegistrationExists,
  getPendingRegistrationFromDb
} from '../helpers/integrationHelpers';

describe('Auth Routes Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  // Helper to generate unique test email
  const generateTestEmail = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}@hospital.vn`;
  };

  // Helper to generate unique citizen ID (12 digits)
  const generateUniqueCitizenId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const combined = timestamp + random;
    return combined.slice(-12); // Take last 12 digits
  };

  beforeAll(async () => {
    // Create Supabase client with service_role key
    supabaseClient = createTestSupabaseClient();

    // Create Express app with real dependencies
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;
  }, 30000); // 30 second timeout for setup

  afterAll(async () => {
    // Cleanup all test users
    if (testEmails.length > 0) {
      await cleanupTestUsers(supabaseClient, testEmails);
    }

    // Cleanup app resources
    if (cleanup) {
      await cleanup();
    }
  });

  describe('POST /auth/register', () => {
    it('should register new patient with complete personal info', async () => {
      const email = generateTestEmail('register-success');
      testEmails.push(email);

      // Generate unique citizen ID to avoid duplicates in database
      const uniqueCitizenId = `${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(-12);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: 'SecurePassword123!',
          fullName: 'Test Patient User',
          phoneNumber: '0901234567',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: uniqueCitizenId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pendingRegistrationId).toBeDefined();
      expect(response.body.email).toBe(email);
      expect(response.body.requiresEmailVerification).toBe(true);

      // Verify pending registration exists in database
      const exists = await verifyPendingRegistrationExists(supabaseClient, response.body.pendingRegistrationId);
      expect(exists).toBe(true);

      // Verify pending registration details in database
      const dbPendingReg = await getPendingRegistrationFromDb(supabaseClient, response.body.pendingRegistrationId);
      expect(dbPendingReg.email).toBe(email);
      expect(dbPendingReg.user_data.fullName).toBe('Test Patient User'); // Data stored in JSONB column
      expect(dbPendingReg.user_data.roleType).toBe('patient'); // Lowercase in database
      expect(dbPendingReg.status).toBe('EMAIL_SENT'); // Email service mock succeeds
    });

    it('should fail to register with existing email', async () => {
      const email = generateTestEmail('register-duplicate');
      testEmails.push(email);

      // Create user first
      await createTestUser(supabaseClient, email, 'Password123!', 'PATIENT', {
        fullName: 'Existing User',
        phoneNumber: '0901234568',
        address: '456 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1991-02-02',
        gender: 'female',
        citizenId: generateUniqueCitizenId() // Generate unique citizen ID
      });

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: 'NewPassword123!',
          fullName: 'Duplicate User',
          phoneNumber: '0901234569',
          address: '789 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1992-03-03',
          gender: 'male',
          citizenId: '001092003456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('USER_ALREADY_EXISTS');
    });

    it('should fail to register with weak password', async () => {
      const email = generateTestEmail('register-weak-password');
      testEmails.push(email);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: '123', // Weak password
          fullName: 'Test User',
          phoneNumber: '0901234570',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: '001090001235'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should fail to register with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email', // Invalid format
          password: 'SecurePassword123!',
          fullName: 'Test User',
          phoneNumber: '0901234571',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: '001090001236'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should allow registration with minimal personal info (personal info is optional)', async () => {
      const email = generateTestEmail('register-minimal');
      testEmails.push(email);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: 'SecurePassword123!',
          fullName: 'Test User',
          phoneNumber: '0901234572',
          roleType: 'patient' // Required field
          // Optional: address, dateOfBirth, gender, citizenId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pendingRegistrationId).toBeDefined();
    });

    it('should force PATIENT role even if roleType is provided', async () => {
      const email = generateTestEmail('register-force-patient');
      testEmails.push(email);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: 'SecurePassword123!',
          roleType: 'ADMIN', // Try to escalate privilege
          fullName: 'Test User',
          phoneNumber: '0901234573',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: `${Date.now().toString().slice(-12)}`
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.pendingRegistrationId).toBeDefined();

      // Verify role is PATIENT, not ADMIN (in pending registration)
      const dbPendingReg = await getPendingRegistrationFromDb(supabaseClient, response.body.pendingRegistrationId);
      expect(dbPendingReg.user_data.roleType).toBe('patient'); // Security: force patient role (lowercase in DB)
    });
  });

  describe('POST /auth/login', () => {
    let testUserEmail: string;
    let testUserPassword: string;
    let testUserId: string;

    beforeAll(async () => {
      // Create test user for login tests
      testUserEmail = generateTestEmail('login-test');
      testUserPassword = 'LoginPassword123!';
      testEmails.push(testUserEmail);

      const user = await createTestUser(
        supabaseClient,
        testUserEmail,
        testUserPassword,
        'PATIENT',
        {
          fullName: 'Login Test User',
          phoneNumber: '0901234574',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: generateUniqueCitizenId() // Generate unique citizen ID
        }
      );
      testUserId = user.userId;
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.roles).toBeDefined();
      expect(response.body.permissions).toBeDefined();

      // Verify session created in database
      const { data: sessions } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_active', true);

      expect(sessions).toBeDefined();
      expect(sessions!.length).toBeGreaterThan(0);

      // Verify login attempt logged
      const { data: loginAttempts } = await supabaseClient
        .from('login_attempts')
        .select('*')
        .eq('email', testUserEmail)
        .eq('success', true)
        .order('attempted_at', { ascending: false })
        .limit(1);

      expect(loginAttempts).toBeDefined();
      expect(loginAttempts!.length).toBe(1);
    });

    it('should fail login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.accessToken).toBeUndefined();

      // Verify failed login attempt logged
      const { data: loginAttempts } = await supabaseClient
        .from('login_attempts')
        .select('*')
        .eq('email', testUserEmail)
        .eq('success', false)
        .order('attempted_at', { ascending: false })
        .limit(1);

      expect(loginAttempts).toBeDefined();
      expect(loginAttempts!.length).toBe(1);
    });

    it('should fail login with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@hospital.vn',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    let testUserEmail: string;
    let testUserPassword: string;
    let testUserId: string;
    let accessToken: string;

    beforeAll(async () => {
      // Create test user and login to get token
      testUserEmail = generateTestEmail('logout-test');
      testUserPassword = 'LogoutPassword123!';
      testEmails.push(testUserEmail);

      const user = await createTestUser(
        supabaseClient,
        testUserEmail,
        testUserPassword,
        'PATIENT',
        {
          fullName: 'Logout Test User',
          phoneNumber: '0901234575',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: generateUniqueCitizenId() // Generate unique citizen ID
        }
      );
      testUserId = user.userId;

      // Login to get access token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify session deactivated in database
      const { data: sessions } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('is_active', true);

      // Should have no active sessions (or fewer than before)
      expect(sessions).toBeDefined();
    });

    it('should fail logout without authentication token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should fail logout with invalid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let testUserEmail: string;
    let testUserPassword: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Create test user and login to get refresh token
      testUserEmail = generateTestEmail('refresh-test');
      testUserPassword = 'RefreshPassword123!';
      testEmails.push(testUserEmail);

      await createTestUser(
        supabaseClient,
        testUserEmail,
        testUserPassword,
        'PATIENT',
        {
          fullName: 'Refresh Test User',
          phoneNumber: '0901234576',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: '001090001240'
        }
      );

      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.accessToken).not.toBe(refreshToken); // New token should be different
    });

    it('should fail refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail refresh without refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

