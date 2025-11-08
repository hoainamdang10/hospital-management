/**
 * Staff Certification Management Integration Tests
 * Tests certification CRUD operations, expiry tracking, and renewal workflows
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
  cleanupTestData
} from '../../helpers/testHelpers';
import { TestDataFactory, TestUtils } from '../../setup';

describe('Staff Certification Management Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let adminToken: string;
  let adminUserId: string;
  
  let testStaffIds: string[] = [];
  let testUserIds: string[] = [];

  beforeAll(async () => {
    const result: AppFactoryResult = await createMinimalTestApp();
    app = result.app;
    cleanup = result.cleanup;
    supabaseClient = result.supabaseClient;

    // Create admin user
    const adminUser = await getOrCreateTestUser(
      supabaseClient,
      'admin-certification@hospital.vn',
      'TestPassword123!@#',
      'ADMIN'
    );
    adminUserId = adminUser.userId;
    adminToken = adminUser.token;
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(supabaseClient, {
      staffIds: testStaffIds,
      userIds: testUserIds
    });
    await cleanup();
  });

  afterEach(() => {
    testStaffIds = [];
    testUserIds = [];
  });

  /**
   * Helper: Create test staff
   */
  async function createTestStaff(): Promise<string> {
    const staffData = TestDataFactory.createValidDoctorData({
      userId: TestUtils.generateRandomUserId(),
      email: TestUtils.generateRandomEmail(),
      phoneNumber: TestUtils.generateRandomPhone(),
      nationalId: TestUtils.generateRandomNationalId(),
      licenseNumber: TestUtils.generateRandomLicenseNumber()
    });

    const response = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(staffData);

    const staffId = response.body.staffId;
    testStaffIds.push(staffId);
    testUserIds.push(staffData.userId);
    
    return staffId;
  }

  // ==================== CREATE CERTIFICATION TESTS ====================

  describe('POST /api/v1/staff/:staffId/certifications - Add Certification', () => {
    it('should add certification successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const certificationData = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'American Heart Association',
        issueDate: '2023-01-01',
        expiryDate: '2025-01-01',
        certificationNumber: 'BLS-2023-001',
        documentUrl: 'https://storage.test/bls-cert.pdf'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(certificationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Thêm chứng chỉ thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.certification.certificationType).toBe('BLS');

      // Verify in database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('certifications')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.certifications).toBeInstanceOf(Array);
      const hasBLS = dbStaff!.certifications.some((c: any) => c.certificationType === 'BLS');
      expect(hasBLS).toBe(true);
    });

    it('should add multiple certifications to same staff', async () => {
      // Arrange
      const staffId = await createTestStaff();

      const cert1 = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'AHA',
        issueDate: '2023-01-01',
        expiryDate: '2025-01-01'
      };

      const cert2 = {
        certificationType: 'ACLS',
        certificationName: 'Advanced Cardiovascular Life Support',
        issuingAuthority: 'AHA',
        issueDate: '2023-02-01',
        expiryDate: '2025-02-01'
      };

      // Act
      const response1 = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cert1);

      const response2 = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cert2);

      // Assert
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      // Verify both exist
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('certifications')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.certifications.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject certification with invalid date format', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'AHA',
        issueDate: 'invalid-date',
        expiryDate: '2025-01-01'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject certification with expiry date before issue date', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'AHA',
        issueDate: '2025-01-01',
        expiryDate: '2023-01-01' // Before issue date
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject certification without required fields', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        certificationType: 'BLS'
        // Missing required fields
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Arrange
      const certificationData = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'AHA',
        issueDate: '2023-01-01',
        expiryDate: '2025-01-01'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/staff/STF-9999-999999-999/certifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(certificationData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const certificationData = {
        certificationType: 'BLS',
        certificationName: 'Basic Life Support',
        issuingAuthority: 'AHA',
        issueDate: '2023-01-01',
        expiryDate: '2025-01-01'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .send(certificationData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== READ CERTIFICATION TESTS ====================

  describe('GET /api/v1/staff/:staffId/certifications - Get Certifications', () => {
    it('should get all certifications for staff', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.certifications).toBeInstanceOf(Array);
      expect(response.body.data.certifications.length).toBeGreaterThan(0);
    });

    it('should return empty array for staff with no certifications', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.certifications).toEqual([]);
    });

    it('should filter expired certifications when requested', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add expired certification
      await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2020-01-01',
          expiryDate: '2022-01-01' // Expired
        });

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications`)
        .query({ includeExpired: 'false' })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== UPDATE CERTIFICATION TESTS ====================

  describe('PUT /api/v1/staff/:staffId/certifications/:certId - Update Certification', () => {
    it('should update certification successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Update
      const updateData = {
        expiryDate: '2026-01-01', // Extend expiry
        documentUrl: 'https://storage.test/updated-cert.pdf'
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/certifications/${certId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.certification.expiryDate).toContain('2026');
    });

    it('should reject update with invalid data', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Update with invalid date
      const invalidData = {
        expiryDate: 'invalid-date'
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/certifications/${certId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== DELETE CERTIFICATION TESTS ====================

  describe('DELETE /api/v1/staff/:staffId/certifications/:certId - Delete Certification', () => {
    it('should delete certification successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/certifications/${certId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xóa chứng chỉ thành công');

      // Verify removed
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('certifications')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      const hasCert = dbStaff!.certifications.some((c: any) => c.id === certId);
      expect(hasCert).toBe(false);
    });

    it('should return 404 for non-existent certification', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/certifications/non-existent-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== CERTIFICATION EXPIRY TRACKING TESTS ====================

  describe('Certification Expiry Tracking', () => {
    it('should identify expiring certifications', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification expiring soon
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

      await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: expiryDate.toISOString().split('T')[0]
        });

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications/expiring`)
        .query({ days: 60 }) // Within 60 days
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expiringCertifications).toBeInstanceOf(Array);
    });

    it('should identify expired certifications', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add expired certification
      await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2020-01-01',
          expiryDate: '2022-01-01' // Expired
        });

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications/expired`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expiredCertifications).toBeInstanceOf(Array);
    });
  });

  // ==================== CERTIFICATION RENEWAL WORKFLOW TESTS ====================

  describe('Certification Renewal Workflow', () => {
    it('should renew certification successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Renew
      const renewalData = {
        newExpiryDate: '2027-01-01',
        renewalDate: new Date().toISOString().split('T')[0],
        renewalDocumentUrl: 'https://storage.test/renewal-cert.pdf'
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications/${certId}/renew`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(renewalData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Gia hạn chứng chỉ thành công');
    });

    it('should reject renewal with past expiry date', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Try to renew with past date
      const invalidRenewal = {
        newExpiryDate: '2020-01-01' // Past date
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications/${certId}/renew`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidRenewal);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== CERTIFICATION VERIFICATION TESTS ====================

  describe('Certification Verification Process', () => {
    it('should verify certification successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01',
          certificationNumber: 'BLS-2023-001'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Verify
      const verificationData = {
        verifiedBy: adminUserId,
        verificationDate: new Date().toISOString(),
        verificationNotes: 'Verified with issuing authority'
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications/${certId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(verificationData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xác thực chứng chỉ thành công');
    });

    it('should check certification validity', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add valid certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-12-31'
        });

      const certId = addResponse.body.data.certification.id;

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications/${certId}/validity`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBeDefined();
      expect(response.body.data.daysUntilExpiry).toBeDefined();
    });
  });

  // ==================== CERTIFICATION DOCUMENT MANAGEMENT TESTS ====================

  describe('Certification Document Management', () => {
    it('should upload certification document', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01'
        });

      const certId = addResponse.body.data.certification.id;

      // Act - Upload document
      const documentData = {
        documentUrl: 'https://storage.test/bls-certificate.pdf',
        documentType: 'certificate',
        uploadedBy: adminUserId
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications/${certId}/documents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(documentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should retrieve certification document', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add certification with document
      const addResponse = await request(app)
        .post(`/api/v1/staff/${staffId}/certifications`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificationType: 'BLS',
          certificationName: 'Basic Life Support',
          issuingAuthority: 'AHA',
          issueDate: '2023-01-01',
          expiryDate: '2025-01-01',
          documentUrl: 'https://storage.test/bls-cert.pdf'
        });

      const certId = addResponse.body.data.certification.id;

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/certifications/${certId}/documents`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toBeDefined();
    });
  });
});
