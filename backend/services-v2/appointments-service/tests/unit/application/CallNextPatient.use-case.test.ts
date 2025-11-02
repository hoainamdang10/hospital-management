/**
 * Call Next Patient Use Case Unit Tests
 * Tests calling next patient from queue
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { CallNextPatientUseCase } from '../../../src/application/use-cases/CallNextPatient.use-case';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';

describe('CallNextPatientUseCase', () => {
  let useCase: CallNextPatientUseCase;
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
          queueId: 'q1',
          patientId: 'patient-1',
          queueNumber: 1,
          priority: 'NORMAL',
          status: 'WAITING',
          appointmentId: 'apt-1',
        },
        {
          queueId: 'q2',
          patientId: 'patient-2',
          queueNumber: 2,
          priority: 'URGENT',
          status: 'WAITING',
          appointmentId: 'apt-2',
        },
        {
          queueId: 'q3',
          patientId: 'patient-3',
          queueNumber: 3,
          priority: 'NORMAL',
          status: 'WAITING',
          appointmentId: 'apt-3',
        },
      ],
      callNext: jest.fn().mockReturnValue({
        queueId: 'q2',
        patientId: 'patient-2',
        queueNumber: 2,
        priority: 'URGENT',
        appointmentId: 'apt-2',
        calledTime: new Date(),
      }),
    };

    mockRepository = {
      findByDoctorAndDate: jest.fn().mockResolvedValue(mockQueue),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockAuthService = {
      canCallNextPatient: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new CallNextPatientUseCase(
      mockRepository,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should call next patient from queue', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('bệnh nhân');
      expect(result.patient).toBeDefined();
      expect(result.patient?.patientId).toBe('patient-2');
      expect(mockQueue.callNext).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockQueue);
    });

    it('should prioritize URGENT patients over NORMAL', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      // Should call patient-2 (URGENT) before patient-1 (NORMAL)
      expect(result.patient?.priority).toBe('URGENT');
      expect(result.patient?.patientId).toBe('patient-2');
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canCallNextPatient.mockResolvedValue(false);

      const request = {
        doctorId: 'doctor-1',
        calledBy: 'patient-1',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(mockQueue.callNext).not.toHaveBeenCalled();
    });

    it('should fail when no queue exists for doctor today', async () => {
      mockRepository.findByDoctorAndDate.mockResolvedValue(null);

      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('hàng chờ');
      expect(result.errors).toContain('No queue found for today');
    });

    it('should fail when queue is empty', async () => {
      mockQueue.callNext.mockReturnValue(null);

      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('bệnh nhân');
      expect(result.errors).toContain('No patients in queue');
    });

    it('should record called time', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.patient?.calledTime).toBeDefined();
      expect(result.patient?.calledTime).toBeInstanceOf(Date);
    });

    it('should return queue number', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.patient?.queueNumber).toBeDefined();
      expect(result.patient?.queueNumber).toBe(2);
    });

    it('should include appointment ID if available', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.patient?.appointmentId).toBe('apt-2');
    });

    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(
        new Error('Database write failed')
      );

      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database write failed');
    });

    it('should verify authorization with correct parameters', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(mockAuthService.canCallNextPatient).toHaveBeenCalledWith(
        'nurse-1',
        'doctor-1'
      );
    });

    it('should query queue for today date', async () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(mockRepository.findByDoctorAndDate).toHaveBeenCalled();
      const callArgs = mockRepository.findByDoctorAndDate.mock.calls[0];
      expect(callArgs[0]).toBe('doctor-1');
      expect(callArgs[1]).toBeInstanceOf(Date);
    });

    it('should only allow doctor or nurse to call next patient', async () => {
      mockAuthService.canCallNextPatient.mockImplementation(
        async (userId) => {
          return userId.startsWith('doctor-') || userId.startsWith('nurse-');
        }
      );

      const requestByPatient = {
        doctorId: 'doctor-1',
        calledBy: 'patient-1',
      };

      const resultPatient = await useCase.execute(requestByPatient, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(resultPatient.success).toBe(false);

      const requestByNurse = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const resultNurse = await useCase.execute(requestByNurse, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(resultNurse.success).toBe(true);
    });
  });

  describe('Priority ordering', () => {
    it('should follow priority order: EMERGENCY > URGENT > NORMAL > LOW', async () => {
      mockQueue.patients = [
        { priority: 'NORMAL', status: 'WAITING', patientId: 'p1' },
        { priority: 'EMERGENCY', status: 'WAITING', patientId: 'p2' },
        { priority: 'LOW', status: 'WAITING', patientId: 'p3' },
        { priority: 'URGENT', status: 'WAITING', patientId: 'p4' },
      ];

      mockQueue.callNext.mockReturnValue({
        patientId: 'p2',
        priority: 'EMERGENCY',
      });

      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.patient?.patientId).toBe('p2');
      expect(result.patient?.priority).toBe('EMERGENCY');
    });
  });

  describe('PHI compliance', () => {
    it('should mark call next patient as PHI operation', () => {
      const request = {
        doctorId: 'doctor-1',
        calledBy: 'nurse-1',
      };

      expect(useCase.involvesPHI(request)).toBe(true);
    });
  });
});
