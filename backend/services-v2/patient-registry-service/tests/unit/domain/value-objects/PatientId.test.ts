/**
 * PatientId Value Object Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { PatientId } from '../../../../src/domain/value-objects/PatientId';

describe('PatientId Value Object', () => {
  describe('generate', () => {
    it('should generate valid PatientId with correct format (PAT-YYYYMM-XXX)', () => {
      const patientId = PatientId.generate();
      
      expect(patientId).toBeInstanceOf(PatientId);
      expect(patientId.value).toMatch(/^PAT-\d{6}-\d{3}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = PatientId.generate();
      const id2 = PatientId.generate();
      
      expect(id1.value).not.toBe(id2.value);
    });

    it('should include current year and month in ID', () => {
      const patientId = PatientId.generate();
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      expect(patientId.value).toContain(yearMonth);
    });

    it('should generate unique numbers', () => {
      const id1 = PatientId.generate();
      const id2 = PatientId.generate();

      const num1 = parseInt(id1.value.split('-')[2]);
      const num2 = parseInt(id2.value.split('-')[2]);

      expect(num1).not.toBe(num2);
    });
  });

  describe('fromString', () => {
    it('should create PatientId from valid string', () => {
      const validId = 'PAT-202501-001';
      const patientId = PatientId.fromString(validId);
      
      expect(patientId).toBeInstanceOf(PatientId);
      expect(patientId.value).toBe(validId);
    });

    it('should throw error for invalid format', () => {
      const invalidIds = [
        'INVALID-202501-001',
        'PAT-2025-001',
        'PAT-202501-1',
        'PAT-202501-ABCD',
        'PAT202501001',
        ''
      ];

      invalidIds.forEach(invalidId => {
        expect(() => PatientId.fromString(invalidId)).toThrow();
      });
    });

    it('should throw error for null or undefined', () => {
      expect(() => PatientId.fromString(null as any)).toThrow();
      expect(() => PatientId.fromString(undefined as any)).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for same patient IDs', () => {
      const id1 = PatientId.fromString('PAT-202501-001');
      const id2 = PatientId.fromString('PAT-202501-001');
      
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different patient IDs', () => {
      const id1 = PatientId.fromString('PAT-202501-001');
      const id2 = PatientId.fromString('PAT-202501-002');
      
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const patientId = PatientId.fromString('PAT-202501-001');
      
      expect(patientId.toString()).toBe('PAT-202501-001');
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should follow Vietnamese patient ID format', () => {
      const patientId = PatientId.generate();
      
      // Format: PAT-YYYYMM-XXX
      // PAT: Patient prefix
      // YYYYMM: Year and month
      // XXX: Sequential number (001-999)
      expect(patientId.value).toMatch(/^PAT-\d{6}-\d{3}$/);
    });

    it('should support up to 999 patients per month', () => {
      const maxId = PatientId.fromString('PAT-202501-999');
      
      expect(maxId.value).toBe('PAT-202501-999');
    });
  });
});

