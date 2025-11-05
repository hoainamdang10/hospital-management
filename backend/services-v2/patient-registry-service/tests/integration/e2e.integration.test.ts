/**
 * End-to-End Integration Tests
 *
 * Executes patient registry flows through the HTTP layer using the in-memory repository
 * and mock identity service.
 */

import request from 'supertest';
import { Application } from 'express';

import { createAuthenticatedTestApp } from '../helpers/appFactory';
import { InMemoryPatientRepository } from '../helpers/InMemoryPatientRepository';
import {
  createValidPatientData,
  generateRandomEmail,
  generateRandomNationalId,
  getOrCreateTestUser
} from '../helpers/testHelpers';
import { PatientId } from '../../src/domain/value-objects/PatientId';

describe('End-to-End Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let patientRepository: InMemoryPatientRepository;

  let adminToken: string;
  let receptionistToken: string;
  let patientToken: string;
  let adminUserId: string;
  let receptionistUserId: string;
  let patientUserId: string;

  beforeAll(async () => {
    const appFactory = await createAuthenticatedTestApp();
    app = appFactory.app;
    cleanup = appFactory.cleanup;

    if (!appFactory.inMemoryRepository) {
      throw new Error('Integration tests require in-memory repository instance');
    }

    patientRepository = appFactory.inMemoryRepository;

    const admin = await getOrCreateTestUser(null, 'admin@test.com', 'test-password-123');
    adminToken = admin.token;
    adminUserId = admin.userId;

    const receptionist = await getOrCreateTestUser(null, 'receptionist@test.com', 'test-password-123');
    receptionistToken = receptionist.token;
    receptionistUserId = receptionist.userId;

    const patient = await getOrCreateTestUser(null, 'patient@test.com', 'test-password-123');
    patientToken = patient.token;
    patientUserId = patient.userId;
  });

  beforeEach(() => {
    patientRepository.clear();
  });

  afterAll(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('Complete Patient Registration Flow', () => {
    it('should register a new patient end-to-end', async () => {
      const patientEmail = generateRandomEmail();
      const patientUser = await getOrCreateTestUser(null, patientEmail, 'test-password-123');

      const patientData = createValidPatientData({
        userId: patientUser.userId,
        email: patientEmail,
        nationalId: generateRandomNationalId()
      });

      const registerResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.patientId).toBeDefined();

      const patientId: string = registerResponse.body.data.patientId;
      const storedPatient = await patientRepository.findById(PatientId.create(patientId));
      expect(storedPatient).not.toBeNull();

      const storedProps = storedPatient!.getProps();
      expect(storedProps.personalInfo.fullName).toBe(patientData.fullName);
      expect(storedProps.personalInfo.nationalId).toBe(patientData.nationalId);

      const getResponse = await request(app)
        .get(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.patientId).toBe(patientId);
      expect(getResponse.body.data.personalInfo.fullName).toBe(patientData.fullName);
    });

    it('should handle duplicate patient registration', async () => {
      const duplicateEmail = generateRandomEmail();
      const duplicateUser = await getOrCreateTestUser(null, duplicateEmail, 'test-password-123');
      const duplicateData = createValidPatientData({
        userId: duplicateUser.userId,
        email: duplicateEmail,
        nationalId: generateRandomNationalId()
      });

      const firstResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(duplicateData);

      expect(firstResponse.status).toBe(201);

      const secondResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(duplicateData);

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.error).toBe('DOMAIN_ERROR');
      expect(secondResponse.body.message).toBe('USER_ALREADY_HAS_PATIENT_PROFILE');
    });
  });

  describe('Patient Update Flow', () => {
    it('should update patient information end-to-end', async () => {
      const updateEmail = generateRandomEmail();
      const updateUser = await getOrCreateTestUser(null, updateEmail, 'test-password-123');

      const patientData = createValidPatientData({
        userId: updateUser.userId,
        email: updateEmail,
        nationalId: generateRandomNationalId()
      });

      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      const patientId: string = createResponse.body.data.patientId;

      const updatePayload = {
        fullName: 'Updated Name',
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        nationalId: patientData.nationalId,
        nationality: patientData.nationality
      };

      const updateResponse = await request(app)
        .put(`/api/v1/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(updatePayload);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      const refreshedPatient = await patientRepository.findById(PatientId.create(patientId));
      expect(refreshedPatient).not.toBeNull();
      expect(refreshedPatient!.getProps().personalInfo.fullName).toBe('Updated Name');
    });
  });

  describe('Patient Search Flow', () => {
    it('should search patients by name', async () => {
      const uniqueName = `E2E Test Patient ${Date.now()}`;
      const searchEmail = generateRandomEmail();
      const searchUser = await getOrCreateTestUser(null, searchEmail, 'test-password-123');

      const patientData = createValidPatientData({
        userId: searchUser.userId,
        email: searchEmail,
        fullName: uniqueName,
        nationalId: generateRandomNationalId()
      });

      await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      const searchResponse = await request(app)
        .get('/api/v1/patients/search')
        .query({ searchTerm: uniqueName })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.success).toBe(true);
      expect(Array.isArray(searchResponse.body.data)).toBe(true);
      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data[0].fullName).toBe(uniqueName);
      expect(searchResponse.body.pagination).toBeDefined();
    });
  });

  describe('Authorization Flow', () => {
    it('should restrict patient deactivation to privileged roles', async () => {
      const authEmail = generateRandomEmail();
      const authUser = await getOrCreateTestUser(null, authEmail, 'test-password-123');

      const patientData = createValidPatientData({
        userId: authUser.userId,
        email: authEmail,
        nationalId: generateRandomNationalId()
      });

      const createResponse = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(patientData);

      const patientId: string = createResponse.body.data.patientId;

      const patientDeactivateResponse = await request(app)
        .post(`/api/v1/patients/${patientId}/deactivate`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Test deactivation',
          requestedBy: patientUserId
        });

      expect(patientDeactivateResponse.status).toBe(403);
      expect(patientDeactivateResponse.body.success).toBe(false);

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
      const invalidPayload = {
        ...createValidPatientData({
          userId: receptionistUserId,
          fullName: ''
        }),
        userId: receptionistUserId,
        fullName: ''
      };

      const response = await request(app)
        .post('/api/v1/patients')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent patient lookups', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-999999-999')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/patients/PAT-202501-001');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
