/**
 * Phase 1 Verification Test
 * Simple test to verify integration test infrastructure is working
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Application } from 'express';
import request from 'supertest';
import { createTestApp } from '../helpers/appFactory';
import {
  createTestUser,
  verifyUserExists,
  getUserFromDb,
  cleanupTestUsers,
  cleanupAllTestUsers,
  generateTestEmail,
  createTestSupabaseClient
} from '../helpers/integrationHelpers';

describe('Phase 1 Verification Tests', () => {
  let supabaseClient: SupabaseClient;
  let app: Application;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  beforeAll(async () => {
    console.log('\n🧪 Starting Phase 1 Verification Tests...\n');

    // Create Supabase client
    supabaseClient = createTestSupabaseClient();

    // Cleanup all test users before starting
    console.log('🧹 Cleaning up existing test users...');
    await cleanupAllTestUsers(supabaseClient, '%@hospital.vn');

    // Create Express app
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;

    console.log('✅ Setup complete\n');
  }, 30000);

  afterAll(async () => {
    console.log('\n🧹 Cleaning up Phase 1 Verification Tests...\n');

    // Cleanup test users
    await cleanupTestUsers(supabaseClient, testEmails);

    // Cleanup app resources
    await cleanup();

    console.log('✅ Cleanup complete\n');
  });

  describe('1. Database Connection', () => {
    it('should connect to Supabase database', async () => {
      const { error } = await supabaseClient
        .from('user_profiles')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
    });

    it('should verify required tables exist', async () => {
      const tables = [
        'user_profiles',
        'user_roles',
        'user_sessions',
        'login_attempts',
        'audit_logs'
      ];

      for (const table of tables) {
        const { error } = await supabaseClient
          .from(table)
          .select('count')
          .limit(1);

        expect(error).toBeNull();
      }
    });
  });

  describe('2. Integration Helpers', () => {
    it('should generate unique test email', () => {
      const email1 = generateTestEmail('test');
      const email2 = generateTestEmail('test');

      expect(email1).toMatch(/^test-\d+-\d+@hospital\.vn$/);
      expect(email2).toMatch(/^test-\d+-\d+@hospital\.vn$/);
      expect(email1).not.toBe(email2);
    });

    it('should create test user in database', async () => {
      const email = generateTestEmail('create');
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        'TestPassword123!',
        'PATIENT',
        {
          fullName: 'Test User',
          phoneNumber: '0901234567'
        }
      );

      expect(user.userId).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.token).toBeDefined();
      expect(user.refreshToken).toBeDefined();
      expect(user.role).toBe('PATIENT');
    });

    it('should verify user exists in database', async () => {
      const email = generateTestEmail('verify');
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        'TestPassword123!',
        'PATIENT'
      );

      const exists = await verifyUserExists(supabaseClient, user.userId);
      expect(exists).toBe(true);
    });

    it('should get user from database', async () => {
      const email = generateTestEmail('get');
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        'TestPassword123!',
        'PATIENT',
        {
          fullName: 'Get Test User'
        }
      );

      const dbUser = await getUserFromDb(supabaseClient, user.userId);
      expect(dbUser.email).toBe(email);
      expect(dbUser.full_name).toBe('Get Test User');
      expect(dbUser.role_type).toBe('patient');
    });
  });

  describe('3. App Factory', () => {
    it('should create Express app', () => {
      expect(app).toBeDefined();
    });

    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('4. End-to-End Flow', () => {
    it('should register user via API and verify in database', async () => {
      const email = generateTestEmail('e2e');
      testEmails.push(email);

      // Register via API with complete personal info
      const response = await request(app)
        .post('/auth/register')
        .send({
          email,
          password: 'TestPassword123!',
          fullName: 'E2E Test User',
          phoneNumber: '0901234567',
          address: '123 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          citizenId: '001090001234'
        });

      // Debug: Log response if failed
      if (response.status !== 201) {
        console.log('Register failed:', {
          status: response.status,
          body: response.body
        });
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBeDefined();

      // Verify in database
      const exists = await verifyUserExists(supabaseClient, response.body.userId);
      expect(exists).toBe(true);

      // Get from database
      const dbUser = await getUserFromDb(supabaseClient, response.body.userId);
      expect(dbUser.email).toBe(email);
      expect(dbUser.full_name).toBe('E2E Test User');
      expect(dbUser.role_type).toBe('patient'); // Security: force patient role
    });

    it('should login user via API and verify session in database', async () => {
      const email = generateTestEmail('login');
      const password = 'TestPassword123!';
      testEmails.push(email);

      // Create user first with complete personal info
      await createTestUser(
        supabaseClient,
        email,
        password,
        'PATIENT',
        {
          fullName: 'Login Test User',
          phoneNumber: '0901234568',
          address: '456 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1991-02-02',
          gender: 'female',
          citizenId: '001091002345'
        }
      );

      // Login via API
      const response = await request(app)
        .post('/auth/login')
        .send({
          email,
          password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();

      // Verify session in database
      const { data: sessions } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('user_id', response.body.userId)
        .eq('is_active', true);

      expect(sessions).toBeDefined();
      expect(sessions!.length).toBeGreaterThan(0);
    });
  });

  describe('5. Cleanup Verification', () => {
    it('should cleanup test user', async () => {
      const email = generateTestEmail('cleanup');

      // Create user
      const user = await createTestUser(
        supabaseClient,
        email,
        'TestPassword123!',
        'PATIENT'
      );

      // Verify exists
      let exists = await verifyUserExists(supabaseClient, user.userId);
      expect(exists).toBe(true);

      // Cleanup
      await cleanupTestUsers(supabaseClient, [email]);

      // Verify deleted
      exists = await verifyUserExists(supabaseClient, user.userId);
      expect(exists).toBe(false);
    });
  });
});

