/**
 * Unit Tests for Appointment Scheduler Integration Handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from "@shared/domain/base/domain-event";

// Mock RemoteSchedulerAdapter before importing handlers
const mockCreateOrUpdateByDedup = jest.fn();
const mockCancelByOwner = jest.fn();
const mockIsAvailable = jest.fn();

jest.mock("../../../../src/infrastructure/adapters/RemoteSchedulerAdapter", () => ({
  RemoteSchedulerAdapter: jest.fn().mockImplementation(() => ({
    createOrUpdateByDedup: mockCreateOrUpdateByDedup,
    cancelByOwner: mockCancelByOwner,
    isAvailable: mockIsAvailable,
  })),
}));

import {
  AppointmentScheduledSchedulerHandler,
  AppointmentCancelledSchedulerHandler,
} from "../../../../src/infrastructure/events/handlers/AppointmentSchedulerIntegrationHandler";

describe("AppointmentScheduledSchedulerHandler", () => {
  let handler: AppointmentScheduledSchedulerHandler;
  let mockOutboxRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOrUpdateByDedup.mockResolvedValue({
      scheduleId: "test-schedule-id",
      status: "ACTIVE",
      nextRunAt: new Date().toISOString(),
    });
    
    // Create mock outbox repository
    mockOutboxRepo = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };
    
    handler = new AppointmentScheduledSchedulerHandler(
      mockOutboxRepo,
      "hospital-1",
    );
  });

  describe("handle - ROUTINE appointment", () => {
    it("should create 24h and 2h reminder schedules for ROUTINE appointment", async () => {
      // Future appointment (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event: any = {
        eventId: "evt-123",
        eventType: "AppointmentScheduled",
        aggregateId: "appt-123",
        aggregateType: "Appointment",
        eventData: {
          appointmentId: "appt-123",
          patientId: "patient-456",
          doctorId: "doctor-789",
          appointmentDate: futureDate.toISOString().split('T')[0],
          appointmentTime: "09:00:00",
          durationMinutes: 30,
          type: "CONSULTATION",
          reason: "Khám định kỳ",
          appointmentType: "CONSULTATION",
          priority: "NORMAL",
          urgencyLevel: "routine",
          scheduledBy: "user-001",
        },
        occurredAt: new Date(),
        version: 1,
      };

      await handler.handle(event);

      // Should enqueue to outbox twice (24h + 2h reminders)
      expect(mockOutboxRepo.enqueue).toHaveBeenCalledTimes(2);

      // Check 24h reminder enqueued
      expect(mockOutboxRepo.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SchedulerReminderCreate',
          aggregateType: 'Appointment',
          aggregateId: 'appt-123',
          dedupKey: 'appt-123:reminder-24h',
          payload: expect.objectContaining({
            tenantId: "hospital-1",
            ownerService: "appointments",
            ownerResourceId: "appt-123",
            scheduleType: "ONCE",
            topicOrCommand: "appointments.appointment.reminder.24h",
            dedupKey: "appt-123:reminder-24h",
          }),
        })
      );
    });

    it("should skip reminders in the past", async () => {
      const pastAppointmentTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const event: any = {
        eventId: "evt-124",
        eventType: "AppointmentScheduled",
        aggregateId: "appt-124",
        aggregateType: "Appointment",
        eventData: {
          appointmentId: "appt-124",
          patientId: "patient-456",
          doctorId: "doctor-789",
          appointmentDate: pastAppointmentTime.toISOString().split('T')[0],
          appointmentTime: pastAppointmentTime.toTimeString().split(' ')[0].substring(0, 8),
          durationMinutes: 30,
          type: "CONSULTATION",
          reason: "Khám gấp",
          appointmentType: "CONSULTATION",
          priority: "URGENT",
          urgencyLevel: "routine",
          scheduledBy: "user-001",
        },
        occurredAt: new Date(),
        version: 1,
      };

      await handler.handle(event);

      // Should not create any reminders (24h and 2h are in the past)
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledTimes(0);
    });
  });

  describe("handle - EMERGENCY appointment", () => {
    it("should not create any reminders for EMERGENCY appointment", async () => {
      // Future appointment (7 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event: any = {
        eventId: "evt-126",
        eventType: "AppointmentScheduled",
        aggregateId: "appt-126",
        aggregateType: "Appointment",
        eventData: {
          appointmentId: "appt-126",
          patientId: "patient-456",
          doctorId: "doctor-789",
          appointmentDate: futureDate.toISOString().split('T')[0],
          appointmentTime: "09:00:00",
          durationMinutes: 30,
          type: "EMERGENCY",
          reason: "Cấp cứu",
          appointmentType: "EMERGENCY",
          priority: "EMERGENCY",
          urgencyLevel: "emergency",
          scheduledBy: "user-001",
        },
        occurredAt: new Date(),
        version: 1,
      };

      await handler.handle(event);

      // Should not create any reminders
      expect(mockCreateOrUpdateByDedup).toHaveBeenCalledTimes(0);
    });
  });
});

describe("AppointmentCancelledSchedulerHandler", () => {
  let handler: AppointmentCancelledSchedulerHandler;
  let mockOutboxRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCancelByOwner.mockResolvedValue({
      cancelledCount: 3,
    });
    
    // Create mock outbox repository
    mockOutboxRepo = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };
    
    handler = new AppointmentCancelledSchedulerHandler(
      mockOutboxRepo,
      "hospital-1",
    );
  });

  it("should cancel all reminders for cancelled appointment", async () => {
    const event: any = {
      eventId: "evt-200",
      eventType: "AppointmentCancelled",
      aggregateId: "appt-200",
      aggregateType: "Appointment",
      eventData: {
        appointmentId: "appt-200",
        patientId: "patient-456",
        doctorId: "doctor-789",
        cancelledBy: "user-001",
        cancelledAt: new Date(),
        reason: "Bệnh nhân hủy",
      },
      occurredAt: new Date(),
      version: 1,
    };

    await handler.handle(event);

    // Should enqueue cancellation to outbox instead of calling scheduler directly
    expect(mockOutboxRepo.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SchedulerReminderCancelByOwner',
        aggregateType: 'Appointment',
        aggregateId: 'appt-200',
        payload: expect.objectContaining({
          tenantId: "hospital-1",
          ownerService: "appointments",
          ownerResourceId: "appt-200",
        }),
      })
    );
  });
});
