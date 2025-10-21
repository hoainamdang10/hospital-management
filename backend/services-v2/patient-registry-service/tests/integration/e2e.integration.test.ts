/**
 * End-to-End Integration Tests
 * 
 * Tests complete workflows from HTTP request to database
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Application } from 'express';
import { createAuthenticatedTestApp } from '../helpers/appFactory';
import {
  getOrCreateTestUser,
  createValidPatientData,
  verifyPatientExists,
  getPatientFromDb,
  cleanupTestPatients
} from '../helpers/testHelpers';

describe('End-to-End Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let adminToken: string;
  let receptionistToken: string;
  let patientToken: string;
  let adminUserId: string;
  let receptionistUserId: string;
  let patientUserId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize app with authentication enabled
    const appFactory = await createAuthenticatedTestApp();
    app = appFactory.app;
    cleanup = appFactory.cleanup;

    // Setup test users
    const admin = await getOrCreateTestUser(supabaseClient, 'admin@test.com', 'test-password-123');
    adminUserId = admin.userId;
    adminToken = admin.token;

    const receptionist = await getOrCreateTestUser(supabaseClient, 'receptionist@test.com', 'test-password-123');
    receptionistUserId = receptionist.userId;
    receptionistToken = receptionist.token;

    const patient = await getOrCreateTestUser(supabaseClient, 'patient@test.com', 'test-password-123');
    patientUserId = patient.userId;
    patientToken = patient.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestPatients(supabaseClient);
    
    // Cleanup app
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Complete Patient Registration Flow', () => {
    it('should register a new patient end-to-end', async () => {
      const patientData = createValidPatientData({
        userId: receptionistUserId,
        nationalId: 'E2E001234567890'
      });

      // Step 1: Register patient via API
      const registerResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.patientId).toBeDefined();

      const patientId = registerResponse.body.data.patientId;

      // Step 2: Verify patient exists in database
      const exists = await verifyPatientExists(supabaseClient, patientId);
      expect(exists).toBe(true);

      // Step 3: Retrieve patient via API
      const getResponse = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.patientId).toBe(patientId);
      expect(getResponse.body.data.personalInfo.fullName).toBe(patientData.fullName);

      // Step 4: Verify data consistency between API and database
      const dbPatient = await getPatientFromDb(supabaseClient, patientId);
      expect(dbPatient.personal_info.fullName).toBe(patientData.fullName);
      expect(dbPatient.personal_info.nationalId).toBe(patientData.nationalId);
    });

    it('should handle duplicate patient registration', async () => {
      const patientData = createValidPatientData({
        userId: receptionistUserId,
        nationalId: 'E2E001234567891'
      });

      // Register patient first time
      const firstResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      expect(firstResponse.status).toBe(201);

      // Try to register same patient again (same national ID)
      const secondResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      expect(secondResponse.status).toBe(409); // Conflict
      expect(secondResponse.body.success).toBe(false);
    });
  });

  describe('Patient Update Flow', () => {
    it('should update patient information end-to-end', async () => {
      // Create patient
      const patientData = createValidPatientData({
        userId: receptionistUserId,
        nationalId: 'E2E001234567892'
      });

      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      const patientId = createResponse.body.data.patientId;

      // Update patient
      const updateData = {
        personalInfo: {
          fullName: 'Updated Name',
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          nationalId: patientData.nationalId
        },
        requestedBy: receptionistUserId
      };

      const updateResponse = await request(app)
        .put(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Verify update in database
      const dbPatient = await getPatientFromDb(supabaseClient, patientId);
      expect(dbPatient.personal_info.fullName).toBe('Updated Name');
    });
  });

  describe('Patient Search Flow', () => {
    it('should search patients by name', async () => {
      // Create test patient with unique name
      const uniqueName = `E2E Test Patient ${Date.now()}`;
      const patientData = createValidPatientData({
        userId: receptionistUserId,
        fullName: uniqueName,
        nationalId: `E2E${Date.now().toString().slice(-12)}`
      });

      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      // Search for patient
      const searchResponse = await request(app)
        .get('/api/v1/patients/search')
        .query({ query: uniqueName })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data[0].personalInfo.fullName).toBe(uniqueName);
    });
  });

  describe('Authorization Flow', () => {
    it('should enforce role-based access control', async () => {
      // Create patient
      const patientData = createValidPatientData({
        userId: receptionistUserId,
        nationalId: 'E2E001234567893'
      });

      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      const patientId = createResponse.body.data.patientId;

      // Patient user should NOT be able to deactivate
      const deactivateResponse = await request(app)
        .post(`/api/v1/patients/${patientId}/deactivate`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Test deactivation',
          requestedBy: patientUserId
        });

      expect(deactivateResponse.status).toBe(403);
      expect(deactivateResponse.body.success).toBe(false);

      // Admin should be able to deactivate
      const adminDeactivateResponse = await request(app)
        .post(`/api/v1/patients/${patientId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test deactivation',
          requestedBy: adminUserId
        });

      expect(adminDeactivateResponse.status).toBe(200);
      expect(adminDeactivateResponse.body.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid patient data', async () => {
      const invalidData = {
        userId: receptionistUserId,
        personalInfo: {
          fullName: '', // Invalid: empty name
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationalId: 'E2E001234567894'
        }
      };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent patient', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-999999-999')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

