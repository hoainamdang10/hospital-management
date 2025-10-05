/**
 * Unit Tests for Email Value Object
 * Tests email validation, domain extraction, and healthcare-specific features
 */

import { Email } from '@domain/value-objects/Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('Test@Example.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email không được để trống');
    });

    it('should throw error for whitespace-only email', () => {
      expect(() => Email.create('   ')).toThrow('Email không được để trống');
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow('Định dạng email không hợp lệ');
    });

    it('should throw error for email without @', () => {
      expect(() => Email.create('testexample.com')).toThrow('Định dạng email không hợp lệ');
    });

    it('should throw error for email without domain', () => {
      expect(() => Email.create('test@')).toThrow('Định dạng email không hợp lệ');
    });

    it('should throw error for email too long (>254 chars)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow('Email quá dài');
    });

    it('should accept email with special characters', () => {
      const email = Email.create('test.name+tag@example.com');
      expect(email.value).toBe('test.name+tag@example.com');
    });

    it('should accept email with numbers', () => {
      const email = Email.create('user123@example.com');
      expect(email.value).toBe('user123@example.com');
    });

    it('should accept email with hyphens in domain', () => {
      const email = Email.create('test@my-domain.com');
      expect(email.value).toBe('test@my-domain.com');
    });
  });

  describe('fromString', () => {
    it('should create email from string', () => {
      const email = Email.fromString('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for invalid string', () => {
      expect(() => Email.fromString('invalid')).toThrow();
    });
  });

  describe('isValid', () => {
    it('should return true for valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.isValid()).toBe(true);
    });
  });

  describe('domain', () => {
    it('should extract domain from email', () => {
      const email = Email.create('test@example.com');
      expect(email.domain).toBe('example.com');
    });

    it('should extract subdomain', () => {
      const email = Email.create('test@mail.example.com');
      expect(email.domain).toBe('mail.example.com');
    });

    it('should handle Vietnamese domain', () => {
      const email = Email.create('doctor@benhvien.vn');
      expect(email.domain).toBe('benhvien.vn');
    });
  });

  describe('localPart', () => {
    it('should extract local part from email', () => {
      const email = Email.create('test@example.com');
      expect(email.localPart).toBe('test');
    });

    it('should extract local part with special chars', () => {
      const email = Email.create('test.name+tag@example.com');
      expect(email.localPart).toBe('test.name+tag');
    });
  });

  describe('isVietnameseHospitalEmail', () => {
    it('should return true for benhvien.vn domain', () => {
      const email = Email.create('doctor@benhvien.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for hospital.vn domain', () => {
      const email = Email.create('doctor@hospital.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for medic.vn domain', () => {
      const email = Email.create('doctor@medic.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for bv.vn domain', () => {
      const email = Email.create('doctor@bv.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for phongkham.vn domain', () => {
      const email = Email.create('doctor@phongkham.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for clinic.vn domain', () => {
      const email = Email.create('doctor@clinic.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return true for yte.vn domain', () => {
      const email = Email.create('doctor@yte.vn');
      expect(email.isVietnameseHospitalEmail()).toBe(true);
    });

    it('should return false for non-Vietnamese domain', () => {
      const email = Email.create('test@example.com');
      expect(email.isVietnameseHospitalEmail()).toBe(false);
    });
  });

  describe('isHealthcareStaffEmail', () => {
    it('should return true for hospital domain', () => {
      const email = Email.create('test@hospital.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for clinic domain', () => {
      const email = Email.create('test@clinic.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for doctor local part', () => {
      const email = Email.create('doctor@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for dr local part', () => {
      const email = Email.create('dr.smith@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for nurse local part', () => {
      const email = Email.create('nurse@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for bacsi local part', () => {
      const email = Email.create('bacsi@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for yta local part', () => {
      const email = Email.create('yta@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for admin local part', () => {
      const email = Email.create('admin@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return true for Vietnamese hospital email', () => {
      const email = Email.create('test@benhvien.vn');
      expect(email.isHealthcareStaffEmail()).toBe(true);
    });

    it('should return false for regular email', () => {
      const email = Email.create('test@example.com');
      expect(email.isHealthcareStaffEmail()).toBe(false);
    });
  });

  describe('getEmailType', () => {
    it('should return admin for admin email', () => {
      const email = Email.create('admin@example.com');
      expect(email.getEmailType()).toBe('admin');
    });

    it('should return admin for quanly email', () => {
      const email = Email.create('quanly@example.com');
      expect(email.getEmailType()).toBe('admin');
    });

    it('should return doctor for doctor email', () => {
      const email = Email.create('doctor@example.com');
      expect(email.getEmailType()).toBe('doctor');
    });

    it('should return doctor for dr email', () => {
      const email = Email.create('dr.smith@example.com');
      expect(email.getEmailType()).toBe('doctor');
    });

    it('should return doctor for bacsi email', () => {
      const email = Email.create('bacsi@example.com');
      expect(email.getEmailType()).toBe('doctor');
    });

    it('should return nurse for nurse email', () => {
      const email = Email.create('nurse@example.com');
      expect(email.getEmailType()).toBe('nurse');
    });

    it('should return nurse for yta email', () => {
      const email = Email.create('yta@example.com');
      expect(email.getEmailType()).toBe('nurse');
    });

    it('should return staff for healthcare staff email', () => {
      const email = Email.create('staff@hospital.com');
      expect(email.getEmailType()).toBe('staff');
    });

    it('should return patient for regular email', () => {
      const email = Email.create('test@example.com');
      expect(email.getEmailType()).toBe('patient');
    });
  });

  describe('getMaskedEmail', () => {
    it('should mask email with long local part', () => {
      const email = Email.create('testuser@example.com');
      expect(email.getMaskedEmail()).toBe('te******@example.com');
    });

    it('should mask email with short local part', () => {
      const email = Email.create('ab@example.com');
      expect(email.getMaskedEmail()).toBe('ab***@example.com');
    });

    it('should mask email with 3-char local part', () => {
      const email = Email.create('abc@example.com');
      expect(email.getMaskedEmail()).toBe('ab*@example.com');
    });
  });

  describe('isSupabaseCompatible', () => {
    it('should return true for compatible email', () => {
      const email = Email.create('test@example.com');
      expect(email.isSupabaseCompatible()).toBe(true);
    });

    it('should return false for email with + alias', () => {
      const email = Email.create('test+alias@example.com');
      expect(email.isSupabaseCompatible()).toBe(false);
    });

    it('should return false for email without TLD', () => {
      const email = Email.create('test@localhost');
      expect(email.isSupabaseCompatible()).toBe(false);
    });

    it('should return true for email with subdomain', () => {
      const email = Email.create('test@mail.example.com');
      expect(email.isSupabaseCompatible()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false for null', () => {
      const email = Email.create('test@example.com');
      expect(email.equals(null as any)).toBe(false);
    });

    it('should return false for non-Email object', () => {
      const email = Email.create('test@example.com');
      expect(email.equals({} as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return email string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('toSupabaseFormat', () => {
    it('should return email in Supabase format', () => {
      const email = Email.create('test@example.com');
      expect(email.toSupabaseFormat()).toBe('test@example.com');
    });
  });
});

