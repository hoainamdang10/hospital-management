/**
 * Unit Tests for Appointment Scheduler Integration Handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

// Mock Scheduler SDK before importing handlers
const mockCreateOrUpdateByDedup = jest.fn();
const mockCancelByOwner = jest.fn();

jest.mock('@hospital/scheduler-client', () => ({
  RemoteSchedulerAdapter: jest.fn().mockImplementation(() => ({
    createOrUpdateByDedup: mockCreateOrUpdateByDedup,
    cancelByOwner: mockCancelByOwner
  }))
}));

import {
  AppointmentScheduledSchedulerHandler,
  AppointmentCancelledSchedulerHandler
} from '../../../../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler';

describe('AppointmentScheduledSchedulerHandler', () => {
  let handler: AppointmentScheduledSchedulerHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOrUpdateByDedup.mockResolvedValue({
      scheduleId: 'test-schedule-id',
      status: 'ACTIVE',
      nextRunAt: new Date().toISOString()
    });
    handler = new AppointmentScheduledSchedulerHandler(
      'http://localhost:3030',
      'test-api-key',
      'hospital-1'
    );
  });

  describe('handle - ROUTINE appointment', () => {
    it('should create 24h and 2h reminder schedules for ROUTINE appointment', async () => {
      const appointmentTime = new Date('2025-10-23T09:00:00Z');
      const event: any = {
        eventId: 'evt-123',
        eventType: 'AppointmentScheduled',
        aggregateId: 'appt-123',
        aggregateType: 'Appointment',
        eventData: {
          appointmentId: 'appt-123',
          patientId: 'patient-456',
          providerId: 'doctor-789',
          startTime: appointmentTime,
          endTime: new Date('2025-10-23T09:30:00Z'),
          reason: 'Khám định kỳ',
          appointmentType: 'CONSULTATION',
          priority: 'NORMAL',
          urgencyLevel: 'routine',
          scheduledBy: 'user-001'
        },
        occurredAt: new Date(),
        version: 1
      };

      await handler.handle(event);

      // Should call createOrUpdateByDedup twice (24h + 2h)
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledTimes(2);

      // Check 24h reminder
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'hospital-1',
          ownerService: 'appointments',
          ownerResourceId: 'appt-123',
          scheduleType: 'ONCE',
          topicOrCommand: 'appointments.appointment.reminder.24h',
          dedupKey: 'appt-123:reminder-24h'
        })
      );
    });

    it('should skip reminders in the past', async () => {
      const pastAppointmentTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const event: any = {
        eventId: 'evt-124',
        eventType: 'AppointmentScheduled',
        aggregateId: 'appt-124',
        aggregateType: 'Appointment',
        eventData: {
          appointmentId: 'appt-124',
          patientId: 'patient-456',
          providerId: 'doctor-789',
          startTime: pastAppointmentTime,
          endTime: new Date(pastAppointmentTime.getTime() + 30 * 60 * 1000),
          reason: 'Khám gấp',
          appointmentType: 'CONSULTATION',
          priority: 'URGENT',
          urgencyLevel: 'routine',
          scheduledBy: 'user-001'
        },
        occurredAt: new Date(),
        version: 1
      };

      await handler.handle(event);

      // Should not create any reminders (24h and 2h are in the past)
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledTimes(0);
    });
  });

  describe('handle - EMERGENCY appointment', () => {
    it('should not create any reminders for EMERGENCY appointment', async () => {
      const appointmentTime = new Date('2025-10-23T09:00:00Z');
      const event: any = {
        eventId: 'evt-126',
        eventType: 'AppointmentScheduled',
        aggregateId: 'appt-126',
        aggregateType: 'Appointment',
        eventData: {
          appointmentId: 'appt-126',
          patientId: 'patient-456',
          providerId: 'doctor-789',
          startTime: appointmentTime,
          endTime: new Date('2025-10-23T09:30:00Z'),
          reason: 'Cấp cứu',
          appointmentType: 'EMERGENCY',
          priority: 'EMERGENCY',
          urgencyLevel: 'emergency',
          scheduledBy: 'user-001'
        },
        occurredAt: new Date(),
        version: 1
      };

      await handler.handle(event);

      // Should not create any reminders
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledTimes(0);
    });
  });
});

describe('AppointmentCancelledSchedulerHandler', () => {
  let handler: AppointmentCancelledSchedulerHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCancelByOwner.mockResolvedValue({
      cancelledCount: 3
    });
    handler = new AppointmentCancelledSchedulerHandler(
      'http://localhost:3030',
      'test-api-key',
      'hospital-1'
    );
  });

  it('should cancel all reminders for cancelled appointment', async () => {
    const event: any = {
      eventId: 'evt-200',
      eventType: 'AppointmentCancelled',
      aggregateId: 'appt-200',
      aggregateType: 'Appointment',
      eventData: {
        appointmentId: 'appt-200',
        patientId: 'patient-456',
        providerId: 'doctor-789',
        cancelledBy: 'user-001',
        cancelledAt: new Date(),
        reason: 'Bệnh nhân hủy'
      },
      occurredAt: new Date(),
      version: 1
    };

    await handler.handle(event);

    expect(mockCancelByOwner).toHaveBeenCalledWith({
      tenantId: 'hospital-1',
      ownerService: 'appointments',
      ownerResourceId: 'appt-200'
    });
  });
});
