/**
 * Check-In Appointment Use Case Tests
 * Tests check-in logic and queue integration
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { CheckInAppointmentUseCase } from '../../../src/application/use-cases/CheckInAppointment.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('CheckInAppointmentUseCase', () => {
  let useCase: CheckInAppointmentUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockAuthService = {
      canCheckInAppointment: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new CheckInAppointmentUseCase(
      mockRepository,
      mockAuthService
    );
  });

  const createConfirmedAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    
    // Appointment 15 minutes from now (within check-in window)
    const futureDate = new Date();
    futureDate.setMinutes(futureDate.getMinutes() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];
    const timeStr = futureDate.toTimeString().split(' ')[0];
    
    const timeSlot = TimeSlot.create(dateStr, timeStr);
    const details = AppointmentDetails.create('Checkup');

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
    return apt;
  };

  describe('execute', () => {
    it('should check in confirmed appointment successfully', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        checkedInBy: 'nurse-1',
        addToQueue: true,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
      expect(result.appointment?.status).toBe(AppointmentStatus.ARRIVED);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent',
        checkedInBy: 'nurse-1',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Không tìm thấy');
    });

    it('should fail when user not authorized', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockAuthService.canCheckInAppointment.mockResolvedValue(false);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        checkedInBy: 'patient-2',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-2',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Check-in thất bại');
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('not authorized');
    });

    it('should record check-in timestamp', async () => {
      // Create an appointment with a specific time so we can check in with a matching timestamp
      const appointmentTime = new Date();
      appointmentTime.setMinutes(appointmentTime.getMinutes() + 10); // 10 minutes from now
      const dateStr = appointmentTime.toISOString().split('T')[0];
      const timeStr = appointmentTime.toTimeString().split(' ')[0];
      
      const appointmentId = AppointmentId.generate();
      const tenantId = TenantId.createDefault();
      const timeSlot = TimeSlot.create(dateStr, timeStr);
      const details = AppointmentDetails.create('Checkup');
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
      
      mockRepository.findByAppointmentId.mockResolvedValue(apt);

      // Check in at the exact appointment time
      const checkInTime = appointmentTime;
      const request = {
        appointmentId: apt.getAppointmentId().value,
        checkedInBy: 'nurse-1',
        checkInTime,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointment?.checkedInAt).toBeDefined();
      expect(result.appointment?.checkedInAt).toEqual(checkInTime);
    });

    it('should publish AppointmentCheckedInEvent', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        checkedInBy: 'nurse-1',
      };

      await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      const savedAppointment = mockRepository.save.mock.calls[0][0];
      const events = savedAppointment.getUncommittedEvents();
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e: any) => e.eventType === 'AppointmentCheckedIn')).toBe(true);
    });
  });
});
