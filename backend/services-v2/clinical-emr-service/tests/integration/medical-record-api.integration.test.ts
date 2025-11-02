/**
 * Integration Tests - Medical Record API
 * Tests for Medical Record REST API endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Jest, REST API, HIPAA, Clean Architecture
 */

import request from 'supertest';
import express, { Express } from 'express';
import { container } from '../../src/infrastructure/di/container';
import { createMedicalRecordRoutes } from '../../src/presentation/routes/medical-record.routes';
import { TestFactories } from '../helpers/test-factories';

describe('Medical Record API - Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let doctorToken: string;
  let patientToken: string;
  let adminToken: string;
  let testRecordId: string;
  let testPatientId: string;
  let testDoctorId: string;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/v2/clinical-emr', createMedicalRecordRoutes());

    // Generate test tokens (mock JWT tokens for testing)
    doctorToken = generateMockToken({ role: 'doctor', userId: 'DOC-001' });
    patientToken = generateMockToken({ role: 'patient', userId: 'PAT-001' });
    adminToken = generateMockToken({ role: 'admin', userId: 'ADMIN-001' });
    authToken = doctorToken; // Default to doctor token

    // Generate test IDs
    testPatientId = global.testUtils.generatePatientId();
    testDoctorId = global.testUtils.generateDoctorId();
  });

  afterAll(async () => {
    // Cleanup
    await container.unbindAll();
  });

  describe('POST /api/v2/clinical-emr/medical-records - Create Medical Record', () => {
    it('should create medical record with valid data', async () => {
      // Arrange
      const requestData = TestFactories.CreateRequest.createValidRequest({
        patientId: testPatientId,
        doctorId: testDoctorId,
      });

      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(requestData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.recordId).toBeDefined();
      testRecordId = response.body.data.recordId; // Save for later tests
    });

    it('should return 401 when no authentication token provided', async () => {
      // Arrange
      const requestData = TestFactories.CreateRequest.createValidRequest();

      // Act & Assert
      await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .send(requestData)
        .expect(401);
    });

    it('should return 403 when patient tries to create medical record', async () => {
      // Arrange
      const requestData = TestFactories.CreateRequest.createValidRequest();

      // Act & Assert
      await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(requestData)
        .expect(403);
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const requestData = {
        patientId: '',
        doctorId: testDoctorId,
      };

      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(requestData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should create medical record with vital signs', async () => {
      // Arrange
      const requestData = TestFactories.CreateRequest.createValidRequest({
        vitalSigns: {
          temperature: 37.5,
          bloodPressure: '120/80',
          heartRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weight: 70,
          height: 170,
        },
      });

      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(requestData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.vitalSigns).toBeDefined();
    });
  });

  describe('GET /api/v2/clinical-emr/medical-records/:recordId - Get Medical Record', () => {
    it('should retrieve medical record with valid ID', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.recordId).toBe(testRecordId);
    });

    it('should return 401 when no authentication token provided', async () => {
      // Act & Assert
      await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .expect(401);
    });

    it('should return 404 when record does not exist', async () => {
      // Arrange
      const nonExistentId = global.testUtils.generateMedicalRecordId();

      // Act & Assert
      await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${nonExistentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);
    });

    it('should return 403 when unauthorized user tries to access record', async () => {
      // Act & Assert
      await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${generateMockToken({ role: 'patient', userId: 'OTHER-PAT-001' })}`)
        .expect(403);
    });
  });

  describe('PUT /api/v2/clinical-emr/medical-records/:recordId - Update Medical Record', () => {
    it('should update medical record with valid data', async () => {
      // Arrange
      const updateData = {
        notes: 'Updated medical notes',
        treatment: 'Updated treatment plan',
      };

      // Act
      const response = await request(app)
        .put(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('thành công');
    });

    it('should return 403 when patient tries to update medical record', async () => {
      // Arrange
      const updateData = { notes: 'Attempted update' };

      // Act & Assert
      await request(app)
        .put(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 404 when updating non-existent record', async () => {
      // Arrange
      const nonExistentId = global.testUtils.generateMedicalRecordId();
      const updateData = { notes: 'Update notes' };

      // Act & Assert
      await request(app)
        .put(`/api/v2/clinical-emr/medical-records/${nonExistentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('GET /api/v2/clinical-emr/patients/:patientId/medical-records - Get Patient Records', () => {
    it('should retrieve all medical records for a patient', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/patients/${testPatientId}/medical-records`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow patient to access their own medical records', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/patients/${testPatientId}/medical-records`)
        .set('Authorization', `Bearer ${generateMockToken({ role: 'patient', userId: testPatientId })}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('should return 403 when patient tries to access other patient records', async () => {
      // Act & Assert
      await request(app)
        .get(`/api/v2/clinical-emr/patients/${testPatientId}/medical-records`)
        .set('Authorization', `Bearer ${generateMockToken({ role: 'patient', userId: 'OTHER-PAT-002' })}`)
        .expect(403);
    });

    it('should support pagination parameters', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/patients/${testPatientId}/medical-records`)
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/v2/clinical-emr/medical-records/:recordId/archive - Archive Medical Record', () => {
    it('should archive medical record', async () => {
      // Act
      const response = await request(app)
        .post(`/api/v2/clinical-emr/medical-records/${testRecordId}/archive`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('lưu trữ');
    });

    it('should return 403 when patient tries to archive record', async () => {
      // Act & Assert
      await request(app)
        .post(`/api/v2/clinical-emr/medical-records/${testRecordId}/archive`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v2/clinical-emr/medical-records/:recordId/restore - Restore Medical Record', () => {
    it('should restore archived medical record', async () => {
      // Act
      const response = await request(app)
        .post(`/api/v2/clinical-emr/medical-records/${testRecordId}/restore`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('khôi phục');
    });

    it('should return 400 when restoring non-archived record', async () => {
      // Act & Assert
      await request(app)
        .post(`/api/v2/clinical-emr/medical-records/${testRecordId}/restore`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/v2/clinical-emr/medical-records/:recordId/vital-signs - Update Vital Signs', () => {
    it('should update vital signs', async () => {
      // Arrange
      const vitalSigns = {
        temperature: 38.0,
        bloodPressure: '130/85',
        heartRate: 80,
        respiratoryRate: 18,
        oxygenSaturation: 97,
        weight: 72,
        height: 170,
      };

      // Act
      const response = await request(app)
        .put(`/api/v2/clinical-emr/medical-records/${testRecordId}/vital-signs`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(vitalSigns)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('should allow nurse to update vital signs', async () => {
      // Arrange
      const nurseToken = generateMockToken({ role: 'nurse', userId: 'NURSE-001' });
      const vitalSigns = {
        temperature: 37.2,
        bloodPressure: '120/80',
        heartRate: 72,
      };

      // Act
      const response = await request(app)
        .put(`/api/v2/clinical-emr/medical-records/${testRecordId}/vital-signs`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send(vitalSigns)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v2/clinical-emr/medical-records/:recordId/fhir - Export to FHIR', () => {
    it('should export medical record to FHIR format', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}/fhir`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.resourceType).toBe('Bundle');
      expect(response.body.data.type).toBe('collection');
    });

    it('should include FHIR version in export', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}/fhir`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.meta.versionId).toBeDefined();
    });
  });

  describe('GET /api/v2/clinical-emr/health - Health Check', () => {
    it('should return healthy status', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/clinical-emr/health')
        .expect(200);

      // Assert
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('clinical-emr-service');
    });

    it('should not require authentication', async () => {
      // Act & Assert
      await request(app)
        .get('/api/v2/clinical-emr/health')
        .expect(200);
    });
  });

  describe('DELETE /api/v2/clinical-emr/medical-records/:recordId - Delete Medical Record', () => {
    it('should allow admin to delete medical record', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('xóa');
    });

    it('should return 403 when doctor tries to delete record', async () => {
      // Act & Assert
      await request(app)
        .delete(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('should return 404 when deleting non-existent record', async () => {
      // Arrange
      const nonExistentId = global.testUtils.generateMedicalRecordId();

      // Act & Assert
      await request(app)
        .delete(`/api/v2/clinical-emr/medical-records/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should include security headers in response', async () => {
      // Act
      const response = await request(app)
        .get('/api/v2/clinical-emr/health')
        .expect(200);

      // Assert - Check for common security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
    });

    it('should handle malformed JSON gracefully', async () => {
      // Act & Assert
      await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should validate content-type header', async () => {
      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('Vietnamese Language Support', () => {
    it('should return error messages in Vietnamese', async () => {
      // Arrange
      const invalidData = { patientId: '' };

      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.message).toMatch(/tiếng Việt|bệnh nhân|bác sĩ|hồ sơ/);
    });

    it('should return success messages in Vietnamese', async () => {
      // Arrange
      const requestData = TestFactories.CreateRequest.createValidRequest();

      // Act
      const response = await request(app)
        .post('/api/v2/clinical-emr/medical-records')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(requestData)
        .expect(201);

      // Assert
      expect(response.body.message).toMatch(/thành công/);
    });
  });

  describe('HIPAA Compliance', () => {
    it('should include audit trail for PHI access', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${testRecordId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Assert - Response should indicate PHI access was logged
      expect(response.body.data.lastAccessedAt).toBeDefined();
    });

    it('should not expose sensitive data in error messages', async () => {
      // Arrange
      const invalidId = 'INVALID-ID-WITH-SENSITIVE-DATA';

      // Act
      const response = await request(app)
        .get(`/api/v2/clinical-emr/medical-records/${invalidId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);

      // Assert - Error should not include the invalid ID
      expect(response.body.message).not.toContain(invalidId);
    });
  });
});

/**
 * Helper function to generate mock JWT tokens for testing
 */
function generateMockToken(payload: { role: string; userId: string }): string {
  // In a real test, you would use jsonwebtoken to generate a proper token
  // For integration tests, this is a simplified version
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `mock.${base64Payload}.signature`;
}
