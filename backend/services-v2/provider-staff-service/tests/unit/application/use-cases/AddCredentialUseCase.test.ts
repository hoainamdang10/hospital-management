/**
 * AddCredentialUseCase Tests
 * Provider/Staff Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AddCredentialUseCase, AddCredentialRequest } from '../../../../src/application/use-cases/AddCredentialUseCase';
import { IProviderStaffRepository } from '../../../../src/domain/repositories/IProviderStaffRepository';
import { IEventBus } from '../../../../src/application/interfaces/IEventBus';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { ProviderStaff } from '../../../../src/domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../../../src/domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../../../src/domain/value-objects/WorkSchedule';
import { Credential } from '../../../../src/domain/entities/Credential';

describe('AddCredentialUseCase', () => {
  let useCase: AddCredentialUseCase;
  let mockStaffRepository: jest.Mocked<IProviderStaffRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;
  let existingStaff: ProviderStaff;

  const validPersonalInfo = PersonalInfo.create({
    fullName: 'Bác sĩ Nguyễn Văn Test',
    dateOfBirth: new Date('1985-01-15'),
    gender: 'male',
    nationalId: '001234567890',
    nationality: 'Vietnamese',
    phoneNumber: '0901234567',
    email: 'doctor@hospital.vn',
    address: {
      street: '123 Test Street',
      ward: 'Ward 1',
      district: 'District 1',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      country: 'Vietnam'
    }
  });

  const validProfessionalInfo = ProfessionalInfo.create({
    title: 'Bác sĩ',
    department: 'Cardiology',
    position: 'Senior Doctor',
    education: ['MD - Medical University'],
    languages: ['Vietnamese', 'English'],
    bio: 'Experienced cardiologist'
  });

  const validWorkSchedule = WorkSchedule.create({
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    timeZone: 'Asia/Ho_Chi_Minh',
    isFlexible: false
  });

  const validRequest: AddCredentialRequest = {
    staffId: 'STF-202501-001',
    credentialType: 'medical_license',
    licenseNumber: 'BYS-12345',
    issuedBy: 'Bộ Y tế Việt Nam',
    issuedDate: '2020-01-01',
    expiryDate: '2025-12-31',
    specialization: 'Cardiology',
    verificationStatus: 'verified',
    addedBy: 'admin-user-id',
    addedByRole: 'ADMIN'
  };

  beforeEach(() => {
    mockStaffRepository = {
      findById: jest.fn(),
      findByLicenseNumber: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    existingStaff = ProviderStaff.create(
      'user-123',
      'doctor',
      validPersonalInfo,
      validProfessionalInfo,
      validWorkSchedule,
      'BYS-00001',
      'full-time',
      new Date('2020-01-01'),
      15
    );

    useCase = new AddCredentialUseCase(
      mockStaffRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('execute - successful addition', () => {
    it('should add credential with valid data', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockStaffRepository.update).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should add medical license credential', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.credentialType).toBe('medical_license');
      expect(result.data?.licenseNumber).toBe('BYS-12345');
    });

    it('should add certification credential', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const certRequest = {
        ...validRequest,
        credentialType: 'certification' as const,
        licenseNumber: 'CERT-12345'
      };

      const result = await useCase.execute(certRequest);

      expect(result.success).toBe(true);
      expect(result.data?.credentialType).toBe('certification');
    });

    it('should publish CredentialAdded event', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CredentialAdded'
        })
      );
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when staff not found', async () => {
      mockStaffRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Nhân viên không tồn tại');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });

    it('should fail when license number already exists', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue({} as ProviderStaff);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Số giấy phép đã tồn tại');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });

    it('should fail when expiry date is before issued date', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);

      const invalidRequest = {
        ...validRequest,
        issuedDate: '2025-12-31',
        expiryDate: '2020-01-01'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Ngày hết hạn phải sau ngày cấp');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });

    it('should fail when credential is already expired', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);

      const expiredRequest = {
        ...validRequest,
        expiryDate: '2020-01-01'
      };

      const result = await useCase.execute(expiredRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Giấy phép đã hết hạn');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('execute - Vietnamese license validation', () => {
    it('should validate Vietnamese medical license format (BYS-XXXXX)', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.licenseNumber).toMatch(/^BYS-\d{5}$/);
    });

    it('should fail with invalid Vietnamese license format', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);

      const invalidRequest = {
        ...validRequest,
        licenseNumber: 'INVALID-123'
      };

      const result = await useCase.execute(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Định dạng số giấy phép không hợp lệ');
    });

    it('should accept Vietnamese issuing authorities', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const authorities = [
        'Bộ Y tế Việt Nam',
        'Sở Y tế TP.HCM',
        'Sở Y tế Hà Nội'
      ];

      for (const authority of authorities) {
        const request = { ...validRequest, issuedBy: authority };
        const result = await useCase.execute(request);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('execute - authorization', () => {
    it('should allow ADMIN to add credentials', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        addedByRole: 'ADMIN'
      });

      expect(result.success).toBe(true);
    });

    it('should allow SUPER_ADMIN to add credentials', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute({
        ...validRequest,
        addedByRole: 'SUPER_ADMIN'
      });

      expect(result.success).toBe(true);
    });

    it('should fail when non-admin tries to add credentials', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);

      const result = await useCase.execute({
        ...validRequest,
        addedByRole: 'DOCTOR'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không có quyền');
      expect(mockStaffRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('execute - HIPAA audit logging', () => {
    it('should log credential addition for audit', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('HIPAA Audit'),
        expect.objectContaining({
          action: 'CREDENTIAL_ADDED',
          staffId: validRequest.staffId,
          credentialType: validRequest.credentialType,
          addedBy: validRequest.addedBy
        })
      );
    });

    it('should mask license number in logs', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(validRequest);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          licenseNumber: expect.stringContaining('***')
        })
      );
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle event bus errors gracefully', async () => {
      mockStaffRepository.findById.mockResolvedValue(existingStaff);
      mockStaffRepository.findByLicenseNumber.mockResolvedValue(null);
      mockStaffRepository.update.mockResolvedValue(undefined);
      mockEventBus.publish.mockRejectedValue(new Error('Event bus error'));

      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});

