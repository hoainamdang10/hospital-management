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
import { TestUserPool } from '../helpers/test-user-pool';
import { testUserPoolCache } from '../helpers/test-user-pool-cache';

describe('User Routes Integration Tests', () => {
  let app: Application;
  let supabaseClient: SupabaseClient;
  let cleanup: () => Promise<void>;
  const testEmails: string[] = [];

  // Sử dụng User Pool Cache (seeds once for all tests)
  let userPool: TestUserPool;

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

    // Get cached test user pool (seeds once, reuses for all tests)
    userPool = await testUserPoolCache.getPool(supabaseClient);
    
    console.log(' Test setup complete with user pool');
    console.log('DEBUG - Admin token:', userPool.admin.token ? `${userPool.admin.token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('DEBUG - Patient token:', userPool.patient.token ? `${userPool.patient.token.substring(0, 20)}...` : 'NO TOKEN');
  }, 90000); // 90 second timeout for setup

  afterAll(async () => {
    // Note: User pool is cached and will be cleaned up in global teardown
    // We only cleanup additional test users created during tests

    // Cleanup any additional test users created in tests
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
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBe(userPool.patient.userId);
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
        .get(`/api/v1/users/${userPool.patient.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(userPool.patient.userId);
    });

    it('should allow admin to get any user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userPool.patient.userId}`)
        .set('Authorization', `Bearer ${userPool.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(userPool.patient.userId);
    });

    it('should fail when patient tries to get another user profile', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userPool.admin.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(403);
    });

    it('should fail with invalid userId', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${userPool.admin.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should allow admin to list all users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userPool.admin.token}`);

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
        .set('Authorization', `Bearer ${userPool.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should support filtering by roleType', async () => {
      const response = await request(app)
        .get('/api/v1/users?roleType=PATIENT')
        .set('Authorization', `Bearer ${userPool.admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
    });

    it('should fail when non-admin tries to list users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    it('should allow user to update own profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${userPool.patient.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`)
        .send({
          fullName: 'Updated Patient Name',
          phoneNumber: '0909999999'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify changes in database
      const dbUser = await getUserFromDb(supabaseClient, userPool.patient.userId);
      expect(dbUser.full_name).toBe('Updated Patient Name');
      expect(dbUser.phone_number).toBe('0909999999');
    });

    it('should allow admin to update any user profile', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${userPool.patient.userId}`)
        .set('Authorization', `Bearer ${userPool.admin.token}`)
        .send({
          fullName: 'Admin Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail when patient tries to update another user', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${userPool.admin.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`)
        .send({
          fullName: 'Hacked Name'
        });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid data', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${userPool.patient.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`)
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
        .set('Authorization', `Bearer ${userPool.admin.token}`)
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
        .delete(`/api/v1/users/${userPool.admin.userId}`)
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:userId/change-password', () => {
    it('should allow user to change own password', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post(`/api/v1/users/${userPool.destructive.passwordChange.userId}/change-password`)
        .set('Authorization', `Bearer ${userPool.destructive.passwordChange.token}`)
        .send({
          currentPassword: 'PasswordChangePool123!',
          newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Note: Password đã thay đổi. Nếu cần test thêm với user này, 
      // sử dụng resetUserPassword() từ test-user-pool helper
    }, 60000); // 60 second timeout for password change with Supabase Auth

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userPool.destructive.passwordChange.userId}/change-password`)
        .set('Authorization', `Bearer ${userPool.destructive.passwordChange.token}`)
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
        .post(`/api/v1/users/${userPool.destructive.passwordChange.userId}/change-password`)
        .set('Authorization', `Bearer ${userPool.destructive.passwordChange.token}`)
        .send({
          currentPassword: 'PasswordChangePool123!',
          newPassword: 'NewPassword789!',
          confirmPassword: 'DifferentPassword789!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak new password', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userPool.destructive.passwordChange.userId}/change-password`)
        .set('Authorization', `Bearer ${userPool.destructive.passwordChange.token}`)
        .send({
          currentPassword: 'PasswordChangePool123!',
          newPassword: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/:userId/lock', () => {
    it('should allow admin to lock user account', async () => {
      // Sử dụng destructive.lockable user từ pool
      const response = await request(app)
        .post(`/api/v1/users/${userPool.destructive.lockable.userId}/lock`)
        .set('Authorization', `Bearer ${userPool.admin.token}`)
        .send({
          reason: 'Test lock account for integration testing',
          terminateSessions: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user is locked in database
      const dbUser = await getUserFromDb(supabaseClient, userPool.destructive.lockable.userId);
      expect(dbUser.is_active).toBe(false);
    });

    it('should fail when non-admin tries to lock user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userPool.admin.userId}/lock`)
        .set('Authorization', `Bearer ${userPool.patient.token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:userId/unlock', () => {
    it('should allow admin to unlock user account', async () => {
      // Use the user that was locked in the previous test
      // Query for users with account_status='locked' (not just is_active=false)
      const lockedUsers = await supabaseClient
        .from('user_profiles')
        .select('id, account_status')
        .eq('account_status', 'locked')
        .limit(1);

      if (lockedUsers.data && lockedUsers.data.length > 0) {
        const lockedUserId = lockedUsers.data[0].id;

        const response = await request(app)
          .post(`/api/v1/users/${lockedUserId}/unlock`)
          .set('Authorization', `Bearer ${userPool.admin.token}`)
          .send({
            reason: 'Test unlock for integration testing purposes'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify user is unlocked in database
        const dbUser = await getUserFromDb(supabaseClient, lockedUserId);
        expect(dbUser.is_active).toBe(true);
        expect(dbUser.account_status).toBe('active');
      }
    });

    it('should fail when non-admin tries to unlock user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userPool.admin.userId}/unlock`)
        .set('Authorization', `Bearer ${userPool.patient.token}`);

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
        .set('Authorization', `Bearer ${userPool.admin.token}`)
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
        .post(`/api/v1/users/${userPool.patient.userId}/assign-role`)
        .set('Authorization', `Bearer ${userPool.patient.token}`)
        .send({
          roleType: 'ADMIN'
        });

      expect(response.status).toBe(403);
    });

    it('should fail with invalid role type', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userForRoleAssignment.userId}/assign-role`)
        .set('Authorization', `Bearer ${userPool.admin.token}`)
        .send({
          roleType: 'INVALID_ROLE'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

