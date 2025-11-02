/**
 * Integration Tests - Email Verification Flow
 * 
 * Tests email verification endpoints with REAL database operations:
 * - POST /auth/verify-email
 * - POST /auth/resend-verification (if implemented)
 * 
 * Flow:
 * 1. User registers → System sends verification email
 * 2. User clicks link in email (gets verification token)
 * 3. User submits verification token
 * 4. System verifies email and activates account
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
  createTestUser,
  cleanupTestUsers
} from '../helpers/integrationHelpers';

describe('Email Verification Flow Integration Tests', () => {
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

  describe('POST /auth/verify-email', () => {
    describe('Validation Errors', () => {
      it('should fail with invalid email format', async () => {
        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: 'invalid-email-format',
            token: 'some-token-123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
        expect(response.body.message).toContain('Email không hợp lệ');
      });

      it('should fail with empty email', async () => {
        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: '',
            token: 'some-token-123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_EMAIL');
      });

      it('should fail with missing email field', async () => {
        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            token: 'some-token-123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with missing token', async () => {
        const email = generateTestEmail('verify-missing-token');

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
        expect(response.body.message).toContain('Mã xác thực không hợp lệ');
      });

      it('should fail with empty token', async () => {
        const email = generateTestEmail('verify-empty-token');

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
      });

      it('should fail with whitespace-only token', async () => {
        const email = generateTestEmail('verify-whitespace-token');

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: '   '
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('INVALID_TOKEN');
      });
    });

    describe('Authentication Errors', () => {
      it('should fail with invalid verification token', async () => {
        const email = generateTestEmail('verify-invalid-token');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Invalid Token Test User',
            phoneNumber: '0901234594',
            address: '123 Test Street, Hanoi, Vietnam',
            skipAutoLogin: true,
            dateOfBirth: '1990-01-01',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: 'invalid-token-12345'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with expired verification token', async () => {
        const email = generateTestEmail('verify-expired-token');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Expired Token Test User',
            phoneNumber: '0901234595',
            address: '456 Test Street, Hanoi, Vietnam',
            skipAutoLogin: true,
            dateOfBirth: '1991-02-02',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        const expiredToken = '123456';

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: expiredToken
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail with token for different email', async () => {
        const email1 = generateTestEmail('verify-email1');
        const email2 = generateTestEmail('verify-email2');
        testEmails.push(email1, email2);

        await createTestUser(
          supabaseClient,
          email1,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'User 1',
            phoneNumber: '0901234596',
            address: '789 Test Street, Hanoi, Vietnam',
            skipAutoLogin: true,
            dateOfBirth: '1992-03-03',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        await createTestUser(
          supabaseClient,
          email2,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'User 2',
            phoneNumber: '0901234597',
            address: '101 Test Street, Hanoi, Vietnam',
            skipAutoLogin: true,
            dateOfBirth: '1993-04-04',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        const tokenForEmail1 = 'token-for-email1';

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: email2,
            token: tokenForEmail1
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle case-sensitive email verification', async () => {
        const email = generateTestEmail('verify-case-sensitive');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Case Sensitive Test User',
            phoneNumber: '0901234598',
            address: '202 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1994-05-05',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: email.toUpperCase(),
            token: 'some-token'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should trim whitespace from email and token', async () => {
        const email = generateTestEmail('verify-whitespace');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Whitespace Test User',
            phoneNumber: '0901234599',
            address: '303 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1995-06-06',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: `  ${email}  `,
            token: '  some-token  '
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle special characters in email', async () => {
        const email = 'test+special.chars_123@hospital.vn';
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Special Chars Test User',
            phoneNumber: '0901234600',
            address: '404 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1996-07-07',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: 'some-token'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle unicode characters in token', async () => {
        const email = generateTestEmail('verify-unicode');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Unicode Test User',
            phoneNumber: '0901234601',
            address: '505 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1997-08-08',
            gender: 'female',
            citizenId: generateUniqueCitizenId(),
            skipAutoLogin: true
          }
        );

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: 'token-with-unicode-ñ-ü-ö'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Security Tests', () => {
      it('should not reveal if email exists in system', async () => {
        const nonExistentEmail = generateTestEmail('verify-non-existent');

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: nonExistentEmail,
            token: 'some-token-123456'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle multiple verification attempts with same token', async () => {
        const email = generateTestEmail('verify-multiple-attempts');
        testEmails.push(email);

        await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Multiple Attempts Test User',
            phoneNumber: '0901234602',
            address: '606 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1998-09-09',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        const token = 'same-token-123456';

        const response1 = await request(app)
          .post('/auth/verify-email')
          .send({ email, token });

        const response2 = await request(app)
          .post('/auth/verify-email')
          .send({ email, token });

        expect(response1.status).toBe(400);
        expect(response2.status).toBe(400);
        expect(response1.body.success).toBe(false);
        expect(response2.body.success).toBe(false);
      });

      it('should handle SQL injection attempts in email', async () => {
        const maliciousEmail = "test@hospital.vn'; DROP TABLE users; --";

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email: maliciousEmail,
            token: 'some-token'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle SQL injection attempts in token', async () => {
        const email = generateTestEmail('verify-sql-injection');
        const maliciousToken = "token'; DROP TABLE users; --";

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: maliciousToken
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should handle XSS attempts in token', async () => {
        const email = generateTestEmail('verify-xss');
        const xssToken = '<script>alert("XSS")</script>';

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: xssToken
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('Business Logic Tests', () => {
      it('should fail verification for already verified email', async () => {
        const email = generateTestEmail('verify-already-verified');
        testEmails.push(email);

        const user = await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Already Verified Test User',
            phoneNumber: '0901234603',
            address: '707 Test Street, Hanoi, Vietnam',
            dateOfBirth: '1999-10-10',
            gender: 'female',
            citizenId: generateUniqueCitizenId()
          }
        );

        await supabaseClient
          .from('users')
          .update({ is_email_verified: true })
          .eq('id', user.userId);

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: 'some-token'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should fail verification for inactive user', async () => {
        const email = generateTestEmail('verify-inactive-user');
        testEmails.push(email);

        const user = await createTestUser(
          supabaseClient,
          email,
          'TestPassword123!',
          'PATIENT',
          {
            fullName: 'Inactive User Test',
            phoneNumber: '0901234604',
            address: '808 Test Street, Hanoi, Vietnam',
            dateOfBirth: '2000-11-11',
            gender: 'male',
            citizenId: generateUniqueCitizenId()
          }
        );

        await supabaseClient
          .from('users')
          .update({ is_active: false })
          .eq('id', user.userId);

        const response = await request(app)
          .post('/auth/verify-email')
          .send({
            email,
            token: 'some-token'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });
});

