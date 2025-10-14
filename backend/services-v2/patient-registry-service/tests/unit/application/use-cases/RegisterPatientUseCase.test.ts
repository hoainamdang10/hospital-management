import { RegisterPatientUseCase } from '../../../../src/application/use-cases/RegisterPatientUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';

describe('RegisterPatientUseCase', () => {
  let useCase: RegisterPatientUseCase;
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

    useCase = new RegisterPatientUseCase(
      mockRepository,
      mockEventBus,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should register patient successfully with valid data', async () => {
      const request = {
        userId: 'user-123',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contactInfo: {
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          preferredContactMethod: 'phone' as 'phone' | 'email' | 'sms',
          address: {
            street: '123 Đường ABC',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            city: 'TP.HCM',
            province: 'Hồ Chí Minh',
            country: 'Vietnam'
          }
        },
        emergencyContacts: [],
        requestedBy: 'admin-123'
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByNationalId.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.patientId).toBeDefined();
      expect(result.message).toBe('Đăng ký bệnh nhân thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting patient registration',
        expect.any(Object)
      );
    });

    it('should fail when userId already exists', async () => {
      const request = {
        userId: 'user-123',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contactInfo: {
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          preferredContactMethod: 'phone' as 'phone' | 'email' | 'sms',
          address: {
            street: '123 Đường ABC',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            city: 'TP.HCM',
            province: 'Hồ Chí Minh',
            country: 'Vietnam'
          }
        },
        emergencyContacts: [],
        requestedBy: 'admin-123'
      };

      const existingPatient = {} as Patient;
      mockRepository.findByUserId.mockResolvedValue(existingPatient);

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('USER_ALREADY_HAS_PATIENT_PROFILE');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle event publishing failure gracefully', async () => {
      const request = {
        userId: 'user-123',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contactInfo: {
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          preferredContactMethod: 'phone' as 'phone' | 'email' | 'sms',
          address: {
            street: '123 Đường ABC',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            city: 'TP.HCM',
            province: 'Hồ Chí Minh',
            country: 'Vietnam'
          }
        },
        emergencyContacts: [],
        requestedBy: 'admin-123'
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByNationalId.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockRejectedValue(new Error('Event bus error'));

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Event publishing failed'),
        expect.any(Object)
      );
    });

    it('should log HIPAA audit after successful registration', async () => {
      const request = {
        userId: 'user-123',
        personalInfo: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          gender: 'male' as 'male' | 'female' | 'other',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contactInfo: {
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          preferredContactMethod: 'phone' as 'phone' | 'email' | 'sms',
          address: {
            street: '123 Đường ABC',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            city: 'TP.HCM',
            province: 'Hồ Chí Minh',
            country: 'Vietnam'
          }
        },
        emergencyContacts: [],
        requestedBy: 'admin-123'
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByNationalId.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting patient registration',
        expect.objectContaining({
          userId: 'user-123',
          requestedBy: 'admin-123'
        })
      );
    });
  });
});

