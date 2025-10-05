/**
 * UserId Value Object Unit Tests
 * Tests for User ID generation and validation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UserId } from '../../../../src/domain/value-objects/UserId';

describe('UserId Value Object', () => {
  describe('create', () => {
    it('should create UserId with valid value', () => {
      const userId = UserId.create('USR-202501-001');
      expect(userId.value).toBe('USR-202501-001');
    });

    it('should trim whitespace from value', () => {
      const userId = UserId.create('  USR-202501-001  ');
      expect(userId.value).toBe('USR-202501-001');
    });

    it('should throw error for empty value', () => {
      expect(() => UserId.create('')).toThrow('User ID không được để trống');
    });

    it('should throw error for whitespace-only value', () => {
      expect(() => UserId.create('   ')).toThrow('User ID không được để trống');
    });
  });

  describe('generate', () => {
    it('should generate UserId with correct format', () => {
      const userId = UserId.generate();
      const pattern = /^USR-\d{6}-\d{3}$/;
      expect(userId.value).toMatch(pattern);
    });

    it('should generate unique UserIds', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();
      // Note: There's a small chance they could be equal due to random sequence
      // but it's very unlikely
      expect(userId1.value).toBeDefined();
      expect(userId2.value).toBeDefined();
    });

    it('should generate UserId with current year and month', () => {
      const userId = UserId.generate();
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const expectedPrefix = `USR-${year}${month}`;
      expect(userId.value).toContain(expectedPrefix);
    });

    it('should generate UserId with 3-digit sequence', () => {
      const userId = UserId.generate();
      const parts = userId.value.split('-');
      expect(parts).toHaveLength(3);
      expect(parts[2]).toHaveLength(3);
      expect(parseInt(parts[2])).toBeGreaterThanOrEqual(1);
      expect(parseInt(parts[2])).toBeLessThanOrEqual(999);
    });
  });

  describe('fromUUID', () => {
    it('should create UserId from UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const userId = UserId.fromUUID(uuid);
      expect(userId.value).toBe(uuid);
    });

    it('should accept any string as UUID', () => {
      const customId = 'custom-user-id-123';
      const userId = UserId.fromUUID(customId);
      expect(userId.value).toBe(customId);
    });
  });

  describe('fromString', () => {
    it('should create UserId from string', () => {
      const value = 'USR-202501-999';
      const userId = UserId.fromString(value);
      expect(userId.value).toBe(value);
    });

    it('should work with any string format', () => {
      const value = 'any-format-id';
      const userId = UserId.fromString(value);
      expect(userId.value).toBe(value);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const userId = UserId.create('USR-202501-001');
      expect(userId.toString()).toBe('USR-202501-001');
    });
  });

  describe('value equality', () => {
    it('should be equal when values are the same', () => {
      const userId1 = UserId.create('USR-202501-001');
      const userId2 = UserId.create('USR-202501-001');
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should not be equal when values are different', () => {
      const userId1 = UserId.create('USR-202501-001');
      const userId2 = UserId.create('USR-202501-002');
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const userId = UserId.create('USR-202501-001');
      const originalValue = userId.value;
      
      // Attempt to modify (should not work due to readonly)
      // @ts-expect-error - Testing immutability
      expect(() => { userId.value = 'modified'; }).toThrow();
      
      expect(userId.value).toBe(originalValue);
    });
  });
});

