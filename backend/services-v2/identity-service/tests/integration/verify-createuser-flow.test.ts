/**
 * Verify CreateTestUser Flow Test
 * 
 * Mục đích: Kiểm tra chi tiết flow createTestUser và verify userId consistency
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createTestApp } from '../helpers/appFactory';
import {
  createTestSupabaseClient,
  createTestUser,
  cleanupTestUsers,
  generateTestEmail
} from '../helpers/integrationHelpers';

describe('Verify CreateTestUser Flow', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  beforeAll(async () => {
    supabaseClient = createTestSupabaseClient();
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    if (cleanup) {
      await cleanup();
    }
    await cleanupTestUsers(supabaseClient, testEmails);
  });

  it('should verify createTestUser creates user and returns correct userId', async () => {
    const testEmail = generateTestEmail('verify-createuser');
    const testPassword = 'VerifyPassword123!';
    testEmails.push(testEmail);

    console.log(' Step 1 - Check if auth user exists BEFORE createTestUser');
    const { data: beforeUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = beforeUsers?.users.find(u => u.email === testEmail);
    console.log('  Existing user:', existingUser ? `YES (ID: ${existingUser.id})` : 'NO');

    console.log(' Step 2 - Call createTestUser');
    const user = await createTestUser(
      supabaseClient,
      testEmail,
      testPassword,
      'PATIENT',
      {
        fullName: 'Verify CreateUser Test',
        phoneNumber: '0901234567',
        address: '123 Test Street',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        citizenId: `${Date.now()}`.slice(-12)
      }
    );

    console.log('  createTestUser returned userId:', user.userId);
    console.log('  createTestUser returned token (first 50 chars):', user.token.substring(0, 50));

    console.log(' Step 3 - Decode token from createTestUser');
    const decodedFromCreateUser = jwt.decode(user.token) as any;
    console.log('  Token sub (user ID):', decodedFromCreateUser?.sub);
    console.log('  Token email:', decodedFromCreateUser?.email);
    console.log('  Token session_id:', decodedFromCreateUser?.session_id);

    console.log(' Step 4 - Check if userId matches token sub');
    const matchFromCreateUser = user.userId === decodedFromCreateUser?.sub;
    console.log('  Match:', matchFromCreateUser ? ' YES' : ' NO');
    console.log('  user.userId:', user.userId);
    console.log('  token.sub:', decodedFromCreateUser?.sub);

    console.log(' Step 5 - Login again with same email/password');
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginResponse.status).toBe(200);
    const newToken = loginResponse.body.accessToken;
    console.log('  Login returned token (first 50 chars):', newToken.substring(0, 50));

    console.log(' Step 6 - Decode new token from login');
    const decodedFromLogin = jwt.decode(newToken) as any;
    console.log('  Token sub (user ID):', decodedFromLogin?.sub);
    console.log('  Token email:', decodedFromLogin?.email);
    console.log('  Token session_id:', decodedFromLogin?.session_id);

    console.log(' Step 7 - Check if new token matches original userId');
    const matchFromLogin = user.userId === decodedFromLogin?.sub;
    console.log('  Match:', matchFromLogin ? ' YES' : ' NO');
    console.log('  user.userId:', user.userId);
    console.log('  token.sub:', decodedFromLogin?.sub);

    console.log(' Step 8 - Check if both tokens have same user ID');
    const tokensMatch = decodedFromCreateUser?.sub === decodedFromLogin?.sub;
    console.log('  Tokens match:', tokensMatch ? ' YES' : ' NO');

    // Assertions
    expect(user.userId).toBe(decodedFromCreateUser?.sub);
    expect(user.userId).toBe(decodedFromLogin?.sub);
    expect(decodedFromCreateUser?.sub).toBe(decodedFromLogin?.sub);
  });

  it('should verify what happens when calling createTestUser with SAME email twice', async () => {
    const testEmail = generateTestEmail('duplicate-test');
    const testPassword = 'DuplicatePassword123!';
    testEmails.push(testEmail);

    console.log(' Test: What happens with duplicate email?');
    console.log('  Email:', testEmail);

    console.log(' Step 1 - Create user FIRST time');
    const user1 = await createTestUser(
      supabaseClient,
      testEmail,
      testPassword,
      'PATIENT',
      {
        fullName: 'First User',
        phoneNumber: '0901234567',
        address: '123 Test Street',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        citizenId: `${Date.now()}`.slice(-12)
      }
    );

    console.log('  First user ID:', user1.userId);

    console.log(' Step 2 - Try to create user SECOND time with SAME email');
    let user2Error: any = null;
    let user2: any = null;

    try {
      user2 = await createTestUser(
        supabaseClient,
        testEmail,
        testPassword,
        'PATIENT',
        {
          fullName: 'Second User',
          phoneNumber: '0901234568',
          address: '456 Test Street',
          dateOfBirth: '1991-01-01',
          gender: 'female',
          citizenId: `${Date.now() + 1}`.slice(-12)
        }
      );
      console.log('  Second user ID:', user2.userId);
      console.log('  Same as first?', user1.userId === user2.userId ? ' YES' : ' NO');
    } catch (error: any) {
      user2Error = error;
      console.log('   ERROR:', error.message);
    }

    // Verify behavior
    if (user2Error) {
      console.log(' createTestUser throws error on duplicate email');
      expect(user2Error).toBeDefined();
    } else if (user2) {
      console.log(' createTestUser does NOT throw error on duplicate email');
      console.log('  Returns same user ID?', user1.userId === user2.userId);
    }
  });
});
