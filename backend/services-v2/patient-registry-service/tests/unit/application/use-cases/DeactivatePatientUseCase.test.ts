/**
 * DeactivatePatientUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DeactivatePatientUseCase } from '../../../../src/application/use-cases/DeactivatePatientUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { AuditService } from '../../../../src/infrastructure/audit/AuditService';

describe('DeactivatePatientUseCase', () => {
  let useCase: DeactivatePatientUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      search: jest.fn(),
      findDuplicates: jest.fn(),
      delete: jest.fn(),
      searchPatients: jest.fn(),
      matchPatients: jest.fn(),
      findWithFilters: jest.fn(),
      getHealthStatus: jest.fn(),
      getStatistics: jest.fn(),
      getPatientHistory: jest.fn()
    } as any;

    mockEventBus = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    } as any;

    mockAuditService = {
      logAudit: jest.fn().mockResolvedValue(undefined),
      logPHIAccess: jest.fn().mockResolvedValue(undefined),
      isEventProcessed: jest.fn().mockResolvedValue(false),
    } as any;

    useCase = new DeactivatePatientUseCase(
      mockRepository,
      mockEventBus,
      mockLogger,
      mockAuditService
    );
  });

  describe('execute', () => {
    it('should deactivate patient successfully', async () => {
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

      const existingPatient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValue(existingPatient);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const request = {
        patientId: existingPatient.getPatientId() || '',
        reason: 'Patient requested deactivation',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Vô hiệu hóa bệnh nhân thành công');
      expect(result.data?.patientId).toBe(request.patientId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting patient deactivation',
        expect.any(Object)
      );
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        patientId: 'PAT-202501-001',
        reason: 'Test reason',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy bệnh nhân');
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when patient is already inactive', async () => {
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

      const existingPatient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      existingPatient.deactivate('Already deactivated', 'admin-123');

      mockRepository.findById.mockResolvedValue(existingPatient);

      const request = {
        patientId: existingPatient.getPatientId() || '',
        reason: 'Test reason',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Bệnh nhân đã bị vô hiệu hóa trước đó');
      expect(result.errors).toContain('PATIENT_ALREADY_INACTIVE');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle event publishing failure gracefully', async () => {
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

      const existingPatient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValue(existingPatient);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockRejectedValue(new Error('Event bus error'));

      const request = {
        patientId: existingPatient.getPatientId() || '',
        reason: 'Patient requested deactivation',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should log HIPAA audit after successful deactivation', async () => {
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

      const existingPatient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValue(existingPatient);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const request = {
        patientId: existingPatient.getPatientId() || '',
        reason: 'Patient requested deactivation',
        performedBy: 'admin-123'
      };

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Patient deactivation audited successfully',
        expect.objectContaining({
          patientId: request.patientId
        })
      );
    });
  });
});

