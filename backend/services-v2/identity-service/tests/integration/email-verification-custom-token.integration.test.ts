/**
 * Integration Tests - Custom JWT Token Email Verification Flow
 * 
 * Tests custom JWT token-based email verification with REAL database operations:
 * - GET /auth/verify-email?token=xxx
 * - POST /auth/resend-verification
 * 
 * Flow:
 * 1. User registers → System generates JWT token, stores in DB, sends email
 * 2. User clicks link in email (gets JWT token from query param)
 * 3. System verifies JWT signature, checks DB, validates expiration
 * 4. System marks user as verified, marks token as used
 * 5. User can resend verification email if needed
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
import { EmailVerificationToken } from '../../src/domain/value-objects/EmailVerificationToken';
import { Email } from '../../src/domain/value-objects/Email';

describe('Custom JWT Token Email Verification Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];
  const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret';

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

  beforeAll(async () => {
    supabaseClient = createTestSupabaseClient();
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;
  }, 30000);

  afterAll(async () => {
    if (testEmails.length > 0) {
      await cleanupTestUsers(supabaseClient, testEmails);
    }
    if (cleanup) {
      await cleanup();
    }
  });

  describe('GET /auth/verify-email', () => {
    describe('Happy Path', () => {
      it('should verify email successfully with valid JWT token', async () => {
        const email = generateTestEmail('verify-success');
        testEmails.push(email);

        // Register user
        const registerResponse = await request(app)
          .post('/auth/register')
          .send({
            email,
            password: 'TestPassword123!',
            fullName: 'Verify Success Test',
            phoneNumber: '0901234567',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          });

        expect(registerResponse.status).toBe(201);
        expect(registerResponse.body.success).toBe(true);
        const pendingRegistrationId = registerResponse.body.pendingRegistrationId;

        // Get token from pending_registrations table (verify-first flow)
        const { data: tokenData } = await supabaseClient
          .from('pending_registrations')
          .select('verification_token')
          .eq('id', pendingRegistrationId)
          .eq('is_used', false)
          .single();

        expect(tokenData).toBeTruthy();
        expect(tokenData!.verification_token).toBeTruthy();

        // Verify email with token
        const verifyResponse = await request(app)
          .get(`/auth/verify-email?token=${tokenData!.verification_token}`);

        expect(verifyResponse.status).toBe(200);
        expect(verifyResponse.body.success).toBe(true);
        expect(verifyResponse.body.userId).toBeTruthy(); // User created after verification
        expect(verifyResponse.body.email).toBe(email);
        expect(verifyResponse.body.message).toContain('xác thực thành công');

        // Verify user is created in user_profiles table
        const createdUserId = verifyResponse.body.userId;
        const { data: userData } = await supabaseClient
          .from('user_profiles')
          .select('is_verified')
          .eq('id', createdUserId)
          .single();

        expect(userData).toBeTruthy();
        expect(userData!.is_verified).toBe(true);

        // Verify pending_registration is deleted (verify-first flow cleanup)
        const { data: deletedPendingReg } = await supabaseClient
          .from('pending_registrations')
          .select('id')
          .eq('id', pendingRegistrationId)
          .maybeSingle();

        expect(deletedPendingReg).toBeNull(); // Should be deleted after successful verification
      });
    });

    describe('Validation Errors', () => {
      it('should fail with missing token', async () => {
        const response = await request(app)
          .get('/auth/verify-email');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
      });

      it('should fail with empty token', async () => {
        const response = await request(app)
          .get('/auth/verify-email?token=');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
      });

      it('should fail with invalid JWT token', async () => {
        const response = await request(app)
          .get('/auth/verify-email?token=invalid-jwt-token');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
        expect(response.body.message).toContain('không hợp lệ hoặc đã hết hạn');
      });
    });

    describe('Token Validation', () => {
      it('should fail with token not found in database', async () => {
        // Generate valid JWT token but not stored in database
        const email = Email.create('notindb@hospital.vn');
        const fakeToken = EmailVerificationToken.generate('fake-user-id', email, jwtSecret, 24);

        const response = await request(app)
          .get(`/auth/verify-email?token=${fakeToken.token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('TOKEN_NOT_FOUND');
        expect(response.body.message).toContain('không tồn tại');
      });

      it('should fail with already used token (verify-first flow)', async () => {
        const email = generateTestEmail('verify-used-token');
        testEmails.push(email);

        // Register user
        const registerResponse = await request(app)
          .post('/auth/register')
          .send({
            email,
            password: 'TestPassword123!',
            fullName: 'Used Token Test',
            phoneNumber: '0901234568',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          });

        const pendingRegistrationId = registerResponse.body.pendingRegistrationId;

        // Get token from pending_registrations
        const { data: tokenData } = await supabaseClient
          .from('pending_registrations')
          .select('verification_token')
          .eq('id', pendingRegistrationId)
          .eq('is_used', false)
          .single();

        // Verify first time (should succeed and delete pending_registration)
        const firstVerify = await request(app).get(`/auth/verify-email?token=${tokenData!.verification_token}`);
        expect(firstVerify.status).toBe(200);

        // Verify second time (should fail with TOKEN_NOT_FOUND)
        // In verify-first flow, pending_registration is deleted after successful verification
        const response = await request(app)
          .get(`/auth/verify-email?token=${tokenData!.verification_token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('TOKEN_NOT_FOUND');
        expect(response.body.message).toContain('không tồn tại hoặc đã hết hạn');
      });

      it('should fail with expired token', async () => {
        const email = generateTestEmail('verify-expired-token');
        testEmails.push(email);

        // Register user first to get token
        const registerResponse = await request(app)
          .post('/auth/register')
          .send({
            email,
            password: 'TestPassword123!',
            fullName: 'Expired Token Test',
            phoneNumber: '0901234569',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          });

        const pendingRegistrationId = registerResponse.body.pendingRegistrationId;

        // Get the token before deleting
        const { data: originalData } = await supabaseClient
          .from('pending_registrations')
          .select('verification_token, password_hash, user_data')
          .eq('id', pendingRegistrationId)
          .single();

        // Delete the original pending_registration
        await supabaseClient
          .from('pending_registrations')
          .delete()
          .eq('id', pendingRegistrationId);

        // Create new pending_registration with expired dates
        // Set both created_at and expires_at to past (25 hours ago)
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 25);
        const createdDate = new Date();
        createdDate.setHours(createdDate.getHours() - 26); // 26 hours ago (before expires_at)

        await supabaseClient
          .from('pending_registrations')
          .insert({
            id: pendingRegistrationId,
            email,
            password_hash: originalData!.password_hash,
            user_data: originalData!.user_data,
            verification_token: originalData!.verification_token,
            created_at: createdDate.toISOString(),
            expires_at: expiredDate.toISOString(),
            is_used: false,
            status: 'EMAIL_SENT'
          });

        // Wait for DB insert to complete
        await new Promise(resolve => setTimeout(resolve, 200));

        const response = await request(app)
          .get(`/auth/verify-email?token=${originalData!.verification_token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('TOKEN_EXPIRED');
        expect(response.body.message).toContain('đã hết hạn');
      });
    });

    describe('User Validation', () => {
      it('should fail when pending registration not found', async () => {
        // Create token for non-existent pending registration
        const email = Email.create('notindb@hospital.vn');
        const token = EmailVerificationToken.generate('pending', email, jwtSecret, 24);

        // Don't store in database - token won't be found

        const response = await request(app)
          .get(`/auth/verify-email?token=${token.token}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('TOKEN_NOT_FOUND');
      });
    });
  });

  describe('POST /auth/resend-verification', () => {
    describe('Happy Path', () => {
      it('should return security message for non-existent user (verify-first flow)', async () => {
        const email = generateTestEmail('resend-success');
        testEmails.push(email);

        // In verify-first flow, resend only works for users who exist but haven't verified
        // Since we register → verify → user created with verified=true,
        // resend will return security message for non-existent pending registration

        // Resend verification for non-existent user
        const response = await request(app)
          .post('/auth/resend-verification')
          .send({ email });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Security message - don't reveal if email exists
        expect(response.body.message).toContain('Nếu email tồn tại trong hệ thống');
      });
    });

    describe('Validation Errors', () => {
      it('should fail with invalid email format', async () => {
        const response = await request(app)
          .post('/auth/resend-verification')
          .send({ email: 'invalid-email' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
      });

      it('should fail with missing email', async () => {
        const response = await request(app)
          .post('/auth/resend-verification')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
      });
    });

    describe('Business Logic', () => {
      it('should not reveal if email exists (security)', async () => {
        const nonExistentEmail = generateTestEmail('resend-nonexistent');

        const response = await request(app)
          .post('/auth/resend-verification')
          .send({ email: nonExistentEmail });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Nếu email tồn tại');
      });

      it('should return security message for non-existent user (verify-first)', async () => {
        const email = generateTestEmail('resend-already-verified');
        testEmails.push(email);

        // In verify-first flow, after register user doesn't exist yet
        // Only pending_registration exists
        // Resend will return security message

        // Try to resend for non-existent user
        const response = await request(app)
          .post('/auth/resend-verification')
          .send({ email });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Security message - don't reveal if email exists
        expect(response.body.message).toContain('Nếu email tồn tại trong hệ thống');
      });

      it('should return security message (verify-first flow)', async () => {
        const email = generateTestEmail('resend-rate-limit');
        testEmails.push(email);

        // In verify-first flow, resend only works for existing users
        // Since user doesn't exist yet (only pending_registration),
        // all resend attempts will return security message

        // Multiple resend attempts
        for (let i = 0; i < 4; i++) {
          const response = await request(app)
            .post('/auth/resend-verification')
            .send({ email });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.message).toContain('Nếu email tồn tại trong hệ thống');
        }
      });
    });
  });
});

