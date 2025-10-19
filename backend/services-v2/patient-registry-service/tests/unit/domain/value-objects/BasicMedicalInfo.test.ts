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

    it('should throw error when knownAllergies is not an array', () => {
      const invalidProps = {
        bloodType: 'O+' as const,
        knownAllergies: 'not an array' as any,
        emergencyMedicalInfo: 'Test'
      };

      expect(() => {
        BasicMedicalInfo.create(invalidProps);
      }).toThrow('Known allergies must be an array');
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

  describe('hasEmergencyInfo', () => {
    it('should return true when emergency info exists', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.hasEmergencyInfo()).toBe(true);
    });

    it('should return false when emergency info is undefined', () => {
      const props = { knownAllergies: [] };
      const medicalInfo = BasicMedicalInfo.create(props);

      expect(medicalInfo.hasEmergencyInfo()).toBe(false);
    });

    it('should return false when emergency info is empty string', () => {
      const props = { knownAllergies: [], emergencyMedicalInfo: '   ' };
      const medicalInfo = BasicMedicalInfo.create(props);

      expect(medicalInfo.hasEmergencyInfo()).toBe(false);
    });
  });

  describe('isAllergyKnown', () => {
    it('should return true for exact allergy match', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.isAllergyKnown('Penicillin')).toBe(true);
      expect(medicalInfo.isAllergyKnown('Peanuts')).toBe(true);
    });

    it('should return true for case-insensitive match', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.isAllergyKnown('penicillin')).toBe(true);
      expect(medicalInfo.isAllergyKnown('PEANUTS')).toBe(true);
    });

    it('should return true for partial match', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.isAllergyKnown('Peni')).toBe(true);
      expect(medicalInfo.isAllergyKnown('nut')).toBe(true);
    });

    it('should return false for unknown allergy', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.isAllergyKnown('Aspirin')).toBe(false);
    });

    it('should handle whitespace in allergy name', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);

      expect(medicalInfo.isAllergyKnown('  Penicillin  ')).toBe(true);
    });
  });

  describe('getEmergencyDisplay', () => {
    it('should format complete medical info in Vietnamese', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      const display = medicalInfo.getEmergencyDisplay();

      expect(display).toContain('Nhóm máu: O+');
      expect(display).toContain('Dị ứng: Penicillin, Peanuts');
      expect(display).toContain('Thông tin khẩn cấp: No chronic conditions');
    });

    it('should format with blood type only', () => {
      const props = { bloodType: 'A+' as const, knownAllergies: [] };
      const medicalInfo = BasicMedicalInfo.create(props);
      const display = medicalInfo.getEmergencyDisplay();

      expect(display).toBe('Nhóm máu: A+');
    });

    it('should format with allergies only', () => {
      const props = { knownAllergies: ['Penicillin'] };
      const medicalInfo = BasicMedicalInfo.create(props);
      const display = medicalInfo.getEmergencyDisplay();

      expect(display).toBe('Dị ứng: Penicillin');
    });

    it('should format with emergency info only', () => {
      const props = { knownAllergies: [], emergencyMedicalInfo: 'Diabetes' };
      const medicalInfo = BasicMedicalInfo.create(props);
      const display = medicalInfo.getEmergencyDisplay();

      expect(display).toBe('Thông tin khẩn cấp: Diabetes');
    });

    it('should return default message when no info available', () => {
      const medicalInfo = BasicMedicalInfo.createEmpty();
      const display = medicalInfo.getEmergencyDisplay();

      expect(display).toBe('Không có thông tin y tế khẩn cấp');
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON format', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      const json = medicalInfo.toJSON();

      expect(json).toEqual({
        bloodType: 'O+',
        knownAllergies: ['Penicillin', 'Peanuts'],
        emergencyMedicalInfo: 'No chronic conditions'
      });
    });

    it('should return copy of allergies array', () => {
      const medicalInfo = BasicMedicalInfo.create(validProps);
      const json = medicalInfo.toJSON();

      // Modify returned array
      json.knownAllergies.push('New Allergy');

      // Original should be unchanged
      expect(medicalInfo.knownAllergies).toHaveLength(2);
    });

    it('should handle empty medical info', () => {
      const medicalInfo = BasicMedicalInfo.createEmpty();
      const json = medicalInfo.toJSON();

      expect(json).toEqual({
        bloodType: undefined,
        knownAllergies: [],
        emergencyMedicalInfo: undefined
      });
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
