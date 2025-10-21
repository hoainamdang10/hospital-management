/**
 * GetConsentsUseCase Unit Tests
 */

import { GetConsentsUseCase } from '../../../../src/application/use-cases/GetConsentsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PatientConsent } from '../../../../src/domain/entities/PatientConsent';
import { ILogger } from '@shared/application/services/logger.interface';

describe('GetConsentsUseCase', () => {
  let useCase: GetConsentsUseCase;
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

    useCase = new GetConsentsUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get all consents successfully', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const consent1 = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        new Date('2025-12-31'),
        'Treatment consent'
      );
      const consent2 = PatientConsent.grant(
        patientId,
        'data_sharing',
        'witness-456',
        undefined,
        'Data sharing consent'
      );

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [consent1, consent2]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.consents).toHaveLength(2);
      expect(result.data!.totalCount).toBe(2);
      expect(result.data!.consents[0].consentType).toBe('treatment');
      expect(result.data!.consents[1].consentType).toBe('data_sharing');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when patient has no consents', async () => {
      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => []
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.consents).toHaveLength(0);
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
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi lấy danh sách đồng ý');
      expect(result.errors).toBeDefined();
    });

    it('should include consent metadata in response', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const expiresAt = new Date('2025-12-31');
      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        expiresAt,
        'Treatment consent'
      );

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [consent]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.data!.consents[0]).toHaveProperty('id');
      expect(result.data!.consents[0]).toHaveProperty('consentType');
      expect(result.data!.consents[0]).toHaveProperty('isActive');
      expect(result.data!.consents[0]).toHaveProperty('grantedAt');
      expect(result.data!.consents[0]).toHaveProperty('expiresAt');
      expect(result.data!.consents[0]).toHaveProperty('witnessId');
      expect(result.data!.consents[0]).toHaveProperty('notes');
      expect(result.data!.consents[0]).toHaveProperty('isExpired');
      expect(result.data!.consents[0]).toHaveProperty('isValid');
      expect(result.data!.consents[0]).toHaveProperty('daysUntilExpiry');
    });
  });
});

