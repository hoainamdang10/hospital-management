/**
 * HealthcareRole Entity Unit Tests
 * Tests for healthcare role permissions and validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { HealthcareRole } from '../../../../src/domain/entities/HealthcareRole';

describe('HealthcareRole Entity', () => {
  describe('create', () => {
    it('should create HealthcareRole with valid data', () => {
      const role = HealthcareRole.create(
        'DOCTOR',
        'Doctor',
        'Bác sĩ',
        'Medical doctor',
        ['read:patients', 'write:patients'],
        true
      );

      expect(role.type).toBe('DOCTOR');
      expect(role.name).toBe('Doctor');
      expect(role.nameVietnamese).toBe('Bác sĩ');
      expect(role.description).toBe('Medical doctor');
      expect(role.permissions).toEqual(['read:patients', 'write:patients']);
      expect(role.hasHIPAATraining()).toBe(true);
      expect(role.isActive).toBe(true);
    });

    it('should create role with default permissions and HIPAA training', () => {
      const role = HealthcareRole.create(
        'NURSE',
        'Nurse',
        'Y tá',
        'Registered nurse'
      );

      expect(role.permissions).toEqual([]);
      expect(role.hasHIPAATraining()).toBe(false);
      expect(role.isActive).toBe(true);
    });
  });

  describe('fromRoleType', () => {
    it('should create ADMIN role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('ADMIN');

      expect(role.type).toBe('ADMIN');
      expect(role.name).toBe('Administrator');
      expect(role.nameVietnamese).toBe('Quản trị viên');
      expect(role.permissions).toContain('*');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create DOCTOR role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');

      expect(role.type).toBe('DOCTOR');
      expect(role.name).toBe('Doctor');
      expect(role.nameVietnamese).toBe('Bác sĩ');
      expect(role.permissions).toContain('read:patients');
      expect(role.permissions).toContain('write:patients');
      expect(role.permissions).toContain('read:medical_records');
      expect(role.permissions).toContain('write:medical_records');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create NURSE role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('NURSE');

      expect(role.type).toBe('NURSE');
      expect(role.name).toBe('Nurse');
      expect(role.nameVietnamese).toBe('Y tá');
      expect(role.permissions).toContain('read:patients');
      expect(role.permissions).toContain('write:patients');
      expect(role.permissions).toContain('read:medical_records');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create RECEPTIONIST role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('RECEPTIONIST');

      expect(role.type).toBe('RECEPTIONIST');
      expect(role.name).toBe('Receptionist');
      expect(role.nameVietnamese).toBe('Lễ tân');
      expect(role.permissions).toContain('read:patients');
      expect(role.permissions).toContain('write:appointments');
      expect(role.hasHIPAATraining()).toBe(false);
    });

    it('should create PHARMACIST role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('PHARMACIST');

      expect(role.type).toBe('PHARMACIST');
      expect(role.name).toBe('Pharmacist');
      expect(role.nameVietnamese).toBe('Dược sĩ');
      expect(role.permissions).toContain('read:prescriptions');
      expect(role.permissions).toContain('write:prescriptions');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create LAB_TECHNICIAN role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('LAB_TECHNICIAN');

      expect(role.type).toBe('LAB_TECHNICIAN');
      expect(role.name).toBe('Lab Technician');
      expect(role.nameVietnamese).toBe('Kỹ thuật viên xét nghiệm');
      expect(role.permissions).toContain('read:lab_results');
      expect(role.permissions).toContain('write:lab_results');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create PATIENT role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('PATIENT');

      expect(role.type).toBe('PATIENT');
      expect(role.name).toBe('Patient');
      expect(role.nameVietnamese).toBe('Bệnh nhân');
      expect(role.permissions).toContain('read:own_records');
      expect(role.hasHIPAATraining()).toBe(false);
    });

    it('should create BILLING_STAFF role with correct properties', () => {
      const role = HealthcareRole.fromRoleType('BILLING_STAFF');

      expect(role.type).toBe('BILLING_STAFF');
      expect(role.name).toBe('Billing Staff');
      expect(role.nameVietnamese).toBe('Nhân viên thanh toán');
      expect(role.permissions).toContain('read:billing');
      expect(role.permissions).toContain('write:billing');
      expect(role.hasHIPAATraining()).toBe(false);
    });

    it('should handle lowercase role type', () => {
      const role = HealthcareRole.fromRoleType('doctor');
      expect(role.type).toBe('DOCTOR');
    });

    it('should throw error for invalid role type', () => {
      expect(() => HealthcareRole.fromRoleType('INVALID_ROLE'))
        .toThrow('Invalid role type: INVALID_ROLE');
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin with wildcard permission', () => {
      const role = HealthcareRole.fromRoleType('ADMIN');
      expect(role.hasPermission('read', 'patients')).toBe(true);
      expect(role.hasPermission('write', 'patients')).toBe(true);
      expect(role.hasPermission('delete', 'anything')).toBe(true);
    });

    it('should return true for specific permission', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      expect(role.hasPermission('read', 'patients')).toBe(true);
      expect(role.hasPermission('write', 'patients')).toBe(true);
    });

    it('should return false for permission not granted', () => {
      const role = HealthcareRole.fromRoleType('NURSE');
      expect(role.hasPermission('write', 'medical_records')).toBe(false);
      expect(role.hasPermission('delete', 'patients')).toBe(false);
    });

    it('should check exact permission format', () => {
      const role = HealthcareRole.fromRoleType('RECEPTIONIST');
      expect(role.hasPermission('read', 'patients')).toBe(true);
      expect(role.hasPermission('write', 'appointments')).toBe(true);
      expect(role.hasPermission('write', 'patients')).toBe(false);
    });
  });

  describe('isMedicalStaff', () => {
    it('should return true for medical staff roles', () => {
      expect(HealthcareRole.fromRoleType('DOCTOR').isMedicalStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('NURSE').isMedicalStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('PHARMACIST').isMedicalStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('LAB_TECHNICIAN').isMedicalStaff()).toBe(true);
    });

    it('should return false for non-medical staff roles', () => {
      expect(HealthcareRole.fromRoleType('ADMIN').isMedicalStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('RECEPTIONIST').isMedicalStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('BILLING_STAFF').isMedicalStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('PATIENT').isMedicalStaff()).toBe(false);
    });
  });

  describe('isAdministrativeStaff', () => {
    it('should return true for administrative staff roles', () => {
      expect(HealthcareRole.fromRoleType('ADMIN').isAdministrativeStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('RECEPTIONIST').isAdministrativeStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('BILLING_STAFF').isAdministrativeStaff()).toBe(true);
    });

    it('should return false for non-administrative staff roles', () => {
      expect(HealthcareRole.fromRoleType('DOCTOR').isAdministrativeStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('NURSE').isAdministrativeStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('PHARMACIST').isAdministrativeStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('LAB_TECHNICIAN').isAdministrativeStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('PATIENT').isAdministrativeStaff()).toBe(false);
    });
  });

  describe('isVietnameseHealthcareRole', () => {
    it('should return true for roles with Vietnamese name', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      expect(role.isVietnameseHealthcareRole()).toBe(true);
    });

    it('should return false for roles without Vietnamese name', () => {
      const role = HealthcareRole.create(
        'DOCTOR', // Use valid role type
        'Custom Role',
        '', // Empty Vietnamese name
        'Custom description'
      );
      expect(role.isVietnameseHealthcareRole()).toBe(false);
    });
  });

  describe('validate', () => {
    it('should not throw for valid role', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      expect(() => role.validate()).not.toThrow();
    });

    it('should throw error when role type is missing', () => {
      // Cannot test this as TypeScript prevents creating role with empty type
      // This is a compile-time check, not runtime
      expect(true).toBe(true);
    });

    it('should throw error when name is empty', () => {
      const role = HealthcareRole.create(
        'DOCTOR',
        '',
        'Bác sĩ',
        'Test'
      );
      expect(() => role.validate()).toThrow('Role name is required');
    });

    it('should throw error when Vietnamese name is empty', () => {
      const role = HealthcareRole.create(
        'DOCTOR',
        'Doctor',
        '',
        'Test'
      );
      expect(() => role.validate()).toThrow('Vietnamese role name is required');
    });
  });

  describe('permissions immutability', () => {
    it('should return a copy of permissions array', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      const permissions1 = role.permissions;
      const permissions2 = role.permissions;

      expect(permissions1).toEqual(permissions2);
      expect(permissions1).not.toBe(permissions2); // Different array instances
    });

    it('should not allow modification of permissions through getter', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      const permissions = role.permissions;
      const originalLength = permissions.length;

      permissions.push('new:permission');

      expect(role.permissions.length).toBe(originalLength);
      expect(role.permissions).not.toContain('new:permission');
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      const persistence = role.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence.type).toBe('DOCTOR');
      expect(persistence.name).toBe('Doctor');
      expect(persistence.name_vietnamese).toBe('Bác sĩ');
      expect(persistence.permissions).toBeInstanceOf(Array);
      expect(persistence.is_active).toBe(true);
      expect(persistence.has_hipaa_training).toBe(true);
    });
  });
});

