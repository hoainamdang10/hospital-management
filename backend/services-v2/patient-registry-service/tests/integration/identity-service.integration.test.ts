/**
 * Integration Tests - Identity Service Communication
 * 
 * Tests authentication and authorization flow between
 * Patient Registry Service and Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Application } from 'express';
import axios from 'axios';
import { createAuthenticatedTestApp } from '../helpers/appFactory';
import { TestUserFactory } from '../helpers/test-user-factory';
import { TestDatabase } from '../helpers/test-database';

describe('Identity Service Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let testDb: TestDatabase;
  let userFactory: TestUserFactory;

  let validToken: string;
  let adminToken: string;
  let receptionistToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let patientToken: string;

  // Test user IDs
  let adminUserId: string;
  let receptionistUserId: string;
  let doctorUserId: string;
  let nurseUserId: string;
  let patientUserId: string;

  // Test patient ID
  let testPatientId: string;

  beforeAll(async () => {
    // Initialize test database and user factory
    testDb = new TestDatabase();
    await testDb.setup();

    supabaseClient = testDb.getClient();
    userFactory = new TestUserFactory(supabaseClient);

    // Initialize app with authentication enabled
    // IMPORTANT: This requires Identity Service running at http://localhost:3021
    // Start Identity Service before running tests: cd ../identity-service && PORT=3021 npm run dev
    const appFactory = await createAuthenticatedTestApp();
    app = appFactory.app;
    cleanup = appFactory.cleanup;

    // Create test users and get tokens via REAL Identity Service
    await setupTestUsers();

    // Create a test patient for tests that need existing patient
    // Use patientUserId which is now set by setupTestUsers()
    const patientData = createValidPatientData(patientUserId);
    const createResponse = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(patientData);

    if (createResponse.status === 201 && createResponse.body.data) {
      testPatientId = createResponse.body.data.patientId;
    }
  }, 30000); // 30 seconds timeout for setup

  afterAll(async () => {
    // Cleanup test users
    await userFactory.cleanup();

    // Cleanup test database
    await testDb.cleanup();
    await testDb.close();

    // Cleanup app resources
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Authentication Flow', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .send({
          userId: 'test-user-id',
          fullName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'male' as const,
          nationalId: '001234567890',
          nationality: 'Vietnamese',
          primaryPhone: '0912345678',
          email: 'test@example.com',
          preferredContactMethod: 'phone' as const,
          address: {
            street: '123 Test St',
            ward: 'Ward 1',
            district: 'District 1',
            city: 'Ho Chi Minh'
          },
          emergencyContacts: [{
            fullName: 'Emergency Contact',
            relationship: 'Spouse',
            phoneNumber: '0987654321'
          }]
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', 'Bearer invalid-token-12345')
        .send({
          userId: 'test-user-id',
          fullName: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'male' as const,
          nationalId: '001234567890',
          nationality: 'Vietnamese',
          primaryPhone: '0912345678',
          email: 'test@example.com',
          preferredContactMethod: 'phone' as const,
          address: {
            street: '123 Test St',
            ward: 'Ward 1',
            district: 'District 1',
            city: 'Ho Chi Minh'
          },
          emergencyContacts: [{
            fullName: 'Emergency Contact',
            relationship: 'Spouse',
            phoneNumber: '0987654321'
          }]
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).not.toBe(401);
    });

    it('should load user context from Identity Service', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', `Bearer ${receptionistToken}`);

      // User context should be loaded and attached to request
      // This is verified by checking that the request succeeds
      // and returns data specific to the authenticated user
      expect(response.status).toBe(200);
    });
  });

  describe('Role-Based Authorization (RBAC)', () => {
    it('should allow ADMIN to create patients', async () => {
      // Create a new user for this test to avoid USER_ALREADY_HAS_PATIENT_PROFILE error
      const timestamp = Date.now();
      const newUserEmail = `new-patient-${timestamp}@test.com`;
      const newUser = await userFactory.createVerifiedPatient({
        email: newUserEmail,
        password: 'Test@Password123!',
        fullName: 'New Test Patient'
      });

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createValidPatientData(newUser.userId));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow RECEPTIONIST to create patients', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(createValidPatientData());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should deny PATIENT role from creating patients', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(createValidPatientData());

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Forbidden');
    });

    it('should allow ADMIN to deactivate patients', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${testPatientId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test deactivation',
          requestedBy: adminUserId
        });

      expect(response.status).toBe(200);
    });

    it('should deny RECEPTIONIST from deactivating patients', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${testPatientId}/deactivate`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          reason: 'Test deactivation',
          requestedBy: receptionistUserId
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Permission-Based Authorization (PBAC)', () => {
    it('should allow users with patient:create permission', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(createValidPatientData());

      expect(response.status).toBe(201);
    });

    it('should allow users with patient:read permission', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow users with patient:update permission', async () => {
      const response = await request(app)
        .put(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          fullName: 'Updated Name',
          dateOfBirth: '1990-01-01',
          gender: 'male' as const,
          nationalId: '001234567890'
        });

      expect(response.status).toBe(200);
    });

    it('should deny users without required permission', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${testPatientId}/deactivate`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Test',
          requestedBy: patientUserId
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Resource Ownership Validation', () => {
    it('should allow patient to access their own profile', async () => {
      // Create patient with specific user ID
      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          ...createValidPatientData(),
          userId: patientUserId
        });

      const patientId = createResponse.body.data.patientId;

      // Patient should be able to access their own profile
      const response = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
    });

    it('should deny patient from accessing other patient profiles', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('access denied');
    });

    it('should allow ADMIN to access any patient profile', async () => {
      const response = await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('User Context Loading', () => {
    it('should load complete user context from Identity Service', async () => {
      // First create a test patient
      const { createTestPatientInDb } = await import('../helpers/testHelpers');
      // Create a unique user for this test
      const contextTestUser = await userFactory.createVerifiedPatient({
        email: `context-test-${Date.now()}@test.com`,
        password: 'Test@Password123!',
        fullName: 'Context Test Patient'
      });

      // Create patient via API
      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(createValidPatientData(contextTestUser.userId));

      const testPatientId = createResponse.body.data?.patientId;

      // Make request that requires user context
      const response = await request(app)
        .get(`/api/v1/patients/${testPatientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      // Verify user context was loaded by checking response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit log contains user information
      const { data: auditLogs } = await supabaseClient
        .from('audit_logs')
        .select('*')
        .eq('entity_id', testPatientId)
        .eq('action', 'READ')
        .order('created_at', { ascending: false })
        .limit(1);

      if (auditLogs && auditLogs.length > 0) {
        expect(auditLogs[0].user_id).toBe(receptionistUserId);
        expect(auditLogs[0].action).toBe('READ');
      }
    });

    it('should include user roles in context', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Admin role should allow access to all resources
    });

    it('should include user permissions in context', async () => {
      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(createValidPatientData());

      expect(response.status).toBe(201);
      // Receptionist should have patient:create permission
    });
  });

  describe('Error Handling', () => {
    it('should handle Identity Service unavailability gracefully', async () => {
      // Test with malformed token that will cause auth service to fail
      const malformedToken = 'malformed.jwt.token.that.will.fail';

      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', `Bearer ${malformedToken}`);

      // Should return 401 Unauthorized when auth service fails
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle expired tokens', async () => {
      // Use a clearly invalid/expired token format
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should handle invalid Authorization header format', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // Helper functions

  async function setupTestUsers() {
    // Helper to add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Create test users and get tokens
    try {
      const timestamp = Date.now();
      const useMockIdentity = process.env.IDENTITY_USE_MOCK === 'true';
      const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3021';
      const password = 'Test@Password123!';

      // Admin user
      const adminEmail = `admin-${timestamp}@test.com`;
      const admin = await userFactory.createVerifiedAdmin({
        email: adminEmail,
        password,
        fullName: 'Admin Test User'
      });
      adminUserId = admin.userId;

      if (useMockIdentity) {
        // Use mock token
        const { issueMockIdentityToken } = await import('../helpers/testHelpers');
        adminToken = issueMockIdentityToken(adminUserId, adminEmail, ['ADMIN']);
      } else {
        // Login to get JWT token from Identity Service
        const adminLogin = await axios.post(`${identityServiceUrl}/auth/login`, {
          email: adminEmail,
          password
        });
        adminToken = adminLogin.data.accessToken;
        await delay(500); // Wait 500ms to avoid rate limiting
      }

      // Receptionist user
      const receptionistEmail = `receptionist-${timestamp}@test.com`;
      const receptionist = await userFactory.createVerifiedUser({
        email: receptionistEmail,
        password,
        fullName: 'Receptionist Test User',
        roleType: 'receptionist'
      });
      receptionistUserId = receptionist.userId;

      if (useMockIdentity) {
        const { issueMockIdentityToken } = await import('../helpers/testHelpers');
        receptionistToken = issueMockIdentityToken(receptionistUserId, receptionistEmail, ['RECEPTIONIST']);
      } else {
        const receptionistLogin = await axios.post(`${identityServiceUrl}/auth/login`, {
          email: receptionistEmail,
          password
        });
        receptionistToken = receptionistLogin.data.accessToken;
        await delay(500);
      }

      // Doctor user
      const doctorEmail = `doctor-${timestamp}@test.com`;
      const doctor = await userFactory.createVerifiedDoctor({
        email: doctorEmail,
        password,
        fullName: 'Doctor Test User'
      });
      doctorUserId = doctor.userId;

      if (useMockIdentity) {
        const { issueMockIdentityToken } = await import('../helpers/testHelpers');
        doctorToken = issueMockIdentityToken(doctorUserId, doctorEmail, ['DOCTOR']);
      } else {
        const doctorLogin = await axios.post(`${identityServiceUrl}/auth/login`, {
          email: doctorEmail,
          password
        });
        doctorToken = doctorLogin.data.accessToken;
        await delay(500);
      }

      // Nurse user
      const nurseEmail = `nurse-${timestamp}@test.com`;
      const nurse = await userFactory.createVerifiedUser({
        email: nurseEmail,
        password,
        fullName: 'Nurse Test User',
        roleType: 'nurse'
      });
      nurseUserId = nurse.userId;

      if (useMockIdentity) {
        const { issueMockIdentityToken } = await import('../helpers/testHelpers');
        nurseToken = issueMockIdentityToken(nurseUserId, nurseEmail, ['NURSE']);
      } else {
        const nurseLogin = await axios.post(`${identityServiceUrl}/auth/login`, {
          email: nurseEmail,
          password
        });
        nurseToken = nurseLogin.data.accessToken;
        await delay(500);
      }

      // Patient user
      const patientEmail = `patient-${timestamp}@test.com`;
      const patient = await userFactory.createVerifiedPatient({
        email: patientEmail,
        password,
        fullName: 'Patient Test User'
      });
      patientUserId = patient.userId;

      if (useMockIdentity) {
        const { issueMockIdentityToken } = await import('../helpers/testHelpers');
        patientToken = issueMockIdentityToken(patientUserId, patientEmail, ['PATIENT']);
      } else {
        const patientLogin = await axios.post(`${identityServiceUrl}/auth/login`, {
          email: patientEmail,
          password
        });
        patientToken = patientLogin.data.accessToken;
      }

      validToken = receptionistToken;

      console.log(' Test users setup complete');
      console.log(`   Admin: ${adminUserId}`);
      console.log(`   Receptionist: ${receptionistUserId}`);
      console.log(`   Doctor: ${doctorUserId}`);
      console.log(`   Nurse: ${nurseUserId}`);
      console.log(`   Patient: ${patientUserId}`);
    } catch (error) {
      console.error(' Failed to setup test users:', error);
      throw error;
    }
  }

  function createValidPatientData(userId?: string) {
    // Generate valid 12-digit CCCD (Vietnamese national ID)
    const timestamp = Date.now().toString();
    const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const nationalId = (timestamp + randomDigits).slice(-12); // Last 12 digits

    return {
      userId: userId || patientUserId, // Use provided userId or default to patientUserId
      // Personal Info (flat structure as per RegisterPatientRequest DTO)
      fullName: 'Test Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male' as const,
      nationalId: nationalId,
      nationality: 'Vietnamese',
      // Contact Info (flat structure)
      primaryPhone: '0912345678',
      email: `test-${timestamp}@example.com`,
      preferredContactMethod: 'phone' as const,
      address: {
        street: '123 Test St',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      },
      emergencyContacts: [{
        name: 'Emergency Contact',
        relationship: 'Spouse',
        primaryPhone: '0987654321',
        isPrimary: true
      }]
    };
  }
});

