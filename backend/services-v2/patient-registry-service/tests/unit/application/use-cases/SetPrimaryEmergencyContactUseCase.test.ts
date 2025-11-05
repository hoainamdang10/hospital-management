/**
 * SetPrimaryEmergencyContactUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SetPrimaryEmergencyContactUseCase } from '../../../../src/application/use-cases/SetPrimaryEmergencyContactUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { EmergencyContact } from '../../../../src/domain/entities/EmergencyContact';

describe('SetPrimaryEmergencyContactUseCase', () => {
  let useCase: SetPrimaryEmergencyContactUseCase;
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
      getHealthStatus: jest.fn(),

      getStatistics: jest.fn(),

      getPatientHistory: jest.fn()
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

    useCase = new SetPrimaryEmergencyContactUseCase(mockRepository, mockEventBus, mockLogger);
  });

  describe('execute', () => {
    it('should set primary emergency contact successfully', async () => {
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

      const contact1 = EmergencyContact.create(
        'Nguyễn Thị B',
        'Vợ',
        '0909999999',
        undefined,
        'contact1@example.com',
        undefined,
        true
      );

      const contact2 = EmergencyContact.create(
        'Nguyễn Văn C',
        'Con',
        '0908888888',
        undefined,
        'contact2@example.com',
        undefined,
        false
      );

      patient.addEmergencyContact(contact1, 'admin-123');
      patient.addEmergencyContact(contact2, 'admin-123');

      mockRepository.findById.mockResolvedValue(patient);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const command = {
        patientId: patient.getPatientId() || '',
        contactId: contact2.getId(),
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should fail when patient ID is empty', async () => {
      const command = {
        patientId: '',
        contactId: 'contact-123',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Patient ID không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when contact ID is empty', async () => {
      const command = {
        patientId: 'patient-123',
        contactId: '',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Contact ID không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-999',
        contactId: 'contact-123',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy bệnh nhân');
    });

    it('should fail when contact not found', async () => {
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

      const command = {
        patientId: patient.getPatientId() || '',
        contactId: 'non-existent-contact',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy người liên hệ khẩn cấp');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-001',
        contactId: 'contact-123',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi đặt người liên hệ khẩn cấp chính');
      expect(result.errors).toBeDefined();
    });
  });
});

