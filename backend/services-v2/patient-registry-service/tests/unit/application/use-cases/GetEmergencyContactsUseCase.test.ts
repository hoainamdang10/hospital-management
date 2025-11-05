/**
 * GetEmergencyContactsUseCase Tests
 * Patient Registry Service - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetEmergencyContactsUseCase } from '../../../../src/application/use-cases/GetEmergencyContactsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { EmergencyContact } from '../../../../src/domain/entities/EmergencyContact';

describe('GetEmergencyContactsUseCase', () => {
  let useCase: GetEmergencyContactsUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
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

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    useCase = new GetEmergencyContactsUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get all emergency contacts successfully', async () => {
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

      // Add emergency contacts
      const contact1 = EmergencyContact.create(
        'Nguyễn Thị B',
        'Vợ',
        '0909999999',
        undefined,
        'emergency1@example.com',
        undefined,
        true
      );

      const contact2 = EmergencyContact.create(
        'Nguyễn Văn C',
        'Con',
        '0908888888',
        undefined,
        'emergency2@example.com',
        undefined,
        false
      );

      patient.addEmergencyContact(contact1, 'admin-123');
      patient.addEmergencyContact(contact2, 'admin-123');

      mockRepository.findById.mockResolvedValue(patient);

      const command = {
        patientId: patient.getPatientId() || '',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.contacts).toHaveLength(2);
      expect(result.data?.totalCount).toBe(2);
      expect(result.data?.contacts[0].name).toBe('Nguyễn Thị B');
      expect(result.data?.contacts[0].isPrimary).toBe(true);
      expect(result.data?.contacts[1].name).toBe('Nguyễn Văn C');
      expect(result.data?.contacts[1].isPrimary).toBe(false);
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when patient has no emergency contacts', async () => {
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
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.contacts).toHaveLength(0);
      expect(result.data?.totalCount).toBe(0);
    });

    it('should fail when patient ID is empty', async () => {
      const command = {
        patientId: '',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Patient ID không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy bệnh nhân');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-002',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi lấy danh sách người liên hệ khẩn cấp');
      expect(result.errors).toBeDefined();
    });
  });
});

