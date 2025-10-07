/**
 * User Aggregate Root Unit Tests
 * Tests for User domain logic and business rules
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { User } from '../../../../src/domain/aggregates/User';
import { Email } from '../../../../src/domain/value-objects/Email';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { HealthcareRole } from '../../../../src/domain/entities/HealthcareRole';
import { UserId } from '../../../../src/domain/value-objects/UserId';

describe('User Aggregate Root', () => {
  // Helper function to create valid test data
  const createValidPersonalInfo = () => PersonalInfo.create({
    fullName: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    citizenId: '001234567890',
    emergencyContactName: 'Nguyễn Văn B',
    emergencyContactPhone: '0909876543'
  });

  const createValidEmail = () => Email.create('test@example.com');
  const createValidRole = () => HealthcareRole.fromRoleType('DOCTOR');

  describe('create', () => {
    it('should create a new user with valid data', () => {
      const email = createValidEmail();
      const personalInfo = createValidPersonalInfo();
      const role = createValidRole();

      const user = User.create(email, personalInfo, [role]);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.personalInfo).toBe(personalInfo);
      expect(user.healthcareRole).toBe(role);
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
    });

    it('should generate domain event on user creation', () => {
      const email = createValidEmail();
      const personalInfo = createValidPersonalInfo();
      const role = createValidRole();

      const user = User.create(email, personalInfo, [role]);
      const events = user.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserCreated');
    });

    it('should throw error when email is invalid', () => {
      const personalInfo = createValidPersonalInfo();
      const role = createValidRole();
      const invalidEmail = { isValid: () => false } as any;

      expect(() => User.create(invalidEmail, personalInfo, [role]))
        .toThrow();
    });

    it('should throw error when personal info is incomplete for active user', () => {
      const email = createValidEmail();
      const incompleteInfo = PersonalInfo.create({ fullName: 'Test User' });
      const role = createValidRole();

      expect(() => User.create(email, incompleteInfo, [role]))
        .toThrow('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from persistence data', () => {
      const id = 'test-user-id';
      const email = createValidEmail();
      const personalInfo = createValidPersonalInfo();
      const role = createValidRole();
      const lastLoginAt = new Date('2025-01-01');
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2025-01-02');

      const user = User.reconstitute(
        id,
        email,
        personalInfo,
        [role],
        true,
        true,
        lastLoginAt,
        createdAt,
        updatedAt
      );

      expect(user.id).toBe(id);
      expect(user.email).toBe(email);
      expect(user.personalInfo).toBe(personalInfo);
      expect(user.healthcareRole).toBe(role);
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(true);
      expect(user.lastLoginAt).toBe(lastLoginAt);
    });

    it('should validate business invariants on reconstitution', () => {
      const id = 'test-user-id';
      const invalidEmail = { isValid: () => false } as any;
      const personalInfo = createValidPersonalInfo();
      const role = createValidRole();

      expect(() => User.reconstitute(
        id,
        invalidEmail,
        personalInfo,
        [role],
        true,
        true,
        undefined,
        new Date(),
        new Date()
      )).toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      expect(user.isEmailVerified).toBe(false);

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
    });

    it('should update updatedAt timestamp', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const originalUpdatedAt = user.toPersistence().updated_at;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        user.verifyEmail();
        const newUpdatedAt = user.toPersistence().updated_at;
        expect(newUpdatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      expect(user.isActive).toBe(true);

      user.deactivate();

      expect(user.isActive).toBe(false);
    });

    it('should update updatedAt timestamp', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.deactivate();

      expect(user.toPersistence().updated_at).toBeDefined();
    });
  });

  describe('activate', () => {
    it('should activate deactivated user', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.deactivate();
      expect(user.isActive).toBe(false);

      user.activate();

      expect(user.isActive).toBe(true);
    });

    it('should validate business invariants on activation', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.deactivate();

      // Should not throw because personal info is complete
      expect(() => user.activate()).not.toThrow();
    });

    it('should throw error when activating user with incomplete info', () => {
      const incompleteInfo = PersonalInfo.create({ fullName: 'Test User' });
      const user = User.reconstitute(
        'test-id',
        createValidEmail(),
        incompleteInfo,
        [createValidRole()],
        false, // inactive
        true,
        undefined,
        new Date(),
        new Date()
      );

      expect(() => user.activate())
        .toThrow('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    });
  });

  describe('recordAuthentication', () => {
    it('should record authentication for active user', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const session = user.recordAuthentication('192.168.1.1', 'Mozilla/5.0');

      expect(session).toBeDefined();
      expect(user.lastLoginAt).toBeDefined();
    });

    it('should throw error for inactive user', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.deactivate();

      expect(() => user.recordAuthentication('192.168.1.1', 'Mozilla/5.0'))
        .toThrow('Tài khoản đã bị vô hiệu hóa');
    });

    it('should generate authentication domain event', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.markEventsAsCommitted(); // Clear creation event
      user.recordAuthentication('192.168.1.1', 'Mozilla/5.0');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserAuthenticated');
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const newRole = HealthcareRole.fromRoleType('NURSE');
      const changedBy = UserId.generate();

      user.changeRole(newRole, changedBy);

      expect(user.healthcareRole).toBe(newRole);
    });

    it('should generate role changed domain event', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.markEventsAsCommitted();
      const newRole = HealthcareRole.fromRoleType('NURSE');
      const changedBy = UserId.generate();

      user.changeRole(newRole, changedBy);

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserRoleChanged');
    });
  });

  describe('updatePersonalInfo', () => {
    it('should update personal info successfully', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const newInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn B',
        phoneNumber: '0909876543',
        address: '456 Đường XYZ',
        dateOfBirth: new Date('1995-05-05'),
        gender: 'male',
        citizenId: '009876543210'
      });

      user.updatePersonalInfo(newInfo);

      expect(user.personalInfo).toBe(newInfo);
    });

    it('should validate business invariants after update', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const incompleteInfo = PersonalInfo.create({ fullName: 'Test' });

      expect(() => user.updatePersonalInfo(incompleteInfo))
        .toThrow('Thông tin cá nhân phải đầy đủ cho người dùng đang hoạt động');
    });
  });

  describe('isVietnameseHealthcareCompliant', () => {
    it('should return true for compliant user', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.verifyEmail();

      expect(user.isVietnameseHealthcareCompliant()).toBe(true);
    });

    it('should return false when email is not verified', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      expect(user.isVietnameseHealthcareCompliant()).toBe(false);
    });

    it('should return false when citizen ID is missing', () => {
      const infoWithoutCitizenId = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      });

      const user = User.reconstitute(
        'test-id',
        createValidEmail(),
        infoWithoutCitizenId,
        [createValidRole()],
        false,
        true,
        undefined,
        new Date(),
        new Date()
      );

      expect(user.isVietnameseHealthcareCompliant()).toBe(false);
    });

    it('should return false when phone number is invalid', () => {
      const infoWithoutPhone = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        address: '123 Đường ABC',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        citizenId: '001234567890'
      });

      const user = User.reconstitute(
        'test-id',
        createValidEmail(),
        infoWithoutPhone,
        [createValidRole()],
        false,
        true,
        undefined,
        new Date(),
        new Date()
      );

      expect(user.isVietnameseHealthcareCompliant()).toBe(false);
    });
  });

  describe('isHIPAACompliant', () => {
    it('should return true for HIPAA compliant user', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.verifyEmail();

      expect(user.isHIPAACompliant()).toBe(true);
    });

    it('should return false when user is inactive', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      user.verifyEmail();
      user.deactivate();

      expect(user.isHIPAACompliant()).toBe(false);
    });

    it('should return false when email is not verified', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      expect(user.isHIPAACompliant()).toBe(false);
    });

    it('should return false when role has no HIPAA training', () => {
      const roleWithoutHIPAA = HealthcareRole.fromRoleType('RECEPTIONIST');
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [roleWithoutHIPAA]
      );

      user.verifyEmail();

      expect(user.isHIPAACompliant()).toBe(false);
    });

    it('should return false when personal info is incomplete', () => {
      const incompleteInfo = PersonalInfo.create({ fullName: 'Test User' });
      const user = User.reconstitute(
        'test-id',
        createValidEmail(),
        incompleteInfo,
        [createValidRole()],
        false,
        true,
        undefined,
        new Date(),
        new Date()
      );

      expect(user.isHIPAACompliant()).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    it('should return false (deprecated method)', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      // Method is deprecated and always returns false
      // Use PermissionService instead for actual permission checks
      expect(user.canPerformAction('read', 'patients')).toBe(false);
    });

    it('should return false for non-permitted action', () => {
      const nurseRole = HealthcareRole.fromRoleType('NURSE');
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [nurseRole]
      );

      expect(user.canPerformAction('write', 'medical_records')).toBe(false);
    });

    it('should return false for admin (deprecated method)', () => {
      const adminRole = HealthcareRole.fromRoleType('ADMIN');
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [adminRole]
      );

      // Method is deprecated and always returns false
      // Use PermissionService instead for actual permission checks
      expect(user.canPerformAction('delete', 'anything')).toBe(false);
    });
  });

  describe('getSummaryForLogging', () => {
    it('should return summary with safe information', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const summary = user.getSummaryForLogging();

      expect(summary).toHaveProperty('userId');
      expect(summary).toHaveProperty('role');
      expect(summary).toHaveProperty('isActive');
      expect(summary).toHaveProperty('isEmailVerified');
      expect(summary).toHaveProperty('createdAt');
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const user = User.create(
        createValidEmail(),
        createValidPersonalInfo(),
        [createValidRole()]
      );

      const persistence = user.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence).toHaveProperty('email');
      expect(persistence).toHaveProperty('full_name');
      expect(persistence).toHaveProperty('phone_number');
      expect(persistence).toHaveProperty('is_active');
      expect(persistence).toHaveProperty('is_email_verified');
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });
  });
});

