/**
 * DoctorId Value Object Tests
 * @version 2.0.0
 */

import { DoctorId } from '../../../../src/domain/value-objects/DoctorId';

describe('DoctorId Value Object', () => {
  describe('create', () => {
    it('should create DoctorId with valid format', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.value).toBe('CARD-DOC-202401-001');
    });

    it('should normalize to uppercase', () => {
      const doctorId = DoctorId.create('card-doc-202401-001');
      expect(doctorId.value).toBe('CARD-DOC-202401-001');
    });

    it('should trim whitespace', () => {
      const doctorId = DoctorId.create('  CARD-DOC-202401-001  ');
      expect(doctorId.value).toBe('CARD-DOC-202401-001');
    });

    it('should fail with empty string', () => {
      expect(() => DoctorId.create('')).toThrow('Mã bác sĩ không được để trống');
    });

    it('should fail with invalid format', () => {
      expect(() => DoctorId.create('INVALID')).toThrow('không đúng định dạng');
    });
  });

  describe('generate', () => {
    it('should generate valid DoctorId', () => {
      const doctorId = DoctorId.generate('CARD');
      expect(doctorId.value).toMatch(/^CARD-DOC-\d{6}-\d{3}$/);
    });

    it('should use GEN as default department', () => {
      const doctorId = DoctorId.generate();
      expect(doctorId.value).toMatch(/^GEN-DOC-\d{6}-\d{3}$/);
    });
  });

  describe('getDepartmentCode', () => {
    it('should extract department code', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.getDepartmentCode()).toBe('CARD');
    });
  });

  describe('getYear', () => {
    it('should extract year', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.getYear()).toBe(2024);
    });
  });

  describe('getMonth', () => {
    it('should extract month', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.getMonth()).toBe(1);
    });
  });

  describe('getSequence', () => {
    it('should extract sequence number', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.getSequence()).toBe(1);
    });
  });

  describe('getDepartmentName', () => {
    it('should return Vietnamese department name', () => {
      const doctorId = DoctorId.create('CARD-DOC-202401-001');
      expect(doctorId.getDepartmentName()).toBe('Tim mạch');
    });

    it('should handle unknown department', () => {
      const doctorId = DoctorId.create('UNKN-DOC-202401-001');
      expect(doctorId.getDepartmentName()).toBe('Không xác định');
    });
  });

  describe('equals', () => {
    it('should be equal for same IDs', () => {
      const id1 = DoctorId.create('CARD-DOC-202401-001');
      const id2 = DoctorId.create('CARD-DOC-202401-001');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal for different IDs', () => {
      const id1 = DoctorId.create('CARD-DOC-202401-001');
      const id2 = DoctorId.create('CARD-DOC-202401-002');
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
