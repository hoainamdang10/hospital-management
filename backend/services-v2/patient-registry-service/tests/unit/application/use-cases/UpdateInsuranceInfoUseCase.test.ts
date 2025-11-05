/**
 * UpdateInsuranceInfoUseCase Unit Tests
 */

import { UpdateInsuranceInfoUseCase } from '../../../../src/application/use-cases/UpdateInsuranceInfoUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { IEventBus } from '@shared/infrastructure/event-bus/EventBus';
import { ILogger } from '@shared/application/services/logger.interface';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { InsuranceInfo } from '../../../../src/domain/entities/InsuranceInfo';

describe('UpdateInsuranceInfoUseCase', () => {
  let useCase: UpdateInsuranceInfoUseCase;
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
      getStatistics: jest.fn(),

      getPatientHistory: jest.fn()
    } as jest.Mocked<IPatientRepository>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    } as jest.Mocked<IEventBus>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      fatal: jest.fn()
    } as jest.Mocked<ILogger>;

    useCase = new UpdateInsuranceInfoUseCase(mockRepository, mockEventBus, mockLogger);
  });

  describe('execute', () => {
    it('should update insurance info successfully', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHXH Việt Nam',
        policyNumber: 'HS1234567890123',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true,
        bhytNumber: 'HS1234567890123'
      });

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => insuranceInfo,
        getUncommittedEvents: () => [],
        markEventsAsCommitted: jest.fn()
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        provider: 'BHXH Hà Nội',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cập nhật thông tin bảo hiểm thành công');
      expect(mockRepository.save).toHaveBeenCalledWith(mockPatient);
    });

    it('should return error when patient ID is empty', async () => {
      const result = await useCase.execute({
        patientId: '',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Patient ID không được để trống');
      expect(result.errors).toContain('INVALID_PATIENT_ID');
    });

    it('should return error when patient not found', async () => {
      const patientId = PatientId.create('PAT-202501-999');
      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        patientId: 'PAT-202501-999',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy bệnh nhân');
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
    });

    it('should return error when patient has no insurance info', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => undefined
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Bệnh nhân chưa có thông tin bảo hiểm để cập nhật');
      expect(result.errors).toContain('NO_INSURANCE_INFO');
    });

    it('should update provider successfully', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHXH Việt Nam',
        policyNumber: 'HS1234567890123',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true
      });

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => insuranceInfo,
        getUncommittedEvents: () => [],
        markEventsAsCommitted: jest.fn()
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        provider: 'BHXH Hà Nội',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should activate/deactivate insurance', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHXH Việt Nam',
        policyNumber: 'HS1234567890123',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true
      });

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => insuranceInfo,
        getUncommittedEvents: () => [],
        markEventsAsCommitted: jest.fn()
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        isActive: false,
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        performedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi khi cập nhật thông tin bảo hiểm');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should publish domain events after update', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const insuranceInfo = InsuranceInfo.create({
        provider: 'BHXH Việt Nam',
        policyNumber: 'HS1234567890123',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'BHYT',
        isActive: true,
        isPrimary: true,
        isVietnameseInsurance: true
      });

      const mockEvent = { type: 'InsuranceUpdated' };
      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => insuranceInfo,
        getUncommittedEvents: () => [mockEvent],
        markEventsAsCommitted: jest.fn()
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);
      mockRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      await useCase.execute({
        patientId: 'PAT-202501-001',
        provider: 'BHXH Hà Nội',
        performedBy: 'admin-123'
      });

      expect(mockEventBus.publish).toHaveBeenCalledWith(mockEvent);
    });
  });
});

