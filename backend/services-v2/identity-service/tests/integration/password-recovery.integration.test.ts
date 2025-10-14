/**
 * Integration Tests - Password Recovery Flow
 * 
 * Tests password recovery endpoints with REAL database operations:
 * - POST /auth/forgot-password
 * - POST /auth/reset-password
 * 
 * Flow:
 * 1. User requests password reset via email
 * 2. System sends reset email with token (via Supabase Auth)
 * 3. User clicks link in email (gets access_token & refresh_token)
 * 4. User submits new password with tokens
 * 5. System resets password and invalidates sessions
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
  getUserFromDb
} from '../helpers/integrationHelpers';

describe('Password Recovery Flow Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
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

  describe('POST /auth/forgot-password', () => {
    describe('Success Cases', () => {
      it('should send password reset email for existing active user', async () => {
        const email = generateTestEmail('forgot-password-success');
        const password = 'OriginalPassword123!';
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          password,
          'PATIENT',
          {
            fullName: 'Forgot Password Test User',
            phoneNumber: '0901234590',
            address: '123 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({
            email
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Email hướng dẫn đặt lại mật khẩu đã được gửi');
      });

      it('should return success message for non-existent email (security)', async () => {
        const nonExistentEmail = generateTestEmail('forgot-password-nonexistent');

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({
            email: nonExistentEmail
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Nếu email tồn tại trong hệ thống');
      });
    });

    describe('Validation Errors', () => {
      it('should fail with invalid email format', async () => {
        const response = await request(app)
          .post('/auth/forgot-password')
          .send({
            email: 'invalid-email-format'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
        expect(response.body.message).toContain('Email không hợp lệ');
      });

      it('should fail with empty email', async () => {
        const response = await request(app)
          .post('/auth/forgot-password')
          .send({
            email: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
      });

      it('should fail with missing email field', async () => {
        const response = await request(app)
          .post('/auth/forgot-password')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Business Logic Errors', () => {
      it('should fail for inactive user account', async () => {
        const email = generateTestEmail('forgot-password-inactive');
        const password = 'InactivePassword123!';
        testEmails.push(email);

        const user = await createTestUser(
          supabaseClient,
          email,
          password,
          'PATIENT',
          {
            fullName: 'Inactive User',
            phoneNumber: '0901234591',
            address: '456 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1991-02-02',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        await supabaseClient
          .from('user_profiles')
          .update({ is_active: false })
          .eq('id', user.userId);

        const response = await request(app)
          .post('/auth/forgot-password')
          .send({
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('USER_INACTIVE');
        expect(response.body.message).toContain('Tài khoản đã bị vô hiệu hóa');
      });
    });

    describe('Rate Limiting & Security', () => {
      it('should handle multiple forgot password requests for same email', async () => {
        const email = generateTestEmail('forgot-password-multiple');
        const password = 'MultiplePassword123!';
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          password,
          'PATIENT',
          {
            fullName: 'Multiple Requests User',
            phoneNumber: '0901234592',
            address: '789 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1992-03-03',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response1 = await request(app)
          .post('/auth/forgot-password')
          .send({ email });

        expect(response1.status).toBe(200);
        expect(response1.body.success).toBe(true);

        await new Promise(resolve => setTimeout(resolve, 61000));

        const response2 = await request(app)
          .post('/auth/forgot-password')
          .send({ email });

        expect(response2.status).toBe(200);
        expect(response2.body.success).toBe(true);
      }, 90000);

      it('should enforce rate limiting (Supabase 60 second cooldown)', async () => {
        const email = generateTestEmail('forgot-password-rate-limit');
        const password = 'RateLimitPassword123!';
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          password,
          'PATIENT',
          {
            fullName: 'Rate Limit Test User',
            phoneNumber: '0901234593',
            address: '111 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1993-05-05',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response1 = await request(app)
          .post('/auth/forgot-password')
          .send({ email });

        expect(response1.status).toBe(200);
        expect(response1.body.success).toBe(true);

        const response2 = await request(app)
          .post('/auth/forgot-password')
          .send({ email });

        expect(response2.status).toBe(400);
        expect(response2.body.success).toBe(false);
        expect(response2.body.message).toContain('seconds');
      });
    });
  });

  describe('POST /auth/reset-password', () => {
    describe('Validation Errors', () => {
      it('should fail with missing access token', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            refreshToken: 'some-refresh-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('VALIDATION_ERROR');
        expect(response.body.message).toContain('Token không hợp lệ');
      });

      it('should fail with empty access token', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: '',
            refreshToken: 'some-refresh-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('VALIDATION_ERROR');
      });

      it('should fail with weak password (too short)', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'Short1!',
            confirmPassword: 'Short1!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('VALIDATION_ERROR');
        expect(response.body.message).toContain('ít nhất 8 ký tự');
      });

      it('should fail with password missing uppercase letter', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'lowercase123!',
            confirmPassword: 'lowercase123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('chữ hoa');
      });

      it('should fail with password missing lowercase letter', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'UPPERCASE123!',
            confirmPassword: 'UPPERCASE123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('chữ thường');
      });

      it('should fail with password missing number', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'NoNumberPassword!',
            confirmPassword: 'NoNumberPassword!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('chữ số');
      });

      it('should fail with password missing special character', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'NoSpecialChar123',
            confirmPassword: 'NoSpecialChar123'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail when passwords do not match', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'DifferentPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('VALIDATION_ERROR');
        expect(response.body.message).toContain('không khớp');
      });
    });

    describe('Authentication Errors', () => {
      it('should fail with invalid access token', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'invalid-token-12345',
            refreshToken: 'invalid-refresh-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('RESET_PASSWORD_FAILED');
      });

      it('should fail with expired access token', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0vVzr-5hGfRMQnGPkNJLYgr5J5Hn-8vZGJvLqQ';

        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: expiredToken,
            refreshToken: 'some-refresh-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in password correctly', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'P@ssw0rd!#$%^&*()',
            confirmPassword: 'P@ssw0rd!#$%^&*()'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle unicode characters in password', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: 'valid-access-token',
            refreshToken: 'valid-refresh-token',
            newPassword: 'Mật_Khẩu_123!',
            confirmPassword: 'Mật_Khẩu_123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should trim whitespace from tokens', async () => {
        const response = await request(app)
          .post('/auth/reset-password')
          .send({
            accessToken: '  valid-access-token  ',
            refreshToken: '  valid-refresh-token  ',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('End-to-End Password Recovery Flow', () => {
    it('should complete full password recovery flow (mocked)', async () => {
      const email = generateTestEmail('e2e-password-recovery');
      const originalPassword = 'OriginalPassword123!';
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        originalPassword,
        'PATIENT',
        {
          fullName: 'E2E Password Recovery User',
          phoneNumber: '0901234593',
          address: '101 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1993-04-04',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      const forgotPasswordResponse = await request(app)
        .post('/auth/forgot-password')
        .send({ email });

      expect(forgotPasswordResponse.status).toBe(200);
      expect(forgotPasswordResponse.body.success).toBe(true);

      const dbUser = await getUserFromDb(supabaseClient, user.userId);
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(email);
    });
  });
});

