/**
 * PatientStatus Tests
 * Comprehensive unit tests for PatientStatus enum and helper
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientStatus, PatientStatusHelper } from '@domain/value-objects/PatientStatus';

describe('PatientStatus', () => {
  describe('enum values', () => {
    it('should have ACTIVE status', () => {
      expect(PatientStatus.ACTIVE).toBe('active');
    });

    it('should have INACTIVE status', () => {
      expect(PatientStatus.INACTIVE).toBe('inactive');
    });

    it('should have DECEASED status', () => {
      expect(PatientStatus.DECEASED).toBe('deceased');
    });

    it('should have MERGED status', () => {
      expect(PatientStatus.MERGED).toBe('merged');
    });

    it('should have exactly 4 status values', () => {
      const statusValues = Object.values(PatientStatus);
      expect(statusValues).toHaveLength(4);
    });
  });

  describe('PatientStatusHelper.getDescription', () => {
    it('should return Vietnamese description for ACTIVE', () => {
      const description = PatientStatusHelper.getDescription(PatientStatus.ACTIVE);
      expect(description).toBe('Đang hoạt động');
    });

    it('should return Vietnamese description for INACTIVE', () => {
      const description = PatientStatusHelper.getDescription(PatientStatus.INACTIVE);
      expect(description).toBe('Không hoạt động');
    });

    it('should return Vietnamese description for DECEASED', () => {
      const description = PatientStatusHelper.getDescription(PatientStatus.DECEASED);
      expect(description).toBe('Đã qua đời');
    });

    it('should return Vietnamese description for MERGED', () => {
      const description = PatientStatusHelper.getDescription(PatientStatus.MERGED);
      expect(description).toBe('Đã gộp (trùng lặp)');
    });

    it('should return default description for invalid status', () => {
      const description = PatientStatusHelper.getDescription('invalid' as PatientStatus);
      expect(description).toBe('Không xác định');
    });
  });

  describe('PatientStatusHelper.isValid', () => {
    it('should return true for valid status values', () => {
      expect(PatientStatusHelper.isValid('active')).toBe(true);
      expect(PatientStatusHelper.isValid('inactive')).toBe(true);
      expect(PatientStatusHelper.isValid('deceased')).toBe(true);
      expect(PatientStatusHelper.isValid('merged')).toBe(true);
    });

    it('should return false for invalid status values', () => {
      expect(PatientStatusHelper.isValid('invalid')).toBe(false);
      expect(PatientStatusHelper.isValid('')).toBe(false);
      expect(PatientStatusHelper.isValid('ACTIVE')).toBe(false); // Case sensitive
      expect(PatientStatusHelper.isValid('pending')).toBe(false);
    });
  });

  describe('PatientStatusHelper.parse', () => {
    it('should parse valid status strings', () => {
      expect(PatientStatusHelper.parse('active')).toBe(PatientStatus.ACTIVE);
      expect(PatientStatusHelper.parse('inactive')).toBe(PatientStatus.INACTIVE);
      expect(PatientStatusHelper.parse('deceased')).toBe(PatientStatus.DECEASED);
      expect(PatientStatusHelper.parse('merged')).toBe(PatientStatus.MERGED);
    });

    it('should throw error for invalid status strings', () => {
      expect(() => {
        PatientStatusHelper.parse('invalid');
      }).toThrow('Invalid patient status: invalid');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        PatientStatusHelper.parse('');
      }).toThrow('Invalid patient status: ');
    });

    it('should throw error for uppercase status', () => {
      expect(() => {
        PatientStatusHelper.parse('ACTIVE');
      }).toThrow('Invalid patient status: ACTIVE');
    });
  });

  describe('PatientStatusHelper.canUpdate', () => {
    it('should return true for ACTIVE status', () => {
      expect(PatientStatusHelper.canUpdate(PatientStatus.ACTIVE)).toBe(true);
    });

    it('should return false for INACTIVE status', () => {
      expect(PatientStatusHelper.canUpdate(PatientStatus.INACTIVE)).toBe(false);
    });

    it('should return false for DECEASED status', () => {
      expect(PatientStatusHelper.canUpdate(PatientStatus.DECEASED)).toBe(false);
    });

    it('should return false for MERGED status', () => {
      expect(PatientStatusHelper.canUpdate(PatientStatus.MERGED)).toBe(false);
    });
  });

  describe('PatientStatusHelper.canMerge', () => {
    it('should return true for ACTIVE status', () => {
      expect(PatientStatusHelper.canMerge(PatientStatus.ACTIVE)).toBe(true);
    });

    it('should return true for INACTIVE status', () => {
      expect(PatientStatusHelper.canMerge(PatientStatus.INACTIVE)).toBe(true);
    });

    it('should return false for DECEASED status', () => {
      expect(PatientStatusHelper.canMerge(PatientStatus.DECEASED)).toBe(false);
    });

    it('should return false for MERGED status', () => {
      expect(PatientStatusHelper.canMerge(PatientStatus.MERGED)).toBe(false);
    });
  });

  describe('PatientStatusHelper.canDeactivate', () => {
    it('should return true for ACTIVE status', () => {
      expect(PatientStatusHelper.canDeactivate(PatientStatus.ACTIVE)).toBe(true);
    });

    it('should return false for INACTIVE status', () => {
      expect(PatientStatusHelper.canDeactivate(PatientStatus.INACTIVE)).toBe(false);
    });

    it('should return false for DECEASED status', () => {
      expect(PatientStatusHelper.canDeactivate(PatientStatus.DECEASED)).toBe(false);
    });

    it('should return false for MERGED status', () => {
      expect(PatientStatusHelper.canDeactivate(PatientStatus.MERGED)).toBe(false);
    });
  });

  describe('business logic validation', () => {
    it('should allow update only for active patients', () => {
      const statuses = [
        PatientStatus.ACTIVE,
        PatientStatus.INACTIVE,
        PatientStatus.DECEASED,
        PatientStatus.MERGED
      ];

      const canUpdateResults = statuses.map(status => PatientStatusHelper.canUpdate(status));

      expect(canUpdateResults).toEqual([true, false, false, false]);
    });

    it('should allow merge for active and inactive patients only', () => {
      const statuses = [
        PatientStatus.ACTIVE,
        PatientStatus.INACTIVE,
        PatientStatus.DECEASED,
        PatientStatus.MERGED
      ];

      const canMergeResults = statuses.map(status => PatientStatusHelper.canMerge(status));

      expect(canMergeResults).toEqual([true, true, false, false]);
    });

    it('should allow deactivate only for active patients', () => {
      const statuses = [
        PatientStatus.ACTIVE,
        PatientStatus.INACTIVE,
        PatientStatus.DECEASED,
        PatientStatus.MERGED
      ];

      const canDeactivateResults = statuses.map(status => PatientStatusHelper.canDeactivate(status));

      expect(canDeactivateResults).toEqual([true, false, false, false]);
    });
  });

  describe('status transitions', () => {
    it('should validate valid status transitions', () => {
      // ACTIVE can transition to INACTIVE, DECEASED, MERGED
      expect(PatientStatusHelper.canDeactivate(PatientStatus.ACTIVE)).toBe(true);
      expect(PatientStatusHelper.canMerge(PatientStatus.ACTIVE)).toBe(true);

      // INACTIVE can transition to ACTIVE (reactivate), MERGED
      expect(PatientStatusHelper.canMerge(PatientStatus.INACTIVE)).toBe(true);

      // DECEASED and MERGED are terminal states
      expect(PatientStatusHelper.canUpdate(PatientStatus.DECEASED)).toBe(false);
      expect(PatientStatusHelper.canUpdate(PatientStatus.MERGED)).toBe(false);
      expect(PatientStatusHelper.canMerge(PatientStatus.DECEASED)).toBe(false);
      expect(PatientStatusHelper.canMerge(PatientStatus.MERGED)).toBe(false);
    });
  });
});

