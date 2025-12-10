/**
 * Staff Department Assignment Integration Tests
 * Tests department assignment endpoint
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

describe('Staff Department Assignment Integration Tests', () => {
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
      'admin-dept@hospital.vn',
      'Admin123!@#456',
      'ADMIN'
    );
    adminUserId = adminUser.userId;
    adminToken = adminUser.token;

    console.log(' Admin user created:', adminUserId);
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

  describe('POST /api/v1/staff/:staffId/departments', () => {
    it('should assign staff to department successfully', async () => {
      // Arrange - Create staff
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Assign to department
      const departmentData = {
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội tổng quát',
        role: 'Bác sĩ điều trị',
        isPrimary: true,
        startDate: new Date().toISOString()
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(departmentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.departmentId).toBe(departmentData.departmentId);
    });

    it('should validate department data', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Missing required fields
      const invalidData = {
        departmentId: 'DEPT-001'
        // Missing departmentName, role, etc.
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const departmentData = {
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội',
        role: 'Bác sĩ',
        isPrimary: true
      };

      const response = await request(app)
        .post('/api/v1/staff/non-existent-id/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(departmentData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should require ADMIN role', async () => {
      // Arrange - Create doctor user
      const doctorUser = await getOrCreateTestUser(
        supabaseClient,
        'doctor-dept@hospital.vn',
        'Doctor123!@#456',
        'DOCTOR'
      );

      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Try with DOCTOR token
      const departmentData = {
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội',
        role: 'Bác sĩ',
        isPrimary: true
      };

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${doctorUser.token}`)
        .send(departmentData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should handle multiple department assignments', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      // Act - Assign to first department
      const dept1 = {
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội',
        role: 'Bác sĩ chính',
        isPrimary: true,
        startDate: new Date().toISOString()
      };

      const response1 = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dept1);

      // Assign to second department
      const dept2 = {
        departmentId: 'DEPT-002',
        departmentName: 'Khoa Ngoại',
        role: 'Bác sĩ hỗ trợ',
        isPrimary: false,
        startDate: new Date().toISOString()
      };

      const response2 = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dept2);

      // Assert
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.isPrimary).toBe(true);
      expect(response2.body.data.isPrimary).toBe(false);
    });

    it('should prevent duplicate department assignments', async () => {
      // Arrange
      const staffData = TestDataFactory.createValidDoctorData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber()
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(staffData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(staffData.userId);

      const departmentData = {
        departmentId: 'DEPT-001',
        departmentName: 'Khoa Nội',
        role: 'Bác sĩ',
        isPrimary: true,
        startDate: new Date().toISOString()
      };

      // Act - Assign twice
      await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(departmentData);

      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(departmentData);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already assigned');
    });
  });
});
