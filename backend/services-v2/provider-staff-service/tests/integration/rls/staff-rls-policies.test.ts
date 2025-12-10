/**
 * RLS Policy Integration Tests
 * Tests Row Level Security policies through real API calls with different user roles
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Security Best Practices
 */

import request from 'supertest';
import { Application } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { createMinimalTestApp, AppFactoryResult } from '../../helpers/appFactory';
import {
  createTestUsersForRoles,
  cleanupTestData
} from '../../helpers/testHelpers';
import { TestDataFactory, TestUtils } from '../../setup';

describe('RLS Policy Integration Tests', () => {
  let app: Application;
  let cleanup: () => Promise<void>;
  let supabaseClient: SupabaseClient;
  
  // Test users with different roles
  let adminUser: { userId: string; token: string; role: string };
  let doctorUser: { userId: string; token: string; role: string };
  let nurseUser: { userId: string; token: string; role: string };
  let deptManagerUser: { userId: string; token: string; role: string };
  
  // Test data tracking
  let testStaffIds: string[] = [];
  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Create test app
    const result: AppFactoryResult = await createMinimalTestApp();
    app = result.app;
    cleanup = result.cleanup;
    supabaseClient = result.supabaseClient;

    // Create test users for all roles
    const users = await createTestUsersForRoles(supabaseClient);
    adminUser = users.admin;
    doctorUser = users.doctor;
    nurseUser = users.nurse;
    deptManagerUser = users.departmentManager;

    console.log(' Test users created:', {
      admin: adminUser.userId,
      doctor: doctorUser.userId,
      nurse: nurseUser.userId,
      deptManager: deptManagerUser.userId
    });
  }, 60000);

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

  describe('RLS Policy: ADMIN Full Access', () => {
    it('should allow ADMIN to register new staff', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      testUserIds.push(staffData.userId);

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.staffId).toBeDefined();

      testStaffIds.push(response.body.staffId);
    });

    it('should allow ADMIN to view all staff profiles', async () => {
      // Arrange - Create test staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Get staff by ID
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staffId).toBe(staffId);
    });

    it('should allow ADMIN to update any staff profile', async () => {
      // Arrange - Create test staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Update staff
      const updateData = {
        personalInfo: {
          phoneNumber: '0987654321'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow ADMIN to search all staff', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/search?searchTerm=test')
        .set('Authorization', `Bearer ${adminUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('RLS Policy: DOCTOR View Doctors Only', () => {
    it('should allow DOCTOR to view other doctors', async () => {
      // Arrange - Create doctor staff
      const doctorStaffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(doctorStaffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(doctorStaffData.userId);

      // Act - Doctor views another doctor
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${doctorUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should NOT allow DOCTOR to register new staff', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${doctorUser.token}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('FORBIDDEN');
    });

    it('should NOT allow DOCTOR to update other staff profiles', async () => {
      // Arrange - Create test staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Doctor tries to update
      const updateData = {
        personalInfo: {
          phoneNumber: '0987654321'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${doctorUser.token}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('RLS Policy: NURSE View Active Staff Only', () => {
    it('should allow NURSE to view active staff', async () => {
      // Arrange - Create active staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Nurse views active staff
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${nurseUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should NOT allow NURSE to register new staff', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidNurseData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      // Act
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${nurseUser.token}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should NOT allow NURSE to update other staff profiles', async () => {
      // Arrange - Create test staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Nurse tries to update
      const updateData = {
        personalInfo: {
          phoneNumber: '0987654321'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}`)
        .set('Authorization', `Bearer ${nurseUser.token}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('RLS Policy: Unauthorized Access', () => {
    it('should block access without authentication token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/search?searchTerm=test');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('should block access with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/search?searchTerm=test')
        .set('Authorization', 'Bearer invalid-token-12345');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should block POST operations without ADMIN role', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      // Act - Try with DOCTOR token
      const response = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${doctorUser.token}`)
        .send(staffData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('FORBIDDEN');
    });
  });

  describe('RLS Policy: Self-Management', () => {
    it('should allow staff to view own profile', async () => {
      // Arrange - Create staff with doctor user ID
      const staffData = TestDataFactory.createValidDoctorData({
        userId: doctorUser.userId,
        email: 'doctor-own-profile@hospital.vn',
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminUser.token}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);

      // Act - Doctor views own profile
      const response = await request(app)
        .get(`/api/v1/staff/user/${doctorUser.userId}`)
        .set('Authorization', `Bearer ${doctorUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(doctorUser.userId);
    });
  });
});
