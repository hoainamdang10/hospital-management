/**
 * Start Appointment Use Case Tests
 * Tests appointment start logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { StartAppointmentUseCase } from '../../../src/application/use-cases/StartAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('StartAppointmentUseCase', () => {
  let useCase: StartAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockAuthService = {
      canStartAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new StartAppointmentUseCase(
      mockRepository,
      mockAuthService
    );
  });

  const createCheckedInAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    const timeSlot = TimeSlot.create('2025-12-01', '10:00:00');
    const details = AppointmentDetails.create('Consultation');

    const apt = Appointment.create(
      appointmentId,
      tenantId,
      'patient-1',
      'doctor-1',
      timeSlot,
      30,
      AppointmentType.CONSULTATION,
      AppointmentPriority.NORMAL,
      details,
      200000,
      'user-1'
    );

    apt.confirm('admin-1');
    apt.checkIn(new Date());
    return apt;
  };

  describe('execute', () => {
    it('should start checked-in appointment successfully', async () => {
      const mockAppointment = createCheckedInAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        startedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.appointment?.status).toBe(AppointmentStatus.IN_PROGRESS);
      expect(result.appointment?.startedAt).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent',
        startedBy: 'doctor-1',
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should fail when user not authorized (only doctor can start)', async () => {
      const mockAppointment = createCheckedInAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockAuthService.canStartAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        startedBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Bắt đầu khám bệnh thất bại');
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('not authorized');
    });

    it('should record actual start time', async () => {
      const mockAppointment = createCheckedInAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const startTime = new Date('2025-12-01T10:05:00Z');
      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        startedBy: 'doctor-1',
        startTime,
      };

      const result = await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointment?.startedAt).toEqual(startTime);
    });

    it('should publish AppointmentStartedEvent', async () => {
      const mockAppointment = createCheckedInAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        startedBy: 'doctor-1',
      };

      await useCase.execute(request, {
        userId: 'doctor-1',
        timestamp: new Date(),
      });

      const savedAppointment = mockRepository.save.mock.calls[0][0];
      const events = savedAppointment.getUncommittedEvents();
      
      expect(events.some((e: any) => e.eventType === 'AppointmentStarted')).toBe(true);
    });
  });
});
