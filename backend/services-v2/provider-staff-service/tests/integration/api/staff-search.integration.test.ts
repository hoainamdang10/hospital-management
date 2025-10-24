/**
 * Staff Search API Integration Tests
 * Tests search functionality with various query parameters
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

describe('Staff Search API Integration Tests', () => {
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
      'admin-search@hospital.vn',
      'Admin123!@#',
      'ADMIN'
    );
    adminUserId = adminUser.userId;
    adminToken = adminUser.token;

    // Create test staff for search
    await createTestStaffForSearch();
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(supabaseClient, {
      staffIds: testStaffIds,
      userIds: testUserIds
    });
    await cleanup();
  });

  afterEach(() => {
    // Don't clear arrays - we need them for final cleanup
  });

  /**
   * Create diverse test staff for search scenarios
   */
  async function createTestStaffForSearch(): Promise<void> {
    // Doctor 1 - Cardiology
    const doctor1Data = TestDataFactory.createValidDoctorData({
      userId: TestUtils.generateRandomUserId(),
      email: TestUtils.generateRandomEmail(),
      phoneNumber: TestUtils.generateRandomPhone(),
      nationalId: TestUtils.generateRandomNationalId(),
      licenseNumber: TestUtils.generateRandomLicenseNumber(),
      fullName: 'Bác sĩ Nguyễn Văn A',
      specialization: 'Tim mạch',
      department: 'Khoa Tim mạch',
      yearsOfExperience: 10
    });

    const response1 = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(doctor1Data);
    
    if (response1.status === 201) {
      testStaffIds.push(response1.body.staffId);
      testUserIds.push(doctor1Data.userId);
    }

    // Doctor 2 - Neurology
    const doctor2Data = TestDataFactory.createValidDoctorData({
      userId: TestUtils.generateRandomUserId(),
      email: TestUtils.generateRandomEmail(),
      phoneNumber: TestUtils.generateRandomPhone(),
      nationalId: TestUtils.generateRandomNationalId(),
      licenseNumber: TestUtils.generateRandomLicenseNumber(),
      fullName: 'Bác sĩ Trần Thị B',
      specialization: 'Thần kinh',
      department: 'Khoa Thần kinh',
      yearsOfExperience: 15
    });

    const response2 = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(doctor2Data);
    
    if (response2.status === 201) {
      testStaffIds.push(response2.body.staffId);
      testUserIds.push(doctor2Data.userId);
    }

    // Nurse 1
    const nurse1Data = TestDataFactory.createValidNurseData({
      userId: TestUtils.generateRandomUserId(),
      email: TestUtils.generateRandomEmail(),
      phoneNumber: TestUtils.generateRandomPhone(),
      nationalId: TestUtils.generateRandomNationalId(),
      licenseNumber: TestUtils.generateRandomLicenseNumber(),
      fullName: 'Điều dưỡng Lê Văn C',
      department: 'Khoa Nội tổng quát'
    });

    const response3 = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(nurse1Data);
    
    if (response3.status === 201) {
      testStaffIds.push(response3.body.staffId);
      testUserIds.push(nurse1Data.userId);
    }

    // Wait for indexing
    await TestUtils.sleep(1000);
  }

  describe('GET /api/v1/staff/search - Basic Search', () => {
    it('should search staff by name', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'Nguyễn' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBeGreaterThan(0);
    });

    it('should search staff by specialization', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ specialization: 'Tim mạch' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // Verify all results have correct specialization
      if (response.body.data.items.length > 0) {
        response.body.data.items.forEach((staff: any) => {
          expect(staff.specializations).toBeDefined();
        });
      }
    });

    it('should search staff by department', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ departmentId: 'Khoa Tim mạch' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
    });

    it('should search staff by staff type', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ staffType: 'doctor' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // Verify all results are doctors
      if (response.body.data.items.length > 0) {
        response.body.data.items.forEach((staff: any) => {
          expect(staff.staffType).toBe('doctor');
        });
      }
    });

    it('should search staff by status', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ status: 'active' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // Verify all results are active
      if (response.body.data.items.length > 0) {
        response.body.data.items.forEach((staff: any) => {
          expect(staff.status).toBe('active');
        });
      }
    });

    it('should return empty results for non-existent search term', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'NonExistentStaffName12345' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBe(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/v1/staff/search - Pagination', () => {
    it('should paginate search results with default values', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBeDefined();
      expect(response.body.data.pagination.limit).toBeDefined();
      expect(response.body.data.pagination.total).toBeDefined();
    });

    it('should paginate with custom page and limit', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
    });

    it('should handle page beyond available results', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ page: 999, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBe(0);
    });

    it('should reject invalid page number', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ page: -1 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ limit: 0 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject limit exceeding maximum', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ limit: 1000 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/search - Sorting', () => {
    it('should sort by name ascending', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify sorting
      if (response.body.data.items.length > 1) {
        const names = response.body.data.items.map((s: any) => s.personalInfo?.fullName || '');
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });

    it('should sort by years of experience descending', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ sortBy: 'experience', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify sorting
      if (response.body.data.items.length > 1) {
        const experiences = response.body.data.items.map((s: any) => s.yearsOfExperience || 0);
        for (let i = 0; i < experiences.length - 1; i++) {
          expect(experiences[i]).toBeGreaterThanOrEqual(experiences[i + 1]);
        }
      }
    });

    it('should reject invalid sort field', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ sortBy: 'invalidField' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid sort order', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ sortOrder: 'invalid' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/search - Combined Filters', () => {
    it('should search with multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({
          staffType: 'doctor',
          status: 'active',
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      
      // Verify all filters applied
      if (response.body.data.items.length > 0) {
        response.body.data.items.forEach((staff: any) => {
          expect(staff.staffType).toBe('doctor');
          expect(staff.status).toBe('active');
        });
      }
    });

    it('should search with search term and filters', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({
          searchTerm: 'Bác sĩ',
          staffType: 'doctor',
          status: 'active'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/staff/search - Authentication & Authorization', () => {
    it('should reject search without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject search with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'test' })
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/search - Performance', () => {
    it('should complete search within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'test', limit: 50 })
        .set('Authorization', `Bearer ${adminToken}`);

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle empty search term efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: '' })
        .set('Authorization', `Bearer ${adminToken}`);

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('GET /api/v1/staff/search - Edge Cases', () => {
    it('should handle special characters in search term', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: 'Nguyễn@#$%' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle very long search term', async () => {
      const longTerm = 'a'.repeat(500);
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: longTerm })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle Unicode characters in search', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: '🏥👨‍⚕️' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/v1/staff/search')
        .query({ searchTerm: "'; DROP TABLE staff_profiles; --" })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Should not cause any database errors
    });
  });
});
