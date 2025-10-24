/**
 * Department Entity - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Department, DepartmentProps } from '../../../src/domain/entities/Department';

describe('Department Entity', () => {
  const validProps: DepartmentProps = {
    departmentCode: 'CARD',
    departmentNameEn: 'Cardiology',
    departmentNameVi: 'Tim mạch',
    description: 'Chuyên khoa tim mạch',
    phone: '0123456789',
    email: 'cardiology@hospital.com',
    location: 'Building A, Floor 3',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    createdBy: 'admin',
    updatedBy: 'admin'
  };

  describe('create', () => {
    it('should create department with valid props', () => {
      const department = Department.create(validProps);

      expect(department).toBeInstanceOf(Department);
      expect(department.code).toBe('CARD');
      expect(department.nameEn).toBe('Cardiology');
      expect(department.nameVi).toBe('Tim mạch');
      expect(department.isActive).toBe(true);
    });

    it('should create department with custom ID', () => {
      const customId = 'custom-uuid-123';
      const department = Department.create(validProps, customId);

      expect(department.id).toBe(customId);
    });

    it('should generate UUID if no ID provided', () => {
      const department = Department.create(validProps);

      expect(department.id).toBeDefined();
      expect(department.id.length).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('should throw error if department code is too short', () => {
      const invalidProps = { ...validProps, departmentCode: 'C' };

      expect(() => Department.create(invalidProps)).toThrow('Department code must be at least 2 characters');
    });

    it('should throw error if department code is not uppercase letters', () => {
      const invalidProps = { ...validProps, departmentCode: 'card' };

      expect(() => Department.create(invalidProps)).toThrow('Department code must be 2-4 uppercase letters');
    });

    it('should throw error if department code contains numbers', () => {
      const invalidProps = { ...validProps, departmentCode: 'CA12' };

      expect(() => Department.create(invalidProps)).toThrow('Department code must be 2-4 uppercase letters');
    });

    it('should throw error if department code is too long', () => {
      const invalidProps = { ...validProps, departmentCode: 'CARDIO' };

      expect(() => Department.create(invalidProps)).toThrow('Department code must be 2-4 uppercase letters');
    });

    it('should throw error if English name is empty', () => {
      const invalidProps = { ...validProps, departmentNameEn: '' };

      expect(() => Department.create(invalidProps)).toThrow('Department name (English) is required');
    });

    it('should throw error if Vietnamese name is empty', () => {
      const invalidProps = { ...validProps, departmentNameVi: '   ' };

      expect(() => Department.create(invalidProps)).toThrow('Department name (Vietnamese) is required');
    });

    it('should throw error if email format is invalid', () => {
      const invalidProps = { ...validProps, email: 'invalid-email' };

      expect(() => Department.create(invalidProps)).toThrow('Invalid email format');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@hospital.com',
        'cardiology.dept@hospital.vn',
        'dept+cardio@hospital.co.uk'
      ];

      validEmails.forEach(email => {
        const props = { ...validProps, email };
        expect(() => Department.create(props)).not.toThrow();
      });
    });
  });

  describe('getters', () => {
    let department: Department;

    beforeEach(() => {
      department = Department.create(validProps);
    });

    it('should return correct code', () => {
      expect(department.code).toBe('CARD');
    });

    it('should return correct English name', () => {
      expect(department.nameEn).toBe('Cardiology');
    });

    it('should return correct Vietnamese name', () => {
      expect(department.nameVi).toBe('Tim mạch');
    });

    it('should return correct description', () => {
      expect(department.description).toBe('Chuyên khoa tim mạch');
    });

    it('should return correct phone', () => {
      expect(department.phone).toBe('0123456789');
    });

    it('should return correct email', () => {
      expect(department.email).toBe('cardiology@hospital.com');
    });

    it('should return correct location', () => {
      expect(department.location).toBe('Building A, Floor 3');
    });

    it('should return correct active status', () => {
      expect(department.isActive).toBe(true);
    });

    it('should return correct created date', () => {
      expect(department.createdAt).toEqual(new Date('2025-01-01'));
    });

    it('should return correct updated date', () => {
      expect(department.updatedAt).toEqual(new Date('2025-01-01'));
    });
  });

  describe('activate', () => {
    it('should activate inactive department', () => {
      const inactiveProps = { ...validProps, isActive: false };
      const department = Department.create(inactiveProps);

      department.activate();

      expect(department.isActive).toBe(true);
    });

    it('should update updatedAt when activating', () => {
      const department = Department.create(validProps);
      const originalUpdatedAt = department.updatedAt;

      // Wait a bit to ensure time difference
      setTimeout(() => {
        department.activate();
        expect(department.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('deactivate', () => {
    it('should deactivate active department', () => {
      const department = Department.create(validProps);

      department.deactivate();

      expect(department.isActive).toBe(false);
    });

    it('should update updatedAt when deactivating', () => {
      const department = Department.create(validProps);
      const originalUpdatedAt = department.updatedAt;

      setTimeout(() => {
        department.deactivate();
        expect(department.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('updateContactInfo', () => {
    let department: Department;

    beforeEach(() => {
      department = Department.create(validProps);
    });

    it('should update phone number', () => {
      department.updateContactInfo('0987654321');

      expect(department.phone).toBe('0987654321');
    });

    it('should update email', () => {
      department.updateContactInfo(undefined, 'newemail@hospital.com');

      expect(department.email).toBe('newemail@hospital.com');
    });

    it('should update location', () => {
      department.updateContactInfo(undefined, undefined, 'Building B, Floor 2');

      expect(department.location).toBe('Building B, Floor 2');
    });

    it('should update all contact info at once', () => {
      department.updateContactInfo('0999999999', 'updated@hospital.com', 'New Location');

      expect(department.phone).toBe('0999999999');
      expect(department.email).toBe('updated@hospital.com');
      expect(department.location).toBe('New Location');
    });

    it('should update updatedAt when updating contact info', () => {
      const originalUpdatedAt = department.updatedAt;

      setTimeout(() => {
        department.updateContactInfo('0999999999');
        expect(department.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const freshProps: DepartmentProps = {
        departmentCode: 'CARD',
        departmentNameEn: 'Cardiology',
        departmentNameVi: 'Tim mạch',
        description: 'Chuyên khoa tim mạch',
        phone: '0123456789',
        email: 'cardiology@hospital.com',
        location: 'Building A, Floor 3',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        createdBy: 'admin',
        updatedBy: 'admin'
      };

      const department = Department.create(freshProps, 'test-id-123');
      const json = department.toJSON();

      expect(json).toEqual({
        id: 'test-id-123',
        code: 'CARD',
        nameEn: 'Cardiology',
        nameVi: 'Tim mạch',
        description: 'Chuyên khoa tim mạch',
        phone: '0123456789',
        email: 'cardiology@hospital.com',
        location: 'Building A, Floor 3',
        isActive: true,
        createdAt: freshProps.createdAt.toISOString(),
        updatedAt: freshProps.updatedAt.toISOString(),
        createdBy: 'admin',
        updatedBy: 'admin'
      });
    });

    it('should handle optional fields in JSON', () => {
      const minimalProps: DepartmentProps = {
        departmentCode: 'ORTH',
        departmentNameEn: 'Orthopedics',
        departmentNameVi: 'Chấn thương chỉnh hình',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      };

      const department = Department.create(minimalProps);
      const json = department.toJSON();

      expect(json.description).toBeUndefined();
      expect(json.phone).toBeUndefined();
      expect(json.email).toBeUndefined();
      expect(json.location).toBeUndefined();
      expect(json.createdBy).toBeUndefined();
      expect(json.updatedBy).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should accept 2-letter department code', () => {
      const props = { ...validProps, departmentCode: 'EM' };
      const department = Department.create(props);

      expect(department.code).toBe('EM');
    });

    it('should accept 4-letter department code', () => {
      const props = { ...validProps, departmentCode: 'ORTH' };
      const department = Department.create(props);

      expect(department.code).toBe('ORTH');
    });

    it('should trim whitespace from names during validation', () => {
      const props = {
        ...validProps,
        departmentNameEn: '  Cardiology  ',
        departmentNameVi: '  Tim mạch  '
      };

      expect(() => Department.create(props)).not.toThrow();
    });
  });
});
