/**
 * Permission Value Object Unit Tests
 * Tests for Pure RBAC permission value object
 * 
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 */

import { Permission } from '../../../../src/domain/value-objects/Permission';

describe('Permission Value Object', () => {
  describe('fromString', () => {
    it('should create Permission from valid string', () => {
      const permission = Permission.fromString('patients:read');

      expect(permission.value).toBe('patients:read');
      expect(permission.resourceType).toBe('patients');
      expect(permission.action).toBe('read');
    });

    it('should create Permission with hyphens in resource name', () => {
      const permission = Permission.fromString('lab-results:write');

      expect(permission.value).toBe('lab-results:write');
      expect(permission.resourceType).toBe('lab-results');
      expect(permission.action).toBe('write');
    });

    it('should create Permission with numbers in resource name', () => {
      const permission = Permission.fromString('medical-records-v2:delete');

      expect(permission.value).toBe('medical-records-v2:delete');
      expect(permission.resourceType).toBe('medical-records-v2');
      expect(permission.action).toBe('delete');
    });

    it('should create Permission with underscores', () => {
      const permission = Permission.fromString('patient_records:read');

      expect(permission.value).toBe('patient_records:read');
      expect(permission.resourceType).toBe('patient_records');
      expect(permission.action).toBe('read');
    });

    it('should create wildcard Permission', () => {
      const permission = Permission.fromString('*');

      expect(permission.value).toBe('*');
      expect(permission.resourceType).toBe('*');
      expect(permission.action).toBe('*');
      expect(permission.isWildcard()).toBe(true);
    });

    it('should trim whitespace', () => {
      const permission = Permission.fromString('  patients:read  ');

      expect(permission.value).toBe('patients:read');
      expect(permission.resourceType).toBe('patients');
      expect(permission.action).toBe('read');
    });

    it('should throw error for empty string', () => {
      expect(() => Permission.fromString('')).toThrow('Permission string cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => Permission.fromString('   ')).toThrow('Permission string cannot be empty');
    });

    it('should throw error for invalid format (no colon)', () => {
      expect(() => Permission.fromString('patients')).toThrow('Invalid permission format');
    });

    it('should throw error for invalid format (multiple colons)', () => {
      expect(() => Permission.fromString('patients:read:write')).toThrow('Invalid permission format');
    });

    it('should throw error for empty resource', () => {
      expect(() => Permission.fromString(':read')).toThrow('Invalid permission format');
    });

    it('should throw error for empty action', () => {
      expect(() => Permission.fromString('patients:')).toThrow('Invalid permission format');
    });

    it('should throw error for uppercase letters', () => {
      expect(() => Permission.fromString('Patients:read')).toThrow('Invalid permission format');
    });

    it('should throw error for special characters', () => {
      expect(() => Permission.fromString('patients@:read')).toThrow('Invalid permission format');
    });

    it('should throw error for spaces in permission', () => {
      expect(() => Permission.fromString('patients :read')).toThrow('Invalid permission format');
    });
  });

  describe('create', () => {
    it('should create Permission from resource and action', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.value).toBe('patients:read');
      expect(permission.resourceType).toBe('patients');
      expect(permission.action).toBe('read');
    });

    it('should create Permission with hyphens', () => {
      const permission = Permission.create('lab-results', 'write');

      expect(permission.value).toBe('lab-results:write');
      expect(permission.resourceType).toBe('lab-results');
      expect(permission.action).toBe('write');
    });

    it('should trim whitespace from resource and action', () => {
      const permission = Permission.create('  patients  ', '  read  ');

      expect(permission.value).toBe('patients:read');
      expect(permission.resourceType).toBe('patients');
      expect(permission.action).toBe('read');
    });

    it('should throw error for empty resource', () => {
      expect(() => Permission.create('', 'read')).toThrow('Resource type cannot be empty');
    });

    it('should throw error for empty action', () => {
      expect(() => Permission.create('patients', '')).toThrow('Action cannot be empty');
    });

    it('should throw error for whitespace-only resource', () => {
      expect(() => Permission.create('   ', 'read')).toThrow('Resource type cannot be empty');
    });

    it('should throw error for whitespace-only action', () => {
      expect(() => Permission.create('patients', '   ')).toThrow('Action cannot be empty');
    });
  });

  describe('wildcard', () => {
    it('should create wildcard Permission', () => {
      const permission = Permission.wildcard();

      expect(permission.value).toBe('*');
      expect(permission.resourceType).toBe('*');
      expect(permission.action).toBe('*');
      expect(permission.isWildcard()).toBe(true);
    });
  });

  describe('fromArray', () => {
    it('should create multiple Permissions from array', () => {
      const permissions = Permission.fromArray([
        'patients:read',
        'patients:write',
        'lab-results:read'
      ]);

      expect(permissions).toHaveLength(3);
      expect(permissions[0].value).toBe('patients:read');
      expect(permissions[1].value).toBe('patients:write');
      expect(permissions[2].value).toBe('lab-results:read');
    });

    it('should handle empty array', () => {
      const permissions = Permission.fromArray([]);

      expect(permissions).toHaveLength(0);
    });

    it('should throw error for invalid permission in array', () => {
      expect(() => Permission.fromArray([
        'patients:read',
        'invalid',
        'lab-results:read'
      ])).toThrow('Invalid permission format');
    });
  });

  describe('isWildcard', () => {
    it('should return true for wildcard permission', () => {
      const permission = Permission.wildcard();

      expect(permission.isWildcard()).toBe(true);
    });

    it('should return false for regular permission', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.isWildcard()).toBe(false);
    });
  });

  describe('matches', () => {
    it('should match exact resource and action', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.matches('patients', 'read')).toBe(true);
    });

    it('should not match different resource', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.matches('doctors', 'read')).toBe(false);
    });

    it('should not match different action', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.matches('patients', 'write')).toBe(false);
    });

    it('should match everything for wildcard permission', () => {
      const permission = Permission.wildcard();

      expect(permission.matches('patients', 'read')).toBe(true);
      expect(permission.matches('doctors', 'write')).toBe(true);
      expect(permission.matches('anything', 'delete')).toBe(true);
    });
  });

  describe('matchesString', () => {
    it('should match exact permission string', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.matchesString('patients:read')).toBe(true);
    });

    it('should not match different permission string', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.matchesString('patients:write')).toBe(false);
    });

    it('should match everything for wildcard permission', () => {
      const permission = Permission.wildcard();

      expect(permission.matchesString('patients:read')).toBe(true);
      expect(permission.matchesString('doctors:write')).toBe(true);
      expect(permission.matchesString('anything:delete')).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal permissions', () => {
      const p1 = Permission.create('patients', 'read');
      const p2 = Permission.create('patients', 'read');

      expect(p1.equals(p2)).toBe(true);
    });

    it('should return false for different permissions', () => {
      const p1 = Permission.create('patients', 'read');
      const p2 = Permission.create('patients', 'write');

      expect(p1.equals(p2)).toBe(false);
    });

    it('should return true for wildcard permissions', () => {
      const p1 = Permission.wildcard();
      const p2 = Permission.wildcard();

      expect(p1.equals(p2)).toBe(true);
    });

    it('should return false for non-Permission object', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.equals({} as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return permission string', () => {
      const permission = Permission.create('patients', 'read');

      expect(permission.toString()).toBe('patients:read');
    });

    it('should return wildcard for wildcard permission', () => {
      const permission = Permission.wildcard();

      expect(permission.toString()).toBe('*');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const permission = Permission.create('patients', 'read');
      const json = permission.toJSON();

      expect(json).toEqual({
        value: 'patients:read',
        resourceType: 'patients',
        action: 'read'
      });
    });

    it('should return JSON for wildcard permission', () => {
      const permission = Permission.wildcard();
      const json = permission.toJSON();

      expect(json).toEqual({
        value: '*',
        resourceType: '*',
        action: '*'
      });
    });
  });

  describe('immutability', () => {
    it('should be immutable (frozen)', () => {
      const permission = Permission.create('patients', 'read');

      expect(Object.isFrozen(permission)).toBe(true);
    });

    it('should not allow modification of properties', () => {
      const permission = Permission.create('patients', 'read') as any;

      expect(() => {
        permission._value = 'modified';
      }).toThrow();
    });
  });
});

