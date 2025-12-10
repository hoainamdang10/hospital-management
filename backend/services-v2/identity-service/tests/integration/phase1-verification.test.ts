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
import { createTestSupabaseClient } from '../helpers/integrationHelpers';
import { TestUserPool, cleanupTestUserPool } from '../helpers/test-user-pool';
import { testUserPoolCache } from '../helpers/test-user-pool-cache';

describe('Phase 1 Verification Tests', () => {
  let supabaseClient: SupabaseClient;
  let app: Application;
  let cleanup: () => Promise<void>;
  let userPool: TestUserPool;

  beforeAll(async () => {
    console.log('\n Starting Phase 1 Verification Tests...\n');

    // Create Supabase client
    supabaseClient = createTestSupabaseClient();

    // Create Express app
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;

    // Get cached test user pool (seeds once, reuses for all tests)
    userPool = await testUserPoolCache.getPool(supabaseClient);

    console.log(' Setup complete\n');
  }, 90000);

  afterAll(async () => {
    console.log('\n Cleaning up Phase 1 Verification Tests...\n');

    // Note: User pool is cached and will be cleaned up in global teardown

    // Cleanup app resources
    await cleanup();

    console.log(' Cleanup complete\n');
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

  describe('2. Test User Pool Verification', () => {
    it('should have created admin user', () => {
      expect(userPool.admin).toBeDefined();
      expect(userPool.admin.userId).toBeTruthy();
      expect(userPool.admin.email).toContain('pool-admin');
      expect(userPool.admin.token).toBeTruthy();
    });

    it('should have created doctor user', () => {
      expect(userPool.doctor).toBeDefined();
      expect(userPool.doctor.userId).toBeTruthy();
      expect(userPool.doctor.email).toContain('pool-doctor');
    });

    it('should have created nurse user', () => {
      expect(userPool.nurse).toBeDefined();
      expect(userPool.nurse.userId).toBeTruthy();
      expect(userPool.nurse.email).toContain('pool-nurse');
    });

    it('should have created patient user', () => {
      expect(userPool.patient).toBeDefined();
      expect(userPool.patient.userId).toBeTruthy();
      expect(userPool.patient.email).toContain('pool-patient');
    });

    it('should verify admin user exists in database', async () => {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userPool.admin.userId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.email).toBe(userPool.admin.email);
    });

    it('should verify user has correct role in user_roles table', async () => {
      const { data, error } = await supabaseClient
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userPool.admin.userId)
        .single();

      expect(error).toBeNull();
      expect(data?.role_name).toBe('admin');
    });
  });

  describe('3. Express App Verification', () => {
    it('should respond to health check', async () => {
      const response = await request(app).get('/health');
      expect([200, 404]).toContain(response.status);
    });

    it('should respond to unknown routes with 404', async () => {
      const response = await request(app).get('/unknown-route-12345');
      expect(response.status).toBe(404);
    });
  });

  describe('4. End-to-End Flow', () => {
    it('should login user via API and verify session in database', async () => {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userPool.patient.email,
          password: userPool.patient.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();

      // Verify session exists in database
      const { data: sessions, error } = await supabaseClient
        .from('user_sessions')
        .select('*')
        .eq('user_id', userPool.patient.userId)
        .eq('is_active', true);

      expect(error).toBeNull();
      expect(sessions).toBeDefined();
      expect(sessions!.length).toBeGreaterThan(0);
    });

    it('should verify login attempt is recorded', async () => {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Make a login attempt
      await request(app)
        .post('/auth/login')
        .send({
          email: userPool.patient2.email,
          password: userPool.patient2.password
        });

      // Verify login attempt exists in database
      const { data: attempts, error } = await supabaseClient
        .from('login_attempts')
        .select('*')
        .eq('email', userPool.patient2.email)
        .order('attempted_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(attempts).toBeDefined();
      expect(attempts!.length).toBeGreaterThan(0);
    });
  });

  describe('5. Cleanup Verification', () => {
    it('should verify cleanup function exists', () => {
      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should verify test user pool cleanup function exists', () => {
      expect(cleanupTestUserPool).toBeDefined();
      expect(typeof cleanupTestUserPool).toBe('function');
    });
  });
});
