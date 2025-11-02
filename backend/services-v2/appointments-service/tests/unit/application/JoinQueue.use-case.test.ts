/**
 * Join Queue Use Case Tests
 * Tests queue joining logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { JoinQueueUseCase } from '../../../src/application/use-cases/JoinQueue.use-case';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { Queue } from '../../../src/domain/aggregates/Queue.aggregate';
import { QueuePriority } from '../../../src/domain/entities/QueueEntry.entity';

describe('JoinQueueUseCase', () => {
  let useCase: JoinQueueUseCase;
  let mockQueueRepo: jest.Mocked<IQueueRepository>;

  beforeEach(() => {
    mockQueueRepo = {
      findByDoctorAndDate: jest.fn(),
      findOrCreateByDoctorAndDate: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByPatient: jest.fn(),
    } as any;

    useCase = new JoinQueueUseCase(mockQueueRepo);
  });

  const createMockQueue = (): Queue => {
    return Queue.create('doctor-1', new Date('2025-12-01'), 15);
  };

  describe('execute', () => {
    it('should add patient to queue successfully', async () => {
      const mockQueue = createMockQueue();
      mockQueueRepo.findOrCreateByDoctorAndDate.mockResolvedValue(mockQueue);

      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        departmentId: 'dept-1',
        priority: 'NORMAL' as const,
        appointmentId: 'apt-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.queueEntry?.position).toBeDefined();
      expect(result.queueEntry?.queueNumber).toBeDefined();
      expect(mockQueueRepo.save).toHaveBeenCalled();
    });

    it('should prioritize EMERGENCY patients', async () => {
      const mockQueue = createMockQueue();
      
      // Add normal patient first
      mockQueue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      
      mockQueueRepo.findOrCreateByDoctorAndDate.mockResolvedValue(mockQueue);

      const request = {
        patientId: 'patient-2',
        doctorId: 'doctor-1',
        departmentId: 'dept-1',
        priority: 'EMERGENCY' as const,
        appointmentId: 'apt-2',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      // Emergency should be position 1 (before normal patient)
      expect(result.queueEntry?.position).toBe(1);
    });

    it('should use findOrCreateByDoctorAndDate to get queue', async () => {
      const mockQueue = createMockQueue();
      mockQueueRepo.findOrCreateByDoctorAndDate.mockResolvedValue(mockQueue);

      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        departmentId: 'dept-1',
        priority: 'NORMAL' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(mockQueueRepo.findOrCreateByDoctorAndDate).toHaveBeenCalledWith(
        'doctor-1',
        expect.any(Date)
      );
      expect(mockQueueRepo.save).toHaveBeenCalled();
    });

    it('should calculate estimated wait time', async () => {
      const mockQueue = createMockQueue();
      
      // Add 3 patients ahead
      mockQueue.addPatient('patient-1', 'apt-1', QueuePriority.NORMAL);
      mockQueue.addPatient('patient-2', 'apt-2', QueuePriority.NORMAL);
      mockQueue.addPatient('patient-3', 'apt-3', QueuePriority.NORMAL);
      
      mockQueueRepo.findOrCreateByDoctorAndDate.mockResolvedValue(mockQueue);

      const request = {
        patientId: 'patient-4',
        doctorId: 'doctor-1',
        departmentId: 'dept-1',
        priority: 'NORMAL' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.queueEntry?.estimatedWaitTime).toBeGreaterThan(0);
      expect(result.queueEntry?.position).toBe(4);
    });

    it('should fail when required fields missing', async () => {
      const request = {
        patientId: '',
        doctorId: 'doctor-1',
        priority: 'NORMAL' as const,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
