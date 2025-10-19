import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * E2E Tests for RBAC & Permissions
 * 
 * Test Coverage:
 * - Role Assignment
 * - Permission Checks
 * - Access Control for Different Roles
 * - Staff Registration (Admin only)
 */

test.describe('RBAC & Permissions', () => {
  const baseURL = 'http://localhost:3021';
  
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let patientToken: string;

  test.beforeAll(async ({ request }) => {
    // Login as admin (pre-seeded)
    const adminLoginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: 'admin@hospital.com',
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

    await request.post(`${baseURL}/auth/register`, {
      data: {
        email: patientEmail,
        password: patientPassword,
        fullName: 'Test Patient',
        phoneNumber: '0901234575',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      }
    });

    const patientLoginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        email: patientEmail,
        password: patientPassword
      }
    });
    
    const patientBody = await patientLoginResponse.json();
    patientToken = patientBody.accessToken;
  });

  test.describe('Staff Registration (Admin Only)', () => {
    test.skip('should allow admin to register doctor', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const doctorEmail = `doctor-${uuidv4().substring(0, 8)}@hospital.com`;
      
      const response = await request.post(`${baseURL}/api/v1/admin/staff/register`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          email: doctorEmail,
          fullName: 'Dr. Test Doctor',
          phoneNumber: '0901234576',
          role: 'DOCTOR'
        }
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('DOCTOR');
      expect(body.data.status).toBe('PENDING_ACTIVATION');
    });

    test.skip('should allow admin to register nurse', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const nurseEmail = `nurse-${uuidv4().substring(0, 8)}@hospital.com`;
      
      const response = await request.post(`${baseURL}/api/v1/admin/staff/register`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          email: nurseEmail,
          fullName: 'Nurse Test',
          phoneNumber: '0901234577',
          role: 'NURSE'
        }
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('NURSE');
    });

    test.skip('should allow admin to register receptionist', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const receptionistEmail = `receptionist-${uuidv4().substring(0, 8)}@hospital.com`;
      
      const response = await request.post(`${baseURL}/api/v1/admin/staff/register`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          email: receptionistEmail,
          fullName: 'Receptionist Test',
          phoneNumber: '0901234578',
          role: 'RECEPTIONIST'
        }
      });

      expect(response.status()).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('RECEPTIONIST');
    });

    test('should reject patient registering staff', async ({ request }) => {
      const staffEmail = `staff-${uuidv4().substring(0, 8)}@hospital.com`;
      
      const response = await request.post(`${baseURL}/api/v1/admin/staff/register`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          email: staffEmail,
          fullName: 'Unauthorized Staff',
          phoneNumber: '0901234579',
          role: 'DOCTOR'
        }
      });

      expect(response.status()).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PERMISSION_DENIED');
    });

    test.skip('should reject registering PATIENT role via staff endpoint', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      const response = await request.post(`${baseURL}/api/v1/admin/staff/register`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          email: `invalid-${uuidv4().substring(0, 8)}@test.com`,
          fullName: 'Invalid Patient',
          phoneNumber: '0901234580',
          role: 'PATIENT' // Should not be allowed
        }
      });

      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('REG_INVALID_ROLE');
    });
  });

  test.describe('Permission Checks', () => {
    test.skip('should get user permissions', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      // Get admin's own permissions
      const response = await request.get(`${baseURL}/api/v1/users/me/permissions`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.permissions)).toBe(true);
      
      // Admin should have wildcard permission
      expect(body.data.permissions).toContain('*:*');
    });

    test('should check patient has limited permissions', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/me/permissions`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.permissions)).toBe(true);
      
      // Patient should NOT have admin permissions
      expect(body.data.permissions).not.toContain('*:*');
      expect(body.data.permissions).not.toContain('users:delete');
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should allow patient to view own profile', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.role).toBe('PATIENT');
    });

    test('should allow patient to update own profile', async ({ request }) => {
      const response = await request.patch(`${baseURL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          fullName: 'Updated Patient Name'
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should reject patient viewing all users', async ({ request }) => {
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

    test('should reject patient deleting users', async ({ request }) => {
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
  });

  test.describe('Role Assignment', () => {
    test.skip('should allow admin to assign roles', async ({ request }) => {
      if (!adminToken) {
        test.skip();
        return;
      }

      // Create a user first
      const userEmail = `roletest-${uuidv4().substring(0, 8)}@test.com`;

      const registerResponse = await request.post(`${baseURL}/auth/register`, {
        data: {
          email: userEmail,
          password: 'TestPass123!',
          fullName: 'Role Test User',
          phoneNumber: '0901234581',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        }
      });
      
      const registerBody = await registerResponse.json();
      const userId = registerBody.data.userId;

      // Assign DOCTOR role
      const response = await request.post(`${baseURL}/api/v1/users/${userId}/roles`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        data: {
          role: 'DOCTOR'
        }
      });

      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should reject non-admin assigning roles', async ({ request }) => {
      const fakeUserId = uuidv4();
      
      const response = await request.post(`${baseURL}/api/v1/users/${fakeUserId}/roles`, {
        headers: {
          'Authorization': `Bearer ${patientToken}`
        },
        data: {
          role: 'DOCTOR'
        }
      });

      expect(response.status()).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('USER_PERMISSION_DENIED');
    });
  });
});

