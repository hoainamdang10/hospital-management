/**
 * MatchPatientsUseCase Tests
 * Patient Registry Service - Unit Tests
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { MatchPatientsUseCase } from '../../../../src/application/use-cases/MatchPatientsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IPatientMatchingService } from '../../../../src/application/services/IPatientMatchingService';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';

describe('MatchPatientsUseCase', () => {
  let useCase: MatchPatientsUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockMatchingService: jest.Mocked<IPatientMatchingService>;
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

    mockMatchingService = {
      matchPatients: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    useCase = new MatchPatientsUseCase(mockRepository, mockMatchingService, mockLogger);
  });

  describe('execute', () => {
    it('should find matching patients successfully', async () => {
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

      mockRepository.matchPatients.mockResolvedValue([
        {
          patient: patient,
          matchGrade: 'certain' as 'certain' | 'probable' | 'possible' | 'certainly-not',
          score: 95
        }
      ]);

      const request = {
        criteria: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01',
          nationalId: '001234567890'
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.matches).toBeDefined();
      expect(result.data?.matches.length).toBeGreaterThan(0);
    });

    it('should return empty matches when no duplicates found', async () => {
      mockRepository.matchPatients.mockResolvedValue([]);

      const request = {
        criteria: {
          fullName: 'NonExistent Patient'
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.matches).toHaveLength(0);
    });

    it('should fail when insufficient criteria provided', async () => {
      const request = {
        criteria: {},
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('INSUFFICIENT_CRITERIA');
    });

    it('should handle repository error gracefully', async () => {
      mockRepository.matchPatients.mockRejectedValue(new Error('Database error'));

      const request = {
        criteria: {
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1990-01-01'
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('MATCH_FAILED');
    });

    it('should match with only national ID', async () => {
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

      mockRepository.matchPatients.mockResolvedValue([
        {
          patient: patient,
          matchGrade: 'certain' as 'certain' | 'probable' | 'possible' | 'certainly-not',
          score: 100
        }
      ]);

      const request = {
        criteria: {
          nationalId: '001234567890'
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.matches).toHaveLength(1);
    });

    it('should match with only phone number', async () => {
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

      mockRepository.matchPatients.mockResolvedValue([
        {
          patient: patient,
          matchGrade: 'probable' as 'certain' | 'probable' | 'possible' | 'certainly-not',
          score: 75
        }
      ]);

      const request = {
        criteria: {
          primaryPhone: '0901234567'
        },
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.matches).toHaveLength(1);
    });

    it('should filter only certain matches when requested', async () => {
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

      mockRepository.matchPatients.mockResolvedValue([
        {
          patient: patient,
          matchGrade: 'certain' as 'certain' | 'probable' | 'possible' | 'certainly-not',
          score: 95
        }
      ]);

      const request = {
        criteria: {
          fullName: 'Nguyễn Văn A',
          nationalId: '001234567890'
        },
        onlyCertainMatches: true,
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.matches).toHaveLength(1);
      expect(mockRepository.matchPatients).toHaveBeenCalledWith(
        expect.any(Object),
        true,
        expect.any(Number)
      );
    });
  });
});

