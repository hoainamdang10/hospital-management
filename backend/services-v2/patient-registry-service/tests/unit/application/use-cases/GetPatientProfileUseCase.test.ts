import { GetPatientProfileUseCase } from '../../../../src/application/use-cases/GetPatientProfileUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { ILogger } from '@shared/application/services/logger.interface';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';

describe('GetPatientProfileUseCase', () => {
  let useCase: GetPatientProfileUseCase;
  let mockRepository: jest.Mocked<IPatientRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      search: jest.fn(),
      findDuplicates: jest.fn(),
      delete: jest.fn()
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn()
    } as any;

    useCase = new GetPatientProfileUseCase(
      mockRepository,
      mockLogger
    );
  });

  describe('execute', () => {
    it('should retrieve patient profile successfully by patientId', async () => {
      const mockPatient = {
        getPatientId: jest.fn().mockReturnValue('PAT-202401-001'),
        getUserId: jest.fn().mockReturnValue('user-123'),
        getPersonalInfo: jest.fn().mockReturnValue({
          fullName: 'Nguyễn Văn A',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        }),
        getContactInfo: jest.fn().mockReturnValue({
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          address: '123 Đường ABC'
        }),
        getBasicMedicalInfo: jest.fn().mockReturnValue({
          bloodType: 'O',
          allergies: [],
          chronicDiseases: []
        }),
        getInsuranceInfo: jest.fn().mockReturnValue(null),
        getEmergencyContacts: jest.fn().mockReturnValue([]),
        getConsents: jest.fn().mockReturnValue([]),
        getLinks: jest.fn().mockReturnValue([]),
        getStatus: jest.fn().mockReturnValue({ valueOf: () => 'active' }),
        getMergedInto: jest.fn().mockReturnValue(null),
        getProps: jest.fn().mockReturnValue({
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        })
      } as any;

      const request = {
        patientId: 'PAT-202401-001',
        requestedBy: 'admin-123'
      };

      mockRepository.findById.mockResolvedValue(mockPatient);

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      expect(result.data?.patientId).toBe('PAT-202401-001');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retrieving patient profile',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'HIPAA Audit: Patient profile access',
        expect.objectContaining({
          action: 'PATIENT_PROFILE_ACCESS',
          complianceLevel: 'hipaa'
        })
      );
    });

    it('should fail when patient not found', async () => {
      const request = {
        patientId: 'PAT-202401-999',
        requestedBy: 'admin-123'
      };

      mockRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('PATIENT_NOT_FOUND');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Patient profile retrieval failed: patient not found',
        expect.any(Object)
      );
    });

    it('should fail when no identifier provided', async () => {
      const request = {
        requestedBy: 'admin-123'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('MISSING_IDENTIFIER');
    });

    it('should log HIPAA audit for every profile access', async () => {
      const mockPatient = {
        getPatientId: jest.fn().mockReturnValue('PAT-202401-001'),
        getUserId: jest.fn().mockReturnValue('user-123'),
        getPersonalInfo: jest.fn().mockReturnValue({
          fullName: 'Nguyễn Văn A',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        }),
        getContactInfo: jest.fn().mockReturnValue({
          primaryPhone: '0901234567',
          email: 'nguyenvana@example.com',
          address: '123 Đường ABC'
        }),
        getBasicMedicalInfo: jest.fn().mockReturnValue({
          bloodType: 'O',
          allergies: [],
          chronicDiseases: []
        }),
        getInsuranceInfo: jest.fn().mockReturnValue(null),
        getEmergencyContacts: jest.fn().mockReturnValue([]),
        getConsents: jest.fn().mockReturnValue([]),
        getLinks: jest.fn().mockReturnValue([]),
        getStatus: jest.fn().mockReturnValue({ valueOf: () => 'active' }),
        getMergedInto: jest.fn().mockReturnValue(null),
        getProps: jest.fn().mockReturnValue({
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        })
      } as any;

      const request = {
        patientId: 'PAT-202401-001',
        requestedBy: 'doctor-456'
      };

      mockRepository.findById.mockResolvedValue(mockPatient);

      await useCase.execute(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'HIPAA Audit: Patient profile access',
        expect.objectContaining({
          action: 'PATIENT_PROFILE_ACCESS',
          patientId: 'PAT-202401-001',
          requestedBy: 'doctor-456',
          dataAccessed: 'patient_full_profile',
          complianceLevel: 'hipaa'
        })
      );
    });
  });
});

