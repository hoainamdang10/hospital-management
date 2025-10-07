/**
 * User Test Helper
 * Provides utility functions for creating mock User aggregates in tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { User } from '../../src/domain/aggregates/User';
import { Email } from '../../src/domain/value-objects/Email';
import { PersonalInfo } from '../../src/domain/value-objects/PersonalInfo';
import { HealthcareRole, HealthcareRoleType } from '../../src/domain/entities/HealthcareRole';

/**
 * Create a mock User for testing
 * Uses User.reconstitute to bypass validation and domain events
 * Provides complete PersonalInfo to satisfy business invariants
 */
export function createMockUser(overrides?: {
  userId?: string;
  email?: string;
  fullName?: string;
  roleType?: HealthcareRoleType;
  isActive?: boolean;
  isEmailVerified?: boolean;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  citizenId?: string;
}): User {
  const userId = overrides?.userId || 'user-123';
  const email = overrides?.email || 'test@hospital.vn';
  const fullName = overrides?.fullName || 'Test User';
  const roleType = overrides?.roleType || 'PATIENT';
  const isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
  const isEmailVerified = overrides?.isEmailVerified !== undefined ? overrides.isEmailVerified : false;

  return User.reconstitute(
    userId,
    Email.create(email),
    PersonalInfo.create({
      fullName,
      phoneNumber: overrides?.phoneNumber || '0912345678',
      address: overrides?.address || '123 Test Street, Hanoi',
      dateOfBirth: overrides?.dateOfBirth || new Date('1990-01-01'),
      gender: overrides?.gender || 'male',
      citizenId: overrides?.citizenId || '001234567890'
    }),
    [HealthcareRole.fromRoleType(roleType)], // Array of roles for Pure RBAC
    isActive,
    isEmailVerified,
    undefined, // twoFactorEnabled
    new Date(),
    new Date()
  );
}

/**
 * Create a mock User using User.create factory method
 * This will trigger validation and domain events
 */
export function createNewMockUser(
  email: string = 'test@hospital.vn',
  fullName: string = 'Test User',
  roleType: HealthcareRoleType = 'PATIENT'
): User {
  return User.create(
    Email.create(email),
    PersonalInfo.create({ fullName }),
    [HealthcareRole.fromRoleType(roleType)] // Array of roles for Pure RBAC
  );
}

/**
 * Create a mock doctor User
 */
export function createMockDoctor(overrides?: {
  userId?: string;
  email?: string;
  fullName?: string;
}): User {
  return createMockUser({
    ...overrides,
    roleType: 'DOCTOR'
  });
}

/**
 * Create a mock patient User
 */
export function createMockPatient(overrides?: {
  userId?: string;
  email?: string;
  fullName?: string;
}): User {
  return createMockUser({
    ...overrides,
    roleType: 'PATIENT'
  });
}

/**
 * Create a mock admin User
 */
export function createMockAdmin(overrides?: {
  userId?: string;
  email?: string;
  fullName?: string;
}): User {
  return createMockUser({
    ...overrides,
    roleType: 'ADMIN'
  });
}

