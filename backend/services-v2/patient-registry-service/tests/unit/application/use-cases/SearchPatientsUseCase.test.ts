/**
 * SearchPatientsUseCase Tests
 * Patient Registry Service - Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SearchPatientsUseCase } from '../../../../src/application/use-cases/SearchPatientsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('SearchPatientsUseCase', () => {
  let useCase: SearchPatientsUseCase;
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
      getHealthStatus: jest.fn()
    } as any;

    useCase = new SearchPatientsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should search patients by name successfully', async () => {
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

      mockRepository.searchPatients.mockResolvedValue({
        patients: [patient],
        total: 1
      });

      const request = {
        searchTerm: 'Nguyễn Văn A',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.patients).toHaveLength(1);
      expect(result.data?.pagination.total).toBe(1);
    });

    it('should return empty results when no patients found', async () => {
      mockRepository.searchPatients.mockResolvedValue({
        patients: [],
        total: 0
      });

      const request = {
        searchTerm: 'NonExistentPatient',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.patients).toHaveLength(0);
      expect(result.data?.pagination.total).toBe(0);
    });

    it('should fail when search term is too short', async () => {
      const request = {
        searchTerm: 'A',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ít nhất 2 ký tự');
      expect(result.errors).toContain('INVALID_SEARCH_TERM');
    });

    it('should handle pagination correctly', async () => {
      const mockPatients = Array(10).fill(null).map((_, i) => {
        const personalInfo = PersonalInfo.create({
          fullName: `Test Patient ${i}`,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          nationalId: `00123456789${i}`,
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

        return Patient.register(
          `user-${i}`,
          personalInfo,
          contactInfo,
          basicMedicalInfo,
          undefined,
          [],
          'admin-123'
        );
      });

      mockRepository.searchPatients.mockResolvedValue({
        patients: mockPatients,
        total: 50
      });

      const request = {
        searchTerm: 'Test',
        pagination: {
          page: 2,
          limit: 10
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.pagination.page).toBe(2);
      expect(result.data?.pagination.limit).toBe(10);
      expect(result.data?.pagination.total).toBe(10);
    });

    it('should handle repository errors', async () => {
      mockRepository.searchPatients.mockRejectedValue(new Error('Database error'));

      const request = {
        searchTerm: 'Test',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Tìm kiếm bệnh nhân thất bại');
    });
  });
});

