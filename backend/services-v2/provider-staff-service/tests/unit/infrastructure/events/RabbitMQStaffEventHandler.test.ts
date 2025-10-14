/**
 * RabbitMQStaffEventHandler Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RabbitMQStaffEventHandler } from '../../../../src/infrastructure/events/RabbitMQStaffEventHandler';
import { createMockLogger, createMockEventPublisher, createMockDomainEvent } from '../../../helpers/mockFactories';

describe('RabbitMQStaffEventHandler', () => {
  let eventHandler: RabbitMQStaffEventHandler;
  let mockEventPublisher: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEventPublisher = createMockEventPublisher();
    mockLogger = createMockLogger();

    eventHandler = new RabbitMQStaffEventHandler(mockEventPublisher, mockLogger);
  });

  describe('handleStaffRegistered', () => {
    it('should publish StaffRegistered integration event', async () => {
      const domainEvent = createMockDomainEvent('StaffRegisteredEvent', {
        aggregateId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Nội',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345',
        registrationDate: new Date().toISOString()
      });

      await eventHandler.handleStaffRegistered(domainEvent);

      expect(mockEventPublisher.publishAll).toHaveBeenCalledTimes(1);
      
      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      expect(publishedEvents).toHaveLength(3);
      
      // Check Identity Service event
      expect(publishedEvents[0]).toMatchObject({
        eventType: 'provider.staff.registered',
        aggregateId: 'STF-202501-001',
        serviceName: 'provider-staff-service'
      });
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Handling StaffRegisteredEvent')
      );
    });

    it('should include all required data in integration event', async () => {
      const domainEvent = createMockDomainEvent('StaffRegisteredEvent', {
        aggregateId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Tim mạch',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345'
      });

      await eventHandler.handleStaffRegistered(domainEvent);

      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      const identityEvent = publishedEvents[0];

      expect(identityEvent.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Nguyễn Văn Test',
        department: 'Khoa Tim mạch',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345'
      });
    });

    it('should publish events to Identity, Scheduling, and Clinical services', async () => {
      const domainEvent = createMockDomainEvent('StaffRegisteredEvent', {
        aggregateId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor'
      });

      await eventHandler.handleStaffRegistered(domainEvent);

      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      
      expect(publishedEvents).toHaveLength(3);
      expect(publishedEvents[0].eventType).toBe('provider.staff.registered');
      expect(publishedEvents[1].eventType).toBe('provider.staff.registered');
      expect(publishedEvents[2].eventType).toBe('provider.staff.registered');
    });

    it('should handle errors gracefully', async () => {
      mockEventPublisher.publishAll.mockRejectedValue(new Error('Publish failed'));

      const domainEvent = createMockDomainEvent('StaffRegisteredEvent', {
        aggregateId: 'STF-202501-001'
      });

      await expect(eventHandler.handleStaffRegistered(domainEvent)).rejects.toThrow('Publish failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleStaffUpdated', () => {
    it('should publish StaffUpdated integration event', async () => {
      const domainEvent = createMockDomainEvent('StaffUpdatedEvent', {
        aggregateId: 'STF-202501-001',
        userId: 'user-123',
        updatedFields: ['consultationFee', 'workSchedule'],
        consultationFee: 600000,
        workSchedule: { monday: { start: '08:00', end: '17:00' } }
      });

      await eventHandler.handleStaffUpdated(domainEvent);

      expect(mockEventPublisher.publishAll).toHaveBeenCalled();
      
      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      expect(publishedEvents.length).toBeGreaterThan(0);
      
      expect(publishedEvents[0]).toMatchObject({
        eventType: 'provider.staff.updated',
        aggregateId: 'STF-202501-001'
      });
    });

    it('should notify Scheduling Service when work schedule changes', async () => {
      const domainEvent = createMockDomainEvent('StaffUpdatedEvent', {
        aggregateId: 'STF-202501-001',
        updatedFields: ['workSchedule'],
        workSchedule: { monday: { start: '09:00', end: '18:00' } }
      });

      await eventHandler.handleStaffUpdated(domainEvent);

      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      
      const schedulingEvent = publishedEvents.find((e: any) => 
        e.eventData.notifySchedulingService === true
      );
      
      expect(schedulingEvent).toBeDefined();
    });

    it('should notify Billing Service when consultation fee changes', async () => {
      const domainEvent = createMockDomainEvent('StaffUpdatedEvent', {
        aggregateId: 'STF-202501-001',
        updatedFields: ['consultationFee'],
        consultationFee: 700000
      });

      await eventHandler.handleStaffUpdated(domainEvent);

      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      
      const billingEvent = publishedEvents.find((e: any) => 
        e.eventData.notifyBillingService === true
      );
      
      expect(billingEvent).toBeDefined();
    });

    it('should include updated fields in event data', async () => {
      const domainEvent = createMockDomainEvent('StaffUpdatedEvent', {
        aggregateId: 'STF-202501-001',
        updatedFields: ['specialization', 'department'],
        specialization: 'Nội tiết',
        department: 'Khoa Nội tiết'
      });

      await eventHandler.handleStaffUpdated(domainEvent);

      const publishedEvents = mockEventPublisher.publishAll.mock.calls[0][0];
      
      expect(publishedEvents[0].eventData.updatedFields).toEqual(['specialization', 'department']);
    });
  });

  describe('handleDoctorAvailabilityChanged', () => {
    it('should publish DoctorAvailabilityChanged integration event', async () => {
      const domainEvent = createMockDomainEvent('DoctorAvailabilityChangedEvent', {
        aggregateId: 'STF-202501-001',
        isAcceptingNewPatients: false,
        reason: 'Đang nghỉ phép',
        effectiveDate: new Date().toISOString()
      });

      await eventHandler.handleDoctorAvailabilityChanged(domainEvent);

      expect(mockEventPublisher.publish).toHaveBeenCalled();
      
      const publishedEvent = mockEventPublisher.publish.mock.calls[0][0];
      
      expect(publishedEvent).toMatchObject({
        eventType: 'provider.doctor.availability.changed',
        aggregateId: 'STF-202501-001'
      });
      
      expect(publishedEvent.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        isAcceptingNewPatients: false,
        reason: 'Đang nghỉ phép'
      });
    });

    it('should set high priority for availability changes', async () => {
      const domainEvent = createMockDomainEvent('DoctorAvailabilityChangedEvent', {
        aggregateId: 'STF-202501-001',
        isAcceptingNewPatients: false
      });

      await eventHandler.handleDoctorAvailabilityChanged(domainEvent);

      const publishedEvent = mockEventPublisher.publish.mock.calls[0][0];
      
      expect(publishedEvent.metadata.priority).toBe('high');
    });

    it('should notify Scheduling Service', async () => {
      const domainEvent = createMockDomainEvent('DoctorAvailabilityChangedEvent', {
        aggregateId: 'STF-202501-001',
        isAcceptingNewPatients: true
      });

      await eventHandler.handleDoctorAvailabilityChanged(domainEvent);

      expect(mockEventPublisher.publish).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Handling DoctorAvailabilityChangedEvent')
      );
    });
  });

  describe('handleStaffStatusChanged', () => {
    it('should publish StaffStatusChanged integration event', async () => {
      const domainEvent = createMockDomainEvent('StaffStatusChangedEvent', {
        aggregateId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Nghỉ việc',
        changedBy: 'admin-123'
      });

      await eventHandler.handleStaffStatusChanged(domainEvent);

      expect(mockEventPublisher.publish).toHaveBeenCalled();
      
      const publishedEvent = mockEventPublisher.publish.mock.calls[0][0];
      
      expect(publishedEvent).toMatchObject({
        eventType: 'provider.staff.status.changed',
        aggregateId: 'STF-202501-001'
      });
      
      expect(publishedEvent.eventData).toMatchObject({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Nghỉ việc',
        changedBy: 'admin-123'
      });
    });

    it('should set high priority for status changes', async () => {
      const domainEvent = createMockDomainEvent('StaffStatusChangedEvent', {
        aggregateId: 'STF-202501-001',
        previousStatus: 'active',
        newStatus: 'suspended'
      });

      await eventHandler.handleStaffStatusChanged(domainEvent);

      const publishedEvent = mockEventPublisher.publish.mock.calls[0][0];
      
      expect(publishedEvent.metadata.priority).toBe('high');
    });
  });

  describe('handle', () => {
    it('should route StaffRegisteredEvent to handleStaffRegistered', async () => {
      const spy = jest.spyOn(eventHandler, 'handleStaffRegistered');
      
      const domainEvent = createMockDomainEvent('StaffRegisteredEvent', {
        aggregateId: 'STF-202501-001'
      });

      await eventHandler.handle(domainEvent);

      expect(spy).toHaveBeenCalledWith(domainEvent);
    });

    it('should route StaffUpdatedEvent to handleStaffUpdated', async () => {
      const spy = jest.spyOn(eventHandler, 'handleStaffUpdated');
      
      const domainEvent = createMockDomainEvent('StaffUpdatedEvent', {
        aggregateId: 'STF-202501-001'
      });

      await eventHandler.handle(domainEvent);

      expect(spy).toHaveBeenCalledWith(domainEvent);
    });

    it('should route DoctorAvailabilityChangedEvent to handleDoctorAvailabilityChanged', async () => {
      const spy = jest.spyOn(eventHandler, 'handleDoctorAvailabilityChanged');
      
      const domainEvent = createMockDomainEvent('DoctorAvailabilityChangedEvent', {
        aggregateId: 'STF-202501-001'
      });

      await eventHandler.handle(domainEvent);

      expect(spy).toHaveBeenCalledWith(domainEvent);
    });

    it('should log warning for unknown event types', async () => {
      const domainEvent = createMockDomainEvent('UnknownEvent', {
        aggregateId: 'STF-202501-001'
      });

      await eventHandler.handle(domainEvent);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unknown event type')
      );
    });
  });
});

