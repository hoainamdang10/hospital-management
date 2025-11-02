/**
 * Get Queue Status Use Case Unit Tests
 * Tests queue status monitoring
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { GetQueueStatusUseCase } from '../../../src/application/use-cases/GetQueueStatus.use-case';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';

describe('GetQueueStatusUseCase', () => {
  let useCase: GetQueueStatusUseCase;
  let mockRepository: jest.Mocked<IQueueRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      id: 'queue-1',
      doctorId: 'doctor-1',
      date: new Date('2025-12-01'),
      getStatus: jest.fn(() => ({
        entries: [
          {
            patientId: 'patient-1',
            queueNumber: 1,
            priority: 'URGENT',
            status: 'IN_PROGRESS',
            checkInTime: new Date('2025-12-01T09:00:00'),
            estimatedWaitMinutes: 0,
          },
          {
            patientId: 'patient-2',
            queueNumber: 2,
            priority: 'NORMAL',
            status: 'CALLED',
            checkInTime: new Date('2025-12-01T09:15:00'),
            estimatedWaitMinutes: 0,
          },
          {
            patientId: 'patient-3',
            queueNumber: 3,
            priority: 'NORMAL',
            status: 'WAITING',
            checkInTime: new Date('2025-12-01T09:30:00'),
            estimatedWaitMinutes: 30,
          },
          {
            patientId: 'patient-4',
            queueNumber: 4,
            priority: 'LOW',
            status: 'WAITING',
            checkInTime: new Date('2025-12-01T09:45:00'),
            estimatedWaitMinutes: 45,
          },
        ],
        totalWaiting: 2,
        totalCalled: 1,
        totalInProgress: 1,
      })),
    };

    mockRepository = {
      findByDoctorAndDate: jest.fn().mockResolvedValue(mockQueue),
      findByPatient: jest.fn().mockResolvedValue(mockQueue),
    } as any;

    mockAuthService = {
      canViewQueueStatus: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new GetQueueStatusUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute - Patient view', () => {
    it('should get patient queue status', async () => {
      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-3',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.queue).toBeDefined();
      expect(result.queue?.patientId).toBe('patient-3');
      expect(result.queue?.queueNumber).toBe(3);
      expect(result.queue?.position).toBe(3);
    });

    it('should calculate patients ahead in queue', async () => {
      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-3',
        timestamp: new Date(),
      });

      expect(result.queue?.patientsAhead).toBe(2); // patient-1 and patient-2 ahead
    });

    it('should estimate wait time', async () => {
      const request = {
        patientId: 'patient-4',
        requestedBy: 'patient-4',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-4',
        timestamp: new Date(),
      });

      expect(result.queue?.estimatedWaitMinutes).toBeDefined();
      expect(result.queue?.estimatedWaitMinutes).toBeGreaterThan(0);
    });

    it('should show current status (WAITING, CALLED, IN_PROGRESS)', async () => {
      const request = {
        patientId: 'patient-2',
        requestedBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.queue?.status).toBe('CALLED');
    });

    it('should fail when patient not in queue', async () => {
      // Mock getStatus to return entries without patient-999
      mockQueue.getStatus.mockReturnValue({
        entries: [
          {
            patientId: 'patient-1',
            queueNumber: 1,
            priority: 'URGENT',
            status: 'IN_PROGRESS',
            checkInTime: new Date('2025-12-01T09:00:00'),
          },
        ],
        totalWaiting: 0,
        totalCalled: 0,
        totalInProgress: 1,
      });

      const request = {
        patientId: 'patient-999',
        requestedBy: 'patient-999',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-999',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Patient not in queue');
    });
  });

  describe('execute - Doctor/Staff view', () => {
    it('should get complete queue status for doctor', async () => {
      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.doctorQueue).toBeDefined();
      expect(result.doctorQueue?.doctorId).toBe('doctor-1');
      expect(result.doctorQueue?.patients).toBeDefined();
    });

    it('should show statistics for doctor queue', async () => {
      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.doctorQueue?.totalWaiting).toBe(2);
      expect(result.doctorQueue?.totalCalled).toBe(1);
      expect(result.doctorQueue?.totalInProgress).toBe(1);
    });

    it('should list all patients in queue with details', async () => {
      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.doctorQueue?.patients).toHaveLength(4);
      expect(result.doctorQueue?.patients[0]).toHaveProperty('patientId');
      expect(result.doctorQueue?.patients[0]).toHaveProperty('queueNumber');
      expect(result.doctorQueue?.patients[0]).toHaveProperty('priority');
      expect(result.doctorQueue?.patients[0]).toHaveProperty('status');
    });

    it('should calculate wait time for each patient', async () => {
      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      const waitingPatients = result.doctorQueue?.patients.filter(
        p => p.status === 'WAITING'
      );

      waitingPatients?.forEach(patient => {
        expect(patient.waitTimeMinutes).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Authorization', () => {
    it('should fail when user not authorized', async () => {
      mockAuthService.canViewQueueStatus.mockResolvedValue(false);

      const request = {
        patientId: 'patient-1',
        requestedBy: 'patient-2', // Different patient
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should allow patient to view their own queue status', async () => {
      mockAuthService.canViewQueueStatus.mockImplementation(
        async (userId, patientId) => {
          return userId === patientId;
        }
      );

      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-3',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should allow doctor to view their own queue', async () => {
      mockAuthService.canViewQueueStatus.mockResolvedValue(true);

      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should allow staff to view any queue', async () => {
      mockAuthService.canViewQueueStatus.mockResolvedValue(true);

      const request = {
        doctorId: 'doctor-1',
        requestedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should fail when neither patientId nor doctorId provided', async () => {
      const request = {
        requestedBy: 'user-1',
      };

      const result = await useCase.execute(request, {
        userId: 'user-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Must provide patientId or doctorId');
    });

    it('should fail when queue not found', async () => {
      mockRepository.findByDoctorAndDate.mockResolvedValue(null);

      const request = {
        doctorId: 'doctor-999',
        requestedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Queue not found');
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.findByPatient.mockRejectedValue(
        new Error('Database query failed')
      );

      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-3',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database query failed');
    });
  });

  describe('Real-time updates', () => {
    it('should reflect current queue state', async () => {
      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-3',
        timestamp: new Date(),
      });

      expect(mockQueue.getStatus).toHaveBeenCalled();
      expect(result.queue?.status).toBe('WAITING');
    });
  });

  describe('PHI compliance', () => {
    it('should mark queue status as PHI', () => {
      const request = {
        patientId: 'patient-3',
        requestedBy: 'patient-3',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
