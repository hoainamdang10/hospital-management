/**
 * RabbitMQStaffEventHandler Unit Tests (updated for v2 implementation)
 */

import { RabbitMQStaffEventHandler } from '../../../../src/infrastructure/events/RabbitMQStaffEventHandler';
import {
  createMockDomainEvent,
  createMockEventPublisher,
  createMockLogger
} from '../../../helpers/mockFactories';

describe('RabbitMQStaffEventHandler', () => {
  let handler: RabbitMQStaffEventHandler;
  let mockPublisher: ReturnType<typeof createMockEventPublisher>;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPublisher = createMockEventPublisher();
    mockLogger = createMockLogger();
    handler = new RabbitMQStaffEventHandler(mockPublisher as any, mockLogger);
  });

  describe('handleStaffRegistered', () => {
    it('publishes integration + notification events for doctor registration', async () => {
      const domainEvent = createMockDomainEvent('StaffRegistered', {
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Tim mạch',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345'
      });

      await handler.handleStaffRegistered(domainEvent as any);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(4);

      const publishedEvents = mockPublisher.publish.mock.calls.map(call => call[0]);
      expect(publishedEvents[0].eventType).toBe('provider.staff.registered');
      expect(publishedEvents[1]).toMatchObject({
        eventType: 'identity.staff-registered',
        eventData: expect.objectContaining({
          staffId: 'STF-202501-001',
          userId: 'user-123',
          staffType: 'doctor'
        })
      });
      expect(publishedEvents[2]).toMatchObject({
        eventType: 'scheduling.doctor-registered',
        eventData: expect.objectContaining({
          staffId: 'STF-202501-001',
          requiresScheduleInitialization: true
        })
      });
      expect(publishedEvents[3]).toMatchObject({
        eventType: 'clinical.provider-registered',
        eventData: expect.objectContaining({
          staffId: 'STF-202501-001',
          licenseNumber: 'BYS-12345'
        })
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'StaffRegistered event processed successfully',
        expect.objectContaining({ staffId: 'STF-202501-001' })
      );
    });

    it('logs and rethrows when publishing fails', async () => {
      mockPublisher.publish.mockRejectedValueOnce(new Error('Publish failed'));
      const domainEvent = createMockDomainEvent('StaffRegistered', {
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor'
      });

      await expect(handler.handleStaffRegistered(domainEvent as any)).rejects.toThrow('Publish failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to handle StaffRegistered event',
        expect.objectContaining({ error: 'Publish failed' })
      );
    });
  });

  describe('handleStaffUpdated', () => {
    it('publishes updates and notifies scheduling/billing when relevant fields change', async () => {
      const domainEvent = createMockDomainEvent('StaffUpdated', {
        staffId: 'STF-202501-001',
        updatedFields: ['workSchedule', 'consultationFee'],
        updatedData: {
          workSchedule: { monday: { start: '08:00', end: '17:00' } },
          consultationFee: 650000
        }
      });

      await handler.handleStaffUpdated(domainEvent as any);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(3);

      const [integrationEvent, schedulingEvent, billingEvent] = mockPublisher.publish.mock.calls.map(call => call[0]);
      expect(integrationEvent.eventType).toBe('provider.staff.updated');
      expect(schedulingEvent).toMatchObject({
        eventType: 'scheduling.work-schedule-updated',
        eventData: expect.objectContaining({
          staffId: 'STF-202501-001'
        })
      });
      expect(billingEvent).toMatchObject({
        eventType: 'billing.consultation-fee-updated',
        eventData: expect.objectContaining({
          consultationFee: 650000
        })
      });
    });
  });

  describe('handleDoctorAvailabilityChanged', () => {
    it('marks integration event as high priority and notifies scheduling', async () => {
      const domainEvent = createMockDomainEvent('DoctorAvailabilityChanged', {
        staffId: 'STF-202501-001',
        isAcceptingNewPatients: false,
        reason: 'Annual leave'
      });

      await handler.handleDoctorAvailabilityChanged(domainEvent as any);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(2);
      const [integrationEvent, schedulingEvent] = mockPublisher.publish.mock.calls.map(call => call[0]);

      expect(integrationEvent.eventType).toBe('provider.doctor.availability.changed');
      expect(integrationEvent.metadata.priority).toBe('high');
      expect(schedulingEvent.eventType).toBe('scheduling.doctor-availability-changed');
    });
  });

  describe('handleStaffStatusChanged', () => {
    it('publishes high-priority status change event', async () => {
      const domainEvent = createMockDomainEvent('StaffStatusChanged', {
        staffId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Resigned',
        changedBy: 'admin-001'
      });

      await handler.handleStaffStatusChanged(domainEvent as any);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = mockPublisher.publish.mock.calls[0][0];
      expect(publishedEvent.eventType).toBe('provider.staff.status.changed');
      expect(publishedEvent.metadata.priority).toBe('high');
    });
  });

  describe('handle', () => {
    it('routes known event types to specific handlers', async () => {
      const registeredEvent = createMockDomainEvent('StaffRegistered', {
        staffId: 'STF-1',
        staffType: 'doctor',
        userId: 'user-1'
      });
      const updatedEvent = createMockDomainEvent('StaffUpdated', {
        staffId: 'STF-2',
        updatedFields: [],
        updatedData: {}
      });
      const availabilityEvent = createMockDomainEvent('DoctorAvailabilityChanged', {
        staffId: 'STF-3',
        isAcceptingNewPatients: true
      });

      const registeredSpy = jest.spyOn(handler, 'handleStaffRegistered');
      const updatedSpy = jest.spyOn(handler, 'handleStaffUpdated');
      const availabilitySpy = jest.spyOn(handler, 'handleDoctorAvailabilityChanged');

      await handler.handle(registeredEvent as any);
      await handler.handle(updatedEvent as any);
      await handler.handle(availabilityEvent as any);

      expect(registeredSpy).toHaveBeenCalledWith(registeredEvent);
      expect(updatedSpy).toHaveBeenCalledWith(updatedEvent);
      expect(availabilitySpy).toHaveBeenCalledWith(availabilityEvent);
    });

    it('logs warning for unknown event types', async () => {
      const unknownEvent = createMockDomainEvent('SomeUnknownEvent', { staffId: 'STF-999' });

      await handler.handle(unknownEvent as any);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unknown event type',
        expect.objectContaining({
          eventType: 'SomeUnknownEvent'
        })
      );
    });
  });
});
