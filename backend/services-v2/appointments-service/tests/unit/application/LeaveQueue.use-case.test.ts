/**
 * Leave Queue Use Case Unit Tests
 * Tests patient leaving queue
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { LeaveQueueUseCase } from '../../../src/application/use-cases/LeaveQueue.use-case';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';

describe('LeaveQueueUseCase', () => {
  let useCase: LeaveQueueUseCase;
  let mockRepository: jest.Mocked<IQueueRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      id: 'queue-1',
      doctorId: 'doctor-1',
      date: new Date('2025-12-01'),
      patients: [
        {
          patientId: 'patient-1',
          queueNumber: 1,
          status: 'WAITING',
        },
        {
          patientId: 'patient-2',
          queueNumber: 2,
          status: 'WAITING',
        },
        {
          patientId: 'patient-3',
          queueNumber: 3,
          status: 'WAITING',
        },
      ],
      hasPatient: jest.fn((patientId: string) => {
        return mockQueue.patients.some((p: any) => p.patientId === patientId);
      }),
      removePatient: jest.fn((patientId: string, reason: string, removedBy: string) => {
        const entryIndex = mockQueue.patients.findIndex((p: any) => p.patientId === patientId);
        if (entryIndex === -1) {
          throw new Error(`Patient ${patientId} not found in queue`);
        }
        const entry = mockQueue.patients[entryIndex];
        mockQueue.patients.splice(entryIndex, 1);
        return entry;
      }),
    };

    mockRepository = {
      findByDoctorAndDate: jest.fn().mockResolvedValue(mockQueue),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canLeaveQueue: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new LeaveQueueUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should remove patient from queue', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        reason: 'Emergency elsewhere',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('rời khỏi');
      expect(mockQueue.removePatient).toHaveBeenCalledWith('patient-2', 'Emergency elsewhere', 'patient-2');
      expect(mockRepository.save).toHaveBeenCalledWith(mockQueue);
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canLeaveQueue.mockResolvedValue(false);

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-1', // Different patient trying to remove patient-2
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(mockQueue.removePatient).not.toHaveBeenCalled();
    });

    it('should fail when queue not found', async () => {
      mockRepository.findByDoctorAndDate.mockResolvedValue(null);

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
      expect(result.errors).toContain('Queue not found');
    });

    it('should fail when patient not in queue', async () => {
      // patient-999 not in mock patients array, so hasPatient will return false

      const request = {
        patientId: 'patient-999',
        doctorId: 'doctor-1',
        leftBy: 'patient-999',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-999',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('không có');
      expect(result.errors).toContain('Patient not in queue');
    });

    it('should include reason when provided', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        reason: 'Need to leave for emergency',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockQueue.removePatient).toHaveBeenCalledWith('patient-2', 'Need to leave for emergency', 'patient-2');
    });

    it('should work without reason', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockQueue.removePatient).toHaveBeenCalledWith('patient-2', 'Patient left queue', 'patient-2');
    });

    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(
        new Error('Database write failed')
      );

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database write failed');
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(mockAuthService.canLeaveQueue).toHaveBeenCalledWith(
        'patient-2',
        'patient-2'
      );
    });

    it('should allow patient to leave their own queue', async () => {
      mockAuthService.canLeaveQueue.mockImplementation(
        async (userId, patientId) => {
          return userId === patientId;
        }
      );

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should allow staff to remove patient from queue', async () => {
      mockAuthService.canLeaveQueue.mockResolvedValue(true);

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        reason: 'Patient requested removal',
        leftBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should prevent patient from removing others from queue', async () => {
      mockAuthService.canLeaveQueue.mockImplementation(
        async (userId, patientId) => {
          return userId === patientId || userId.startsWith('nurse-');
        }
      );

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-1', // Different patient
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should query queue for today date', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(mockRepository.findByDoctorAndDate).toHaveBeenCalled();
      const callArgs = mockRepository.findByDoctorAndDate.mock.calls[0];
      expect(callArgs[0]).toBe('doctor-1');
      expect(callArgs[1]).toBeInstanceOf(Date);
    });
  });

  describe('Queue reordering', () => {
    it('should trigger queue reordering after removal', async () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      // Verify that save is called, which should trigger reordering
      expect(mockRepository.save).toHaveBeenCalledWith(mockQueue);
    });
  });

  describe('PHI compliance', () => {
    it('should mark leave queue as PHI operation', () => {
      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        leftBy: 'patient-2',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
