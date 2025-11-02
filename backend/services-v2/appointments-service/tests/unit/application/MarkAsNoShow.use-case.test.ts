/**
 * Mark As No-Show Use Case Tests
 * Tests no-show marking logic
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { MarkAsNoShowUseCase } from '../../../src/application/use-cases/MarkAsNoShow.use-case';
import { IAppointmentRepository } from '../../../src/domain/repositories/IAppointmentRepository';
import { IAuthorizationService } from '../../../src/application/services/IAuthorizationService';
import { Appointment, AppointmentType, AppointmentPriority, AppointmentStatus } from '../../../src/domain/aggregates/Appointment.aggregate';
import { AppointmentId } from '../../../src/domain/value-objects/AppointmentId.vo';
import { TenantId } from '../../../src/domain/value-objects/TenantId.vo';
import { TimeSlot } from '../../../src/domain/value-objects/TimeSlot.vo';
import { AppointmentDetails } from '../../../src/domain/value-objects/AppointmentDetails.vo';

describe('MarkAsNoShowUseCase', () => {
  let useCase: MarkAsNoShowUseCase;
  let mockRepository: jest.Mocked<IAppointmentRepository>;
  let mockAuthService: jest.Mocked<IAuthorizationService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockAuthService = {
      hasAnyRole: jest.fn().mockResolvedValue(true),
    } as any;

    useCase = new MarkAsNoShowUseCase(
      mockRepository,
      mockAuthService
    );
  });

  const createConfirmedAppointment = (): Appointment => {
    const appointmentId = AppointmentId.generate();
    const tenantId = TenantId.createDefault();
    
    // Past appointment time (2 hours ago)
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 2);
    const dateStr = pastDate.toISOString().split('T')[0];
    const timeStr = pastDate.toTimeString().split(' ')[0];
    
    const timeSlot = TimeSlot.create(dateStr, timeStr);
    const details = AppointmentDetails.create('Missed appointment');

    // Use reconstitute to bypass past time validation
    const props = {
      appointmentId,
      tenantId,
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      timeSlot,
      durationMinutes: 30,
      type: AppointmentType.CONSULTATION,
      priority: AppointmentPriority.NORMAL,
      status: AppointmentStatus.CONFIRMED,
      details,
      consultationFee: 200000,
      reminderSent: false,
      confirmationRequired: true,
      version: 1,
      createdBy: 'user-1',
      createdAt: pastDate,
      updatedAt: pastDate,
      confirmedAt: pastDate,
      confirmedBy: 'admin-1',
    };

    return Appointment.reconstitute(props, appointmentId.value);
  };

  describe('execute', () => {
    it('should mark confirmed appointment as no-show', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        markedBy: 'nurse-1',
        reason: 'Patient did not arrive',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('không đến khám');
      expect(result.appointment?.status).toBe(AppointmentStatus.NO_SHOW);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should fail when appointment not found', async () => {
      mockRepository.findByAppointmentId.mockResolvedValue(null);

      const request = {
        appointmentId: 'non-existent',
        markedBy: 'nurse-1',
        reason: 'No show',
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
    });

    it('should fail when user not authorized', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);
      mockAuthService.hasAnyRole.mockResolvedValue(false);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        markedBy: 'patient-1',
        reason: 'No show',
      };

      const result = await useCase.execute(request, {
        userId: 'patient-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đánh dấu no-show thất bại');
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('not authorized');
    });

    it('should include penalty fee', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        markedBy: 'nurse-1',
        reason: 'Patient called to cancel but too late',
        applyPenalty: true,
      };

      const result = await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.appointment?.noShowPenalty).toBeDefined();
      expect(result.appointment?.noShowPenalty?.amount).toBeGreaterThan(0);
    });

    it('should publish AppointmentNoShowEvent', async () => {
      const mockAppointment = createConfirmedAppointment();
      mockRepository.findByAppointmentId.mockResolvedValue(mockAppointment);

      const request = {
        appointmentId: mockAppointment.getAppointmentId().value,
        markedBy: 'nurse-1',
        reason: 'No show',
      };

      await useCase.execute(request, {
        userId: 'nurse-1',
        timestamp: new Date(),
      });

      const savedAppointment = mockRepository.save.mock.calls[0][0];
      const events = savedAppointment.getUncommittedEvents();
      
      expect(events.some((e: any) => e.eventType === 'AppointmentNoShow')).toBe(true);
    });
  });
});
