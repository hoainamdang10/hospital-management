/**
 * Integration Tests - User Routes
 * 
 * Tests user management endpoints with REAL database operations:
 * - GET /api/v1/users/me
 * - GET /api/v1/users/:userId
 * - GET /api/v1/users (list all)
 * - PATCH /api/v1/users/:userId
 * - DELETE /api/v1/users/:userId
 * - POST /api/v1/users/:userId/change-password
 * - POST /api/v1/users/:userId/lock
 * - POST /api/v1/users/:userId/unlock
 * - POST /api/v1/users/:userId/assign-role
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

describe('User Routes Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  // Test users
  let patientUser: { userId: string; email: string; password: string; accessToken: string };
  let adminUser: { userId: string; email: string; password: string; accessToken: string };
  let passwordChangeUser: { userId: string; email: string; password: string; accessToken: string };

  // Helper to generate unique test email
  const generateTestEmail = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}@hospital.vn`;
  };

  // Helper to generate unique citizen ID (12 digits)
  const generateUniqueCitizenId = (): string => {
    const timestamp = Date.now().toString(); // Full timestamp
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0'); // 5 random digits
    const combined = timestamp + random;
    // Take last 12 digits to ensure 12-digit format
    return combined.slice(-12);
  };

  beforeAll(async () => {
    // Create Supabase client with service_role key
    supabaseClient = createTestSupabaseClient();

    // Create Express app with real dependencies
    const result = await createTestApp();
    app = result.app;
    cleanup = result.cleanup;

    // Create test patient user
    const patientEmail = generateTestEmail('patient-user');
    const patientPassword = 'PatientPassword123!';
    testEmails.push(patientEmail);

    const patient = await createTestUser(
      supabaseClient,
      patientEmail,
      patientPassword,
      'PATIENT',
      {
        fullName: 'Test Patient User',
        phoneNumber: '0901234580',
        address: '123 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        citizenId: generateUniqueCitizenId()
      }
    );

    // Login to get access token
    const patientLoginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: patientEmail,
        password: patientPassword
      });

    console.log('Patient login response:', {
      status: patientLoginResponse.status,
      body: patientLoginResponse.body
    });

    if (!patientLoginResponse.body.accessToken) {
      throw new Error('Failed to get access token for patient user');
    }

    patientUser = {
      userId: patient.userId,
      email: patientEmail,
      password: patientPassword,
      accessToken: patientLoginResponse.body.accessToken
    };

    // Create test admin user
    const adminEmail = generateTestEmail('admin-user');
    const adminPassword = 'AdminPassword123!';
    testEmails.push(adminEmail);

    const admin = await createTestUser(
      supabaseClient,
      adminEmail,
      adminPassword,
      'ADMIN',
      {
        fullName: 'Test Admin User',
        phoneNumber: '0901234581',
        address: '456 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1985-05-05',
        gender: 'female',
        citizenId: generateUniqueCitizenId()
      }
    );

    // Login to get access token
    const adminLoginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: adminEmail,
        password: adminPassword
      });

    console.log('Admin login response:', {
      status: adminLoginResponse.status,
      body: adminLoginResponse.body
    });

    if (!adminLoginResponse.body.accessToken) {
      throw new Error('Failed to get access token for admin user');
    }

    adminUser = {
      userId: admin.userId,
      email: adminEmail,
      password: adminPassword,
      accessToken: adminLoginResponse.body.accessToken
    };

    // Create dedicated user for password change tests
    const passwordChangeEmail = generateTestEmail('password-change-user');
    const passwordChangePassword = 'PasswordChange123!';
    testEmails.push(passwordChangeEmail);

    const passwordChangeUserData = await createTestUser(
      supabaseClient,
      passwordChangeEmail,
      passwordChangePassword,
      'PATIENT',
      {
        fullName: 'Test Password Change User',
        phoneNumber: '0901234582',
        address: '789 Test Street, Hanoi, Vietnam',
        dateOfBirth: '1992-03-03',
        gender: 'male',
        citizenId: generateUniqueCitizenId()
      }
    );

    // Login to get access token
    const passwordChangeLoginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: passwordChangeEmail,
        password: passwordChangePassword
      });

    if (!passwordChangeLoginResponse.body.accessToken) {
      throw new Error('Failed to get access token for password change user');
    }

    passwordChangeUser = {
      userId: passwordChangeUserData.userId,
      email: passwordChangeEmail,
      password: passwordChangePassword,
      accessToken: passwordChangeLoginResponse.body.accessToken
    };
  }, 60000); // 60 second timeout for setup

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

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe(patientUser.userId);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should allow user to get own profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(patientUser.userId);
    });

    it('should allow admin to get any user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${patientUser.userId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(patientUser.userId);
    });

    it('should fail when patient tries to get another user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${adminUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should fail with invalid userId', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should allow admin to list all users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should support filtering by roleType', async () => {
      const response = await request(app)
        .get('/api/v1/users?roleType=PATIENT')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
    });

    it('should fail when non-admin tries to list users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    it('should allow user to update own profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${patientUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`)
        .send({
          fullName: 'Updated Patient Name',
          phoneNumber: '0909999999'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify changes in database
      const dbUser = await getUserFromDb(supabaseClient, patientUser.userId);
      expect(dbUser.full_name).toBe('Updated Patient Name');
      expect(dbUser.phone_number).toBe('0909999999');
    });

    it('should allow admin to update any user profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${patientUser.userId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({
          fullName: 'Admin Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail when patient tries to update another user', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${adminUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`)
        .send({
          fullName: 'Hacked Name'
        });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${patientUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`)
        .send({
          email: 'invalid-email' // Invalid email format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    let userToDelete: { userId: string; email: string; password: string };

    beforeAll(async () => {
      // Create user to delete
      const email = generateTestEmail('user-to-delete');
      const password = 'DeletePassword123!';
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        password,
        'PATIENT',
        {
          fullName: 'User To Delete',
          phoneNumber: '0901234582',
          address: '789 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1992-03-03',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      userToDelete = {
        userId: user.userId,
        email,
        password
      };
    });

    it('should allow admin to soft delete user', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userToDelete.userId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({
          reason: 'Test deletion'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user still exists but is_active = false
      const dbUser = await getUserFromDb(supabaseClient, userToDelete.userId);
      expect(dbUser).toBeDefined();
      expect(dbUser.is_active).toBe(false);
    });

    it('should fail when non-admin tries to delete user', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${adminUser.userId}`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:userId/change-password', () => {
    it('should allow user to change own password', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post(`/api/v1/users/${passwordChangeUser.userId}/change-password`)
        .set('Authorization', `Bearer ${passwordChangeUser.accessToken}`)
        .send({
          currentPassword: passwordChangeUser.password,
          newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Update password for future tests
      passwordChangeUser.password = newPassword;

      // Login again to get new access token after password change
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: passwordChangeUser.email,
          password: newPassword
        });

      if (loginResponse.body.accessToken) {
        passwordChangeUser.accessToken = loginResponse.body.accessToken;
      }
    }, 60000); // 60 second timeout for password change with Supabase Auth

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${passwordChangeUser.userId}/change-password`)
        .set('Authorization', `Bearer ${passwordChangeUser.accessToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${passwordChangeUser.userId}/change-password`)
        .set('Authorization', `Bearer ${passwordChangeUser.accessToken}`)
        .send({
          currentPassword: passwordChangeUser.password,
          newPassword: 'NewPassword789!',
          confirmPassword: 'DifferentPassword789!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak new password', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${passwordChangeUser.userId}/change-password`)
        .set('Authorization', `Bearer ${passwordChangeUser.accessToken}`)
        .send({
          currentPassword: passwordChangeUser.password,
          newPassword: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/:userId/lock', () => {
    let userToLock: { userId: string; email: string; password: string };

    beforeAll(async () => {
      // Create user to lock
      const email = generateTestEmail('user-to-lock');
      const password = 'LockPassword123!';
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        password,
        'PATIENT',
        {
          fullName: 'User To Lock',
          phoneNumber: '0901234583',
          address: '101 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1993-04-04',
          gender: 'female',
          citizenId: generateUniqueCitizenId()
        }
      );

      userToLock = {
        userId: user.userId,
        email,
        password
      };
    });

    it('should allow admin to lock user account', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userToLock.userId}/lock`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({
          reason: 'Test lock account for integration testing',
          terminateSessions: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is locked in database
      const dbUser = await getUserFromDb(supabaseClient, userToLock.userId);
      expect(dbUser.is_active).toBe(false);
    });

    it('should fail when non-admin tries to lock user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${adminUser.userId}/lock`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:userId/unlock', () => {
    it('should allow admin to unlock user account', async () => {
      // First, get a locked user (from previous test)
      const lockedUsers = await supabaseClient
        .from('user_profiles')
        .select('id')
        .eq('is_active', false)
        .limit(1);

      if (lockedUsers.data && lockedUsers.data.length > 0) {
        const lockedUserId = lockedUsers.data[0].id;

        const response = await request(app)
          .post(`/api/v1/users/${lockedUserId}/unlock`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({
            reason: 'Test unlock'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify user is unlocked in database
        const dbUser = await getUserFromDb(supabaseClient, lockedUserId);
        expect(dbUser.is_active).toBe(true);
      }
    });

    it('should fail when non-admin tries to unlock user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${adminUser.userId}/unlock`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:userId/assign-role', () => {
    let userForRoleAssignment: { userId: string; email: string; password: string };

    beforeAll(async () => {
      // Create user for role assignment
      const email = generateTestEmail('user-role-assignment');
      const password = 'RolePassword123!';
      testEmails.push(email);

      const user = await createTestUser(
        supabaseClient,
        email,
        password,
        'PATIENT',
        {
          fullName: 'User For Role Assignment',
          phoneNumber: '0901234584',
          address: '202 Test Street, Hanoi, Vietnam',
          dateOfBirth: '1994-05-05',
          gender: 'male',
          citizenId: generateUniqueCitizenId()
        }
      );

      userForRoleAssignment = {
        userId: user.userId,
        email,
        password
      };
    });

    it('should allow admin to assign role to user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userForRoleAssignment.userId}/assign-role`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({
          roleType: 'NURSE',
          reason: 'Promoted to nurse'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify role in database
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userForRoleAssignment.userId);

      expect(userRoles).toBeDefined();
      const roleNames = userRoles!.map(r => r.role_name);
      expect(roleNames).toContain('nurse');
    });

    it('should fail when non-admin tries to assign role', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${patientUser.userId}/assign-role`)
        .set('Authorization', `Bearer ${patientUser.accessToken}`)
        .send({
          roleType: 'ADMIN'
        });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid role type', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userForRoleAssignment.userId}/assign-role`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({
          roleType: 'INVALID_ROLE'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

