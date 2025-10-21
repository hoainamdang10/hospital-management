import {
  ScheduleCreatedEvent,
  ScheduleUpdatedEvent,
  ScheduleCancelledEvent,
  SchedulePausedEvent,
  ScheduleResumedEvent
} from '../../../../src/domain/events/ScheduleEvents';

describe('Schedule Domain Events', () => {
  describe('ScheduleCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('schedule-123');
      expect(event.aggregateType).toBe('Schedule');
      expect(event.eventType).toBe('ScheduleCreated');
      expect(event.eventData).toEqual({
        scheduleId: 'schedule-123',
        tenantId: 'tenant-456',
        ownerService: 'test-service',
        topicOrCommand: 'test.command'
      });
    });

    it('should have timestamp', () => {
      const before = new Date();
      const event = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have eventId', () => {
      const event = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );

      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
    });
  });

  describe('ScheduleUpdatedEvent', () => {
    it('should create event with correct properties', () => {
      const changes = {
        payloadJson: { updated: true },
        maxRuns: 100
      };

      const event = new ScheduleUpdatedEvent(
        'schedule-123',
        'tenant-456',
        changes
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('schedule-123');
      expect(event.aggregateType).toBe('Schedule');
      expect(event.eventType).toBe('ScheduleUpdated');
      expect(event.eventData).toEqual({
        scheduleId: 'schedule-123',
        tenantId: 'tenant-456',
        changes
      });
    });

    it('should handle empty changes', () => {
      const event = new ScheduleUpdatedEvent(
        'schedule-123',
        'tenant-456',
        {}
      );

      expect(event.eventData.changes).toEqual({});
    });

    it('should handle multiple changes', () => {
      const changes = {
        payloadJson: { updated: true },
        maxRuns: 100,
        endAtUtc: new Date('2025-12-31T23:59:59Z')
      };

      const event = new ScheduleUpdatedEvent(
        'schedule-123',
        'tenant-456',
        changes
      );

      expect(event.eventData.changes).toEqual(changes);
    });
  });

  describe('ScheduleCancelledEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleCancelledEvent(
        'schedule-123',
        'tenant-456',
        'User requested cancellation'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('schedule-123');
      expect(event.aggregateType).toBe('Schedule');
      expect(event.eventType).toBe('ScheduleCancelled');
      expect(event.eventData).toEqual({
        scheduleId: 'schedule-123',
        tenantId: 'tenant-456',
        reason: 'User requested cancellation'
      });
    });

    it('should create event without reason', () => {
      const event = new ScheduleCancelledEvent(
        'schedule-123',
        'tenant-456'
      );

      expect(event.eventData.reason).toBeUndefined();
    });

    it('should handle empty reason', () => {
      const event = new ScheduleCancelledEvent(
        'schedule-123',
        'tenant-456',
        ''
      );

      expect(event.eventData.reason).toBe('');
    });
  });

  describe('SchedulePausedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SchedulePausedEvent(
        'schedule-123',
        'tenant-456'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('schedule-123');
      expect(event.aggregateType).toBe('Schedule');
      expect(event.eventType).toBe('SchedulePaused');
      expect(event.eventData).toEqual({
        scheduleId: 'schedule-123',
        tenantId: 'tenant-456'
      });
    });

    it('should have timestamp', () => {
      const before = new Date();
      const event = new SchedulePausedEvent(
        'schedule-123',
        'tenant-456'
      );
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('ScheduleResumedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleResumedEvent(
        'schedule-123',
        'tenant-456'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('schedule-123');
      expect(event.aggregateType).toBe('Schedule');
      expect(event.eventType).toBe('ScheduleResumed');
      expect(event.eventData).toEqual({
        scheduleId: 'schedule-123',
        tenantId: 'tenant-456'
      });
    });

    it('should have timestamp', () => {
      const before = new Date();
      const event = new ScheduleResumedEvent(
        'schedule-123',
        'tenant-456'
      );
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('event immutability', () => {
    it('should not allow modification of event data', () => {
      const event = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );

      const originalData = { ...event.eventData };

      // Attempt to modify should throw error because eventData is frozen
      expect(() => {
        (event.eventData as any).scheduleId = 'modified-id';
      }).toThrow();

      // Original data should remain unchanged
      expect(event.eventData.scheduleId).toBe(originalData.scheduleId);
    });
  });

  describe('event serialization', () => {
    it('should serialize ScheduleCreatedEvent to JSON', () => {
      const event = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.aggregateId).toBe('schedule-123');
      expect(parsed.eventType).toBe('ScheduleCreated');
    });

    it('should serialize ScheduleUpdatedEvent to JSON', () => {
      const changes = { payloadJson: { updated: true } };
      const event = new ScheduleUpdatedEvent(
        'schedule-123',
        'tenant-456',
        changes
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.eventData.changes).toEqual(changes);
    });

    it('should serialize ScheduleCancelledEvent to JSON', () => {
      const event = new ScheduleCancelledEvent(
        'schedule-123',
        'tenant-456',
        'Test reason'
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.eventData.reason).toBe('Test reason');
    });
  });

  describe('event ordering', () => {
    it('should create events with increasing timestamps', () => {
      const event1 = new ScheduleCreatedEvent(
        'schedule-123',
        'tenant-456',
        'test-service',
        'test.command'
      );

      // Small delay to ensure different timestamps
      const event2 = new SchedulePausedEvent(
        'schedule-123',
        'tenant-456'
      );

      expect(event2.occurredAt.getTime()).toBeGreaterThanOrEqual(event1.occurredAt.getTime());
    });
  });
});

