/**
 * Specialization Entity Tests
 * Provider/Staff Service - Domain Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Specialization } from '../../../../src/domain/entities/Specialization';

describe('Specialization Entity', () => {
  const validSpecializationData = {
    code: 'CARD',
    name: 'Cardiology',
    description: 'Heart and cardiovascular system',
    isActive: true
  };

  describe('create', () => {
    it('should create specialization with valid data', () => {
      const spec = Specialization.create(validSpecializationData);

      expect(spec).toBeDefined();
      expect(spec.code).toBe('CARD');
      expect(spec.name).toBe('Cardiology');
      expect(spec.isActive).toBe(true);
    });

    it('should normalize code to uppercase', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        code: 'card'
      });

      expect(spec.code).toBe('CARD');
    });

    it('should trim code and name', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        code: '  CARD  ',
        name: '  Cardiology  '
      });

      expect(spec.code).toBe('CARD');
      expect(spec.name).toBe('Cardiology');
    });

    it('should trim description', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        description: '  Heart diseases  '
      });

      expect(spec.description).toBe('Heart diseases');
    });

    it('should create specialization without description', () => {
      const { description, ...dataWithoutDesc } = validSpecializationData;
      const spec = Specialization.create(dataWithoutDesc);

      expect(spec.description).toBeUndefined();
    });

    it('should set timestamps automatically', () => {
      const spec = Specialization.create(validSpecializationData);
      const persistence = spec.toPersistence();

      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', () => {
      const spec = Specialization.create(validSpecializationData);

      expect(() => spec.validate()).not.toThrow();
    });

    it('should fail when code is empty', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        code: ''
      });

      expect(() => spec.validate()).toThrow('Mã chuyên khoa không được để trống');
    });

    it('should fail when code is whitespace only', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        code: '   '
      });

      expect(() => spec.validate()).toThrow('Mã chuyên khoa không được để trống');
    });

    it('should fail when name is empty', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        name: ''
      });

      expect(() => spec.validate()).toThrow('Tên chuyên khoa không được để trống');
    });

    it('should fail when name is whitespace only', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        name: '   '
      });

      expect(() => spec.validate()).toThrow('Tên chuyên khoa không được để trống');
    });
  });

  describe('activate', () => {
    it('should activate inactive specialization', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        isActive: false
      });

      spec.activate();

      expect(spec.isActive).toBe(true);
    });

    it('should update timestamp when activated', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        isActive: false
      });

      spec.activate();
      const updatedAt = spec.toPersistence().updated_at;
      expect(updatedAt).toBeDefined();
    });
  });

  describe('deactivate', () => {
    it('should deactivate active specialization', () => {
      const spec = Specialization.create(validSpecializationData);

      spec.deactivate();

      expect(spec.isActive).toBe(false);
    });

    it('should update timestamp when deactivated', () => {
      const spec = Specialization.create(validSpecializationData);
      
      spec.deactivate();
      
      expect(spec.toPersistence().updated_at).toBeDefined();
    });
  });

  describe('updateDescription', () => {
    it('should update description', () => {
      const spec = Specialization.create(validSpecializationData);
      const newDescription = 'Specialized in heart and cardiovascular diseases';

      spec.updateDescription(newDescription);

      expect(spec.description).toBe(newDescription);
    });

    it('should trim new description', () => {
      const spec = Specialization.create(validSpecializationData);

      spec.updateDescription('  New description  ');

      expect(spec.description).toBe('New description');
    });

    it('should update timestamp when description changed', () => {
      const spec = Specialization.create(validSpecializationData);
      
      spec.updateDescription('New description');
      
      expect(spec.toPersistence().updated_at).toBeDefined();
    });
  });

  describe('equals', () => {
    it('should be equal when codes match', () => {
      const spec1 = Specialization.create(validSpecializationData);
      const spec2 = Specialization.create(validSpecializationData);

      expect(spec1.equals(spec2)).toBe(true);
    });

    it('should not be equal when codes differ', () => {
      const spec1 = Specialization.create(validSpecializationData);
      const spec2 = Specialization.create({
        ...validSpecializationData,
        code: 'ORTH'
      });

      expect(spec1.equals(spec2)).toBe(false);
    });

    it('should handle null comparison', () => {
      const spec = Specialization.create(validSpecializationData);

      expect(spec.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string', () => {
      const spec = Specialization.create(validSpecializationData);

      expect(spec.toString()).toBe('CARD - Cardiology');
    });

    it('should handle Vietnamese names', () => {
      const spec = Specialization.create({
        ...validSpecializationData,
        code: 'TIM',
        name: 'Tim mạch'
      });

      expect(spec.toString()).toBe('TIM - Tim mạch');
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstruct specialization from database', () => {
      const dbData = {
        id: 'spec-123',
        code: 'CARD',
        name: 'Cardiology',
        description: 'Heart diseases',
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const spec = Specialization.fromPersistenceData(dbData);

      expect(spec.code).toBe('CARD');
      expect(spec.name).toBe('Cardiology');
      expect(spec.isActive).toBe(true);
    });

    it('should handle null description', () => {
      const dbData = {
        id: 'spec-123',
        code: 'CARD',
        name: 'Cardiology',
        description: null,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const spec = Specialization.fromPersistenceData(dbData);

      expect(spec.description).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert to database format', () => {
      const spec = Specialization.create(validSpecializationData);

      const persistence = spec.toPersistence();

      expect(persistence).toHaveProperty('code', 'CARD');
      expect(persistence).toHaveProperty('name', 'Cardiology');
      expect(persistence).toHaveProperty('description');
      expect(persistence).toHaveProperty('is_active', true);
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });

    it('should handle optional description', () => {
      const { description, ...dataWithoutDesc } = validSpecializationData;
      const spec = Specialization.create(dataWithoutDesc);

      const persistence = spec.toPersistence();

      expect(persistence.description).toBeUndefined();
    });
  });

  describe('Vietnamese Medical Specializations', () => {
    it('should support common Vietnamese medical specializations', () => {
      const specializations = [
        { code: 'TIM', name: 'Tim mạch' },
        { code: 'XUONG', name: 'Xương khớp' },
        { code: 'NHI', name: 'Nhi khoa' },
        { code: 'SANPK', name: 'Sản phụ khoa' },
        { code: 'MAT', name: 'Mắt' },
        { code: 'TAI', name: 'Tai Mũi Họng' },
        { code: 'RANG', name: 'Răng Hàm Mặt' },
        { code: 'DA', name: 'Da liễu' },
        { code: 'TAM', name: 'Tâm thần' },
        { code: 'YHCT', name: 'Y học cổ truyền' }
      ];

      specializations.forEach(data => {
        const spec = Specialization.create({
          code: data.code,
          name: data.name,
          isActive: true
        });

        expect(spec.code).toBe(data.code.toUpperCase());
        expect(spec.name).toBe(data.name);
        expect(() => spec.validate()).not.toThrow();
      });
    });

    it('should support bilingual specializations', () => {
      const spec = Specialization.create({
        code: 'CARD',
        name: 'Cardiology',
        description: 'Tim mạch - Chuyên khoa tim mạch',
        isActive: true
      });

      expect(spec.description).toContain('Tim mạch');
      expect(spec.name).toBe('Cardiology');
    });
  });

  describe('International Medical Specializations', () => {
    it('should support common international specializations', () => {
      const specializations = [
        { code: 'CARD', name: 'Cardiology' },
        { code: 'ORTH', name: 'Orthopedics' },
        { code: 'PEDI', name: 'Pediatrics' },
        { code: 'OBGYN', name: 'Obstetrics & Gynecology' },
        { code: 'DERM', name: 'Dermatology' },
        { code: 'ENT', name: 'Ear, Nose & Throat' },
        { code: 'NEUR', name: 'Neurology' },
        { code: 'PSYCH', name: 'Psychiatry' },
        { code: 'ONCOL', name: 'Oncology' },
        { code: 'RADIO', name: 'Radiology' }
      ];

      specializations.forEach(data => {
        const spec = Specialization.create({
          code: data.code,
          name: data.name,
          isActive: true
        });

        expect(spec.code).toBe(data.code.toUpperCase());
        expect(spec.name).toBe(data.name);
        expect(() => spec.validate()).not.toThrow();
      });
    });
  });

  describe('Specialization Lifecycle', () => {
    it('should support activation/deactivation cycle', () => {
      const spec = Specialization.create(validSpecializationData);

      expect(spec.isActive).toBe(true);

      spec.deactivate();
      expect(spec.isActive).toBe(false);

      spec.activate();
      expect(spec.isActive).toBe(true);
    });

    it('should maintain description through lifecycle', () => {
      const spec = Specialization.create(validSpecializationData);
      const originalDesc = spec.description;

      spec.deactivate();
      expect(spec.description).toBe(originalDesc);

      spec.activate();
      expect(spec.description).toBe(originalDesc);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long descriptions', () => {
      const longDesc = 'A'.repeat(500);
      const spec = Specialization.create({
        ...validSpecializationData,
        description: longDesc
      });

      expect(spec.description).toBe(longDesc);
      expect(spec.description?.length).toBe(500);
    });

    it('should handle special characters in names', () => {
      const spec = Specialization.create({
        code: 'ENT',
        name: 'Ear, Nose & Throat (ENT)',
        isActive: true
      });

      expect(spec.name).toBe('Ear, Nose & Throat (ENT)');
    });

    it('should handle code with numbers', () => {
      const spec = Specialization.create({
        code: 'CARD2',
        name: 'Advanced Cardiology',
        isActive: true
      });

      expect(spec.code).toBe('CARD2');
    });

    it('should handle Vietnamese diacritics', () => {
      const spec = Specialization.create({
        code: 'TMH',
        name: 'Tai Mũi Họng',
        description: 'Chuyên khoa Tai Mũi Họng',
        isActive: true
      });

      expect(spec.name).toContain('ũ');
      expect(spec.description).toContain('ọ');
    });
  });
});
