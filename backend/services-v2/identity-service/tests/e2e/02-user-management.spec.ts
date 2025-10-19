import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * E2E Tests for User Management
 * 
 * Test Coverage:
 * - Get User Profile
 * - Update User Profile
 * - List Users (Admin only)
 * - Delete User (Admin only)
 * - Permission Checks
 */

test.describe('User Management', () => {
  const baseURL = 'http://localhost:3021';
  
  let adminToken: string;
  let patientToken: string;
  let patientUserId: string;
  let doctorUserId: string;

  test.beforeAll(async ({ request }) => {
    // Create and login as admin
    const adminEmail = `admin-${uuidv4().substring(0, 8)}@test.com`;
    
    // Register admin (assuming there's a way to create admin - might need to use existing admin)
    // For now, we'll use a pre-existing admin account
    // In real scenario, you'd have a seed script or use Supabase directly
    
    // Login as existing admin (you need to have at least one admin in the system)
    const adminLoginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: 'admin@hospital.com', // Pre-seeded admin
        password: 'Admin123!'
      }
    });
    
    if (adminLoginResponse.ok()) {
      const adminBody = await adminLoginResponse.json();
      adminToken = adminBody.data.accessToken;
    }

    // Create and login as patient
    const patientEmail = `patient-${uuidv4().substring(0, 8)}@test.com`;
    const patientPassword = 'TestPass123!';

    const registerResponse = await request.post(`${baseURL}/auth/register`, {
      data: {
        email: patientEmail,
        password: patientPassword,
        fullName: 'Test Patient',
        phoneNumber: '0901234572',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      }
    });
    
    const registerBody = await registerResponse.json();
    patientUserId = registerBody.userId;

    const loginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: patientEmail,
        password: patientPassword
      }
    });
    
    const loginBody = await loginResponse.json();
    patientToken = loginBody.data.accessToken;
  });

  test.describe('Get User Profile', () => {
    test('should get own user profile', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/${patientUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(patientUserId);
      expect(body.data.role).toBe('PATIENT');
    });

    test('should reject getting user profile without authentication', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/${patientUserId}`);

      expect(response.status()).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('should reject getting non-existent user', async ({ request }) => {
      const fakeUserId = uuidv4();
      
      const response = await request.get(`${baseURL}/api/v1/users/${fakeUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_NOT_FOUND');
    });
  });

  test.describe('Update User Profile', () => {
    test('should update own profile', async ({ request }) => {
      const response = await request.patch(`${baseURL}/api/v1/users/${patientUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          fullName: 'Updated Patient Name',
          phoneNumber: '0901234573'
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.fullName).toBe('Updated Patient Name');
      expect(body.data.phoneNumber).toBe('0901234573');
    });

    test('should reject updating another user profile (non-admin)', async ({ request }) => {
      // Try to update admin's profile with patient token
      const fakeUserId = uuidv4();
      
      const response = await request.patch(`${baseURL}/api/v1/users/${fakeUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          fullName: 'Hacked Name'
        }
      });

      expect(response.status()).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PERMISSION_DENIED');
    });

    test('should reject updating with invalid data', async ({ request }) => {
      const response = await request.patch(`${baseURL}/api/v1/users/${patientUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          phoneNumber: '123' // Invalid phone number
        }
      });

      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('List Users (Admin Only)', () => {
    test.skip('should list all users as admin', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${baseURL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    test('should reject listing users as non-admin', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PERMISSION_DENIED');
    });
  });

  test.describe('Delete User (Admin Only)', () => {
    test.skip('should delete user as admin', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      // Create a user to delete
      const deleteEmail = `delete-${uuidv4().substring(0, 8)}@test.com`;

      const registerResponse = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: deleteEmail,
          password: 'TestPass123!',
          fullName: 'To Be Deleted',
          phoneNumber: '0901234574',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });
      
      const registerBody = await registerResponse.json();
      const userToDeleteId = registerBody.data.userId;

      // Delete the user
      const response = await request.delete(`${baseURL}/api/v1/users/${userToDeleteId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(204);
    });

    test('should reject deleting user as non-admin', async ({ request }) => {
      const fakeUserId = uuidv4();
      
      const response = await request.delete(`${baseURL}/api/v1/users/${fakeUserId}`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PERMISSION_DENIED');
    });

    test.skip('should reject deleting own account', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      // Try to delete self
      const response = await request.delete(`${baseURL}/api/v1/users/self`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(422);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_CANNOT_DELETE_SELF');
    });
  });

  test.describe('Search and Filter Users', () => {
    test.skip('should search users by email (Admin only)', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${baseURL}/api/v1/users?search=patient`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test.skip('should filter users by role (Admin only)', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const response = await request.get(`${baseURL}/api/v1/users?role=PATIENT`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // All returned users should be patients
      body.data.forEach((user: any) => {
        expect(user.role).toBe('PATIENT');
      });
    });
  });
});

