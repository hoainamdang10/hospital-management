/**
 * Staff Schedule Management Integration Tests
 * Tests schedule update and retrieval endpoints
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

describe('Staff Schedule Management Integration Tests', () => {
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
      'admin-schedule@hospital.vn',
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

  describe('PUT /api/v1/staff/:staffId/schedule', () => {
    it('should update staff work schedule successfully', async () => {
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

      // Act - Update schedule
      const scheduleData = {
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: {
          start: '08:00',
          end: '17:00'
        },
        breakTime: {
          start: '12:00',
          end: '13:00'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workingDays).toEqual(scheduleData.workingDays);
    });

    it('should validate working hours format', async () => {
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

      // Act - Invalid time format
      const invalidSchedule = {
        workingDays: ['monday'],
        workingHours: {
          start: '25:00', // Invalid hour
          end: '17:00'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSchedule);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate working days', async () => {
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

      // Act - Invalid day
      const invalidSchedule = {
        workingDays: ['invalidday'],
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSchedule);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require ADMIN role', async () => {
      // Arrange - Create doctor user
      const doctorUser = await getOrCreateTestUser(
        supabaseClient,
        'doctor-schedule@hospital.vn',
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
      const scheduleData = {
        workingDays: ['monday'],
        workingHours: {
          start: '08:00',
          end: '17:00'
        }
      };

      const response = await request(app)
        .put(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${doctorUser.token}`)
        .send(scheduleData);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/:staffId/schedule', () => {
    it('should retrieve staff schedule', async () => {
      // Arrange - Create staff with schedule
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

      // Set schedule
      const scheduleData = {
        workingDays: ['monday', 'wednesday', 'friday'],
        workingHours: {
          start: '09:00',
          end: '18:00'
        }
      };

      await request(app)
        .put(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleData);

      // Act - Get schedule
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workingDays).toEqual(scheduleData.workingDays);
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/non-existent-id/schedule')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should allow authenticated users to view schedules', async () => {
      // Arrange - Create doctor user
      const doctorUser = await getOrCreateTestUser(
        supabaseClient,
        'doctor-view-schedule@hospital.vn',
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

      // Act - Doctor views schedule
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/schedule`)
        .set('Authorization', `Bearer ${doctorUser.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
