/**
 * MergePatientsUseCase Tests
 * Patient Registry Service - Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { MergePatientsUseCase } from '../../../../src/application/use-cases/MergePatientsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('MergePatientsUseCase', () => {
  let useCase: MergePatientsUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;

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

    useCase = new MergePatientsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should merge patients successfully', async () => {
      const personalInfo1 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo1 = ContactInfo.create({
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

      const basicMedicalInfo1 = BasicMedicalInfo.createEmpty();

      const masterPatient = Patient.register(
        'user-123',
        personalInfo1,
        contactInfo1,
        basicMedicalInfo1,
        undefined,
        [],
        'admin-123'
      );

      const personalInfo2 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo2 = ContactInfo.create({
        primaryPhone: '0909999999',
        email: 'test2@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '456 Đường XYZ',
          ward: 'Phường Đa Kao',
          district: 'Quận 1',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo2 = BasicMedicalInfo.createEmpty();

      const duplicatePatient = Patient.register(
        'user-456',
        personalInfo2,
        contactInfo2,
        basicMedicalInfo2,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockImplementation(async (id) => {
        if (id.toString() === masterPatient.getPatientId()) {
          return masterPatient;
        }
        if (id.toString() === duplicatePatient.getPatientId()) {
          return duplicatePatient;
        }
        return null;
      });

      mockRepository.save.mockResolvedValue();

      const request = {
        masterPatientId: masterPatient.getPatientId() || '',
        duplicatePatientId: duplicatePatient.getPatientId() || '',
        reason: 'Duplicate patient records',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã merge bệnh nhân thành công');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail when trying to merge same patient', async () => {
      const request = {
        masterPatientId: 'PAT-202501-001',
        duplicatePatientId: 'PAT-202501-001',
        reason: 'Duplicate patient records',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể merge bệnh nhân với chính nó');
      expect(result.errors).toContain('SAME_PATIENT');
    });

    it('should fail when source patient not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      const request = {
        duplicatePatientId: 'PAT-202501-001',
        masterPatientId: 'PAT-202501-002',
        reason: 'Duplicate',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('DUPLICATE_PATIENT_NOT_FOUND');
    });

    it('should fail when target patient not found', async () => {
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

      const sourcePatient = Patient.register(
        'user-123',
        personalInfo,
        contactInfo,
        basicMedicalInfo,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValueOnce(sourcePatient);
      mockRepository.findById.mockResolvedValueOnce(null);

      const request = {
        duplicatePatientId: sourcePatient.getPatientId() || '',
        masterPatientId: 'PAT-202501-002',
        reason: 'Duplicate',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('MASTER_PATIENT_NOT_FOUND');
    });

    it('should handle repository save failure', async () => {
      const personalInfo1 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo1 = ContactInfo.create({
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

      const basicMedicalInfo1 = BasicMedicalInfo.createEmpty();

      const sourcePatient = Patient.register(
        'user-123',
        personalInfo1,
        contactInfo1,
        basicMedicalInfo1,
        undefined,
        [],
        'admin-123'
      );

      const personalInfo2 = PersonalInfo.create({
        fullName: 'Nguyễn Văn B',
        dateOfBirth: new Date('1990-01-02'),
        gender: 'male',
        nationalId: '001234567891',
        nationality: 'Vietnamese'
      });

      const contactInfo2 = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'test2@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '456 Đường XYZ',
          ward: 'Phường 2',
          district: 'Quận 2',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo2 = BasicMedicalInfo.createEmpty();

      const targetPatient = Patient.register(
        'user-456',
        personalInfo2,
        contactInfo2,
        basicMedicalInfo2,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockResolvedValueOnce(sourcePatient);
      mockRepository.findById.mockResolvedValueOnce(targetPatient);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      const request = {
        duplicatePatientId: sourcePatient.getPatientId() || '',
        masterPatientId: targetPatient.getPatientId() || '',
        reason: 'Duplicate',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('MERGE_FAILED');
    });

    it('should fail when source patient is already merged', async () => {
      const personalInfo1 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo1 = ContactInfo.create({
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

      const basicMedicalInfo1 = BasicMedicalInfo.createEmpty();

      const sourcePatient = Patient.register(
        'user-123',
        personalInfo1,
        contactInfo1,
        basicMedicalInfo1,
        undefined,
        [],
        'admin-123'
      );

      const personalInfo2 = PersonalInfo.create({
        fullName: 'Nguyễn Văn B',
        dateOfBirth: new Date('1990-01-02'),
        gender: 'male',
        nationalId: '001234567891',
        nationality: 'Vietnamese'
      });

      const contactInfo2 = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'test2@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '456 Đường XYZ',
          ward: 'Phường 2',
          district: 'Quận 2',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo2 = BasicMedicalInfo.createEmpty();

      const targetPatient = Patient.register(
        'user-456',
        personalInfo2,
        contactInfo2,
        basicMedicalInfo2,
        undefined,
        [],
        'admin-123'
      );

      // Merge source patient first
      const anotherPatientId = require('../../../../src/domain/value-objects/PatientId').PatientId.generate();
      sourcePatient.mergeInto(anotherPatientId, 'Already merged', 'admin-123');

      mockRepository.findById.mockResolvedValueOnce(sourcePatient);
      mockRepository.findById.mockResolvedValueOnce(targetPatient);

      const request = {
        duplicatePatientId: sourcePatient.getPatientId() || '',
        masterPatientId: targetPatient.getPatientId() || '',
        reason: 'Duplicate',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('SOURCE_ALREADY_MERGED');
    });

    it('should fail when source patient is deceased', async () => {
      const personalInfo1 = PersonalInfo.create({
        fullName: 'Nguyễn Văn A',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '001234567890',
        nationality: 'Vietnamese'
      });

      const contactInfo1 = ContactInfo.create({
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

      const basicMedicalInfo1 = BasicMedicalInfo.createEmpty();

      const sourcePatient = Patient.register(
        'user-123',
        personalInfo1,
        contactInfo1,
        basicMedicalInfo1,
        undefined,
        [],
        'admin-123'
      );

      const personalInfo2 = PersonalInfo.create({
        fullName: 'Nguyễn Văn B',
        dateOfBirth: new Date('1990-01-02'),
        gender: 'male',
        nationalId: '001234567891',
        nationality: 'Vietnamese'
      });

      const contactInfo2 = ContactInfo.create({
        primaryPhone: '0987654321',
        email: 'test2@example.com',
        preferredContactMethod: 'phone',
        address: {
          street: '456 Đường XYZ',
          ward: 'Phường 2',
          district: 'Quận 2',
          city: 'TP.HCM',
          province: 'Hồ Chí Minh',
          country: 'Vietnam'
        }
      });

      const basicMedicalInfo2 = BasicMedicalInfo.createEmpty();

      const targetPatient = Patient.register(
        'user-456',
        personalInfo2,
        contactInfo2,
        basicMedicalInfo2,
        undefined,
        [],
        'admin-123'
      );

      // Mark source patient as deceased
      sourcePatient.markAsDeceased('admin-123');

      mockRepository.findById.mockResolvedValueOnce(sourcePatient);
      mockRepository.findById.mockResolvedValueOnce(targetPatient);

      const request = {
        duplicatePatientId: sourcePatient.getPatientId() || '',
        masterPatientId: targetPatient.getPatientId() || '',
        reason: 'Duplicate',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('SOURCE_DECEASED');
    });
  });
});

