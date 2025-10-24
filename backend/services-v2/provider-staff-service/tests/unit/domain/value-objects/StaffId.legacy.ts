/**
 * StaffId Value Object - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { StaffId } from '../../../../src/domain/value-objects/StaffId';

describe('StaffId Value Object', () => {
  describe('create', () => {
    it('should create valid StaffId with correct format', () => {
      // Arrange & Act
      const staffId = StaffId.create('DOC-CARD-202501-001');

      // Assert
      expect(staffId).toBeInstanceOf(StaffId);
      expect(staffId.value).toBe('DOC-CARD-202501-001');
    });

    it('should create StaffId from existing value', () => {
      // Arrange
      const existingId = 'DOC-CARD-202501-001';

      // Act
      const staffId = StaffId.fromString(existingId);

      // Assert
      expect(staffId.value).toBe(existingId);
    });

    it('should generate unique IDs', () => {
      // Arrange & Act
      const id1 = StaffId.generate('doctor', 'CARD');
      const id2 = StaffId.generate('doctor', 'CARD');

      // Assert
      expect(id1.value).not.toBe(id2.value);
    });

    it('should include current year and month in ID', () => {
      // Arrange
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const expectedPrefix = `DOC-CARD-${year}${month}`;

      // Act
      const staffId = StaffId.generate('doctor', 'CARD');

      // Assert
      expect(staffId.value).toContain(expectedPrefix);
    });
  });

  describe('fromString', () => {
    it('should create StaffId from valid string', () => {
      // Arrange
      const validId = 'DOC-CARD-202501-001';

      // Act
      const staffId = StaffId.fromString(validId);

      // Assert
      expect(staffId.value).toBe(validId);
    });

    it('should throw error for invalid format', () => {
      // Arrange
      const invalidIds = [
        'INVALID-ID',
        'STF-2025-001',
        'STF-20250101-001',
        'STF-202501-1',
        'STF-202501-ABCD',
        'DOC-TOOLONG-202501-001', // Department code too long (>5 chars)
        ''
      ];

      // Act & Assert
      invalidIds.forEach(invalidId => {
        expect(() => StaffId.fromString(invalidId)).toThrow();
      });
    });

    it('should throw error for null or undefined', () => {
      // Act & Assert
      expect(() => StaffId.fromString(null as any)).toThrow();
      expect(() => StaffId.fromString(undefined as any)).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for same ID values', () => {
      // Arrange
      const id1 = StaffId.fromString('DOC-CARD-202501-001');
      const id2 = StaffId.fromString('DOC-CARD-202501-001');

      // Act & Assert
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different ID values', () => {
      // Arrange
      const id1 = StaffId.fromString('DOC-CARD-202501-001');
      const id2 = StaffId.fromString('DOC-CARD-202501-002');

      // Act & Assert
      expect(id1.equals(id2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // Arrange
      const id = StaffId.fromString('DOC-CARD-202501-001');

      // Act & Assert
      expect(id.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const idValue = 'DOC-CARD-202501-001';
      const staffId = StaffId.fromString(idValue);

      // Act
      const result = staffId.toString();

      // Assert
      expect(result).toBe(idValue);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const staffId = StaffId.fromString('DOC-CARD-202501-001');
      const originalValue = staffId.value;

      // Act - Try to modify (should not work)
      try {
        (staffId as any).value = 'DOC-CARD-202501-999';
      } catch (e) {
        // Expected to fail in strict mode
      }

      // Assert
      expect(staffId.value).toBe(originalValue);
    });
  });
});

