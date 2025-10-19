/**
 * InsuranceInfo Entity Tests
 * Comprehensive unit tests for InsuranceInfo entity
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { InsuranceInfo } from '@domain/entities/InsuranceInfo';

describe('InsuranceInfo Entity', () => {
  const validFrom = new Date('2024-01-01');
  const validTo = new Date('2025-12-31');

  describe('create', () => {
    it('should create BHYT insurance with valid data', () => {
      const insurance = InsuranceInfo.create({
        provider: 'BHXH Vietnam',
        policyNumber: 'BHYT-123456789',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance).toBeDefined();
      expect(insurance.provider).toBe('BHXH Vietnam');
      expect(insurance.policyNumber).toBe('BHYT-123456789');
      expect(insurance.coverageType).toBe('BHYT');
      expect(insurance.isActive).toBe(true);
      expect(insurance.isPrimary).toBe(true);
      expect(insurance.isVietnameseInsurance).toBe(true);
      expect(insurance.bhytNumber).toBe('DN1234567890123');
    });

    it('should create BHTN insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Bao Viet Insurance',
        policyNumber: 'BHTN-987654321',
        validFrom,
        validTo,
        coverageType: 'BHTN',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: true,
        bhytNumber: 'HN9876543210987'
      });

      expect(insurance.coverageType).toBe('BHTN');
      expect(insurance.isBHTN()).toBe(true);
    });

    it('should create private insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'AIA Vietnam',
        policyNumber: 'AIA-111222333',
        groupNumber: 'GROUP-001',
        validFrom,
        validTo,
        coverageType: 'private',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: false
      });

      expect(insurance.coverageType).toBe('private');
      expect(insurance.isPrivate()).toBe(true);
      expect(insurance.groupNumber).toBe('GROUP-001');
    });

    it('should create self-pay insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Self',
        policyNumber: 'SELF-001',
        validFrom,
        validTo,
        coverageType: 'self_pay',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: false
      });

      expect(insurance.coverageType).toBe('self_pay');
      expect(insurance.isSelfPay()).toBe(true);
    });

    it('should generate unique ID for each insurance', () => {
      const insurance1 = InsuranceInfo.create({
        provider: 'Provider 1',
        policyNumber: 'POL-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      const insurance2 = InsuranceInfo.create({
        provider: 'Provider 2',
        policyNumber: 'POL-002',
        validFrom,
        validTo,
        coverageType: 'BHTN',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: true,
        bhytNumber: 'HN9876543210987'
      });

      expect(insurance1.getId()).not.toBe(insurance2.getId());
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute insurance from persistence data', () => {
      const props = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        provider: 'BHXH Vietnam',
        policyNumber: 'BHYT-123456789',
        validFrom,
        validTo,
        coverageType: 'BHYT' as const,
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const insurance = InsuranceInfo.reconstitute(props);

      expect(insurance.getId()).toBe(props.id);
      expect(insurance.provider).toBe(props.provider);
      expect(insurance.policyNumber).toBe(props.policyNumber);
      expect(insurance.coverageType).toBe(props.coverageType);
    });
  });

  describe('isNotExpired', () => {
    it('should return true for non-expired insurance', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date(),
        validTo: futureDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isNotExpired()).toBe(true);
    });

    it('should return false for expired insurance', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date('2020-01-01'),
        validTo: pastDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isNotExpired()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true for expired insurance', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date('2020-01-01'),
        validTo: pastDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isExpired()).toBe(true);
    });
  });

  describe('isValidOn', () => {
    it('should return true for date within validity period', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isValidOn(new Date('2024-06-15'))).toBe(true);
    });

    it('should return false for date before validity period', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isValidOn(new Date('2023-12-31'))).toBe(false);
    });

    it('should return false for date after validity period', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isValidOn(new Date('2025-01-01'))).toBe(false);
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should calculate days until expiry correctly', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 30);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: today,
        validTo: futureDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      const days = insurance.getDaysUntilExpiry();
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });
  });

  describe('isExpiringWithin', () => {
    it('should return true if expiring within specified days', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 15);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: today,
        validTo: futureDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isExpiringWithin(30)).toBe(true);
    });

    it('should return false if not expiring within specified days', () => {
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 60);

      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom: today,
        validTo: futureDate,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isExpiringWithin(30)).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: false,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      insurance.activate();
      expect(insurance.isActive).toBe(true);
    });

    it('should deactivate insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      insurance.deactivate();
      expect(insurance.isActive).toBe(false);
    });
  });

  describe('setPrimary and removePrimary', () => {
    it('should set insurance as primary', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      insurance.setPrimary();
      expect(insurance.isPrimary).toBe(true);
    });

    it('should remove primary status', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'POL-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      insurance.removePrimary();
      expect(insurance.isPrimary).toBe(false);
    });
  });

  describe('Vietnamese insurance methods', () => {
    it('should identify BHYT insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'BHXH Vietnam',
        policyNumber: 'BHYT-123',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.isBHYT()).toBe(true);
      expect(insurance.isBHTN()).toBe(false);
      expect(insurance.isPrivate()).toBe(false);
      expect(insurance.isSelfPay()).toBe(false);
    });

    it('should get Vietnamese insurance number', () => {
      const insurance = InsuranceInfo.create({
        provider: 'BHXH Vietnam',
        policyNumber: 'BHYT-123',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.getVietnameseInsuranceNumber()).toBe('DN1234567890123');
    });

    it('should return null for non-Vietnamese insurance', () => {
      const insurance = InsuranceInfo.create({
        provider: 'AIA',
        policyNumber: 'AIA-123',
        validFrom,
        validTo,
        coverageType: 'private',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: false
      });

      expect(insurance.getVietnameseInsuranceNumber()).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert to persistence format', () => {
      const insurance = InsuranceInfo.create({
        provider: 'BHXH Vietnam',
        policyNumber: 'BHYT-123',
        groupNumber: 'GROUP-001',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      const persistence = insurance.toPersistence();

      expect(persistence).toHaveProperty('id');
      expect(persistence.provider).toBe('BHXH Vietnam');
      expect(persistence.policy_number).toBe('BHYT-123');
      expect(persistence.group_number).toBe('GROUP-001');
      expect(persistence.coverage_type).toBe('BHYT');
      expect(persistence.is_active).toBe(true);
      expect(persistence.is_primary).toBe(true);
      expect(persistence.is_vietnamese_insurance).toBe(true);
      expect(persistence.bhyt_number).toBe('DN1234567890123');
    });
  });

  describe('getMaskedPolicyNumber', () => {
    it('should mask policy number showing only last 4 characters', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: 'BHYT-123456789',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.getMaskedPolicyNumber()).toBe('***6789');
    });

    it('should return *** for short policy numbers', () => {
      const insurance = InsuranceInfo.create({
        provider: 'Provider',
        policyNumber: '123',
        validFrom,
        validTo,
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'DN1234567890123'
      });

      expect(insurance.getMaskedPolicyNumber()).toBe('***');
    });
  });
});

