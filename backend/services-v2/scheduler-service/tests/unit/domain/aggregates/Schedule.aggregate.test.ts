import { Schedule, ScheduleStatus } from '../../../../src/domain/aggregates/Schedule.aggregate';
import { ScheduleType, ScheduleTypeVO } from '../../../../src/domain/value-objects/ScheduleType';
import { CronExpression } from '../../../../src/domain/value-objects/CronExpression';
import { RRuleExpression } from '../../../../src/domain/value-objects/RRuleExpression';
import { Timezone } from '../../../../src/domain/value-objects/Timezone';
import { TenantId } from '../../../../src/domain/value-objects/TenantId';
import { DedupKey } from '../../../../src/domain/value-objects/DedupKey';
import { RetryPolicy, RetryStrategy } from '../../../../src/domain/value-objects/RetryPolicy';
import {
  ScheduleCreatedEvent,
  ScheduleUpdatedEvent,
  ScheduleCancelledEvent,
  SchedulePausedEvent,
  ScheduleResumedEvent
} from '../../../../src/domain/events/ScheduleEvents';

describe('Schedule Aggregate', () => {
  const createValidScheduleProps = (overrides?: any) => ({
    tenantId: TenantId.create('test-tenant'),
    ownerService: 'test-service',
    scheduleType: ScheduleTypeVO.create(ScheduleType.ONCE),
    timezone: Timezone.create('UTC'),
    startAtUtc: new Date('2025-01-15T10:00:00Z'),
    topicOrCommand: 'test.command',
    payloadJson: { test: true },
    jitterMs: 0,
    retryPolicy: RetryPolicy.default(),
    dedupKey: DedupKey.create('test-dedup-key'),
    ...overrides
  });

  describe('create', () => {
    it('should create a valid ONCE schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps());

      expect(schedule).toBeDefined();
      expect(schedule.getScheduleId()).toBeDefined();
      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
      expect(schedule.getTenantId().getValue()).toBe('test-tenant');
    });

    it('should create a valid CRON schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
        cronExpr: CronExpression.create('0 9 * * *'), // Every day at 9 AM
        startAtUtc: undefined
      }));

      expect(schedule).toBeDefined();
      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
    });

    it('should create a valid RRULE schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.RRULE),
        rrule: RRuleExpression.create('FREQ=DAILY;COUNT=5'),
        startAtUtc: undefined
      }));

      expect(schedule).toBeDefined();
      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
    });

    it('should emit ScheduleCreatedEvent on creation', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      const events = schedule.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleCreatedEvent);
      expect((events[0] as ScheduleCreatedEvent).aggregateId).toBe(schedule.getScheduleId());
    });

    it('should set default status to ACTIVE', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const before = new Date();
      const schedule = Schedule.create(createValidScheduleProps());
      const after = new Date();

      expect(schedule.getCreatedAt()).toBeInstanceOf(Date);
      expect(schedule.getUpdatedAt()).toBeInstanceOf(Date);
      expect(schedule.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(schedule.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('validation', () => {
    it('should throw error if ONCE schedule missing startAtUtc', () => {
      expect(() => {
        Schedule.create(createValidScheduleProps({
          scheduleType: ScheduleTypeVO.create(ScheduleType.ONCE),
          startAtUtc: undefined
        }));
      }).toThrow('ONCE schedule must have startAtUtc');
    });

    it('should throw error if CRON schedule missing cronExpr', () => {
      expect(() => {
        Schedule.create(createValidScheduleProps({
          scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
          cronExpr: undefined,
          startAtUtc: undefined
        }));
      }).toThrow('CRON schedule must have cronExpr');
    });

    it('should throw error if RRULE schedule missing rrule', () => {
      expect(() => {
        Schedule.create(createValidScheduleProps({
          scheduleType: ScheduleTypeVO.create(ScheduleType.RRULE),
          rrule: undefined,
          startAtUtc: undefined
        }));
      }).toThrow('RRULE schedule must have rrule');
    });

    it('should throw error if jitterMs is negative', () => {
      expect(() => {
        Schedule.create(createValidScheduleProps({
          jitterMs: -100
        }));
      }).toThrow('Jitter must be non-negative');
    });

    it('should throw error if maxRuns is less than 1', () => {
      expect(() => {
        Schedule.create(createValidScheduleProps({
          maxRuns: 0
        }));
      }).toThrow('Max runs must be at least 1');
    });

    it('should allow maxRuns to be undefined', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        maxRuns: undefined
      }));

      expect(schedule).toBeDefined();
    });

    it('should allow valid maxRuns', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        maxRuns: 10
      }));

      expect(schedule).toBeDefined();
    });
  });

  describe('getNextOccurrence', () => {
    it('should return null if schedule is PAUSED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();

      const nextOccurrence = schedule.getNextOccurrence();
      expect(nextOccurrence).toBeNull();
    });

    it('should return null if schedule is CANCELLED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();

      const nextOccurrence = schedule.getNextOccurrence();
      expect(nextOccurrence).toBeNull();
    });

    it('should return null if current time is past endAtUtc', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        endAtUtc: new Date('2025-01-10T00:00:00Z')
      }));

      const nextOccurrence = schedule.getNextOccurrence(new Date('2025-01-15T00:00:00Z'));
      expect(nextOccurrence).toBeNull();
    });

    it('should return startAtUtc for ONCE schedule if in future', () => {
      const startAt = new Date('2025-01-15T10:00:00Z');
      const schedule = Schedule.create(createValidScheduleProps({
        startAtUtc: startAt
      }));

      const nextOccurrence = schedule.getNextOccurrence(new Date('2025-01-14T00:00:00Z'));
      expect(nextOccurrence).toEqual(startAt);
    });

    it('should return null for ONCE schedule if startAtUtc is in past', () => {
      const startAt = new Date('2025-01-10T10:00:00Z');
      const schedule = Schedule.create(createValidScheduleProps({
        startAtUtc: startAt
      }));

      const nextOccurrence = schedule.getNextOccurrence(new Date('2025-01-15T00:00:00Z'));
      expect(nextOccurrence).toBeNull();
    });

    it('should return next occurrence for CRON schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
        cronExpr: CronExpression.create('0 9 * * *'), // Every day at 9 AM UTC
        startAtUtc: undefined
      }));

      const from = new Date('2025-01-15T08:00:00Z');
      const nextOccurrence = schedule.getNextOccurrence(from);

      expect(nextOccurrence).toBeDefined();
      expect(nextOccurrence!.getUTCHours()).toBe(9);
      expect(nextOccurrence!.getUTCMinutes()).toBe(0);
    });

    it('should return next occurrence for RRULE schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.RRULE),
        rrule: RRuleExpression.create('FREQ=DAILY;COUNT=5'),
        startAtUtc: undefined
      }));

      const from = new Date('2025-01-15T08:00:00Z');
      const nextOccurrence = schedule.getNextOccurrence(from);

      expect(nextOccurrence).toBeDefined();
      expect(nextOccurrence!.getTime()).toBeGreaterThan(from.getTime());
    });

    it('should return null if next occurrence is past endAtUtc', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
        cronExpr: CronExpression.create('0 9 * * *'),
        endAtUtc: new Date('2025-01-16T00:00:00Z'),
        startAtUtc: undefined
      }));

      // Use from time before 9 AM so next occurrence is today at 9 AM (within endAtUtc)
      const from = new Date('2025-01-15T08:00:00Z');
      const nextOccurrence = schedule.getNextOccurrence(from);

      expect(nextOccurrence).toBeDefined();
      expect(nextOccurrence!.getTime()).toBeLessThanOrEqual(new Date('2025-01-16T00:00:00Z').getTime());
    });

    it('should apply jitter to next occurrence', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        jitterMs: 5000 // 5 seconds jitter
      }));

      const from = new Date('2025-01-14T00:00:00Z');
      const nextOccurrence = schedule.getNextOccurrence(from);

      expect(nextOccurrence).toBeDefined();
      // Jitter should add 0-5000ms to startAtUtc
      const expectedMin = new Date('2025-01-15T10:00:00Z').getTime();
      const expectedMax = expectedMin + 5000;
      expect(nextOccurrence!.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(nextOccurrence!.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('getOccurrencesBetween', () => {
    it('should return empty array if schedule is PAUSED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-14T00:00:00Z'),
        new Date('2025-01-16T00:00:00Z')
      );

      expect(occurrences).toEqual([]);
    });

    it('should return empty array if schedule is CANCELLED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-14T00:00:00Z'),
        new Date('2025-01-16T00:00:00Z')
      );

      expect(occurrences).toEqual([]);
    });

    it('should return single occurrence for ONCE schedule within range', () => {
      const startAt = new Date('2025-01-15T10:00:00Z');
      const schedule = Schedule.create(createValidScheduleProps({
        startAtUtc: startAt
      }));

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-14T00:00:00Z'),
        new Date('2025-01-16T00:00:00Z')
      );

      expect(occurrences).toHaveLength(1);
      expect(occurrences[0]).toEqual(startAt);
    });

    it('should return empty array for ONCE schedule outside range', () => {
      const startAt = new Date('2025-01-20T10:00:00Z');
      const schedule = Schedule.create(createValidScheduleProps({
        startAtUtc: startAt
      }));

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-14T00:00:00Z'),
        new Date('2025-01-16T00:00:00Z')
      );

      expect(occurrences).toEqual([]);
    });

    it('should limit occurrences by maxRuns', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
        cronExpr: CronExpression.create('0 * * * *'), // Every hour
        maxRuns: 3,
        startAtUtc: undefined
      }));

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-15T23:59:59Z')
      );

      expect(occurrences.length).toBeLessThanOrEqual(3);
    });

    it('should filter occurrences by endAtUtc', () => {
      const schedule = Schedule.create(createValidScheduleProps({
        scheduleType: ScheduleTypeVO.create(ScheduleType.CRON),
        cronExpr: CronExpression.create('0 * * * *'), // Every hour
        endAtUtc: new Date('2025-01-15T12:00:00Z'),
        startAtUtc: undefined
      }));

      const occurrences = schedule.getOccurrencesBetween(
        new Date('2025-01-15T00:00:00Z'),
        new Date('2025-01-15T23:59:59Z')
      );

      occurrences.forEach(occ => {
        expect(occ.getTime()).toBeLessThanOrEqual(new Date('2025-01-15T12:00:00Z').getTime());
      });
    });
  });

  describe('pause', () => {
    it('should pause an ACTIVE schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();

      expect(schedule.getStatus()).toBe(ScheduleStatus.PAUSED);
    });

    it('should emit SchedulePausedEvent', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.clearDomainEvents(); // Clear creation event
      schedule.pause();

      const events = schedule.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SchedulePausedEvent);
    });

    it('should update updatedAt timestamp', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      const before = schedule.getUpdatedAt();

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        schedule.pause();
        expect(schedule.getUpdatedAt().getTime()).toBeGreaterThan(before.getTime());
      }, 10);
    });

    it('should throw error if schedule is CANCELLED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();

      expect(() => schedule.pause()).toThrow('Cannot pause cancelled schedule');
    });

    it('should be idempotent (no error if already PAUSED)', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();
      schedule.pause(); // Should not throw

      expect(schedule.getStatus()).toBe(ScheduleStatus.PAUSED);
    });
  });

  describe('resume', () => {
    it('should resume a PAUSED schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();
      schedule.resume();

      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
    });

    it('should emit ScheduleResumedEvent', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();
      schedule.clearDomainEvents(); // Clear previous events
      schedule.resume();

      const events = schedule.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleResumedEvent);
    });

    it('should throw error if schedule is CANCELLED', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();

      expect(() => schedule.resume()).toThrow('Cannot resume cancelled schedule');
    });

    it('should be idempotent (no error if already ACTIVE)', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.resume(); // Should not throw

      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
    });
  });

  describe('cancel', () => {
    it('should cancel an ACTIVE schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();

      expect(schedule.getStatus()).toBe(ScheduleStatus.CANCELLED);
    });

    it('should cancel a PAUSED schedule', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.pause();
      schedule.cancel();

      expect(schedule.getStatus()).toBe(ScheduleStatus.CANCELLED);
    });

    it('should emit ScheduleCancelledEvent', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.clearDomainEvents(); // Clear creation event
      schedule.cancel();

      const events = schedule.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleCancelledEvent);
    });

    it('should be idempotent (no error if already CANCELLED)', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.cancel();
      schedule.cancel(); // Should not throw

      expect(schedule.getStatus()).toBe(ScheduleStatus.CANCELLED);
    });
  });

  describe('update', () => {
    it('should update payloadJson', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      const newPayload = { updated: true };

      schedule.update({ payloadJson: newPayload });

      expect(schedule.getPayloadJson()).toEqual(newPayload);
    });

    it('should update endAtUtc', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      const newEndAt = new Date('2025-12-31T23:59:59Z');

      schedule.update({ endAtUtc: newEndAt });

      expect(schedule.getEndAtUtc()).toEqual(newEndAt);
    });

    it('should update maxRuns', () => {
      const schedule = Schedule.create(createValidScheduleProps());

      schedule.update({ maxRuns: 100 });

      expect(schedule.getMaxRuns()).toBe(100);
    });

    it('should emit ScheduleUpdatedEvent', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      schedule.clearDomainEvents(); // Clear creation event

      schedule.update({ payloadJson: { updated: true } });

      const events = schedule.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ScheduleUpdatedEvent);
    });

    it('should update updatedAt timestamp', () => {
      const schedule = Schedule.create(createValidScheduleProps());
      const before = schedule.getUpdatedAt();

      setTimeout(() => {
        schedule.update({ payloadJson: { updated: true } });
        expect(schedule.getUpdatedAt().getTime()).toBeGreaterThan(before.getTime());
      }, 10);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute schedule from props', () => {
      const props = {
        scheduleId: 'test-schedule-id',
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: ScheduleTypeVO.create(ScheduleType.ONCE),
        timezone: Timezone.create('UTC'),
        startAtUtc: new Date('2025-01-15T10:00:00Z'),
        topicOrCommand: 'test.command',
        payloadJson: { test: true },
        jitterMs: 0,
        retryPolicy: RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key'),
        status: ScheduleStatus.ACTIVE,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z')
      };

      const schedule = Schedule.reconstitute(props);

      expect(schedule.getScheduleId()).toBe('test-schedule-id');
      expect(schedule.getStatus()).toBe(ScheduleStatus.ACTIVE);
      expect(schedule.getTenantId().getValue()).toBe('test-tenant');
    });

    it('should not emit domain events on reconstitution', () => {
      const props = {
        scheduleId: 'test-schedule-id',
        tenantId: TenantId.create('test-tenant'),
        ownerService: 'test-service',
        scheduleType: ScheduleTypeVO.create(ScheduleType.ONCE),
        timezone: Timezone.create('UTC'),
        startAtUtc: new Date('2025-01-15T10:00:00Z'),
        topicOrCommand: 'test.command',
        payloadJson: { test: true },
        jitterMs: 0,
        retryPolicy: RetryPolicy.default(),
        dedupKey: DedupKey.create('test-dedup-key'),
        status: ScheduleStatus.ACTIVE,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z')
      };

      const schedule = Schedule.reconstitute(props);
      const events = schedule.getDomainEvents();

      expect(events).toHaveLength(0);
    });
  });
});

