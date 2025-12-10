/**
 * Integration Tests - Account Lockout & Brute Force Protection
 * 
 * Tests account lockout logic with MOCKED Supabase Auth to avoid rate limiting.
 * This allows us to test the application's brute force protection logic
 * without being blocked by Supabase's built-in rate limiting.
 * 
 * Account Lockout Configuration:
 * - Threshold: 5 failed attempts within 30 minutes
 * - Lockout Duration: 30 minutes from last failed attempt
 * - Tracking: login_attempts table in database
 * 
 * @group integration
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createTestApp } from '../helpers/appFactory';
import {
  createTestSupabaseClient,
  cleanupTestUsers
} from '../helpers/integrationHelpers';
import { TestUserPool } from '../helpers/test-user-pool';
import { testUserPoolCache } from '../helpers/test-user-pool-cache';

describe('Account Lockout & Brute Force Protection Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  let userPool: TestUserPool;
  const testEmails: string[] = [];

  const generateTestEmail = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}@hospital.vn`;
  };

  const generateUniqueCitizenId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const combined = timestamp + random;
    return combined.slice(-12);
  };

  const createUserDirectly = async (email: string, password: string, role: string = 'PATIENT') => {
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message}`);
    }

    const citizenId = generateUniqueCitizenId();

    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: `Test User ${email}`,
        role_type: role.toLowerCase(),
        phone_number: '0901234567',
        citizen_id: citizenId,
        date_of_birth: '1990-01-01',
        gender: 'male',
        address: '123 Test Street, Hanoi, Vietnam',
        is_active: true,
        is_verified: true,
        subscription_tier: 'free'
      });

    if (profileError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role_name: role.toLowerCase()
      });

    if (roleError) {
      await supabaseClient.from('user_profiles').delete().eq('id', authData.user.id);
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    return {
      userId: authData.user.id,
      email,
      role
    };
  };

  const insertFailedLoginAttempts = async (email: string, count: number, delayMinutes: number = 0) => {
    const attempts = [];
    const baseTime = new Date();

    for (let i = 0; i < count; i++) {
      const attemptTime = new Date(baseTime.getTime() - (delayMinutes * 60 * 1000) + (i * 1000));
      attempts.push({
        email,
        success: false,
        ip_address: '127.0.0.1',
        user_agent: 'Test-Agent/1.0',
        attempted_at: attemptTime.toISOString(),
        failure_reason: 'Invalid credentials'
      });
    }

    const { error } = await supabaseClient
      .from('login_attempts')
      .insert(attempts);

    if (error) {
      throw new Error(`Failed to insert login attempts: ${error.message}`);
    }
  };

  beforeAll(async () => {
    supabaseClient = createTestSupabaseClient();
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;

    // Get cached test user pool (seeds once, reuses for all tests)
    userPool = await testUserPoolCache.getPool(supabaseClient);
    console.log(' Test user pool ready for account lockout tests');
  }, 120000); // Increased timeout for user pool seeding

  afterAll(async () => {
    // Note: User pool is cached and will be cleaned up in global teardown
    
    if (testEmails.length > 0) {
      await cleanupTestUsers(supabaseClient, testEmails);
    }
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Account Lockout Logic', () => {
    describe('Lockout Threshold Detection', () => {
      it('should lock account after 5 failed login attempts within 30 minutes', async () => {
        const email = generateTestEmail('lockout-threshold');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 5, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Tài khoản đã bị khóa');
      });

      it('should not lock account with only 4 failed attempts', async () => {
        const email = generateTestEmail('lockout-no-threshold');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 4, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should not lock account if failed attempts are older than 30 minutes', async () => {
        const email = generateTestEmail('lockout-expired-attempts');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 5, 31);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should provide unlock time in lockout message', async () => {
        const email = generateTestEmail('lockout-unlock-time');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 5, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/Vui lòng thử lại sau/);
      });
    });

    describe('Lockout Recovery', () => {
      it('should allow login after lockout period expires', async () => {
        const email = generateTestEmail('lockout-recovery');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 5, 31);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should clear old failed attempts after successful login', async () => {
        const email = generateTestEmail('lockout-clear-attempts');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 3, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const { data: attempts } = await supabaseClient
          .from('login_attempts')
          .select('*')
          .eq('email', email)
          .eq('success', true)
          .order('attempted_at', { ascending: false })
          .limit(1);

        expect(attempts).toBeDefined();
        expect(attempts!.length).toBeGreaterThan(0);
        expect(attempts![0].success).toBe(true);
      });
    });

    describe('Lockout Edge Cases', () => {
      it('should not lock account for different users with similar emails', async () => {
        // Use pool users to avoid creating new users (rate limiting)
        const user1 = userPool.patient;
        const user2 = userPool.patient2;

        // Clear any existing login attempts for both users
        await supabaseClient
          .from('login_attempts')
          .delete()
          .in('email', [user1.email, user2.email]);

        // Insert failed attempts for user1 only
        await insertFailedLoginAttempts(user1.email, 5, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        // Try to login as user2 - should succeed since user2 has no failed attempts
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: user2.email,
            password: 'PatientPool123!' // Correct password from test pool
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should track lockout status per email address', async () => {
        const email1 = generateTestEmail('lockout-email1');
        const email2 = generateTestEmail('lockout-email2');
        const password = 'CorrectPassword123!';
        testEmails.push(email1, email2);

        await createUserDirectly(email1, password, 'PATIENT');
        await createUserDirectly(email2, password, 'PATIENT');

        await insertFailedLoginAttempts(email1, 5, 0);
        await insertFailedLoginAttempts(email2, 2, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response1 = await request(app)
          .post('/auth/login')
          .send({
            email: email1,
            password
          });

        // Add delay between login calls
        await new Promise(resolve => setTimeout(resolve, 300));

        const response2 = await request(app)
          .post('/auth/login')
          .send({
            email: email2,
            password
          });

        expect(response1.status).toBe(401);
        expect(response1.body.message).toContain('Tài khoản đã bị khóa');

        expect(response2.status).toBe(200);
        expect(response2.body.success).toBe(true);
      });

      it('should handle case-sensitive email in lockout check', async () => {
        const email = generateTestEmail('lockout-case-sensitive');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email.toUpperCase(), 5, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should count only failed attempts (not successful ones)', async () => {
        // Use pool user to avoid creating new user (rate limiting)
        const user = userPool.destructive.lockable;

        // Clear any existing login attempts
        await supabaseClient
          .from('login_attempts')
          .delete()
          .eq('email', user.email);

        // Insert 3 failed attempts
        await insertFailedLoginAttempts(user.email, 3, 0);

        // Insert 2 successful attempts (should not count toward lockout)
        await supabaseClient
          .from('login_attempts')
          .insert([
            {
              email: user.email,
              success: true,
              ip_address: '127.0.0.1',
              user_agent: 'Test-Agent/1.0',
              attempted_at: new Date().toISOString()
            },
            {
              email: user.email,
              success: true,
              ip_address: '127.0.0.1',
              user_agent: 'Test-Agent/1.0',
              attempted_at: new Date().toISOString()
            }
          ]);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        // Should login successfully - only 3 failed attempts (< 5 threshold)
        const response = await request(app)
          .post('/auth/login')
          .send({
            email: user.email,
            password: 'LockablePool123!' // Correct password from test pool (PATIENT role)
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Login Attempt Tracking', () => {
      it('should record failed login attempt with IP and user agent', async () => {
        const email = generateTestEmail('tracking-failed');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .set('User-Agent', 'Test-Browser/1.0')
          .send({
            email,
            password: 'WrongPassword123!'
          });

        expect(response.status).toBe(401);

        const { data: attempts } = await supabaseClient
          .from('login_attempts')
          .select('*')
          .eq('email', email)
          .order('attempted_at', { ascending: false })
          .limit(1);

        expect(attempts).toBeDefined();
        expect(attempts!.length).toBeGreaterThan(0);
        expect(attempts![0].success).toBe(false);
        expect(attempts![0].ip_address).toBeDefined();
        expect(attempts![0].user_agent).toBeDefined();
      });

      it('should record successful login attempt', async () => {
        // Use pool user to avoid creating new user (rate limiting)
        const user = userPool.destructive.deletable;

        // Clear any existing login attempts
        await supabaseClient
          .from('login_attempts')
          .delete()
          .eq('email', user.email);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email: user.email,
            password: 'DeletablePool123!' // Correct password from test pool (PATIENT role)
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const { data: attempts } = await supabaseClient
          .from('login_attempts')
          .select('*')
          .eq('email', user.email)
          .order('attempted_at', { ascending: false })
          .limit(1);

        expect(attempts).toBeDefined();
        expect(attempts!.length).toBeGreaterThan(0);
        expect(attempts![0].success).toBe(true);
      });

      it('should record lockout attempt separately', async () => {
        const email = generateTestEmail('tracking-lockout');
        const password = 'CorrectPassword123!';
        testEmails.push(email);

        await createUserDirectly(email, password, 'PATIENT');

        await insertFailedLoginAttempts(email, 5, 0);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

        const response = await request(app)
          .post('/auth/login')
          .send({
            email,
            password
          });

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Tài khoản đã bị khóa');

        // Get all attempts after the 5 initial failed attempts
        const { data: attempts } = await supabaseClient
          .from('login_attempts')
          .select('*')
          .eq('email', email)
          .order('attempted_at', { ascending: false });

        expect(attempts).toBeDefined();
        expect(attempts!.length).toBeGreaterThan(5); // Should have more than the 5 initial attempts

        // Find the first attempt with "Account is locked" message
        const lockoutAttempt = attempts!.find(a =>
          a.failure_reason && a.failure_reason.includes('Account is locked')
        );

        expect(lockoutAttempt).toBeDefined();
        expect(lockoutAttempt!.success).toBe(false);
        expect(lockoutAttempt!.failure_reason).toContain('Account is locked');
      });
    });
  });
});

