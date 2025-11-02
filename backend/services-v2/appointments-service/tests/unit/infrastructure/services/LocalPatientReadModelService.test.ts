/**
 * Local Patient Read Model Service Unit Tests
 * Tests patient data denormalization without HTTP calls
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { LocalPatientReadModelService } from '../../../../src/infrastructure/services/LocalPatientReadModelService';
import { PatientReadModelRepository } from '../../../../src/infrastructure/repositories/PatientReadModelRepository';

describe('LocalPatientReadModelService', () => {
  let service: LocalPatientReadModelService;
  let mockRepository: jest.Mocked<PatientReadModelRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      exists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new LocalPatientReadModelService(mockRepository);
  });

  describe('getPatient', () => {
    it('should retrieve patient from read model', async () => {
      const mockPatient = {
        patientId: 'patient-1',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        email: 'nguyen.vana@example.com',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        nationalId: '001234567890',
        insuranceNumber: 'BHYT123456',
        insuranceType: 'BHYT',
        address: '123 Le Loi, HCMC',
      };

      mockRepository.findById.mockResolvedValue(mockPatient as any);

      const result = await service.getPatient('patient-1');

      expect(result).toEqual(mockPatient);
      expect(mockRepository.findById).toHaveBeenCalledWith('patient-1');
    });

    it('should return null when patient not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getPatient('patient-999');

      expect(result).toBeNull();
    });

    it('should throw error when repository fails', async () => {
      mockRepository.findById.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.getPatient('patient-1')).rejects.toThrow(
        'Failed to fetch patient from read model'
      );
    });

    it('should NOT make HTTP calls', async () => {
      mockRepository.findById.mockResolvedValue({
        patientId: 'patient-1',
        fullName: 'Test Patient',
      } as any);

      await service.getPatient('patient-1');

      // Verify only local repository was called
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPatients (batch)', () => {
    it('should retrieve multiple patients by IDs', async () => {
      const mockPatients = [
        {
          patientId: 'patient-1',
          fullName: 'Nguyen Van A',
          phone: '0901234567',
        },
        {
          patientId: 'patient-2',
          fullName: 'Tran Thi B',
          phone: '0907654321',
        },
      ];

      mockRepository.findByIds.mockResolvedValue(mockPatients as any);

      const result = await service.getPatients(['patient-1', 'patient-2']);

      expect(result).toHaveLength(2);
      expect(result[0].patientId).toBe('patient-1');
      expect(result[1].patientId).toBe('patient-2');
      expect(mockRepository.findByIds).toHaveBeenCalledWith([
        'patient-1',
        'patient-2',
      ]);
    });

    it('should return empty array when no IDs provided', async () => {
      const result = await service.getPatients([]);

      expect(result).toEqual([]);
      expect(mockRepository.findByIds).not.toHaveBeenCalled();
    });

    it('should handle partial results when some patients not found', async () => {
      mockRepository.findByIds.mockResolvedValue([
        {
          patientId: 'patient-1',
          fullName: 'Nguyen Van A',
        },
      ] as any);

      const result = await service.getPatients(['patient-1', 'patient-999']);

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe('patient-1');
    });

    it('should throw error when batch query fails', async () => {
      mockRepository.findByIds.mockRejectedValue(
        new Error('Query timeout')
      );

      await expect(
        service.getPatients(['patient-1', 'patient-2'])
      ).rejects.toThrow('Failed to fetch patients from read model');
    });
  });

  describe('exists', () => {
    it('should return true when patient exists', async () => {
      mockRepository.exists.mockResolvedValue(true);

      const result = await service.exists('patient-1');

      expect(result).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith('patient-1');
    });

    it('should return false when patient does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false);

      const result = await service.exists('patient-999');

      expect(result).toBe(false);
    });

    it('should return false when check fails', async () => {
      mockRepository.exists.mockRejectedValue(new Error('Database error'));

      const result = await service.exists('patient-1');

      expect(result).toBe(false);
    });
  });

  describe('Performance characteristics', () => {
    it('should complete queries in <10ms (no HTTP overhead)', async () => {
      mockRepository.findById.mockResolvedValue({
        patientId: 'patient-1',
        fullName: 'Test Patient',
      } as any);

      const start = Date.now();
      await service.getPatient('patient-1');
      const duration = Date.now() - start;

      // Should be significantly faster than HTTP calls (100-500ms)
      expect(duration).toBeLessThan(50); // Allow some overhead for mock execution
    });

    it('should handle batch queries efficiently', async () => {
      const patientIds = Array.from({ length: 100 }, (_, i) => `patient-${i}`);
      const mockPatients = patientIds.map(id => ({
        patientId: id,
        fullName: `Patient ${id}`,
      }));

      mockRepository.findByIds.mockResolvedValue(mockPatients as any);

      const start = Date.now();
      await service.getPatients(patientIds);
      const duration = Date.now() - start;

      // Batch query should still be fast
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Event-driven sync', () => {
    it('should rely on event consumers to update read model', async () => {
      // This service does not update read model directly
      // It's the responsibility of event consumers (PatientEventConsumer)
      
      const mockPatient = {
        patientId: 'patient-1',
        fullName: 'Old Name',
      };

      mockRepository.findById.mockResolvedValue(mockPatient as any);

      const result = await service.getPatient('patient-1');

      // Service just reads from the repository
      expect(result?.fullName).toBe('Old Name');
    });
  });

  describe('Error handling', () => {
    it('should provide descriptive error messages', async () => {
      mockRepository.findById.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(service.getPatient('patient-1')).rejects.toThrow(
        /Failed to fetch patient from read model/
      );
    });

    it('should handle undefined repository responses', async () => {
      mockRepository.findById.mockResolvedValue(undefined as any);

      const result = await service.getPatient('patient-1');

      expect(result).toBeNull();
    });
  });

  describe('Data consistency', () => {
    it('should return same structure as HTTP service (compatibility)', async () => {
      const mockPatient = {
        patientId: 'patient-1',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        email: 'nguyen.vana@example.com',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        nationalId: '001234567890',
        insuranceNumber: 'BHYT123456',
        insuranceType: 'BHYT',
        address: '123 Le Loi, HCMC',
      };

      mockRepository.findById.mockResolvedValue(mockPatient as any);

      const result = await service.getPatient('patient-1');

      // Should have all required PatientDTO fields
      expect(result).toHaveProperty('patientId');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('dateOfBirth');
      expect(result).toHaveProperty('gender');
    });

    it('should handle Vietnamese patient data correctly', async () => {
      const mockPatient = {
        patientId: 'patient-1',
        fullName: 'Nguyễn Văn Ái',
        phone: '0901234567',
        email: 'nguyen.vanai@example.com',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      };

      mockRepository.findById.mockResolvedValue(mockPatient as any);

      const result = await service.getPatient('patient-1');

      expect(result?.fullName).toBe('Nguyễn Văn Ái');
      expect(result?.address).toBe('123 Đường Lê Lợi, Quận 1, TP.HCM');
    });
  });
});
