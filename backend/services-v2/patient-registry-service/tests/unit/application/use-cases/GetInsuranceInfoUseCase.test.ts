/**
 * GetInsuranceInfoUseCase Unit Tests
 */

import { GetInsuranceInfoUseCase } from '../../../../src/application/use-cases/GetInsuranceInfoUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { InsuranceInfo } from '../../../../src/domain/entities/InsuranceInfo';

describe('GetInsuranceInfoUseCase', () => {
  let useCase: GetInsuranceInfoUseCase;
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

    useCase = new GetInsuranceInfoUseCase(mockRepository, mockLogger);
  });

  describe('execute', () => {
    it('should get insurance info successfully', async () => {
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
        getInsuranceInfo: () => insuranceInfo
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.provider).toBe('BHXH Việt Nam');
      expect(result.data!.coverageType).toBe('BHYT');
      expect(mockRepository.findById).toHaveBeenCalledWith(patientId);
    });

    it('should return error when patient ID is empty', async () => {
      const result = await useCase.execute({
        patientId: '',
        requestedBy: 'admin-123'
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
        requestedBy: 'admin-123'
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
        requestedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Bệnh nhân chưa có thông tin bảo hiểm');
      expect(result.errors).toContain('NO_INSURANCE_INFO');
    });

    it('should handle repository errors', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      mockRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi khi lấy thông tin bảo hiểm');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should return correct insurance data structure', async () => {
      const patientId = PatientId.create('PAT-202501-001');
      const insuranceInfo = InsuranceInfo.create({
        provider: 'Bảo Việt',
        policyNumber: 'BV123456',
        groupNumber: 'GRP001',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        coverageType: 'private',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: false
      });

      const mockPatient = {
        getId: () => 'PAT-202501-001',
        getInsuranceInfo: () => insuranceInfo
      } as unknown as Patient;

      mockRepository.findById.mockResolvedValue(mockPatient);

      const result = await useCase.execute({
        patientId: 'PAT-202501-001',
        requestedBy: 'admin-123'
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        provider: 'Bảo Việt',
        policyNumber: 'BV123456',
        groupNumber: 'GRP001',
        coverageType: 'private',
        isActive: true,
        isPrimary: false,
        isVietnameseInsurance: false
      });
    });
  });
});

