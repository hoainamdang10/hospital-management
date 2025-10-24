/**
 * DomainEvent Base Class Tests
 * @version 2.0.0
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

// Concrete implementation for testing
class TestDomainEvent extends DomainEvent {
  constructor(
    public readonly testData: string,
    correlationId?: string,
    causationId?: string
  ) {
    super(
      'TestEvent',
      'test-aggregate-123',
      'TestAggregate',
      { testData },
      1,
      correlationId,
      causationId
    );
  }

  public getEventData(): any {
    return {
      testData: this.testData,
      occurredAt: this.occurredAt.toISOString()
    };
  }

  public containsPHI(): boolean {
    return false;
  }

  public getPatientId(): string | null {
    return null;
  }
}

describe('DomainEvent', () => {
  describe('constructor', () => {
    it('should create event with required properties', () => {
      const event = new TestDomainEvent('test data');

      expect(event.eventType).toBe('TestEvent');
      expect(event.aggregateId).toBe('test-aggregate-123');
      expect(event.aggregateType).toBe('TestAggregate');
      expect(event.eventVersion).toBe(1);
      expect(event.testData).toBe('test data');
    });

    it('should generate eventId automatically', () => {
      const event = new TestDomainEvent('test data');

      expect(event.eventId).toBeDefined();
      expect(typeof event.eventId).toBe('string');
      expect(event.eventId.length).toBeGreaterThan(0);
    });

    it('should set occurredAt timestamp', () => {
      const before = new Date();
      const event = new TestDomainEvent('test data');
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include correlation tracking', () => {
      const event = new TestDomainEvent(
        'test data',
        'correlation-123',
        'causation-456'
      );

      expect(event.correlationId).toBe('correlation-123');
      expect(event.causationId).toBe('causation-456');
    });
  });

  describe('getEventData', () => {
    it('should return event data', () => {
      const event = new TestDomainEvent('test data');
      const data = event.getEventData();

      expect(data.testData).toBe('test data');
      expect(data.occurredAt).toBeDefined();
    });
  });

  describe('containsPHI', () => {
    it('should return false for test event', () => {
      const event = new TestDomainEvent('test data');
      expect(event.containsPHI()).toBe(false);
    });
  });

  describe('getPatientId', () => {
    it('should return null for test event', () => {
      const event = new TestDomainEvent('test data');
      expect(event.getPatientId()).toBeNull();
    });
  });
});
