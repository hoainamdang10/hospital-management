/**
 * Staff API Integration Tests
 * 
 * Tests API endpoints with real database and event publishing
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
  createTestStaffInDb,
  verifyStaffExistsInDb
} from '../../helpers/testHelpers';
import { TestDataFactory, TestUtils } from '../../setup';

describe('Staff API Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  let adminToken: string;
  let adminUserId: string;
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
      'Admin123!@#'
    );
    adminUserId = userId;
    adminToken = token;
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(supabaseClient, {
      staffIds: testStaffIds,
      userIds: testUserIds
    });

    // Cleanup app
    await cleanup();
  });

  afterEach(() => {
    // Clear arrays for next test
    testStaffIds = [];
    testUserIds = [];
  });

  describe('POST /api/v1/staff - Register Staff', () => {
    it('should register new doctor successfully', async () => {
      // Arrange
      const doctorData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      testUserIds.push(doctorData.userId);

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(doctorData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.staffId).toBeDefined();
      expect(response.body.staffId).toMatch(/^STF-\d{6}-\d{3}$/);
      expect(response.body.message).toBe('Đăng ký nhân viên thành công');
      expect(response.body.data.staff).toBeDefined();
      expect(response.body.data.staff.userId).toBe(doctorData.userId);
      expect(response.body.data.staff.staffType).toBe('doctor');

      // Save for cleanup
      testStaffIds.push(response.body.staffId);

      // Verify in database
      const exists = await verifyStaffExistsInDb(supabaseClient, response.body.staffId);
      expect(exists).toBe(true);
    });

    it('should register new nurse successfully', async () => {
      // Arrange
      const nurseData = TestDataFactory.createValidNurseData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      testUserIds.push(nurseData.userId);

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nurseData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.staffType).toBe('nurse');

      testStaffIds.push(response.body.staffId);
    });

    it('should reject registration without authentication', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidStaffData();

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .send(staffData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Unauthorized');
    });

    it('should reject registration with invalid data', async () => {
      // Arrange
      const invalidData = {
        userId: 'user-123',
        staffType: 'doctor',
        personalInfo: {
          fullName: '', // Empty name - invalid
          dateOfBirth: '1985-01-01',
          gender: 'male'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject duplicate user registration', async () => {
      // Arrange
      const userId = TestUtils.generateRandomUserId();
      const staffData = TestDataFactory.createValidDoctorData({
        userId,
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      testUserIds.push(userId);

      // Register first time
      const firstResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      testStaffIds.push(firstResponse.body.staffId);

      // Act - Try to register again with same userId
      const secondResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...staffData,
          licenseNumber: TestUtils.generateRandomLicenseNumber() // Different license
        });

      // Assert
      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.message).toContain('đã được đăng ký');
    });

    it('should reject duplicate license number', async () => {
      // Arrange
      const licenseNumber = TestUtils.generateRandomLicenseNumber();
      
      const firstStaffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber
      });

      testUserIds.push(firstStaffData.userId);

      // Register first staff
      const firstResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(firstStaffData);

      testStaffIds.push(firstResponse.body.staffId);

      // Act - Try to register with same license number
      const secondStaffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber // Same license number
      });

      testUserIds.push(secondStaffData.userId);

      const secondResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(secondStaffData);

      // Assert
      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.message).toContain('giấy phép');
    });
  });

  describe('GET /api/v1/staff/:staffId - Get Staff Profile', () => {
    let testStaffId: string;

    beforeEach(async () => {
      // Create test staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      testUserIds.push(staffData.userId);

      testStaffId = await createTestStaffInDb(supabaseClient, staffData);
      testStaffIds.push(testStaffId);
    });

    it('should retrieve staff profile successfully', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${testStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff).toBeDefined();
      expect(response.body.data.staff.id).toBe(testStaffId);
      expect(response.body.data.staff.staffType).toBe('doctor');
    });

    it('should reject request without authentication', async () => {
      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${testStaffId}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/STF-999999-999')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Không tìm thấy');
    });

    it('should return 400 for invalid staffId format', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff - Search Staff', () => {
    beforeEach(async () => {
      // Create multiple test staff
      const staffTypes = ['doctor', 'nurse', 'technician'];
      
      for (const staffType of staffTypes) {
        const staffData = TestDataFactory.createValidStaffData({
          userId: TestUtils.generateRandomUserId(),
          staffType,
          email: TestUtils.generateRandomEmail(),
          phoneNumber: TestUtils.generateRandomPhone(),
          nationalId: TestUtils.generateRandomNationalId(),
          licenseNumber: TestUtils.generateRandomLicenseNumber()
        });

        testUserIds.push(staffData.userId);

        const staffId = await createTestStaffInDb(supabaseClient, staffData);
        testStaffIds.push(staffId);
      }
    });

    it('should search staff by type', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ staffType: 'doctor' })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff).toBeInstanceOf(Array);
      expect(response.body.data.staff.length).toBeGreaterThan(0);
      expect(response.body.data.staff.every((s: any) => s.staffType === 'doctor')).toBe(true);
    });

    it('should search staff by department', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ department: 'Khoa Nội' })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
});

