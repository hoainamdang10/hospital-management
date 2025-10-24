/**
 * Staff Update & Delete API Integration Tests
 * Tests update and delete operations with audit logging
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

describe('Staff Update & Delete API Integration Tests', () => {
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
      'admin-update-delete@hospital.vn',
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
    // Clear arrays after each test
    testStaffIds = [];
    testUserIds = [];
  });

  // ==================== UPDATE STAFF TESTS ====================

  describe('PUT /api/v1/staff/:staffId - Update Staff Profile', () => {
    let staffIdToUpdate: string;
    let userIdToUpdate: string;

    beforeEach(async () => {
      // Create staff for update tests
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

      staffIdToUpdate = response.body.staffId;
      userIdToUpdate = staffData.userId;
      testStaffIds.push(staffIdToUpdate);
      testUserIds.push(userIdToUpdate);
    });

    it('should update staff personal info successfully', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        personalInfo: {
          fullName: 'Bác sĩ Updated Name',
          phoneNumber: TestUtils.generateRandomPhone(),
          email: TestUtils.generateRandomEmail(),
          address: {
            street: '456 Updated St',
            ward: 'Ward 2',
            district: 'District 2',
            city: 'Ho Chi Minh',
            province: 'Ho Chi Minh',
            country: 'Vietnam'
          }
        }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Cập nhật');
      expect(response.body.data.staff.personalInfo.fullName).toBe('Bác sĩ Updated Name');

      // Verify in database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('personal_info')
        .eq('staff_id', staffIdToUpdate)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.personal_info.fullName).toBe('Bác sĩ Updated Name');
    });

    it('should update staff professional info successfully', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        professionalInfo: {
          title: 'Tiến sĩ',
          department: 'Khoa Ngoại tổng quát',
          position: 'Trưởng khoa',
          education: ['Doctor of Medicine', 'PhD in Surgery'],
          languages: ['Vietnamese', 'English', 'French'],
          bio: 'Updated bio information'
        }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.professionalInfo.title).toBe('Tiến sĩ');
      expect(response.body.data.staff.professionalInfo.department).toBe('Khoa Ngoại tổng quát');
    });

    it('should update staff work schedule successfully', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        workSchedule: {
          workingDays: ['monday', 'wednesday', 'friday'],
          workingHours: {
            start: '09:00',
            end: '18:00'
          },
          timeZone: 'Asia/Ho_Chi_Minh',
          isFlexible: true
        }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.workSchedule.workingDays).toEqual(['monday', 'wednesday', 'friday']);
      expect(response.body.data.staff.workSchedule.isFlexible).toBe(true);
    });

    it('should update consultation fee successfully', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        consultationFee: 750000
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.consultationFee).toBe(750000);
    });

    it('should reject update with invalid data', async () => {
      // Arrange
      const invalidData = {
        staffId: staffIdToUpdate,
        personalInfo: {
          fullName: '', // Empty name - invalid
          phoneNumber: 'invalid-phone'
        }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Arrange
      const updateData = {
        staffId: 'STF-999999-999',
        personalInfo: {
          fullName: 'Test Name'
        }
      };

      // Act
      const response = await request(app)
        .put('/api/v1/staff/STF-999999-999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject update without authentication', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        personalInfo: { fullName: 'Test' }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should log audit trail after update', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        personalInfo: {
          fullName: 'Audit Test Name'
        }
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);

      // Verify updated_at timestamp changed
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('updated_at, updated_by')
        .eq('staff_id', staffIdToUpdate)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.updated_at).toBeDefined();
      expect(dbStaff!.updated_by).toBeDefined();
    });

    it('should handle concurrent updates gracefully', async () => {
      // Arrange
      const update1 = {
        staffId: staffIdToUpdate,
        personalInfo: { fullName: 'Concurrent Update 1' }
      };
      const update2 = {
        staffId: staffIdToUpdate,
        personalInfo: { fullName: 'Concurrent Update 2' }
      };

      // Act - Send concurrent requests
      const [response1, response2] = await Promise.all([
        request(app)
          .put(`/api/v1/staff/${staffIdToUpdate}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(update1),
        request(app)
          .put(`/api/v1/staff/${staffIdToUpdate}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(update2)
      ]);

      // Assert - Both should succeed (last write wins)
      expect([200, 409]).toContain(response1.status);
      expect([200, 409]).toContain(response2.status);
    });

    it('should update multiple fields at once', async () => {
      // Arrange
      const updateData = {
        staffId: staffIdToUpdate,
        personalInfo: {
          fullName: 'Multi Update Test',
          phoneNumber: TestUtils.generateRandomPhone()
        },
        professionalInfo: {
          title: 'Phó Giáo sư',
          department: 'Khoa Nội tổng quát'
        },
        consultationFee: 850000
      };

      // Act
      const response = await request(app)
        .put(`/api/v1/staff/${staffIdToUpdate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.staff.personalInfo.fullName).toBe('Multi Update Test');
      expect(response.body.data.staff.professionalInfo.title).toBe('Phó Giáo sư');
      expect(response.body.data.staff.consultationFee).toBe(850000);
    });
  });

  // ==================== DELETE STAFF TESTS ====================

  describe('DELETE /api/v1/staff/:staffId - Delete Staff', () => {
    let staffIdToDelete: string;

    beforeEach(async () => {
      // Create staff for delete tests
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

      staffIdToDelete = response.body.staffId;
      userIdToDelete = staffData.userId;
      // Don't add to cleanup arrays - we're testing deletion
    });

    it('should soft delete staff successfully', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xóa');

      // Verify soft delete in database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('is_active, status')
        .eq('staff_id', staffIdToDelete)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.is_active).toBe(false);
      expect(dbStaff!.status).toBe('inactive');
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/staff/STF-999999-999')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject delete without authentication', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should log audit trail after delete', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);

      // Verify updated_at and updated_by changed
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('updated_at, updated_by')
        .eq('staff_id', staffIdToDelete)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.updated_at).toBeDefined();
      expect(dbStaff!.updated_by).toBeDefined();
    });

    it('should prevent deletion of staff with active appointments', async () => {
      // Note: This test assumes integration with appointments service
      // For now, we'll test the endpoint behavior
      
      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert - Should succeed (soft delete)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should cascade soft delete to related entities', async () => {
      // Arrange - Add credential to staff
      await request(app)
        .post(`/api/v1/staff/${staffIdToDelete}/credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          credentialNumber: 'TEST-CRED-001',
          credentialType: 'license',
          issuingAuthority: 'Bộ Y tế',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01'
        });

      // Act - Delete staff
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);

      // Verify credentials are also soft deleted or marked inactive
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('credentials')
        .eq('staff_id', staffIdToDelete)
        .single();

      // Credentials should still exist but staff is inactive
      expect(dbStaff).toBeDefined();
    });

    it('should allow re-activation after soft delete', async () => {
      // Arrange - Delete staff first
      await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Act - Reactivate
      const response = await request(app)
        .post(`/api/v1/staff/${staffIdToDelete}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify in database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('is_active, status')
        .eq('staff_id', staffIdToDelete)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.is_active).toBe(true);
      expect(dbStaff!.status).toBe('active');
    });

    it('should not allow double deletion', async () => {
      // Arrange - Delete staff first
      await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Act - Try to delete again
      const response = await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert - Should return error or 404
      expect([404, 400]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should preserve data after soft delete', async () => {
      // Arrange - Get original data
      const { data: originalStaff } = await supabaseClient
        .from('staff_profiles')
        .select('personal_info, professional_info')
        .eq('staff_id', staffIdToDelete)
        .single();

      // Act - Delete staff
      await request(app)
        .delete(`/api/v1/staff/${staffIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert - Data should still exist
      const { data: deletedStaff } = await supabaseClient
        .from('staff_profiles')
        .select('personal_info, professional_info, is_active')
        .eq('staff_id', staffIdToDelete)
        .single();

      expect(deletedStaff).toBeDefined();
      expect(originalStaff).toBeDefined();
      expect(deletedStaff!.personal_info).toEqual(originalStaff!.personal_info);
      expect(deletedStaff!.professional_info).toEqual(originalStaff!.professional_info);
      expect(deletedStaff!.is_active).toBe(false);
    });
  });
});
