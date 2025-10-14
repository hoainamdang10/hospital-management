jest.mock('uuid');

import { AuthenticatedUser } from '@domain/entities/AuthenticatedUser';
import { UserId } from '@domain/value-objects/UserId';

describe('AuthenticatedUser Entity', () => {
  let validUserId: UserId;
  let validProps: any;

  beforeEach(() => {
    // Mock uuid.validate to always return true
    const { validate } = require('uuid');
    validate.mockReturnValue(true);

    validUserId = UserId.create('550e8400-e29b-41d4-a716-446655440000');
    validProps = {
      userId: validUserId,
      email: 'test@example.com',
      roles: ['doctor', 'admin'],
      permissions: ['patient:read', 'patient:write', 'appointment:read'],
      sessionId: '660e8400-e29b-41d4-a716-446655440000',
      issuedAt: new Date('2025-01-10T10:00:00Z'),
      expiresAt: new Date('2025-01-10T12:00:00Z')
    };
  });

  describe('create', () => {
    it('should create a valid AuthenticatedUser', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.userId.value).toBe(validUserId.value);
      expect(user.email).toBe(validProps.email);
      expect(user.roles).toEqual(validProps.roles);
      expect(user.permissions).toEqual(validProps.permissions);
    });

    it('should throw error for invalid email', () => {
      expect(() => AuthenticatedUser.create({ ...validProps, email: 'invalid-email' }))
        .toThrow('Invalid email format');
    });

    it('should throw error for empty roles', () => {
      expect(() => AuthenticatedUser.create({ ...validProps, roles: [] }))
        .toThrow('User must have at least one role');
    });

    it('should throw error for empty permissions', () => {
      expect(() => AuthenticatedUser.create({ ...validProps, permissions: [] }))
        .toThrow('User must have at least one permission');
    });

    it('should throw error for expiresAt before issuedAt', () => {
      expect(() => AuthenticatedUser.create({
        ...validProps,
        issuedAt: new Date('2025-01-10T12:00:00Z'),
        expiresAt: new Date('2025-01-10T10:00:00Z')
      })).toThrow('Token expiration time must be after issued time');
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the role', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasRole('doctor')).toBe(true);
      expect(user.hasRole('admin')).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasRole('patient')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAnyRole(['doctor', 'nurse'])).toBe(true);
      expect(user.hasAnyRole(['admin', 'patient'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAnyRole(['patient', 'nurse'])).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true if user has all of the roles', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAllRoles(['doctor', 'admin'])).toBe(true);
    });

    it('should return false if user is missing any role', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAllRoles(['doctor', 'admin', 'nurse'])).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has the permission', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasPermission('patient:read')).toBe(true);
      expect(user.hasPermission('patient:write')).toBe(true);
    });

    it('should return false if user does not have the permission', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasPermission('patient:delete')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAnyPermission(['patient:read', 'patient:delete'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAnyPermission(['patient:delete', 'billing:read'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all of the permissions', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAllPermissions(['patient:read', 'patient:write'])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      const user = AuthenticatedUser.create(validProps);
      expect(user.hasAllPermissions(['patient:read', 'patient:delete'])).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return false if token is not expired', () => {
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      });
      expect(user.isExpired()).toBe(false);
    });

    it('should return true if token is expired', () => {
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt: new Date(Date.now() - 3600000) // 1 hour ago
      });
      expect(user.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true if token is not expired', () => {
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt: new Date(Date.now() + 3600000)
      });
      expect(user.isValid()).toBe(true);
    });

    it('should return false if token is expired', () => {
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt: new Date(Date.now() - 3600000)
      });
      expect(user.isValid()).toBe(false);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive milliseconds if not expired', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt
      });
      const timeUntilExpiry = user.getTimeUntilExpiry();
      expect(timeUntilExpiry).toBeGreaterThan(0);
      expect(timeUntilExpiry).toBeLessThanOrEqual(3600000);
    });

    it('should return negative milliseconds if expired', () => {
      const user = AuthenticatedUser.create({
        ...validProps,
        expiresAt: new Date(Date.now() - 3600000)
      });
      expect(user.getTimeUntilExpiry()).toBeLessThan(0);
    });
  });
});

