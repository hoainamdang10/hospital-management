/**
 * Supabase Department Repository - Integration Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseDepartmentRepository } from '../../../src/infrastructure/persistence/SupabaseDepartmentRepository';
import { Department, DepartmentProps } from '../../../src/domain/entities/Department';

describe('SupabaseDepartmentRepository - Integration Tests', () => {
  let repository: SupabaseDepartmentRepository;
  let testDepartment: Department;

  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ciasxktujslgsdgylimv.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  beforeAll(() => {
    if (!SUPABASE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for integration tests');
    }

    repository = new SupabaseDepartmentRepository(SUPABASE_URL, SUPABASE_KEY);
  });

  beforeEach(() => {
    const props: DepartmentProps = {
      departmentCode: 'TEST',
      departmentNameEn: 'Test Department',
      departmentNameVi: 'Khoa Test',
      description: 'Test department for integration testing',
      phone: '0123456789',
      email: 'test@hospital.com',
      location: 'Test Building',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test-user',
      updatedBy: 'test-user'
    };

    testDepartment = Department.create(props);
  });

  afterEach(async () => {
    // Cleanup: Delete test department if it exists
    if (testDepartment) {
      try {
        await repository.delete(testDepartment.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('save', () => {
    it('should save new department to database', async () => {
      await repository.save(testDepartment);

      const retrieved = await repository.findById(testDepartment.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testDepartment.id);
      expect(retrieved?.code).toBe('TEST');
      expect(retrieved?.nameEn).toBe('Test Department');
      expect(retrieved?.nameVi).toBe('Khoa Test');
    });

    it('should update existing department', async () => {
      // Save initial
      await repository.save(testDepartment);

      // Update contact info
      testDepartment.updateContactInfo('0999999999', 'updated@hospital.com', 'New Location');

      // Save updated
      await repository.save(testDepartment);

      // Retrieve and verify
      const retrieved = await repository.findById(testDepartment.id);

      expect(retrieved?.phone).toBe('0999999999');
      expect(retrieved?.email).toBe('updated@hospital.com');
      expect(retrieved?.location).toBe('New Location');
    });

    it('should preserve all fields when saving', async () => {
      await repository.save(testDepartment);

      const retrieved = await repository.findById(testDepartment.id);

      expect(retrieved?.description).toBe('Test department for integration testing');
      expect(retrieved?.isActive).toBe(true);
      expect(retrieved?.props.createdBy).toBe('test-user');
      expect(retrieved?.props.updatedBy).toBe('test-user');
    });
  });

  describe('findById', () => {
    it('should find department by ID', async () => {
      await repository.save(testDepartment);

      const found = await repository.findById(testDepartment.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(testDepartment.id);
      expect(found?.code).toBe('TEST');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id-12345');

      expect(found).toBeNull();
    });

    it('should return Department instance', async () => {
      await repository.save(testDepartment);

      const found = await repository.findById(testDepartment.id);

      expect(found).toBeInstanceOf(Department);
    });
  });

  describe('findByCode', () => {
    it('should find department by code', async () => {
      await repository.save(testDepartment);

      const found = await repository.findByCode('TEST');

      expect(found).toBeDefined();
      expect(found?.code).toBe('TEST');
      expect(found?.nameEn).toBe('Test Department');
    });

    it('should be case-insensitive', async () => {
      await repository.save(testDepartment);

      const found = await repository.findByCode('test');

      expect(found).toBeDefined();
      expect(found?.code).toBe('TEST');
    });

    it('should return null for non-existent code', async () => {
      const found = await repository.findByCode('NONEXIST');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all active departments', async () => {
      const departments = await repository.findAll(true);

      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);
      
      // All should be active
      departments.forEach(dept => {
        expect(dept.isActive).toBe(true);
      });
    });

    it('should return all departments including inactive', async () => {
      const allDepartments = await repository.findAll(false);
      const activeDepartments = await repository.findAll(true);

      expect(allDepartments.length).toBeGreaterThanOrEqual(activeDepartments.length);
    });

    it('should return departments sorted by English name', async () => {
      const departments = await repository.findAll(true);

      for (let i = 1; i < departments.length; i++) {
        const prev = departments[i - 1].nameEn.toLowerCase();
        const curr = departments[i].nameEn.toLowerCase();
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
      });
    });

    it('should return Department instances', async () => {
      const departments = await repository.findAll(true);

      departments.forEach(dept => {
        expect(dept).toBeInstanceOf(Department);
      });
    });
  });

  describe('delete', () => {
    it('should soft delete department', async () => {
      await repository.save(testDepartment);

      await repository.delete(testDepartment.id);

      const found = await repository.findById(testDepartment.id);
      expect(found?.isActive).toBe(false);
    });

    it('should not physically remove department', async () => {
      await repository.save(testDepartment);

      await repository.delete(testDepartment.id);

      // Should still be findable by ID
      const found = await repository.findById(testDepartment.id);
      expect(found).toBeDefined();
    });

    it('should exclude deleted department from active list', async () => {
      await repository.save(testDepartment);

      const beforeDelete = await repository.findAll(true);
      const beforeCount = beforeDelete.filter(d => d.code === 'TEST').length;

      await repository.delete(testDepartment.id);

      const afterDelete = await repository.findAll(true);
      const afterCount = afterDelete.filter(d => d.code === 'TEST').length;

      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('count', () => {
    it('should count active departments', async () => {
      const count = await repository.count(true);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should count all departments', async () => {
      const activeCount = await repository.count(true);
      const totalCount = await repository.count(false);

      expect(totalCount).toBeGreaterThanOrEqual(activeCount);
    });

    it('should return correct count after adding department', async () => {
      const beforeCount = await repository.count(true);

      await repository.save(testDepartment);

      const afterCount = await repository.count(true);

      expect(afterCount).toBe(beforeCount + 1);
    });

    it('should return correct count after deleting department', async () => {
      await repository.save(testDepartment);
      const beforeCount = await repository.count(true);

      await repository.delete(testDepartment.id);

      const afterCount = await repository.count(true);

      expect(afterCount).toBe(beforeCount - 1);
    });
  });

  describe('data integrity', () => {
    it('should preserve Vietnamese characters', async () => {
      const props: DepartmentProps = {
        departmentCode: 'VIET',
        departmentNameEn: 'Vietnamese Test',
        departmentNameVi: 'Khoa Tiếng Việt có dấu',
        description: 'Mô tả bằng tiếng Việt',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dept = Department.create(props);
      await repository.save(dept);

      const retrieved = await repository.findById(dept.id);

      expect(retrieved?.nameVi).toBe('Khoa Tiếng Việt có dấu');
      expect(retrieved?.description).toBe('Mô tả bằng tiếng Việt');

      // Cleanup
      await repository.delete(dept.id);
    });

    it('should handle optional fields correctly', async () => {
      const minimalProps: DepartmentProps = {
        departmentCode: 'MIN',
        departmentNameEn: 'Minimal Department',
        departmentNameVi: 'Khoa Tối Thiểu',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dept = Department.create(minimalProps);
      await repository.save(dept);

      const retrieved = await repository.findById(dept.id);

      expect(retrieved?.description).toBeUndefined();
      expect(retrieved?.phone).toBeUndefined();
      expect(retrieved?.email).toBeUndefined();
      expect(retrieved?.location).toBeUndefined();

      // Cleanup
      await repository.delete(dept.id);
    });
  });

  describe('error handling', () => {
    it('should handle invalid Supabase URL gracefully', async () => {
      const invalidRepo = new SupabaseDepartmentRepository('invalid-url', SUPABASE_KEY);

      const result = await invalidRepo.findAll();

      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      const result = await repository.findById('test-id-with-network-issue');

      // Should not throw, should return null
      expect(result).toBeNull();
    });
  });
});
