/**
 * InsuranceValidationService Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { InsuranceValidationService } from '../../../../src/application/services/InsuranceValidationService';
import { ILogger } from '@shared/application/services/logger.interface';

describe('InsuranceValidationService', () => {
  let service: InsuranceValidationService;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    service = new InsuranceValidationService(mockLogger);
  });

  describe('validateBHYTNumber', () => {
    it('should validate correct BHYT number', async () => {
      const result = await service.validateBHYTNumber('HN-1-01-2024-12345-67890');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.provinceCode).toBe('HN');
      expect(result.metadata?.priorityLevel).toBe('1');
      expect(result.metadata?.groupCode).toBe('01');
      expect(result.metadata?.year).toBe('2024');
    });

    it('should validate BHYT number with different province codes', async () => {
      const validCodes = ['HN', 'HP', 'HB', 'QB', 'BN', 'HD', 'SG', 'ĐN', 'CT'];

      for (const code of validCodes) {
        const result = await service.validateBHYTNumber(`${code}-1-01-2024-12345-67890`);
        expect(result.isValid).toBe(true);
        expect(result.metadata?.provinceCode).toBe(code);
      }
    });

    it('should reject invalid BHYT format', async () => {
      const result = await service.validateBHYTNumber('INVALID-FORMAT');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Số BHYT không đúng định dạng. Định dạng đúng: XX-Y-ZZ-YYYY-NNNNN-CCCCC');
    });

    it('should reject invalid province code', async () => {
      const result = await service.validateBHYTNumber('XX-1-01-2024-12345-67890');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mã tỉnh/thành không hợp lệ: XX');
    });

    it('should reject invalid priority level', async () => {
      const result = await service.validateBHYTNumber('HN-9-01-2024-12345-67890');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mức ưu tiên không hợp lệ: 9');
    });

    it('should warn about uncommon group code', async () => {
      const result = await service.validateBHYTNumber('HN-1-99-2024-12345-67890');

      expect(result.warnings).toContain('Mã nhóm không phổ biến: 99');
    });

    it('should reject invalid year (too old)', async () => {
      const result = await service.validateBHYTNumber('HN-1-01-1999-12345-67890');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Năm không hợp lệ: 1999');
    });

    it('should reject invalid year (too far in future)', async () => {
      const futureYear = new Date().getFullYear() + 2;
      const result = await service.validateBHYTNumber(`HN-1-01-${futureYear}-12345-67890`);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Năm không hợp lệ: ${futureYear}`);
    });

    it('should warn about expired BHYT', async () => {
      const result = await service.validateBHYTNumber('HN-1-01-2020-12345-67890');

      expect(result.warnings).toContain('Thẻ BHYT có thể đã hết hạn (năm 2020)');
    });

    it('should normalize BHYT number (lowercase to uppercase)', async () => {
      const result = await service.validateBHYTNumber('hn-1-01-2024-12345-67890');

      expect(result.isValid).toBe(true);
      expect(result.metadata?.provinceCode).toBe('HN');
    });

    it('should normalize BHYT number (trim spaces)', async () => {
      const result = await service.validateBHYTNumber('  HN-1-01-2024-12345-67890  ');

      expect(result.isValid).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Force an error by passing null (will cause error in regex match)
      const result = await service.validateBHYTNumber(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lỗi khi kiểm tra số BHYT');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validateBHTNNumber', () => {
    it('should validate correct BHTN number', async () => {
      const result = await service.validateBHTNNumber('BHTN-2024-12345678');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.year).toBe('2024');
      expect(result.metadata?.policyNumber).toBe('12345678');
    });

    it('should reject invalid BHTN format', async () => {
      const result = await service.validateBHTNNumber('INVALID-FORMAT');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Số BHTN không đúng định dạng. Định dạng đúng: BHTN-YYYY-NNNNNNNN');
    });

    it('should reject invalid year (too old)', async () => {
      const result = await service.validateBHTNNumber('BHTN-1999-12345678');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Năm không hợp lệ: 1999');
    });

    it('should reject invalid year (too far in future)', async () => {
      const futureYear = new Date().getFullYear() + 2;
      const result = await service.validateBHTNNumber(`BHTN-${futureYear}-12345678`);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Năm không hợp lệ: ${futureYear}`);
    });

    it('should warn about expired BHTN', async () => {
      const result = await service.validateBHTNNumber('BHTN-2020-12345678');

      expect(result.warnings).toContain('Hợp đồng BHTN có thể đã hết hạn (năm 2020)');
    });

    it('should reject invalid policy number (not 8 digits)', async () => {
      const result = await service.validateBHTNNumber('BHTN-2024-123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Số BHTN không đúng định dạng. Định dạng đúng: BHTN-YYYY-NNNNNNNN');
    });

    it('should normalize BHTN number (lowercase to uppercase)', async () => {
      const result = await service.validateBHTNNumber('bhtn-2024-12345678');

      expect(result.isValid).toBe(true);
    });

    it('should normalize BHTN number (trim spaces)', async () => {
      const result = await service.validateBHTNNumber('  BHTN-2024-12345678  ');

      expect(result.isValid).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const result = await service.validateBHTNNumber(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lỗi khi kiểm tra số BHTN');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('checkExpiration', () => {
    it('should detect expired insurance', () => {
      const validFrom = new Date('2020-01-01');
      const validTo = new Date('2021-01-01');

      const result = service.checkExpiration(validFrom, validTo);

      expect(result.isExpired).toBe(true);
      expect(result.isExpiringSoon).toBe(false);
    });

    it('should detect insurance expiring soon (within 30 days)', () => {
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + 15); // 15 days from now

      const result = service.checkExpiration(validFrom, validTo);

      expect(result.isExpired).toBe(false);
      expect(result.isExpiringSoon).toBe(true);
      expect(result.daysUntilExpiration).toBeGreaterThan(0);
      expect(result.daysUntilExpiration).toBeLessThanOrEqual(30);
    });

    it('should detect valid insurance (not expiring soon)', () => {
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + 60); // 60 days from now

      const result = service.checkExpiration(validFrom, validTo);

      expect(result.isExpired).toBe(false);
      expect(result.isExpiringSoon).toBe(false);
      expect(result.daysUntilExpiration).toBeGreaterThan(30);
    });

    it('should calculate correct days until expiration', () => {
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + 10); // 10 days from now

      const result = service.checkExpiration(validFrom, validTo);

      expect(result.daysUntilExpiration).toBe(10);
    });
  });

  describe('validateInsurance', () => {
    it('should validate BHYT insurance', async () => {
      const result = await service.validateInsurance(
        'BHYT',
        'HN-1-01-2024-12345-67890',
        new Date('2024-01-01'),
        new Date('2025-12-31')
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate BHTN insurance', async () => {
      const result = await service.validateInsurance(
        'BHTN',
        'BHTN-2024-12345678',
        new Date('2024-01-01'),
        new Date('2025-12-31')
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate private insurance by dates only', async () => {
      const result = await service.validateInsurance(
        'PRIVATE',
        'PRIVATE-12345',
        new Date('2024-01-01'),
        new Date('2025-12-31')
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject private insurance with invalid dates', async () => {
      const result = await service.validateInsurance(
        'PRIVATE',
        'PRIVATE-12345',
        new Date('2025-01-01'),
        new Date('2024-01-01') // validTo before validFrom
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ngày bắt đầu phải trước ngày kết thúc');
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = service.getStatus();

      expect(status.serviceName).toBe('InsuranceValidationService');
      expect(status.supportedTypes).toEqual(['BHYT', 'BHTN']);
      expect(status.provinceCodes).toBeGreaterThan(0);
      expect(status.isHealthy).toBe(true);
      expect(status.timestamp).toBeDefined();
    });
  });
});

