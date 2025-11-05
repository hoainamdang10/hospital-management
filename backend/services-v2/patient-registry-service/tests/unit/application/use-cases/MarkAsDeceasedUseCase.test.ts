/**
 * MarkAsDeceasedUseCase Tests
 * Patient Registry Service - Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { MarkAsDeceasedUseCase } from '../../../../src/application/use-cases/MarkAsDeceasedUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('MarkAsDeceasedUseCase', () => {
  let useCase: MarkAsDeceasedUseCase;
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

    useCase = new MarkAsDeceasedUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should mark patient as deceased successfully', async () => {
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

      const command = {
        patientId: patient.getPatientId() || '',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã đánh dấu bệnh nhân đã qua đời thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-001',
        performedBy: 'admin-123'
      };

      await expect(useCase.execute(command)).rejects.toThrow('Không tìm thấy bệnh nhân với ID: PAT-202501-001');
    });
  });
});

