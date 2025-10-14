/**
 * ValidateInsuranceUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValidateInsuranceUseCase } from '../../../../src/application/use-cases/ValidateInsuranceUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IInsuranceValidationService } from '../../../../src/application/services/IInsuranceValidationService';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { InsuranceInfo } from '../../../../src/domain/entities/InsuranceInfo';

describe('ValidateInsuranceUseCase', () => {
  let useCase: ValidateInsuranceUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockInsuranceService: jest.Mocked<IInsuranceValidationService>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      searchPatients: jest.fn(),
      matchPatients: jest.fn(),
      findWithFilters: jest.fn(),
      delete: jest.fn(),
      getHealthStatus: jest.fn()
    } as any;

    mockInsuranceService = {
      validateInsurance: jest.fn(),
      checkExpiration: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    useCase = new ValidateInsuranceUseCase(mockRepository, mockInsuranceService, mockLogger);
  });

  describe('execute', () => {
    it('should validate insurance successfully', async () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo = ContactInfo.create({
        primaryPhone: '0901234567',
        email: 'test@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '123 Đường ABC',
          ward: 'Phường Bến Nghé',
          district: 'Quận 1',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo = BasicMedicalInfo.createEmpty();

      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHYT',
        policyNumber: 'BHYT123456',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'BHYT',
        isVietnameseInsurance: true,
        bhytNumber: 'BHYT123456',
        isPrimary: true,
        isActive: true
      });

      const patient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        insuranceInfo,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValue(patient);
      mockInsuranceService.validateInsurance.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });
      mockInsuranceService.checkExpiration.mockReturnValue({
        isExpired: false,
        isExpiringSoon: false,
        daysUntilExpiration: 365
      });

      const request = {
        patientId: patient.getPatientId() || '',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Bảo hiểm hợp lệ');
      expect(result.data?.hasInsurance).toBe(true);
      expect(result.data?.validationResult.isValid).toBe(true);
    });

    it('should return success when patient has no insurance', async () => {
      const personalInfo = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo = ContactInfo.create({
        primaryPhone: '0901234567',
        email: 'test@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '123 Đường ABC',
          ward: 'Phường Bến Nghé',
          district: 'Quận 1',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo = BasicMedicalInfo.createEmpty();

      const patient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValue(patient);

      const request = {
        patientId: patient.getPatientId() || '',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Bệnh nhân không có bảo hiểm');
      expect(result.data?.hasInsurance).toBe(false);
      expect(result.data?.validationResult.isValid).toBe(false);
      expect(result.data?.validationResult.reasons).toContain('NO_INSURANCE');
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy bệnh nhân');
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
    });
  });
});

