/**
 * Credential Management API Integration Tests
 * Tests for credential CRUD operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createMinimalTestApp, AppFactoryResult } from '../../helpers/appFactory';
import {
  getOrCreateTestUser,
  cleanupTestData,
  createTestStaffInDb
} from '../../helpers/testHelpers';

describe('Credential Management API Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let adminToken: string;
  let adminUserId: string;
  let testStaffId: string;
  let testUserId: string;
  let testStaffIds: string[] = [];
  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Create test app
    const result: AppFactoryResult = await createMinimalTestApp();
    app = result.app;
    cleanup = result.cleanup;
    supabaseClient = result.supabaseClient;

    // Create admin user
    const { userId, token } = await getOrCreateTestUser(
      supabaseClient,
      'admin@test.com',
      'Admin123!@#456'
    );
    adminUserId = userId;
    adminToken = token;

    // Create test staff
    testStaffId = await createTestStaffInDb(supabaseClient, {
      userId: adminUserId,
      staffType: 'doctor',
      personalInfo: {
        fullName: 'Dr. Test Credential',
        dateOfBirth: '1980-01-01',
        gender: 'male',
        phoneNumber: '0901234567',
        email: 'doctor.credential@test.com',
        address: '123 Test St'
      },
      professionalInfo: {
        licenseNumber: 'BYS-TEST-001',
        specialization: 'Cardiology',
        yearsOfExperience: 10
      }
    });

    testUserId = adminUserId;
    testStaffIds.push(testStaffId);
    testUserIds.push(testUserId);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabaseClient, {
      staffIds: testStaffIds,
      userIds: testUserIds
    });

    if (cleanup) {
      await cleanup();
    }
  });

  describe('POST /api/v1/staff/:staffId/credentials - Add Credential', () => {
    const validCredentialData = {
      credentialNumber: 'BYS-12345',
      credentialType: 'license',
      issuingAuthority: 'Bộ Y tế',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01'
    };

    describe('Happy Path', () => {
      it('should add credential successfully with valid data', async () => {
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validCredentialData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Thêm chứng chỉ thành công');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.credentialNumber).toBe(validCredentialData.credentialNumber);
        expect(response.body.data.credentialType).toBe(validCredentialData.credentialType);
      });
    });

    describe('Validation Errors', () => {
      it('should fail when staffId is invalid format', async () => {
        const response = await request(app)
          .post('/api/v1/staff/INVALID-ID/credentials')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validCredentialData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should fail when credentialNumber is empty', async () => {
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validCredentialData, credentialNumber: '' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain('Số chứng chỉ không được để trống');
      });

      it('should fail when credentialType is invalid', async () => {
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validCredentialData, credentialType: 'invalid' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should fail when issueDate is in future', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validCredentialData, issueDate: futureDate.toISOString().split('T')[0] })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('Business Rules', () => {
      it('should fail when staff not found', async () => {
        const response = await request(app)
          .post('/api/v1/staff/DOC-CARD-999999-999/credentials')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validCredentialData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Không tìm thấy nhân viên');
      });

      it('should fail when credential already exists', async () => {
        // First add credential
        await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validCredentialData, credentialNumber: 'BYS-DUPLICATE' })
          .expect(201);

        // Try to add same credential again
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validCredentialData, credentialNumber: 'BYS-DUPLICATE' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('đã tồn tại');
      });
    });

    describe('Authentication', () => {
      it('should fail without JWT token', async () => {
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .send(validCredentialData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should fail with invalid JWT token', async () => {
        const response = await request(app)
          .post(`/api/v1/staff/${testStaffId}/credentials`)
          .set('Authorization', 'Bearer invalid-token')
          .send(validCredentialData)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('DELETE /api/v1/staff/:staffId/credentials/:credentialNumber - Remove Credential', () => {
    let credentialToRemove: string;

    beforeEach(async () => {
      // Add a credential to remove
      credentialToRemove = `BYS-REMOVE-${Date.now()}`;
      await request(app)
        .post(`/api/v1/staff/${testStaffId}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: credentialToRemove,
          credentialType: 'certificate',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01'
        });

      // Add another credential so we don't violate "only valid credential" rule
      await request(app)
        .post(`/api/v1/staff/${testStaffId}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: `BYS-KEEP-${Date.now()}`,
          credentialType: 'license',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01'
        });
    });

    describe('Happy Path', () => {
      it('should remove credential successfully', async () => {
        const response = await request(app)
          .delete(`/api/v1/staff/${testStaffId}/credentials/${credentialToRemove}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Xóa chứng chỉ thành công');
        expect(response.body.data.credentialNumber).toBe(credentialToRemove);
      });
    });

    describe('Validation Errors', () => {
      it('should fail when staffId is invalid format', async () => {
        const response = await request(app)
          .delete(`/api/v1/staff/INVALID-ID/credentials/${credentialToRemove}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail when credentialNumber is empty', async () => {
        const response = await request(app)
          .delete(`/api/v1/staff/${testStaffId}/credentials/ `)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404); // Route not found

        expect(response.body.success).toBe(false);
      });
    });

    describe('Business Rules', () => {
      it('should fail when staff not found', async () => {
        const response = await request(app)
          .delete('/api/v1/staff/DOC-CARD-999999-999/credentials/BYS-12345')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Không tìm thấy nhân viên');
      });

      it('should fail when credential not found', async () => {
        const response = await request(app)
          .delete(`/api/v1/staff/${testStaffId}/credentials/BYS-NOTEXIST`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('không tồn tại');
      });
    });

    describe('Authentication', () => {
      it('should fail without JWT token', async () => {
        const response = await request(app)
          .delete(`/api/v1/staff/${testStaffId}/credentials/${credentialToRemove}`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('PUT /api/v1/staff/:staffId/credentials/:credentialNumber/renew - Renew Credential', () => {
    let credentialToRenew: string;

    beforeEach(async () => {
      // Add a credential to renew
      credentialToRenew = `BYS-RENEW-${Date.now()}`;
      await request(app)
        .post(`/api/v1/staff/${testStaffId}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: credentialToRenew,
          credentialType: 'license',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2025-01-01'
        });
    });

    describe('Happy Path', () => {
      it('should renew credential successfully', async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 5);

        const response = await request(app)
          .put(`/api/v1/staff/${testStaffId}/credentials/${credentialToRenew}/renew`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newExpiryDate: newExpiryDate.toISOString().split('T')[0] })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Gia hạn chứng chỉ thành công');
        expect(response.body.data.credentialNumber).toBe(credentialToRenew);
      });
    });

    describe('Validation Errors', () => {
      it('should fail when staffId is invalid format', async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 5);

        const response = await request(app)
          .put(`/api/v1/staff/INVALID-ID/credentials/${credentialToRenew}/renew`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newExpiryDate: newExpiryDate.toISOString().split('T')[0] })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail when newExpiryDate is in past', async () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const response = await request(app)
          .put(`/api/v1/staff/${testStaffId}/credentials/${credentialToRenew}/renew`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newExpiryDate: pastDate.toISOString().split('T')[0] })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain('Ngày hết hạn mới phải trong tương lai');
      });

      it('should fail when newExpiryDate is missing', async () => {
        const response = await request(app)
          .put(`/api/v1/staff/${testStaffId}/credentials/${credentialToRenew}/renew`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Business Rules', () => {
      it('should fail when staff not found', async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 5);

        const response = await request(app)
          .put('/api/v1/staff/DOC-CARD-999999-999/credentials/BYS-12345/renew')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newExpiryDate: newExpiryDate.toISOString().split('T')[0] })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Không tìm thấy nhân viên');
      });

      it('should fail when credential not found', async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 5);

        const response = await request(app)
          .put(`/api/v1/staff/${testStaffId}/credentials/BYS-NOTEXIST/renew`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newExpiryDate: newExpiryDate.toISOString().split('T')[0] })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('không tồn tại');
      });
    });

    describe('Authentication', () => {
      it('should fail without JWT token', async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 5);

        const response = await request(app)
          .put(`/api/v1/staff/${testStaffId}/credentials/${credentialToRenew}/renew`)
          .send({ newExpiryDate: newExpiryDate.toISOString().split('T')[0] })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/v1/staff/credentials/expiring - Get Expiring Credentials', () => {
    beforeAll(async () => {
      // Add credentials with different expiry dates
      const now = new Date();

      // Expiring soon (15 days)
      const expiringSoon = new Date(now);
      expiringSoon.setDate(expiringSoon.getDate() + 15);

      await request(app)
        .post(`/api/v1/staff/${testStaffId}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: `BYS-EXPIRING-${Date.now()}`,
          credentialType: 'license',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: expiringSoon.toISOString().split('T')[0]
        });

      // Not expiring (60 days)
      const notExpiring = new Date(now);
      notExpiring.setDate(notExpiring.getDate() + 60);

      await request(app)
        .post(`/api/v1/staff/${testStaffId}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: `BYS-VALID-${Date.now()}`,
          credentialType: 'certificate',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: notExpiring.toISOString().split('T')[0]
        });
    });

    describe('Happy Path', () => {
      it('should get expiring credentials with default threshold (30 days)', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Lấy danh sách chứng chỉ sắp hết hạn thành công');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.expiringCredentials).toBeInstanceOf(Array);
        expect(response.body.data.totalCount).toBeGreaterThanOrEqual(0);
      });

      it('should filter by daysThreshold', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring?daysThreshold=20')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.expiringCredentials).toBeInstanceOf(Array);
      });

      it('should filter by staffType', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring?staffType=doctor')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.expiringCredentials).toBeInstanceOf(Array);
      });
    });

    describe('Validation Errors', () => {
      it('should fail when daysThreshold is less than 1', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring?daysThreshold=0')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain('Ngưỡng số ngày phải từ 1 đến 365');
      });

      it('should fail when daysThreshold is greater than 365', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring?daysThreshold=400')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain('Ngưỡng số ngày phải từ 1 đến 365');
      });

      it('should fail when staffType is invalid', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring?staffType=invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toContain('Loại nhân viên không hợp lệ');
      });
    });

    describe('Authentication', () => {
      it('should fail without JWT token', async () => {
        const response = await request(app)
          .get('/api/v1/staff/credentials/expiring')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });
});
