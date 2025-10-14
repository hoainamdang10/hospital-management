import { UserId } from '@domain/value-objects/UserId';

describe('UserId Value Object', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  describe('create', () => {
    it('should create a valid UserId', () => {
      const userId = UserId.create(validUuid);
      expect(userId.value).toBe(validUuid);
    });

    it('should throw error for empty userId', () => {
      expect(() => UserId.create('')).toThrow('User ID cannot be empty');
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => UserId.create('invalid-uuid')).toThrow('Invalid User ID format - must be a valid UUID');
    });

    it('should throw error for UUID with wrong length', () => {
      expect(() => UserId.create('550e8400-e29b-41d4-a716')).toThrow('Invalid User ID format - must be a valid UUID');
    });

    it('should trim whitespace', () => {
      const userId = UserId.create(`  ${validUuid}  `);
      expect(userId.value).toBe(validUuid);
    });

    it('should accept UUID in uppercase', () => {
      const uppercaseUuid = validUuid.toUpperCase();
      const userId = UserId.create(uppercaseUuid);
      expect(userId.value).toBe(uppercaseUuid.toLowerCase());
    });
  });

  describe('equals', () => {
    it('should return true for same UUID', () => {
      const userId1 = UserId.create(validUuid);
      const userId2 = UserId.create(validUuid);
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different UUIDs', () => {
      const userId1 = UserId.create(validUuid);
      const userId2 = UserId.create('660e8400-e29b-41d4-a716-446655440000');
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return UUID as string', () => {
      const userId = UserId.create(validUuid);
      expect(userId.toString()).toBe(validUuid);
    });
  });
});

