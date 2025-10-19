import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

/**
 * E2E Tests for Email Verification Flow (Custom JWT Tokens)
 * 
 * Test Coverage:
 * - Patient Registration → Email Verification Token Generated
 * - Verify Email with Valid Token
 * - Verify Email with Invalid/Expired Token
 * - Resend Verification Email
 * - Login Before/After Email Verification
 * - Rate Limiting on Resend
 */

test.describe('Email Verification Flow', () => {
  const baseURL = 'http://localhost:3021';
  let testPatientEmail: string;
  let testPatientPassword: string;
  let userId: string;
  let verificationToken: string;

  // Supabase client for database operations
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  test.beforeAll(() => {
    // Generate unique test data
    const uniqueId = uuidv4().substring(0, 8);
    testPatientEmail = `verify-${uniqueId}@test.com`;
    testPatientPassword = 'TestPass123!';
  });

  test.afterAll(async () => {
    // Cleanup: Delete test user and tokens
    if (userId) {
      await supabase.from('email_verification_tokens').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);
    }
  });

  test.describe('Patient Registration with Email Verification', () => {
    test('should register patient and generate verification token', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          email: testPatientEmail,
          password: testPatientPassword,
          fullName: 'Nguyễn Văn Verify',
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

      userId = body.userId;

      // Verify token was created in database
      const { data: tokenData, error } = await supabase
        .from('email_verification_tokens')
        .select('token, expires_at, is_used')
        .eq('user_id', userId)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(tokenData).toBeTruthy();
      expect(tokenData.token).toBeTruthy();
      expect(tokenData.is_used).toBe(false);

      verificationToken = tokenData.token;
    });

    test('should prevent login before email verification', async ({ request }) => {
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
    });
  });

  test.describe('Email Verification', () => {
    test('should verify email with valid token', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/verify-email?token=${verificationToken}`);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.userId).toBe(userId);
      expect(body.email).toBe(testPatientEmail);
      expect(body.message).toContain('xác thực thành công');

      // Verify user is marked as verified in database
      const { data: userData } = await supabase
        .from('users')
        .select('is_email_verified')
        .eq('id', userId)
        .single();

      expect(userData.is_email_verified).toBe(true);

      // Verify token is marked as used
      const { data: tokenData } = await supabase
        .from('email_verification_tokens')
        .select('is_used, used_at')
        .eq('token', verificationToken)
        .single();

      expect(tokenData.is_used).toBe(true);
      expect(tokenData.used_at).toBeTruthy();
    });

    test('should allow login after email verification', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          email: testPatientEmail,
          password: testPatientPassword
        }
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
    });

    test('should reject already used token', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/verify-email?token=${verificationToken}`);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('TOKEN_ALREADY_USED');
    });

    test('should reject invalid token', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/verify-email?token=invalid-token-123`);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('INVALID_TOKEN');
    });

    test('should reject empty token', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/verify-email?token=`);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('INVALID_TOKEN');
    });
  });

  test.describe('Resend Verification Email', () => {
    let newUserEmail: string;
    let newUserId: string;

    test.beforeAll(() => {
      const uniqueId = uuidv4().substring(0, 8);
      newUserEmail = `resend-${uniqueId}@test.com`;
    });

    test.afterAll(async () => {
      if (newUserId) {
        await supabase.from('email_verification_tokens').delete().eq('user_id', newUserId);
        await supabase.from('users').delete().eq('id', newUserId);
      }
    });

    test('should register new user for resend tests', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: newUserEmail,
          password: 'TestPass123!',
          fullName: 'Nguyễn Văn Resend',
          phoneNumber: '0901234568',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      newUserId = body.userId;
    });

    test('should resend verification email successfully', async ({ request }) => {
      // Get old token count
      const { data: oldTokens } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('user_id', newUserId);

      const oldTokenCount = oldTokens?.length || 0;

      const response = await request.post(`${baseURL}/auth/resend-verification`, {
        data: {
          email: newUserEmail
        }
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('Email xác thực đã được gửi lại');

      // Verify old tokens are invalidated
      const { data: invalidatedTokens } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('user_id', newUserId)
        .eq('is_used', true);

      expect(invalidatedTokens?.length).toBe(oldTokenCount);

      // Verify new token is created
      const { data: newTokens } = await supabase
        .from('email_verification_tokens')
        .select('*')
        .eq('user_id', newUserId)
        .eq('is_used', false);

      expect(newTokens?.length).toBe(1);
    });

    test('should enforce rate limiting (max 3 active tokens)', async ({ request }) => {
      // Resend 3 times (should succeed)
      for (let i = 0; i < 3; i++) {
        const response = await request.post(`${baseURL}/auth/resend-verification`, {
          data: { email: newUserEmail }
        });
        expect(response.status()).toBe(200);
      }

      // 4th attempt should fail
      const response = await request.post(`${baseURL}/auth/resend-verification`, {
        data: { email: newUserEmail }
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should not reveal if email exists (security)', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/resend-verification`, {
        data: {
          email: 'nonexistent@test.com'
        }
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toContain('Nếu email tồn tại');
    });
  });
});

