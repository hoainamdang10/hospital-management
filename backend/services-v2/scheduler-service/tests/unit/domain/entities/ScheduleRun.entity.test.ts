import { ScheduleRun, ScheduleRunStatus } from '../../../../src/domain/entities/ScheduleRun.entity';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import {
  ScheduleRunCreatedEvent,
  ScheduleRunStartedEvent,
  ScheduleRunCompletedEvent,
  ScheduleRunFailedEvent,
  ScheduleRunEmittedEvent
} from '../../../../src/domain/events/ScheduleRunEvents';

describe('ScheduleRun Entity', () => {
  const createValidScheduleRun = (overrides?: any) => {
    return ScheduleRun.create(
      'schedule-123',
      TenantId.create('test-tenant'),
      new Date('2025-01-15T10:00:00Z'),
      overrides?.segment
    );
  };

  describe('create', () => {
    it('should create a valid schedule run', () => {
      const run = createValidScheduleRun();

      expect(run).toBeDefined();
      expect(run.getRunId()).toBeDefined();
      expect(run.getScheduleId()).toBe('schedule-123');
      expect(run.getTenantId().getValue()).toBe('test-tenant');
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
      expect(run.getAttempt()).toBe(0);
    });

    it('should set default status to DUE', () => {
      const run = createValidScheduleRun();
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
    });

    it('should set attempt to 0', () => {
      const run = createValidScheduleRun();
      expect(run.getAttempt()).toBe(0);
    });

    it('should emit ScheduleRunCreatedEvent', () => {
      const run = createValidScheduleRun();
      const events = run.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleRunCreatedEvent);
    });

    it('should create run with segment', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z'),
        2
      );

      const props = run.getProps();
      expect(props.segment).toBe(2);
    });

    it('should create run without segment', () => {
      const run = createValidScheduleRun();
      const props = run.getProps();
      expect(props.segment).toBeUndefined();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute run from props', () => {
      const props = {
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: TenantId.create('test-tenant'),
        dueAtUtc: new Date('2025-01-15T10:00:00Z'),
        status: ScheduleRunStatus.DUE,
        attempt: 0,
        createdAt: new Date('2025-01-01T00:00:00Z')
      };

      const run = ScheduleRun.reconstitute(props);

      expect(run.getRunId()).toBe('run-123');
      expect(run.getScheduleId()).toBe('schedule-456');
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
    });

    it('should not emit domain events on reconstitution', () => {
      const props = {
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: TenantId.create('test-tenant'),
        dueAtUtc: new Date('2025-01-15T10:00:00Z'),
        status: ScheduleRunStatus.DUE,
        attempt: 0,
        createdAt: new Date('2025-01-01T00:00:00Z')
      };

      const run = ScheduleRun.reconstitute(props);
      const events = run.getDomainEvents();

      expect(events).toHaveLength(0);
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock for DUE run', () => {
      const run = createValidScheduleRun();
      const acquired = run.acquireLock('worker-1');

      expect(acquired).toBe(true);
      const props = run.getProps();
      expect(props.lockedBy).toBe('worker-1');
      expect(props.lockedAtUtc).toBeDefined();
    });

    it('should not acquire lock if run is not DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');

      const acquired = run.acquireLock('worker-2');
      expect(acquired).toBe(false);
    });

    it('should not acquire lock if already locked by another worker (within 60s)', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');

      const acquired = run.acquireLock('worker-2');
      expect(acquired).toBe(false);
    });

    it('should acquire lock if previous lock expired (>60s)', () => {
      const run = ScheduleRun.reconstitute({
        runId: 'run-123',
        scheduleId: 'schedule-456',
        tenantId: TenantId.create('test-tenant'),
        dueAtUtc: new Date('2025-01-15T10:00:00Z'),
        status: ScheduleRunStatus.DUE,
        attempt: 0,
        lockedBy: 'worker-1',
        lockedAtUtc: new Date(Date.now() - 61000), // 61 seconds ago
        createdAt: new Date('2025-01-01T00:00:00Z')
      });

      const acquired = run.acquireLock('worker-2');
      expect(acquired).toBe(true);
      expect(run.getProps().lockedBy).toBe('worker-2');
    });
  });

  describe('start', () => {
    it('should start a DUE run', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.clearDomainEvents();
      run.start('worker-1');

      expect(run.getStatus()).toBe(ScheduleRunStatus.RUNNING);
      const props = run.getProps();
      expect(props.startedAtUtc).toBeDefined();
    });

    it('should emit ScheduleRunStartedEvent', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.clearDomainEvents();
      run.start('worker-1');

      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleRunStartedEvent);
    });

    it('should throw error if run is not DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');

      expect(() => run.start('worker-1')).toThrow('Cannot start run in status: RUNNING');
    });

    it('should throw error if locked by another worker', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');

      expect(() => run.start('worker-2')).toThrow('Run is locked by another worker');
    });
  });

  describe('markAsEmitting', () => {
    it('should mark RUNNING run as EMITTING', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();

      expect(run.getStatus()).toBe(ScheduleRunStatus.EMITTING);
    });

    it('should throw error if run is not RUNNING', () => {
      const run = createValidScheduleRun();

      expect(() => run.markAsEmitting()).toThrow('Cannot mark as emitting from status: DUE');
    });
  });

  describe('markAsEmitted', () => {
    it('should mark EMITTING run as EMITTED', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.clearDomainEvents();
      run.markAsEmitted('test.command');

      expect(run.getStatus()).toBe(ScheduleRunStatus.EMITTED);
    });

    it('should emit ScheduleRunEmittedEvent', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.clearDomainEvents();
      run.markAsEmitted('test.command');

      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleRunEmittedEvent);
    });

    it('should throw error if run is not EMITTING', () => {
      const run = createValidScheduleRun();

      expect(() => run.markAsEmitted('test.command')).toThrow('Cannot mark as emitted from status: DUE');
    });
  });

  describe('markAsSucceeded', () => {
    it('should mark EMITTED run as SUCCEEDED', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.command');
      run.clearDomainEvents();
      run.markAsSucceeded();

      expect(run.getStatus()).toBe(ScheduleRunStatus.SUCCEEDED);
      const props = run.getProps();
      expect(props.finishedAtUtc).toBeDefined();
    });

    it('should emit ScheduleRunCompletedEvent with success=true', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsEmitting();
      run.markAsEmitted('test.command');
      run.clearDomainEvents();
      run.markAsSucceeded();

      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleRunCompletedEvent);
    });

    it('should throw error if run is not EMITTED', () => {
      const run = createValidScheduleRun();

      expect(() => run.markAsSucceeded()).toThrow('Cannot mark as succeeded from status: DUE');
    });
  });

  describe('markAsFailed', () => {
    it('should mark run as FAILED', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.clearDomainEvents();
      run.markAsFailed('Test error');

      expect(run.getStatus()).toBe(ScheduleRunStatus.FAILED);
      const props = run.getProps();
      expect(props.lastError).toBe('Test error');
      expect(props.finishedAtUtc).toBeDefined();
      expect(props.attempt).toBe(1);
    });

    it('should emit ScheduleRunFailedEvent', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.clearDomainEvents();
      run.markAsFailed('Test error');

      const events = run.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleRunFailedEvent);
    });

    it('should increment attempt counter', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Error 1');

      expect(run.getAttempt()).toBe(1);

      run.retry();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Error 2');

      expect(run.getAttempt()).toBe(2);
    });
  });

  describe('retry', () => {
    it('should reset FAILED run to DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Test error');
      run.retry();

      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
      const props = run.getProps();
      expect(props.lockedBy).toBeUndefined();
      expect(props.lockedAtUtc).toBeUndefined();
      expect(props.startedAtUtc).toBeUndefined();
      expect(props.finishedAtUtc).toBeUndefined();
    });

    it('should throw error if run is not FAILED', () => {
      const run = createValidScheduleRun();

      expect(() => run.retry()).toThrow('Can only retry failed runs');
    });

    it('should preserve attempt counter on retry', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');
      run.markAsFailed('Test error');

      const attemptBeforeRetry = run.getAttempt();
      run.retry();

      expect(run.getAttempt()).toBe(attemptBeforeRetry);
    });
  });

  describe('isDue', () => {
    it('should return true if run is DUE and dueAtUtc is in past', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T10:05:00Z');
      expect(run.isDue(now)).toBe(true);
    });

    it('should return false if run is DUE but dueAtUtc is in future', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T09:55:00Z');
      expect(run.isDue(now)).toBe(false);
    });

    it('should return false if run is not DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');

      const now = new Date('2025-01-15T10:05:00Z');
      expect(run.isDue(now)).toBe(false);
    });

    it('should use current time if not provided', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date(Date.now() - 60000) // 1 minute ago
      );

      expect(run.isDue()).toBe(true);
    });

    it('should return true if dueAtUtc equals now', () => {
      const dueAt = new Date('2025-01-15T10:00:00Z');
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        dueAt
      );

      expect(run.isDue(dueAt)).toBe(true);
    });
  });

  describe('isOverdue', () => {
    it('should return true if run is past grace window', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T10:02:00Z'); // 2 minutes after due
      expect(run.isOverdue(now, 60000)).toBe(true); // 1 minute grace window
    });

    it('should return false if run is within grace window', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T10:00:30Z'); // 30 seconds after due
      expect(run.isOverdue(now, 60000)).toBe(false); // 1 minute grace window
    });

    it('should return false if run is not DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');

      const now = new Date('2025-01-15T10:05:00Z');
      expect(run.isOverdue(now)).toBe(false);
    });

    it('should use default grace window of 60 seconds', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T10:01:30Z'); // 90 seconds after due
      expect(run.isOverdue(now)).toBe(true); // Default 60s grace window
    });

    it('should use current time if not provided', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date(Date.now() - 120000) // 2 minutes ago
      );

      expect(run.isOverdue()).toBe(true);
    });
  });

  describe('getQueueLag', () => {
    it('should return lag in seconds for DUE run', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T10:02:00Z'); // 2 minutes after due
      const lag = run.getQueueLag(now);

      expect(lag).toBe(120); // 120 seconds
    });

    it('should return 0 if run is not DUE', () => {
      const run = createValidScheduleRun();
      run.acquireLock('worker-1');
      run.start('worker-1');

      const now = new Date('2025-01-15T10:05:00Z');
      expect(run.getQueueLag(now)).toBe(0);
    });

    it('should return 0 if dueAtUtc is in future', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date('2025-01-15T10:00:00Z')
      );

      const now = new Date('2025-01-15T09:55:00Z');
      expect(run.getQueueLag(now)).toBe(0);
    });

    it('should use current time if not provided', () => {
      const run = ScheduleRun.create(
        'schedule-123',
        TenantId.create('test-tenant'),
        new Date(Date.now() - 60000) // 1 minute ago
      );

      const lag = run.getQueueLag();
      expect(lag).toBeGreaterThanOrEqual(60); // At least 60 seconds
    });
  });

  describe('domain events', () => {
    it('should accumulate domain events', () => {
      const run = createValidScheduleRun();
      expect(run.getDomainEvents()).toHaveLength(1); // ScheduleRunCreatedEvent

      run.acquireLock('worker-1');
      run.start('worker-1');
      expect(run.getDomainEvents()).toHaveLength(2); // + ScheduleRunStartedEvent

      run.markAsEmitting();
      run.markAsEmitted('test.command');
      expect(run.getDomainEvents()).toHaveLength(3); // + ScheduleRunEmittedEvent

      run.markAsSucceeded();
      expect(run.getDomainEvents()).toHaveLength(4); // + ScheduleRunCompletedEvent
    });

    it('should clear domain events', () => {
      const run = createValidScheduleRun();
      expect(run.getDomainEvents()).toHaveLength(1);

      run.clearDomainEvents();
      expect(run.getDomainEvents()).toHaveLength(0);
    });

    it('should return copy of domain events', () => {
      const run = createValidScheduleRun();
      const events1 = run.getDomainEvents();
      const events2 = run.getDomainEvents();

      expect(events1).not.toBe(events2); // Different array instances
      expect(events1).toEqual(events2); // Same content
    });
  });

  describe('getters', () => {
    it('should get runId', () => {
      const run = createValidScheduleRun();
      expect(run.getRunId()).toBeDefined();
      expect(typeof run.getRunId()).toBe('string');
    });

    it('should get scheduleId', () => {
      const run = createValidScheduleRun();
      expect(run.getScheduleId()).toBe('schedule-123');
    });

    it('should get tenantId', () => {
      const run = createValidScheduleRun();
      expect(run.getTenantId().getValue()).toBe('test-tenant');
    });

    it('should get status', () => {
      const run = createValidScheduleRun();
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
    });

    it('should get attempt', () => {
      const run = createValidScheduleRun();
      expect(run.getAttempt()).toBe(0);
    });

    it('should get props as readonly copy', () => {
      const run = createValidScheduleRun();
      const props1 = run.getProps();
      const props2 = run.getProps();

      expect(props1).not.toBe(props2); // Different object instances
      expect(props1).toEqual(props2); // Same content
    });
  });

  describe('status transitions', () => {
    it('should follow happy path: DUE -> RUNNING -> EMITTING -> EMITTED -> SUCCEEDED', () => {
      const run = createValidScheduleRun();
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);

      run.acquireLock('worker-1');
      run.start('worker-1');
      expect(run.getStatus()).toBe(ScheduleRunStatus.RUNNING);

      run.markAsEmitting();
      expect(run.getStatus()).toBe(ScheduleRunStatus.EMITTING);

      run.markAsEmitted('test.command');
      expect(run.getStatus()).toBe(ScheduleRunStatus.EMITTED);

      run.markAsSucceeded();
      expect(run.getStatus()).toBe(ScheduleRunStatus.SUCCEEDED);
    });

    it('should follow failure path: DUE -> RUNNING -> FAILED -> DUE (retry)', () => {
      const run = createValidScheduleRun();
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);

      run.acquireLock('worker-1');
      run.start('worker-1');
      expect(run.getStatus()).toBe(ScheduleRunStatus.RUNNING);

      run.markAsFailed('Test error');
      expect(run.getStatus()).toBe(ScheduleRunStatus.FAILED);

      run.retry();
      expect(run.getStatus()).toBe(ScheduleRunStatus.DUE);
    });
  });
});

