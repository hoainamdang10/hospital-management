import {
  ScheduleRunCreatedEvent,
  ScheduleRunStartedEvent,
  ScheduleRunCompletedEvent,
  ScheduleRunFailedEvent,
  ScheduleRunEmittedEvent
} from '../../../../src/domain/events/ScheduleRunEvents';

describe('ScheduleRun Domain Events', () => {
  describe('ScheduleRunCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const dueAt = new Date('2025-01-15T10:00:00Z');
      const event = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        dueAt
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('run-123');
      expect(event.aggregateType).toBe('ScheduleRun');
      expect(event.eventType).toBe('ScheduleRunCreated');
      expect(event.eventData).toEqual({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: 'tenant-789',
        dueAtUtc: dueAt.toISOString()
      });
    });

    it('should serialize dueAtUtc to ISO string', () => {
      const dueAt = new Date('2025-01-15T10:00:00Z');
      const event = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        dueAt
      );

      expect(event.eventData.dueAtUtc).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should have timestamp', () => {
      const before = new Date();
      const event = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        new Date()
      );
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('ScheduleRunStartedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleRunStartedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'worker-1'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('run-123');
      expect(event.aggregateType).toBe('ScheduleRun');
      expect(event.eventType).toBe('ScheduleRunStarted');
      expect(event.eventData).toEqual({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: 'tenant-789',
        workerId: 'worker-1'
      });
    });

    it('should include workerId in data', () => {
      const event = new ScheduleRunStartedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'worker-abc-123'
      );

      expect(event.eventData.workerId).toBe('worker-abc-123');
    });
  });

  describe('ScheduleRunCompletedEvent', () => {
    it('should create event with success=true', () => {
      const event = new ScheduleRunCompletedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        true
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('run-123');
      expect(event.aggregateType).toBe('ScheduleRun');
      expect(event.eventType).toBe('ScheduleRunCompleted');
      expect(event.eventData).toEqual({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: 'tenant-789',
        success: true,
        error: undefined
      });
    });

    it('should create event with success=false and error', () => {
      const event = new ScheduleRunCompletedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        false,
        'Test error message'
      );

      expect(event.eventData.success).toBe(false);
      expect(event.eventData.error).toBe('Test error message');
    });

    it('should create event without error when success=true', () => {
      const event = new ScheduleRunCompletedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        true
      );

      expect(event.eventData.error).toBeUndefined();
    });
  });

  describe('ScheduleRunFailedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Connection timeout',
        3
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('run-123');
      expect(event.aggregateType).toBe('ScheduleRun');
      expect(event.eventType).toBe('ScheduleRunFailed');
      expect(event.eventData).toEqual({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: 'tenant-789',
        error: 'Connection timeout',
        attempt: 3
      });
    });

    it('should include attempt number', () => {
      const event = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Error',
        1
      );

      expect(event.eventData.attempt).toBe(1);
    });

    it('should handle attempt number 0', () => {
      const event = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Error',
        0
      );

      expect(event.eventData.attempt).toBe(0);
    });

    it('should handle large attempt numbers', () => {
      const event = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Error',
        100
      );

      expect(event.eventData.attempt).toBe(100);
    });
  });

  describe('ScheduleRunEmittedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new ScheduleRunEmittedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'test.command'
      );

      expect(event).toBeDefined();
      expect(event.aggregateId).toBe('run-123');
      expect(event.aggregateType).toBe('ScheduleRun');
      expect(event.eventType).toBe('ScheduleRunEmitted');
      expect(event.eventData).toEqual({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: 'tenant-789',
        topicOrCommand: 'test.command'
      });
    });

    it('should include topicOrCommand in data', () => {
      const event = new ScheduleRunEmittedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'patient.appointment.reminder'
      );

      expect(event.eventData.topicOrCommand).toBe('patient.appointment.reminder');
    });
  });

  describe('event immutability', () => {
    it('should not allow modification of event data', () => {
      const event = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        new Date()
      );

      const originalData = { ...event.eventData };

      // Attempt to modify should throw error because eventData is frozen
      expect(() => {
        (event.eventData as any).runId = 'modified-id';
      }).toThrow();

      // Original data should remain unchanged
      expect(event.eventData.runId).toBe(originalData.runId);
    });
  });

  describe('event serialization', () => {
    it('should serialize ScheduleRunCreatedEvent to JSON', () => {
      const dueAt = new Date('2025-01-15T10:00:00Z');
      const event = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        dueAt
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.aggregateId).toBe('run-123');
      expect(parsed.eventType).toBe('ScheduleRunCreated');
      expect(parsed.eventData.dueAtUtc).toBe(dueAt.toISOString());
    });

    it('should serialize ScheduleRunFailedEvent to JSON', () => {
      const event = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Test error',
        2
      );

      const json = JSON.stringify(event);
      const parsed = JSON.parse(json);

      expect(parsed.eventData.error).toBe('Test error');
      expect(parsed.eventData.attempt).toBe(2);
    });
  });

  describe('event lifecycle', () => {
    it('should create events in correct order for successful run', () => {
      const createdEvent = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        new Date()
      );

      const startedEvent = new ScheduleRunStartedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'worker-1'
      );

      const emittedEvent = new ScheduleRunEmittedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'test.command'
      );

      const completedEvent = new ScheduleRunCompletedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        true
      );

      expect(createdEvent.eventType).toBe('ScheduleRunCreated');
      expect(startedEvent.eventType).toBe('ScheduleRunStarted');
      expect(emittedEvent.eventType).toBe('ScheduleRunEmitted');
      expect(completedEvent.eventType).toBe('ScheduleRunCompleted');
    });

    it('should create events in correct order for failed run', () => {
      const createdEvent = new ScheduleRunCreatedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        new Date()
      );

      const startedEvent = new ScheduleRunStartedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'worker-1'
      );

      const failedEvent = new ScheduleRunFailedEvent(
        'run-123',
        'schedule-456',
        'tenant-789',
        'Connection error',
        1
      );

      expect(createdEvent.eventType).toBe('ScheduleRunCreated');
      expect(startedEvent.eventType).toBe('ScheduleRunStarted');
      expect(failedEvent.eventType).toBe('ScheduleRunFailed');
    });
  });
});

