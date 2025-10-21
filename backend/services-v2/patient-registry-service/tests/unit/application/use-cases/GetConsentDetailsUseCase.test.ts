/**
 * GetConsentDetailsUseCase Unit Tests
 */

import { GetConsentDetailsUseCase } from '../../../../src/application/use-cases/GetConsentDetailsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PatientConsent } from '../../../../src/domain/entities/PatientConsent';
import { ILogger } from '@shared/application/services/logger.interface';

describe('GetConsentDetailsUseCase', () => {
  let useCase: GetConsentDetailsUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      searchPatients: jest.fn(),
      delete: jest.fn(),
      findWithFilters: jest.fn(),
      matchPatients: jest.fn(),
      getHealthStatus: jest.fn(),
      getStatistics: jest.fn()
    } as jest.Mocked<IPatientRepository>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as jest.Mocked<ILogger>;

    useCase = new GetConsentDetailsUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get consent details successfully', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        new Date('2025-12-31'),
        'Treatment consent'
      );

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [consent]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        consentId: consent.getId(),
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(consent.getId());
      expect(result.data!.consentType).toBe('treatment');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should fail when patient ID is empty', async () => {
      const command = {
        patientId: '',
        consentId: 'consent-123',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Patient ID không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when consent ID is empty', async () => {
      const command = {
        patientId: 'PAT-202501-001',
        consentId: '',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Consent ID không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-999',
        consentId: 'consent-123',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy bệnh nhân');
    });

    it('should fail when consent not found', async () => {
      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => []
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        consentId: 'non-existent-consent',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy đồng ý');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-001',
        consentId: 'consent-123',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi lấy chi tiết đồng ý');
      expect(result.errors).toBeDefined();
    });
  });
});

