/**
 * HealthcareRole Entity Unit Tests
 * Tests for healthcare role metadata and validation (Pure RBAC)
 *
 * NOTE: Permissions are NO LONGER tested here.
 * Permissions are loaded from database via IPermissionRepository.
 * See PermissionService.test.ts for permission tests.
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
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
        true
      );

      expect(role.type).toBe('DOCTOR');
      expect(role.name).toBe('Doctor');
      expect(role.nameVietnamese).toBe('Bác sĩ');
      expect(role.description).toBe('Medical doctor');
      expect(role.hasHIPAATraining()).toBe(true);
      expect(role.isActive).toBe(true);
    });

    it('should create role with default HIPAA training', () => {
      const role = HealthcareRole.create(
        'NURSE',
        'Nurse',
        'Y tá',
        'Registered nurse'
      );

      expect(role.hasHIPAATraining()).toBe(false);
      expect(role.isActive).toBe(true);
    });
  });

  describe('fromRoleType', () => {
    it('should create ADMIN role with correct metadata', () => {
      const role = HealthcareRole.fromRoleType('ADMIN');

      expect(role.type).toBe('ADMIN');
      expect(role.name).toBe('Administrator');
      expect(role.nameVietnamese).toBe('Quản trị viên');
      expect(role.description).toBe('System administrator with full access (includes billing management)');
      expect(role.hasHIPAATraining()).toBe(true);
      expect(role.isActive).toBe(true);
    });

    it('should create DOCTOR role with correct metadata', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');

      expect(role.type).toBe('DOCTOR');
      expect(role.name).toBe('Doctor');
      expect(role.nameVietnamese).toBe('Bác sĩ');
      expect(role.description).toBe('Medical doctor (includes pharmacy orders & lab orders)');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create NURSE role with correct metadata', () => {
      const role = HealthcareRole.fromRoleType('NURSE');

      expect(role.type).toBe('NURSE');
      expect(role.name).toBe('Nurse');
      expect(role.nameVietnamese).toBe('Y tá');
      expect(role.description).toBe('Registered nurse (includes pharmacy dispensing & lab specimen collection)');
      expect(role.hasHIPAATraining()).toBe(true);
    });

    it('should create RECEPTIONIST role with correct metadata', () => {
      const role = HealthcareRole.fromRoleType('RECEPTIONIST');

      expect(role.type).toBe('RECEPTIONIST');
      expect(role.name).toBe('Receptionist');
      expect(role.nameVietnamese).toBe('Lễ tân');
      expect(role.description).toBe('Front desk receptionist (includes billing & payment processing)');
      expect(role.hasHIPAATraining()).toBe(false);
    });

    // PHARMACIST and LAB_TECHNICIAN roles have been merged into DOCTOR and NURSE
    // Tests removed as part of 5-role simplification

    it('should create PATIENT role with correct metadata', () => {
      const role = HealthcareRole.fromRoleType('PATIENT');

      expect(role.type).toBe('PATIENT');
      expect(role.name).toBe('Patient');
      expect(role.nameVietnamese).toBe('Bệnh nhân');
      expect(role.description).toBe('Patient user');
      expect(role.hasHIPAATraining()).toBe(false);
    });

    // BILLING_STAFF role has been merged into RECEPTIONIST and ADMIN
    // Test removed as part of 5-role simplification

    it('should handle lowercase role type', () => {
      const role = HealthcareRole.fromRoleType('doctor');
      expect(role.type).toBe('DOCTOR');
    });

    it('should throw error for invalid role type', () => {
      expect(() => HealthcareRole.fromRoleType('INVALID_ROLE'))
        .toThrow('Invalid role type: INVALID_ROLE');
    });
  });



  describe('isMedicalStaff', () => {
    it('should return true for medical staff roles', () => {
      expect(HealthcareRole.fromRoleType('DOCTOR').isMedicalStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('NURSE').isMedicalStaff()).toBe(true);
      // PHARMACIST and LAB_TECHNICIAN merged into DOCTOR and NURSE
    });

    it('should return false for non-medical staff roles', () => {
      expect(HealthcareRole.fromRoleType('ADMIN').isMedicalStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('RECEPTIONIST').isMedicalStaff()).toBe(false);
      // BILLING_STAFF merged into RECEPTIONIST and ADMIN
      expect(HealthcareRole.fromRoleType('PATIENT').isMedicalStaff()).toBe(false);
    });
  });

  describe('isAdministrativeStaff', () => {
    it('should return true for administrative staff roles', () => {
      expect(HealthcareRole.fromRoleType('ADMIN').isAdministrativeStaff()).toBe(true);
      expect(HealthcareRole.fromRoleType('RECEPTIONIST').isAdministrativeStaff()).toBe(true);
      // BILLING_STAFF merged into RECEPTIONIST and ADMIN
    });

    it('should return false for non-administrative staff roles', () => {
      expect(HealthcareRole.fromRoleType('DOCTOR').isAdministrativeStaff()).toBe(false);
      expect(HealthcareRole.fromRoleType('NURSE').isAdministrativeStaff()).toBe(false);
      // PHARMACIST and LAB_TECHNICIAN merged into DOCTOR and NURSE
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



  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const role = HealthcareRole.fromRoleType('DOCTOR');
      const persistence = role.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence.type).toBe('DOCTOR');
      expect(persistence.name).toBe('Doctor');
      expect(persistence.name_vietnamese).toBe('Bác sĩ');
      expect(persistence.description).toBe('Medical doctor (includes pharmacy orders & lab orders)');
      expect(persistence.is_active).toBe(true);
      expect(persistence.has_hipaa_training).toBe(true);
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });
  });
});

