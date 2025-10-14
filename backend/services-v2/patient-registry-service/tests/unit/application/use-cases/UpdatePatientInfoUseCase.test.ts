/**
 * UpdatePatientInfoUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { UpdatePatientInfoUseCase } from '../../../../src/application/use-cases/UpdatePatientInfoUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';

describe('UpdatePatientInfoUseCase', () => {
  let useCase: UpdatePatientInfoUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      search: jest.fn(),
      findDuplicates: jest.fn(),
      delete: jest.fn()
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

    useCase = new UpdatePatientInfoUseCase(
      mockRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should update patient personal info successfully', async () => {
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
        personalInfo: {
          fullName: 'Nguyễn Văn B Updated',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        updatedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cập nhật thông tin bệnh nhân thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting patient info update',
        expect.any(Object)
      );
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const request = {
        patientId: 'PAT-202501-001',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        updatedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy bệnh nhân');
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when patient is inactive', async () => {
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

      existingPatient.deactivate('Test deactivation', 'admin-123');

      mockRepository.findById.mockResolvedValue(existingPatient);

      const request = {
        patientId: existingPatient.getPatientId() || '',
        personalInfo: {
          fullName: 'Nguyễn Văn B Updated',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        updatedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể cập nhật bệnh nhân không hoạt động');
      expect(result.errors).toContain('PATIENT_NOT_ACTIVE');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should update contact info successfully', async () => {
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
        contactInfo: {
          primaryPhone: '0909999999',
          email: 'newemail@example.com',
          preferredContactMethod: 'email' as 'phone' | 'email' | 'sms',
          address: {
            street: '456 Đường XYZ',
            ward: 'Phường Đa Kao',
            district: 'Quận 1',
            city: 'TP.HCM',
            province: 'Hồ Chí Minh',
            country: 'Vietnam'
          }
        },
        updatedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
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
        personalInfo: {
          fullName: 'Nguyễn Văn B Updated',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        updatedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});

