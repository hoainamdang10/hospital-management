/**
 * AddEmergencyContactUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AddEmergencyContactUseCase } from '../../../../src/application/use-cases/AddEmergencyContactUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('AddEmergencyContactUseCase', () => {
  let useCase: AddEmergencyContactUseCase;
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
      searchPatients: jest.fn(),
      matchPatients: jest.fn(),
      findWithFilters: jest.fn(),
      delete: jest.fn(),
      getHealthStatus: jest.fn()
    } as any;

    mockEventBus = {
      publish: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    useCase = new AddEmergencyContactUseCase(mockRepository, mockEventBus, mockLogger);
  });

  describe('execute', () => {
    it('should add emergency contact successfully', async () => {
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
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const command = {
        patientId: patient.getPatientId() || '',
        name: 'Nguyễn Thị B',
        relationship: 'Vợ',
        primaryPhone: '0909999999',
        email: 'emergency@example.com',
        isPrimary: true,
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã thêm người liên hệ khẩn cấp thành công');
      expect(result.contactId).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-001',
        name: 'Nguyễn Thị B',
        relationship: 'Vợ',
        primaryPhone: '0909999999',
        performedBy: 'admin-123'
      };

      await expect(useCase.execute(command)).rejects.toThrow('Không tìm thấy bệnh nhân với ID: PAT-202501-001');
    });

    it('should throw error when name is empty', async () => {
      const command = {
        patientId: 'PAT-202501-001',
        name: '',
        relationship: 'Vợ',
        primaryPhone: '0909999999',
        performedBy: 'admin-123'
      };

      await expect(useCase.execute(command)).rejects.toThrow('Tên người liên hệ không được để trống');
    });

    it('should throw error when relationship is empty', async () => {
      const command = {
        patientId: 'PAT-202501-001',
        name: 'Nguyễn Thị B',
        relationship: '',
        primaryPhone: '0909999999',
        performedBy: 'admin-123'
      };

      await expect(useCase.execute(command)).rejects.toThrow('Mối quan hệ không được để trống');
    });

    it('should throw error when primary phone is empty', async () => {
      const command = {
        patientId: 'PAT-202501-001',
        name: 'Nguyễn Thị B',
        relationship: 'Vợ',
        primaryPhone: '',
        performedBy: 'admin-123'
      };

      await expect(useCase.execute(command)).rejects.toThrow('Số điện thoại không được để trống');
    });
  });
});

