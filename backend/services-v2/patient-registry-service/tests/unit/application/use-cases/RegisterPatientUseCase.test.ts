import { RegisterPatientUseCase } from '../../../../src/application/use-cases/RegisterPatientUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { AuditService } from '../../../../src/infrastructure/audit/AuditService';

describe('RegisterPatientUseCase', () => {
  let useCase: RegisterPatientUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockSupabaseClient: any;

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
      log: jest.fn().mockResolvedValue(undefined),
      getLogsForResource: jest.fn().mockResolvedValue([]),
      getLogsForUser: jest.fn().mockResolvedValue([]),
    } as any;

    // Mock Supabase client for PatientId.generateFromDB()
    mockSupabaseClient = {
      rpc: jest.fn().mockResolvedValue({
        data: 1,
        error: null
      })
    };

    useCase = new RegisterPatientUseCase(
      mockRepository,
      mockEventBus,
      mockLogger,
      mockAuditService,
      mockSupabaseClient
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

    it('should fail when nationalId already exists', async () => {
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
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByNationalId.mockResolvedValue(existingPatient);

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('NATIONAL_ID_ALREADY_EXISTS');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
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
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('REGISTRATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle repository findByUserId failure', async () => {
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

      mockRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('REGISTRATION_FAILED');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should register patient with insurance info', async () => {
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
        insuranceInfo: {
          provider: 'BHYT',
          policyNumber: 'HN-1-01-2024-12345-67890',
          validFrom: '2024-01-01',
          validTo: '2025-12-31',
          coverageType: 'BHYT' as 'BHYT' | 'BHTN' | 'private' | 'self_pay',
          isVietnameseInsurance: true,
          bhytNumber: 'HN-1-01-2024-12345-67890',
          isPrimary: true
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
    });

    it('should register patient with emergency contacts', async () => {
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
        emergencyContacts: [
          {
            name: 'Nguyễn Văn B',
            relationship: 'Vợ/Chồng',
            primaryPhone: '0987654321',
            isPrimary: true
          }
        ],
        requestedBy: 'admin-123'
      };

      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByNationalId.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.patientId).toBeDefined();
    });

    it('should register patient with basic medical info', async () => {
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
        basicMedicalInfo: {
          bloodType: 'A+' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
          knownAllergies: ['Penicillin']
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
    });
  });
});

