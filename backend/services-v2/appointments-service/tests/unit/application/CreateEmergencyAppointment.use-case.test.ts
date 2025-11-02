/**
 * Create Emergency Appointment Use Case Tests
 * Tests emergency appointment creation logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { CreateEmergencyAppointmentUseCase } from '../../../src/application/use-cases/CreateEmergencyAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../../src/domain/repositories/IQueueRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Queue } from '../../../src/domain/aggregates/Queue.aggregate';
import { QueuePriority } from '../../../src/domain/entities/QueueEntry.entity';

describe('CreateEmergencyAppointmentUseCase', () => {
  let useCase: CreateEmergencyAppointmentUseCase;
  let mockAppointmentRepo: jest.Mocked<IAppointmentRepository>;
  let mockQueueRepo: jest.Mocked<IQueueRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;
  let mockQueue: any;

  beforeEach(() => {
    mockAppointmentRepo = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      checkConflicts: jest.fn(),
    } as any;

    // Create mock Queue aggregate
    mockQueue = {
      addPatient: jest.fn().mockReturnValue({
        patientId: 'patient-1',
        queueNumber: 1,
        priority: QueuePriority.EMERGENCY,
        status: 'waiting'
      }),
      getEntries: jest.fn().mockReturnValue([]),
    };

    mockQueueRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDoctorAndDate: jest.fn(),
      findOrCreateByDoctorAndDate: jest.fn().mockResolvedValue(mockQueue),
      findByPatient: jest.fn(),
    } as any;

    mockAuthService = {
      canCreateEmergencyAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new CreateEmergencyAppointmentUseCase(
      mockAppointmentRepo,
      mockQueueRepo,
      mockAuthService
    );
  });

  describe('execute', () => {
    it('should create emergency appointment with highest priority', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        appointmentType: 'EMERGENCY',
        chiefComplaint: 'Chest pain',
        notes: 'Severe pain, requires immediate attention',
        createdBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.appointment).toBeDefined();
      expect(result.appointment?.priority).toBe('EMERGENCY');
      expect(result.appointment?.queuePosition).toBe(1);
      expect(mockAppointmentRepo.save).toHaveBeenCalled();
      expect(mockQueueRepo.findOrCreateByDoctorAndDate).toHaveBeenCalled();
      expect(mockQueue.addPatient).toHaveBeenCalledWith(
        'patient-1',
        expect.any(String), // appointmentId
        QueuePriority.EMERGENCY
      );
      expect(mockQueueRepo.save).toHaveBeenCalledWith(mockQueue);
    });

    it('should fail when user not authorized', async () => {
      mockAuthService.canCreateEmergencyAppointment.mockResolvedValue(false);

      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        appointmentType: 'EMERGENCY',
        chiefComplaint: 'Chest pain',
        createdBy: 'patient-1', // Patients cannot create emergency appointments
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('not authorized');
    });

    it('should create appointment immediately without availability check', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        appointmentType: 'EMERGENCY',
        chiefComplaint: 'Severe bleeding',
        createdBy: 'doctor-2',
      };

      await useCase.execute(request, {
        userId: 'doctor-2',
        timestamp: new Date(),
      });

      // Should not check conflicts for emergency
      expect(mockAppointmentRepo.checkConflicts).not.toHaveBeenCalled();
      expect(mockAppointmentRepo.save).toHaveBeenCalled();
    });

    it('should place emergency appointment at top of queue', async () => {
      const request = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        appointmentType: 'EMERGENCY',
        chiefComplaint: 'Critical condition',
        createdBy: 'nurse-1',
      };

      await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(mockQueueRepo.findOrCreateByDoctorAndDate).toHaveBeenCalled();
      expect(mockQueue.addPatient).toHaveBeenCalledWith(
        'patient-1',
        expect.any(String), // appointmentId
        QueuePriority.EMERGENCY
      );
    });
  });
});
