/**
 * BasicMedicalInfo Value Object Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('BasicMedicalInfo Value Object', () => {
  const validProps = {
    bloodType: 'O+' as const,
    knownAllergies: ['Penicillin', 'Peanuts'],
    emergencyMedicalInfo: 'No chronic conditions'
  };

  describe('create', () => {
    it('should create BasicMedicalInfo with valid data', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      
      expect(medicalInfo).toBeInstanceOf(BasicMedicalInfo);
      expect(medicalInfo.bloodType).toBe('O+');
      expect(medicalInfo.knownAllergies).toHaveLength(2);
      expect(medicalInfo.emergencyMedicalInfo).toBe('No chronic conditions');
    });

    it('should accept all valid blood types', () => {
      const bloodTypes: Array<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'> = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      ];

      bloodTypes.forEach(bloodType => {
        const props = { ...validProps, bloodType };
        const medicalInfo = BasicMedicalInfo.create(props);
        expect(medicalInfo.bloodType).toBe(bloodType);
      });
    });

    it('should accept optional blood type', () => {
      const propsWithoutBloodType = {
        knownAllergies: ['Penicillin'],
        emergencyMedicalInfo: 'No chronic conditions'
      };
      const medicalInfo = BasicMedicalInfo.create(propsWithoutBloodType);
      
      expect(medicalInfo.bloodType).toBeUndefined();
    });

    it('should allow empty allergies array', () => {
      const props = { ...validProps, knownAllergies: [] };
      const medicalInfo = BasicMedicalInfo.create(props);
      
      expect(medicalInfo.knownAllergies).toHaveLength(0);
    });

    it('should create BasicMedicalInfo without optional fields', () => {
      const minimalProps = {
        knownAllergies: []
      };
      const medicalInfo = BasicMedicalInfo.create(minimalProps);
      
      expect(medicalInfo).toBeInstanceOf(BasicMedicalInfo);
      expect(medicalInfo.bloodType).toBeUndefined();
      expect(medicalInfo.emergencyMedicalInfo).toBeUndefined();
    });

    it('should create empty BasicMedicalInfo', () => {
      const medicalInfo = BasicMedicalInfo.createEmpty();
      
      expect(medicalInfo).toBeInstanceOf(BasicMedicalInfo);
      expect(medicalInfo.knownAllergies).toHaveLength(0);
      expect(medicalInfo.bloodType).toBeUndefined();
    });
  });

  describe('hasAllergies', () => {
    it('should return true when allergies exist', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      
      expect(medicalInfo.hasAllergies()).toBe(true);
    });

    it('should return false when no allergies', () => {
      const props = { ...validProps, knownAllergies: [] };
      const medicalInfo = BasicMedicalInfo.create(props);
      
      expect(medicalInfo.hasAllergies()).toBe(false);
    });
  });

  describe('hasBloodType', () => {
    it('should return true when blood type is set', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      
      expect(medicalInfo.hasBloodType()).toBe(true);
    });

    it('should return false when blood type is not set', () => {
      const props = { knownAllergies: [] };
      const medicalInfo = BasicMedicalInfo.create(props);
      
      expect(medicalInfo.hasBloodType()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same medical info', () => {
      const info1 = BasicMedicalInfo.create(validProps);
      const info2 = BasicMedicalInfo.create(validProps);
      
      expect(info1.equals(info2)).toBe(true);
    });

    it('should return false for different medical info', () => {
      const info1 = BasicMedicalInfo.create(validProps);
      const info2 = BasicMedicalInfo.create({
        ...validProps,
        bloodType: 'A+'
      });
      
      expect(info1.equals(info2)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      
      expect(() => {
        (medicalInfo as any).bloodType = 'A+';
      }).toThrow();
    });
  });

  describe('Vietnamese healthcare compliance', () => {
    it('should support Vietnamese allergy names', () => {
      const vietnameseProps = {
        bloodType: 'O+' as const,
        knownAllergies: ['Penicillin', 'Đậu phộng', 'Hải sản'],
        emergencyMedicalInfo: 'Không có bệnh mãn tính'
      };
      const medicalInfo = BasicMedicalInfo.create(vietnameseProps);
      
      expect(medicalInfo.knownAllergies).toContain('Đậu phộng');
      expect(medicalInfo.knownAllergies).toContain('Hải sản');
    });
  });
});
