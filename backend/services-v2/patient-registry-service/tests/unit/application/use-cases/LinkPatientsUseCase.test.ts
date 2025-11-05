/**
 * LinkPatientsUseCase Tests
 * Patient Registry Service - Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { LinkPatientsUseCase } from '../../../../src/application/use-cases/LinkPatientsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('LinkPatientsUseCase', () => {
  let useCase: LinkPatientsUseCase;
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

    useCase = new LinkPatientsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should link patients successfully', async () => {
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

      const patient1 = Patient.register(
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
        dateOfBirth: new Date('1985-05-15'),
        gender: 'male',
        nationalId: '009876543210',
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

      const patient2 = Patient.register(
        'user-456',
        personalInfo2,
        contactInfo2,
        basicMedicalInfo2,
        undefined,
        [],
        'admin-123'
      );

      mockRepository.findById.mockImplementation(async (id) => {
        if (id.toString() === patient1.getPatientId()) {
          return patient1;
        }
        if (id.toString() === patient2.getPatientId()) {
          return patient2;
        }
        return null;
      });

      mockRepository.save.mockResolvedValue();

      const request = {
        patientId: patient1.getPatientId() || '',
        otherPatientId: patient2.getPatientId() || '',
        linkType: 'refer' as 'refer' | 'seealso',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đã link bệnh nhân thành công');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail when trying to link same patient', async () => {
      const request = {
        patientId: 'PAT-202501-001',
        otherPatientId: 'PAT-202501-001',
        linkType: 'refer' as 'refer' | 'seealso',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể link bệnh nhân với chính nó');
      expect(result.errors).toContain('SAME_PATIENT');
    });
  });
});

