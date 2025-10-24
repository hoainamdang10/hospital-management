/**
 * DepartmentAssignment Entity Tests
 * Provider/Staff Service - Domain Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DepartmentAssignment } from '../../../../src/domain/entities/DepartmentAssignment';

describe('DepartmentAssignment Entity', () => {
  const validAssignmentData = {
    departmentId: 'dept-123',
    departmentCode: 'CARD',
    departmentNameEn: 'Cardiology',
    departmentNameVi: 'Tim mạch',
    role: 'Senior Doctor',
    isPrimary: true,
    startDate: new Date('2024-01-01'),
    isActive: true
  };

  describe('create', () => {
    it('should create assignment with valid data', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      expect(assignment).toBeDefined();
      expect(assignment.departmentId).toBe('dept-123');
      expect(assignment.departmentCode).toBe('CARD');
      expect(assignment.role).toBe('Senior Doctor');
      expect(assignment.isActive).toBe(true);
    });

    it('should create assignment without end date', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      expect(assignment.endDate).toBeUndefined();
    });

    it('should create assignment with end date', () => {
      const endDate = new Date('2025-12-31');
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        endDate
      });

      expect(assignment.endDate).toEqual(endDate);
    });

    it('should default isPrimary to false if not provided', () => {
      const { isPrimary, ...dataWithoutPrimary } = validAssignmentData;
      const assignment = DepartmentAssignment.create(dataWithoutPrimary);

      expect(assignment.isPrimary).toBe(false);
    });

    it('should set timestamps automatically', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);
      const persistence = assignment.toPersistence();

      expect(persistence.createdAt).toBeDefined();
      expect(persistence.updatedAt).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      expect(() => assignment.validate()).not.toThrow();
    });

    it('should fail when departmentId is empty', () => {
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentId: ''
      });

      expect(() => assignment.validate()).toThrow('ID khoa/phòng ban không được để trống');
    });

    it('should fail when departmentId is undefined', () => {
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentId: undefined as any
      });

      expect(() => assignment.validate()).toThrow('ID khoa/phòng ban không được để trống');
    });
  });

  describe('end', () => {
    it('should end assignment with end date', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);
      const endDate = new Date('2025-12-31');

      assignment.end(endDate);

      expect(assignment.endDate).toEqual(endDate);
      expect(assignment.isActive).toBe(false);
    });

    it('should update timestamp when ended', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);
      const endDate = new Date('2025-12-31');

      assignment.end(endDate);

      const persistence = assignment.toPersistence();
      expect(persistence.updatedAt).toBeDefined();
    });

    it('should allow ending already inactive assignment', () => {
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        isActive: false
      });
      const endDate = new Date('2025-12-31');

      assignment.end(endDate);

      expect(assignment.isActive).toBe(false);
      expect(assignment.endDate).toEqual(endDate);
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstruct assignment from database with snake_case', () => {
      const dbData = {
        id: 'assign-123',
        department_id: 'dept-456',
        department_code: 'CARD',
        department_name_en: 'Cardiology',
        department_name_vi: 'Tim mạch',
        role: 'Doctor',
        is_primary: true,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const assignment = DepartmentAssignment.fromPersistenceData(dbData);

      expect(assignment.departmentId).toBe('dept-456');
      expect(assignment.departmentCode).toBe('CARD');
      expect(assignment.isActive).toBe(true);
    });

    it('should reconstruct assignment from database with camelCase', () => {
      const dbData = {
        id: 'assign-123',
        departmentId: 'dept-456',
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        role: 'Doctor',
        isPrimary: true,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      const assignment = DepartmentAssignment.fromPersistenceData(dbData);

      expect(assignment.departmentId).toBe('dept-456');
      expect(assignment.isPrimary).toBe(true);
    });

    it('should handle fallback for department names', () => {
      const dbData = {
        id: 'assign-123',
        departmentId: 'dept-456',
        departmentCode: 'CARD',
        department_name: 'Cardiology',
        role: 'Doctor',
        startDate: '2024-01-01T00:00:00.000Z',
        isActive: true
      };

      const assignment = DepartmentAssignment.fromPersistenceData(dbData);

      expect(assignment.departmentNameEn).toBe('Cardiology');
      expect(assignment.departmentNameVi).toBe('Cardiology');
    });

    it('should default isPrimary to false when missing', () => {
      const dbData = {
        id: 'assign-123',
        departmentId: 'dept-456',
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        role: 'Doctor',
        startDate: '2024-01-01T00:00:00.000Z',
        isActive: true
      };

      const assignment = DepartmentAssignment.fromPersistenceData(dbData);

      expect(assignment.isPrimary).toBe(false);
    });

    it('should handle null end date', () => {
      const dbData = {
        id: 'assign-123',
        departmentId: 'dept-456',
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        role: 'Doctor',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: null,
        isActive: true
      };

      const assignment = DepartmentAssignment.fromPersistenceData(dbData);

      expect(assignment.endDate).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('should convert to database format', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      const persistence = assignment.toPersistence();

      expect(persistence).toHaveProperty('departmentId', 'dept-123');
      expect(persistence).toHaveProperty('departmentCode', 'CARD');
      expect(persistence).toHaveProperty('departmentNameEn', 'Cardiology');
      expect(persistence).toHaveProperty('departmentNameVi', 'Tim mạch');
      expect(persistence).toHaveProperty('role', 'Senior Doctor');
      expect(persistence).toHaveProperty('isPrimary', true);
      expect(persistence).toHaveProperty('isActive', true);
      expect(persistence).toHaveProperty('createdAt');
      expect(persistence).toHaveProperty('updatedAt');
    });

    it('should convert dates to ISO strings', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      const persistence = assignment.toPersistence();

      expect(typeof persistence.startDate).toBe('string');
      expect(persistence.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle optional end date', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      const persistence = assignment.toPersistence();

      expect(persistence.endDate).toBeUndefined();
    });

    it('should include end date when set', () => {
      const endDate = new Date('2025-12-31');
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        endDate
      });

      const persistence = assignment.toPersistence();

      expect(persistence.endDate).toBeDefined();
      expect(typeof persistence.endDate).toBe('string');
    });
  });

  describe('Vietnamese Healthcare Departments', () => {
    it('should support common Vietnamese medical departments', () => {
      const departments = [
        { code: 'TIM', nameEn: 'Cardiology', nameVi: 'Khoa Tim mạch' },
        { code: 'XUONG', nameEn: 'Orthopedics', nameVi: 'Khoa Xương khớp' },
        { code: 'NHI', nameEn: 'Pediatrics', nameVi: 'Khoa Nhi' },
        { code: 'SANPK', nameEn: 'OB/GYN', nameVi: 'Khoa Sản phụ khoa' },
        { code: 'CCHS', nameEn: 'Emergency', nameVi: 'Khoa Cấp cứu - Hồi sức' },
        { code: 'NGOAI', nameEn: 'Surgery', nameVi: 'Khoa Ngoại tổng hợp' }
      ];

      departments.forEach(dept => {
        const assignment = DepartmentAssignment.create({
          departmentId: `dept-${dept.code}`,
          departmentCode: dept.code,
          departmentNameEn: dept.nameEn,
          departmentNameVi: dept.nameVi,
          role: 'Doctor',
          startDate: new Date(),
          isActive: true
        });

        expect(assignment.departmentCode).toBe(dept.code);
        expect(assignment.departmentNameVi).toBe(dept.nameVi);
        expect(() => assignment.validate()).not.toThrow();
      });
    });
  });

  describe('Assignment Roles', () => {
    it('should support common staff roles', () => {
      const roles = [
        'Head of Department',
        'Senior Doctor',
        'Doctor',
        'Resident',
        'Head Nurse',
        'Senior Nurse',
        'Nurse',
        'Assistant'
      ];

      roles.forEach(role => {
        const assignment = DepartmentAssignment.create({
          ...validAssignmentData,
          role
        });

        expect(assignment.role).toBe(role);
      });
    });

    it('should support Vietnamese role names', () => {
      const vietnameseRoles = [
        'Trưởng khoa',
        'Phó Trưởng khoa',
        'Bác sĩ điều trị',
        'Bác sĩ nội trú',
        'Điều dưỡng trưởng',
        'Điều dưỡng'
      ];

      vietnameseRoles.forEach(role => {
        const assignment = DepartmentAssignment.create({
          ...validAssignmentData,
          role
        });

        expect(assignment.role).toBe(role);
      });
    });
  });

  describe('Primary vs Secondary Assignments', () => {
    it('should identify primary assignment', () => {
      const primary = DepartmentAssignment.create({
        ...validAssignmentData,
        isPrimary: true
      });

      expect(primary.isPrimary).toBe(true);
    });

    it('should identify secondary assignment', () => {
      const secondary = DepartmentAssignment.create({
        ...validAssignmentData,
        isPrimary: false
      });

      expect(secondary.isPrimary).toBe(false);
    });

    it('should handle multiple assignments (one primary)', () => {
      const primary = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentId: 'dept-1',
        isPrimary: true
      });

      const secondary1 = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentId: 'dept-2',
        isPrimary: false
      });

      const secondary2 = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentId: 'dept-3',
        isPrimary: false
      });

      expect(primary.isPrimary).toBe(true);
      expect(secondary1.isPrimary).toBe(false);
      expect(secondary2.isPrimary).toBe(false);
    });
  });

  describe('Assignment Lifecycle', () => {
    it('should track assignment from start to end', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-12-31');

      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        startDate
      });

      expect(assignment.startDate).toEqual(startDate);
      expect(assignment.isActive).toBe(true);

      assignment.end(endDate);

      expect(assignment.endDate).toEqual(endDate);
      expect(assignment.isActive).toBe(false);
    });

    it('should allow open-ended assignments', () => {
      const assignment = DepartmentAssignment.create(validAssignmentData);

      expect(assignment.endDate).toBeUndefined();
      expect(assignment.isActive).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long role names', () => {
      const longRole = 'Senior Consultant Cardiologist and Head of Cardiac Catheterization Laboratory';
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        role: longRole
      });

      expect(assignment.role).toBe(longRole);
    });

    it('should handle special characters in names', () => {
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        departmentNameEn: 'OB/GYN & Women\'s Health',
        departmentNameVi: 'Khoa Sản phụ & Sức khỏe Phụ nữ'
      });

      expect(assignment.departmentNameEn).toContain('&');
      expect(assignment.departmentNameVi).toContain('&');
    });

    it('should handle same start and end dates', () => {
      const sameDate = new Date('2024-01-01');
      const assignment = DepartmentAssignment.create({
        ...validAssignmentData,
        startDate: sameDate,
        endDate: sameDate
      });

      expect(assignment.startDate).toEqual(sameDate);
      expect(assignment.endDate).toEqual(sameDate);
    });
  });
});
