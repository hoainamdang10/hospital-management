/**
 * Unit Tests for AppointmentAbuseEventHandler
 * Tests event handling from Appointments Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, High Test Coverage
 */

import { AppointmentAbuseEventHandler } from '@application/event-handlers/AppointmentAbuseEventHandler';
import { InboxService } from '@infrastructure/inbox/InboxService';

describe('AppointmentAbuseEventHandler', () => {
  let handler: AppointmentAbuseEventHandler;
  let mockInboxService: jest.Mocked<InboxService>;
  let mockSupabaseClient: any;
  let mockLogger: any;

  beforeEach(() => {
    mockInboxService = {
      checkProcessed: jest.fn(),
      storeEvent: jest.fn(),
      markProcessed: jest.fn(),
      markFailed: jest.fn()
    } as any;

    const mockGte = jest.fn();
    mockSupabaseClient = {
      schema: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ error: null }),
      contains: jest.fn().mockReturnThis(),
      gte: mockGte,
      single: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    handler = new AppointmentAbuseEventHandler(
      mockInboxService,
      mockSupabaseClient,
      mockLogger
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAppointmentNoShow', () => {
    const mockEvent = {
      eventId: 'evt-301',
      appointmentId: 'appt-456',
      patientId: 'patient-123',
      doctorId: 'doctor-789',
      scheduledDate: new Date('2025-01-01T10:00:00Z'),
      noShowDetails: {},
      occurredAt: new Date('2025-01-01T11:00:00Z')
    };

    it('should flag account if >= 3 no-shows in 30 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-1',
        status: 'PENDING'
      });

      // Mock count query - 3 no-shows
      mockSupabaseClient.gte.mockResolvedValue({
        count: 3,
        error: null
      });

      await handler.handleAppointmentNoShow(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-301');
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should skip if event already processed', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(true);

      await handler.handleAppointmentNoShow(mockEvent);

      expect(mockInboxService.storeEvent).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Event already processed', { eventId: 'evt-301' });
    });

    it('should mark as failed on error', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('DB error'));

      await expect(handler.handleAppointmentNoShow(mockEvent)).rejects.toThrow('DB error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-301', 'DB error');
    });
  });

  describe('handleAppointmentCancelled', () => {
    const mockEvent = {
      eventId: 'evt-302',
      appointmentId: 'appt-456',
      patientId: 'patient-123',
      cancelledBy: 'patient-123',
      cancellationType: 'PATIENT_INITIATED',
      reason: 'Personal reasons',
      hoursNotice: 1,
      occurredAt: new Date('2025-01-01T09:00:00Z')
    };

    it('should flag account if >= 5 late cancellations in 30 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-2',
        status: 'PENDING'
      });

      // Mock count query - 5 late cancellations with < 24 hours notice
      mockSupabaseClient.gte.mockResolvedValue({
        data: Array(5).fill({ 
          payload_json: { 
            patientId: 'patient-123',
            hoursNotice: 2 // < 24 hours
          }
        }),
        error: null
      });

      await handler.handleAppointmentCancelled(mockEvent);

      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-302');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('User flagged for review'),
        expect.any(Object)
      );
    });
  });

  describe('handleAppointmentRescheduled', () => {
    const mockEvent = {
      eventId: 'evt-303',
      appointmentId: 'appt-456',
      patientId: 'patient-123',
      oldScheduledDate: new Date('2025-01-01T10:00:00Z'),
      newScheduledDate: new Date('2025-01-02T10:00:00Z'),
      rescheduledBy: 'patient-123',
      reason: 'Schedule conflict',
      occurredAt: new Date('2025-01-01T09:00:00Z')
    };

    it('should restrict booking if >= 3 reschedules in 30 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-3',
        status: 'PENDING'
      });

      // Mock count query - 3 reschedules (handler uses select with count)
      mockSupabaseClient.gte.mockResolvedValue({
        count: 3,
        error: null
      });

      await handler.handleAppointmentRescheduled(mockEvent);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Restricting booking'),
        expect.any(Object)
      );
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-303');
    });

    it('should mark event as failed when storeEvent throws', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockRejectedValue(new Error('DB error'));

      await expect(handler.handleAppointmentRescheduled(mockEvent)).rejects.toThrow('DB error');

      expect(mockInboxService.markFailed).toHaveBeenCalledWith('evt-303', 'DB error');
      expect(mockInboxService.markProcessed).not.toHaveBeenCalled();
    });
  });

  describe('handleAppointmentLateArrival', () => {
    const mockEvent = {
      eventId: 'evt-304',
      appointmentId: 'appt-456',
      patientId: 'patient-123',
      scheduledTime: new Date('2025-01-01T10:00:00Z'),
      actualArrivalTime: new Date('2025-01-01T10:20:00Z'),
      minutesLate: 20,
      occurredAt: new Date('2025-01-01T10:20:00Z')
    };

    it('should flag account if >= 3 late arrivals (>15 min) in 30 days', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-4',
        status: 'PENDING'
      });

      // Mock count query - 3 late arrivals
      mockSupabaseClient.gte.mockResolvedValue({
        count: 3,
        error: null
      });

      await handler.handleAppointmentLateArrival(mockEvent);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Flagging account'),
        expect.any(Object)
      );
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-304');
    });
  });

  describe('handleAppointmentCompleted', () => {
    const mockEvent = {
      eventId: 'evt-305',
      appointmentId: 'appt-456',
      patientId: 'patient-123',
      doctorId: 'doctor-789',
      completedAt: new Date('2025-01-01T11:00:00Z'),
      wasOnTime: true,
      hadNoIssues: true,
      occurredAt: new Date('2025-01-01T11:00:00Z')
    };

    it('should reset restrictions if >= 3 good behavior appointments', async () => {
      mockInboxService.checkProcessed.mockResolvedValue(false);
      mockInboxService.storeEvent.mockResolvedValue({
        isNew: true,
        inboxId: 'inbox-5',
        status: 'PENDING'
      });

      const hasActiveRestrictionsSpy = jest
        .spyOn(handler as any, 'hasActiveRestrictions')
        .mockResolvedValue(true);
      const getGoodBehaviorCountSpy = jest
        .spyOn(handler as any, 'getGoodBehaviorCount')
        .mockResolvedValue(3);
      const resetBookingRestrictionsSpy = jest
        .spyOn(handler as any, 'resetBookingRestrictions')
        .mockResolvedValue(undefined);

      await handler.handleAppointmentCompleted(mockEvent);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Booking restrictions reset'),
        expect.any(Object)
      );
      expect(mockInboxService.markProcessed).toHaveBeenCalledWith('evt-305');

      hasActiveRestrictionsSpy.mockRestore();
      getGoodBehaviorCountSpy.mockRestore();
      resetBookingRestrictionsSpy.mockRestore();
    });
  });
});
