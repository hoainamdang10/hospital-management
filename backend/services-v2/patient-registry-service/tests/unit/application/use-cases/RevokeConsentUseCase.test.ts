/**
 * RevokeConsentUseCase Unit Tests
 */

import { RevokeConsentUseCase } from '../../../../src/application/use-cases/RevokeConsentUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PatientConsent } from '../../../../src/domain/entities/PatientConsent';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';

describe('RevokeConsentUseCase', () => {
  let useCase: RevokeConsentUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
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

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<IEventBus>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as jest.Mocked<ILogger>;

    useCase = new RevokeConsentUseCase(mockRepository, mockEventBus, mockLogger);
  });

  describe('execute', () => {
    it('should revoke consent successfully', async () => {
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
        getConsents: () => [consent],
        getUncommittedEvents: () => [],
        markEventsAsCommitted: jest.fn()
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue();

      const command = {
        patientId: 'PAT-202501-001',
        consentId: consent.getId(),
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Thu hồi đồng ý thành công');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(consent.isActive).toBe(false);
    });

    it('should fail when patient ID is empty', async () => {
      const command = {
        patientId: '',
        consentId: 'consent-123',
        performedBy: 'admin-123'
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
        performedBy: 'admin-123'
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
        performedBy: 'admin-123'
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
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy đồng ý');
    });

    it('should fail when consent already withdrawn', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const consent = PatientConsent.grant(
        patientId,
        'treatment',
        'witness-123',
        new Date('2025-12-31'),
        'Treatment consent'
      );
      consent.withdraw();

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getConsents: () => [consent]
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const command = {
        patientId: 'PAT-202501-001',
        consentId: consent.getId(),
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Đồng ý đã được thu hồi trước đó');
    });

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const command = {
        patientId: 'PAT-202501-001',
        consentId: 'consent-123',
        performedBy: 'admin-123'
      };

      const result = await useCase.execute(command);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Lỗi khi thu hồi đồng ý');
      expect(result.errors).toBeDefined();
    });
  });
});

