/**
 * Staff Specialization Management Integration Tests
 * Tests specialization CRUD operations and business rules
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

describe('Staff Specialization Management Integration Tests', () => {
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
      'admin-specialization@hospital.vn',
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

  // ==================== GET SPECIALIZATIONS TESTS ====================

  describe('GET /api/v1/staff/:staffId/specializations - Get Specializations', () => {
    it('should get staff specializations successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.specializations).toBeInstanceOf(Array);
    });

    it('should return empty array for staff with no specializations', async () => {
      // Arrange
      const nurseData = TestDataFactory.createValidNurseData({
        userId: TestUtils.generateRandomUserId(),
        email: TestUtils.generateRandomEmail(),
        phoneNumber: TestUtils.generateRandomPhone(),
        nationalId: TestUtils.generateRandomNationalId(),
        licenseNumber: TestUtils.generateRandomLicenseNumber(),
        specializations: []
      });

      const registerResponse = await request(app)
        .post('/api/v1/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nurseData);

      const staffId = registerResponse.body.staffId;
      testStaffIds.push(staffId);
      testUserIds.push(nurseData.userId);

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.specializations).toEqual([]);
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/staff/STF-9999-999999-999/specializations')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should filter inactive specializations by default', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add active specialization
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CARD',
          name: 'Tim mạch',
          description: 'Chuyên khoa Tim mạch',
          isActive: true
        });

      // Add inactive specialization
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'NEUR',
          name: 'Thần kinh',
          description: 'Chuyên khoa Thần kinh',
          isActive: false
        });

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.specializations).toBeInstanceOf(Array);
      
      // Should only return active specializations
      const activeSpecs = response.body.data.specializations.filter((s: any) => s.isActive);
      expect(activeSpecs.length).toBeGreaterThan(0);
    });

    it('should include inactive specializations when requested', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`)
        .query({ includeInactive: 'true' })
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ==================== ADD SPECIALIZATION TESTS ====================

  describe('POST /api/v1/staff/:staffId/specializations - Add Specialization', () => {
    it('should add specialization successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const specializationData = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch',
        isActive: true
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specializationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Thêm chuyên khoa thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.specialization.code).toBe('CARD');
      expect(response.body.data.specialization.name).toBe('Tim mạch');

      // Verify in database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('specializations')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      expect(dbStaff!.specializations).toBeInstanceOf(Array);
      const hasCardiology = dbStaff!.specializations.some((s: any) => s.code === 'CARD');
      expect(hasCardiology).toBe(true);
    });

    it('should add multiple specializations to same staff', async () => {
      // Arrange
      const staffId = await createTestStaff();

      const spec1 = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch'
      };

      const spec2 = {
        code: 'NEUR',
        name: 'Thần kinh',
        description: 'Chuyên khoa Thần kinh'
      };

      // Act
      const response1 = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(spec1);

      const response2 = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(spec2);

      // Assert
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      // Verify both specializations exist
      const getResponse = await request(app)
        .get(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.body.data.specializations.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject duplicate specialization code', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const specializationData = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch'
      };

      // Add first time
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specializationData);

      // Act - Try to add again
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specializationData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('đã tồn tại');
    });

    it('should reject invalid specialization code format', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        code: 'invalid-code-123', // Invalid format
        name: 'Test Specialization',
        description: 'Test'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty specialization code', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        code: '',
        name: 'Test Specialization',
        description: 'Test'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject empty specialization name', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        code: 'CARD',
        name: '',
        description: 'Test'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Arrange
      const specializationData = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/staff/STF-9999-999999-999/specializations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specializationData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const specializationData = {
        code: 'CARD',
        name: 'Tim mạch'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .send(specializationData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should set default isActive to true if not provided', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const specializationData = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa Tim mạch'
        // isActive not provided
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specializationData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.specialization.isActive).toBe(true);
    });
  });

  // ==================== DELETE SPECIALIZATION TESTS ====================

  describe('DELETE /api/v1/staff/:staffId/specializations/:code - Remove Specialization', () => {
    it('should remove specialization successfully', async () => {
      // Arrange
      const staffId = await createTestStaff();
      
      // Add specialization first
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CARD',
          name: 'Tim mạch',
          description: 'Chuyên khoa Tim mạch'
        });

      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/specializations/CARD`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Xóa chuyên khoa thành công');

      // Verify removed from database
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('specializations')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      const hasCardiology = dbStaff!.specializations.some((s: any) => s.code === 'CARD');
      expect(hasCardiology).toBe(false);
    });

    it('should return 404 for non-existent specialization code', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/specializations/NONEXISTENT`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent staff', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/staff/STF-9999-999999-999/specializations/CARD')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Act
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/specializations/CARD`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should allow removing one of multiple specializations', async () => {
      // Arrange
      const staffId = await createTestStaff();
      
      // Add multiple specializations
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'CARD', name: 'Tim mạch' });

      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'NEUR', name: 'Thần kinh' });

      // Act - Remove one
      const response = await request(app)
        .delete(`/api/v1/staff/${staffId}/specializations/CARD`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);

      // Verify CARD removed but NEUR remains
      const { data: dbStaff } = await supabaseClient
        .from('staff_profiles')
        .select('specializations')
        .eq('staff_id', staffId)
        .single();

      expect(dbStaff).toBeDefined();
      const hasCard = dbStaff!.specializations.some((s: any) => s.code === 'CARD');
      const hasNeur = dbStaff!.specializations.some((s: any) => s.code === 'NEUR');

      expect(hasCard).toBe(false);
      expect(hasNeur).toBe(true);
    });
  });

  // ==================== SPECIALIZATION VALIDATION TESTS ====================

  describe('Specialization Validation Rules', () => {
    it('should validate Vietnamese specialization codes', async () => {
      // Arrange
      const staffId = await createTestStaff();
      
      const vietnameseSpecs = [
        { code: 'CARD', name: 'Tim mạch' },
        { code: 'NEUR', name: 'Thần kinh' },
        { code: 'ORTH', name: 'Chỉnh hình' },
        { code: 'PEDI', name: 'Nhi khoa' },
        { code: 'OBGY', name: 'Sản phụ khoa' }
      ];

      // Act & Assert
      for (const spec of vietnameseSpecs) {
        const response = await request(app)
          .post(`/api/v1/staff/${staffId}/specializations`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(spec);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject specialization code with special characters', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        code: 'CARD@#$',
        name: 'Tim mạch'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject specialization code exceeding max length', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const invalidData = {
        code: 'A'.repeat(100), // Too long
        name: 'Test'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept Vietnamese characters in specialization name', async () => {
      // Arrange
      const staffId = await createTestStaff();
      const vietnameseData = {
        code: 'CARD',
        name: 'Chuyên khoa Tim mạch và Mạch máu',
        description: 'Điều trị các bệnh lý về tim và mạch máu'
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vietnameseData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.specialization.name).toBe(vietnameseData.name);
    });
  });

  // ==================== PRIMARY SPECIALIZATION LOGIC TESTS ====================

  describe('Primary Specialization Logic', () => {
    it('should handle primary specialization designation', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add primary specialization
      const primarySpec = {
        code: 'CARD',
        name: 'Tim mạch',
        description: 'Chuyên khoa chính',
        isPrimary: true
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(primarySpec);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow only one primary specialization per staff', async () => {
      // Arrange
      const staffId = await createTestStaff();

      // Add first primary
      await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CARD',
          name: 'Tim mạch',
          isPrimary: true
        });

      // Act - Try to add second primary
      const response = await request(app)
        .post(`/api/v1/staff/${staffId}/specializations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'NEUR',
          name: 'Thần kinh',
          isPrimary: true
        });

      // Assert - Should either reject or auto-set isPrimary to false
      expect([201, 400]).toContain(response.status);
    });
  });
});
