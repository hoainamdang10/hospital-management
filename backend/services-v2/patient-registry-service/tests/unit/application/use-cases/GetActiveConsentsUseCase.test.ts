/**
 * GetActiveConsentsUseCase Unit Tests
 */

import { GetActiveConsentsUseCase } from '../../../../src/application/use-cases/GetActiveConsentsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PatientConsent } from '../../../../src/domain/entities/PatientConsent';
import { ILogger } from '@shared/application/services/logger.interface';

describe('GetActiveConsentsUseCase', () => {
  let useCase: GetActiveConsentsUseCase;
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
      getStatistics: jest.fn(),
      getPatientHistory: jest.fn()
    } as jest.Mocked<IPatientRepository>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as jest.Mocked<ILogger>;

    useCase = new GetActiveConsentsUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get only active consents', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      
      // Active consent
      const activeConsent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        new Date('2025-12-31'),
        'Active treatment consent'
      );

      // Withdrawn consent
      const withdrawnConsent = PatientConsent.grant(
        patientId,
        'data_sharing',
        'witness-456',
        new Date('2025-12-31'),
        'Withdrawn consent'
      );
      withdrawnConsent.withdraw();

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [activeConsent, withdrawnConsent]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.activeConsents).toHaveLength(1);
      expect(result.data!.totalCount).toBe(1);
      expect(result.data!.activeConsents[0].consentType).toBe('treatment');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no active consents', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const withdrawnConsent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        new Date('2025-12-31'),
        'Withdrawn consent'
      );
      withdrawnConsent.withdraw();

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [withdrawnConsent]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data!.activeConsents).toHaveLength(0);
      expect(result.data!.totalCount).toBe(0);
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

    it('should fail when requested by is empty', async () => {
      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: ''
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Người yêu cầu không được để trống');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should fail when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = {
        patientId: 'PAT-202501-999',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy bệnh nhân');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi lấy danh sách đồng ý đang hoạt động');
      expect(result.errors).toBeDefined();
    });
  });
});

