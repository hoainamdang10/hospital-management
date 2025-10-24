/**
 * Vietnamese Healthcare Compliance Integration Tests
 * Tests Vietnamese healthcare regulations, license validation, and MOH compliance
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

describe('Vietnamese Healthcare Compliance Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let adminToken: string;
  
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
      'admin-compliance@hospital.vn',
      'Admin123!@#',
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

  // ==================== VIETNAMESE LICENSE FORMAT VALIDATION TESTS ====================

  describe('Vietnamese Healthcare License Format Validation', () => {
    it('should accept valid Vietnamese license format VN-XX-XXXXXX', async () => {
      // Arrange
      const validLicenses = [
        'VN-BS-123456',
        'VN-DD-789012',
        'VN-YS-345678',
        'VN-DC-901234'
      ];

      // Act & Assert
      for (const license of validLicenses) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: license,
          vietnameseHealthcareLicense: license
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        
        testStaffIds.push(response.body.staffId);
        testUserIds.push(staffData.userId);
      }
    });

    it('should reject invalid Vietnamese license format', async () => {
      // Arrange
      const invalidLicenses = [
        'INVALID-123',
        'VN-123-ABC',
        'BS-123456',
        'VN-B-123456',
        'VN-BSS-123456',
        'VN-BS-12345', // Too short
        'VN-BS-1234567' // Too long
      ];

      // Act & Assert
      for (const license of invalidLicenses) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: license,
          vietnameseHealthcareLicense: license
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('không đúng định dạng');
      }
    });

    it('should validate license prefix codes', async () => {
      // Arrange - Valid Vietnamese medical license prefixes
      const validPrefixes = ['BS', 'DD', 'YS', 'DC', 'DS', 'TS'];

      // Act & Assert
      for (const prefix of validPrefixes) {
        const license = `VN-${prefix}-123456`;
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: license,
          vietnameseHealthcareLicense: license
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(201);
        
        testStaffIds.push(response.body.staffId);
        testUserIds.push(staffData.userId);
      }
    });

    it('should reject license without VN prefix', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'US-MD-123456', // Foreign license
        vietnameseHealthcareLicense: 'US-MD-123456'
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== MOH REGISTRATION NUMBER VALIDATION TESTS ====================

  describe('Ministry of Health (MOH) Registration Number Validation', () => {
    it('should accept valid MOH registration number', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        mohRegistrationNumber: 'MOH-2023-001234'
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mohRegistrationNumber).toBe('MOH-2023-001234');
      
      testStaffIds.push(response.body.staffId);
      testUserIds.push(staffData.userId);
    });

    it('should reject invalid MOH registration format', async () => {
      // Arrange
      const invalidMOHNumbers = [
        'INVALID',
        'MOH-ABC-123',
        'MOH-2023',
        '2023-001234'
      ];

      // Act & Assert
      for (const mohNumber of invalidMOHNumbers) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          mohRegistrationNumber: mohNumber
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should verify MOH registration with issuing authority', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        mohRegistrationNumber: 'MOH-2023-001234',
        credentials: {
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          issuingAuthority: 'Bộ Y tế', // Ministry of Health
          issueDate: '2023-01-01',
          expiryDate: '2028-01-01'
        }
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      testStaffIds.push(response.body.staffId);
      testUserIds.push(staffData.userId);
    });

    it('should accept Sở Y tế as valid issuing authority', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        credentials: {
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          issuingAuthority: 'Sở Y tế TP.HCM', // Provincial Health Department
          issueDate: '2023-01-01',
          expiryDate: '2028-01-01'
        }
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      testStaffIds.push(response.body.staffId);
      testUserIds.push(staffData.userId);
    });
  });

  // ==================== LICENSE EXPIRY CHECKING TESTS ====================

  describe('License Expiry Checking and Alerts', () => {
    it('should identify licenses expiring within 90 days', async () => {
      // Arrange
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60); // 60 days from now

      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        credentials: {
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2023-01-01',
          expiryDate: expiryDate.toISOString().split('T')[0]
        }
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/license/expiry-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isExpiringSoon).toBe(true);
      expect(response.body.data.daysUntilExpiry).toBeLessThanOrEqual(90);
    });

    it('should identify expired licenses', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        credentials: {
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2023-01-01' // Expired
        }
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/license/expiry-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isExpired).toBe(true);
    });

    it('should generate expiry alerts for staff', async () => {
      // Arrange
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days

      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        credentials: {
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2023-01-01',
          expiryDate: expiryDate.toISOString().split('T')[0]
        }
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act
      const response = await request(app)
        .get('/api/v1/staff/license/expiring-alerts')
        .query({ days: 60 })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });
  });

  // ==================== VIETNAMESE MEDICAL TITLE VALIDATION TESTS ====================

  describe('Vietnamese Medical Title Validation', () => {
    it('should accept valid Vietnamese medical titles', async () => {
      // Arrange
      const validTitles = [
        'Bác sĩ',
        'Thạc sĩ',
        'Tiến sĩ',
        'Giáo sư',
        'Phó Giáo sư',
        'Bác sĩ Chuyên khoa I',
        'Bác sĩ Chuyên khoa II'
      ];

      // Act & Assert
      for (const title of validTitles) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          professionalInfo: {
            medicalTitle: title,
            specialization: 'Tim mạch',
            yearsOfExperience: 5
          }
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.professionalInfo.medicalTitle).toBe(title);
        
        testStaffIds.push(response.body.staffId);
        testUserIds.push(staffData.userId);
      }
    });

    it('should reject invalid medical titles', async () => {
      // Arrange
      const invalidTitles = [
        'Doctor',
        'MD',
        'PhD',
        'Invalid Title'
      ];

      // Act & Assert
      for (const title of invalidTitles) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: TestUtils.generateRandomLicenseNumber(),
          professionalInfo: {
            medicalTitle: title,
            specialization: 'Cardiology',
            yearsOfExperience: 5
          }
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate title hierarchy', async () => {
      // Arrange - Giáo sư requires higher qualifications
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        professionalInfo: {
          medicalTitle: 'Giáo sư',
          specialization: 'Tim mạch',
          yearsOfExperience: 20 // Requires significant experience
        }
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      testStaffIds.push(response.body.staffId);
      testUserIds.push(staffData.userId);
    });
  });

  // ==================== VIETNAMESE HEALTHCARE REGULATIONS COMPLIANCE TESTS ====================

  describe('Vietnamese Healthcare Regulations Compliance', () => {
    it('should verify complete Vietnamese healthcare compliance', async () => {
      // Arrange
      const compliantStaffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        vietnameseHealthcareLicense: 'VN-BS-123456',
        mohRegistrationNumber: 'MOH-2023-001234',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1985-01-01',
          gender: 'MALE',
          nationality: 'Vietnamese',
          nationalId: '079085001234', // Valid CMND
          phoneNumber: '0901234567', // Valid Vietnamese phone
          email: 'doctor@hospital.vn',
          address: 'TP.HCM, Việt Nam'
        },
        professionalInfo: {
          medicalTitle: 'Bác sĩ Chuyên khoa I',
          specialization: 'Tim mạch',
          yearsOfExperience: 10
        },
        credentials: {
          licenseNumber: 'VN-BS-123456',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2023-01-01',
          expiryDate: '2028-01-01'
        }
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(compliantStaffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      const staffId = response.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(compliantStaffData.userId);

      // Verify compliance
      const complianceResponse = await request(app)
        .get(`/api/v1/staff/${staffId}/compliance/vietnamese-healthcare`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(complianceResponse.status).toBe(200);
      expect(complianceResponse.body.data.isCompliant).toBe(true);
    });

    it('should identify non-compliant staff', async () => {
      // Arrange - Missing MOH registration
      const nonCompliantData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        vietnameseHealthcareLicense: 'VN-BS-123456'
        // Missing mohRegistrationNumber
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nonCompliantData);

      // Assert - Should either reject or flag as non-compliant
      if (response.status === 201) {
        const staffId = response.body.staffId;
        testStaffIds.push(staffId);
        testUserIds.push(nonCompliantData.userId);

        const complianceResponse = await request(app)
          .get(`/api/v1/staff/${staffId}/compliance/vietnamese-healthcare`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(complianceResponse.body.data.isCompliant).toBe(false);
        expect(complianceResponse.body.data.missingRequirements).toContain('MOH Registration');
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should validate CMND/CCCD format', async () => {
      // Arrange - Valid CMND (9 digits)
      const cmndData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: '079085001', // 9 digits CMND
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      // Act
      const cmndResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cmndData);

      // Assert
      expect(cmndResponse.status).toBe(201);
      testStaffIds.push(cmndResponse.body.staffId);
      testUserIds.push(cmndData.userId);

      // Arrange - Valid CCCD (12 digits)
      const cccdData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: '079085001234', // 12 digits CCCD
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      // Act
      const cccdResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cccdData);

      // Assert
      expect(cccdResponse.status).toBe(201);
      testStaffIds.push(cccdResponse.body.staffId);
      testUserIds.push(cccdData.userId);
    });

    it('should validate Vietnamese phone number format', async () => {
      // Arrange - Valid formats
      const validPhones = [
        '0901234567',
        '0912345678',
        '0987654321',
        '+84901234567'
      ];

      // Act & Assert
      for (const phone of validPhones) {
        const staffData = TestDataFactory.createValidDoctorData({
          userId: TestUtils.generateRandomUserId(),
          email: TestUtils.generateRandomEmail(),
          phoneNumber: phone,
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: TestUtils.generateRandomLicenseNumber()
        });

        const response = await request(app)
          .post('/api/v1/staff')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(staffData);

        expect(response.status).toBe(201);
        testStaffIds.push(response.body.staffId);
        testUserIds.push(staffData.userId);
      }
    });
  });

  // ==================== LICENSE RENEWAL WORKFLOW TESTS ====================

  describe('License Renewal Workflows', () => {
    it('should process license renewal successfully', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        vietnameseHealthcareLicense: 'VN-BS-123456',
        credentials: {
          licenseNumber: 'VN-BS-123456',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2025-01-01'
        }
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Renew license
      const renewalData = {
        newExpiryDate: '2030-01-01',
        renewalDate: new Date().toISOString().split('T')[0],
        renewalAuthority: 'Bộ Y tế',
        renewalDocumentUrl: 'https://storage.test/renewal-doc.pdf'
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/license/renew`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(renewalData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Gia hạn giấy phép thành công');
    });

    it('should require MOH approval for license renewal', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        vietnameseHealthcareLicense: 'VN-BS-123456'
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Try to renew without MOH approval
      const renewalData = {
        newExpiryDate: '2030-01-01',
        renewalAuthority: 'Unauthorized Authority' // Not MOH
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/license/renew`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(renewalData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Bộ Y tế');
    });
  });

  // ==================== VIETNAMESE HEALTHCARE AUTHORITIES INTEGRATION TESTS ====================

  describe('Integration with Vietnamese Healthcare Authorities', () => {
    it('should verify license with MOH database', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        vietnameseHealthcareLicense: 'VN-BS-123456',
        mohRegistrationNumber: 'MOH-2023-001234'
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Verify with MOH
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/verify/moh`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          licenseNumber: 'VN-BS-123456',
          mohRegistrationNumber: 'MOH-2023-001234'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verificationStatus).toBeDefined();
    });

    it('should sync with provincial health department', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: 'VN-BS-123456',
        credentials: {
          licenseNumber: 'VN-BS-123456',
          issuingAuthority: 'Sở Y tế TP.HCM',
          issueDate: '2023-01-01',
          expiryDate: '2028-01-01'
        }
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Sync with provincial department
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/sync/provincial-health`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          province: 'TP.HCM'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
