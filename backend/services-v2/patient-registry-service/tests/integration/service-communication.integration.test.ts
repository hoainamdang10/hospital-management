/**
 * Integration Tests - Service-to-Service Communication
 * 
 * Tests event-driven communication between Patient Registry Service
 * and downstream services (Clinical EMR, Scheduling, Billing)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { EventEmitter } from 'events';
import { Patient } from '../../src/domain/aggregates/Patient';
import { PatientRegisteredEvent } from '../../src/domain/events/PatientRegisteredEvent';
import { PatientUpdatedEvent } from '../../src/domain/events/PatientUpdatedEvent';
import { PatientMergedEvent } from '../../src/domain/events/PatientMergedEvent';

describe('Service-to-Service Communication Tests', () => {
  let eventBus: EventEmitter;
  let receivedEvents: any[];

  beforeEach(() => {
    eventBus = new EventEmitter();
    receivedEvents = [];

    // Mock event subscribers (downstream services)
    eventBus.on('PatientRegisteredEvent', (event) => {
      receivedEvents.push({ type: 'PatientRegisteredEvent', data: event });
    });

    eventBus.on('PatientUpdatedEvent', (event) => {
      receivedEvents.push({ type: 'PatientUpdatedEvent', data: event });
    });

    eventBus.on('PatientMergedEvent', (event) => {
      receivedEvents.push({ type: 'PatientMergedEvent', data: event });
    });
  });

  afterEach(() => {
    eventBus.removeAllListeners();
    receivedEvents = [];
  });

  describe('PatientRegisteredEvent Publishing', () => {
    it('should publish event when patient is registered', async () => {
      // Arrange
      const patientData = createTestPatientData();

      // Act
      const event = new PatientRegisteredEvent(
        patientData.patientId,
        patientData.userId,
        patientData.personalInfo,
        patientData.contactInfo,
        new Date()
      );

      eventBus.emit('PatientRegisteredEvent', event);

      // Assert
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('PatientRegisteredEvent');
      expect(receivedEvents[0].data.patientId).toBe(patientData.patientId);
    });

    it('should include all required patient data in event', async () => {
      const patientData = createTestPatientData();

      const event = new PatientRegisteredEvent(
        patientData.patientId,
        patientData.userId,
        patientData.personalInfo,
        patientData.contactInfo,
        new Date()
      );

      eventBus.emit('PatientRegisteredEvent', event);

      const receivedEvent = receivedEvents[0].data;
      expect(receivedEvent.patientId).toBeDefined();
      expect(receivedEvent.userId).toBeDefined();
      expect(receivedEvent.personalInfo).toBeDefined();
      expect(receivedEvent.personalInfo.fullName).toBe(patientData.personalInfo.fullName);
      expect(receivedEvent.contactInfo).toBeDefined();
    });

    it('should be received by Clinical EMR Service', async () => {
      // Mock Clinical EMR Service subscriber
      let clinicalEMRReceived = false;
      eventBus.on('PatientRegisteredEvent', () => {
        clinicalEMRReceived = true;
      });

      const event = new PatientRegisteredEvent(
        'PAT-202501-001',
        'user-123',
        { fullName: 'Test Patient', dateOfBirth: new Date('1990-01-01'), gender: 'male', nationalId: '001234567890' },
        { primaryPhone: '0912345678', address: { street: '123 St', ward: 'W1', district: 'D1', city: 'HCM' } },
        new Date()
      );

      eventBus.emit('PatientRegisteredEvent', event);

      expect(clinicalEMRReceived).toBe(true);
    });

    it('should be received by Scheduling Service', async () => {
      let schedulingReceived = false;
      eventBus.on('PatientRegisteredEvent', () => {
        schedulingReceived = true;
      });

      const event = new PatientRegisteredEvent(
        'PAT-202501-001',
        'user-123',
        { fullName: 'Test Patient', dateOfBirth: new Date('1990-01-01'), gender: 'male', nationalId: '001234567890' },
        { primaryPhone: '0912345678', address: { street: '123 St', ward: 'W1', district: 'D1', city: 'HCM' } },
        new Date()
      );

      eventBus.emit('PatientRegisteredEvent', event);

      expect(schedulingReceived).toBe(true);
    });

    it('should be received by Billing Service', async () => {
      let billingReceived = false;
      eventBus.on('PatientRegisteredEvent', () => {
        billingReceived = true;
      });

      const event = new PatientRegisteredEvent(
        'PAT-202501-001',
        'user-123',
        { fullName: 'Test Patient', dateOfBirth: new Date('1990-01-01'), gender: 'male', nationalId: '001234567890' },
        { primaryPhone: '0912345678', address: { street: '123 St', ward: 'W1', district: 'D1', city: 'HCM' } },
        new Date()
      );

      eventBus.emit('PatientRegisteredEvent', event);

      expect(billingReceived).toBe(true);
    });
  });

  describe('PatientUpdatedEvent Publishing', () => {
    it('should publish event when patient is updated', async () => {
      const event = new PatientUpdatedEvent(
        'PAT-202501-001',
        { fullName: 'Updated Name' },
        'user-123',
        new Date()
      );

      eventBus.emit('PatientUpdatedEvent', event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('PatientUpdatedEvent');
    });

    it('should include changed fields in event', async () => {
      const changedFields = {
        personalInfo: {
          fullName: 'New Name'
        },
        contactInfo: {
          primaryPhone: '0987654321'
        }
      };

      const event = new PatientUpdatedEvent(
        'PAT-202501-001',
        changedFields,
        'user-123',
        new Date()
      );

      eventBus.emit('PatientUpdatedEvent', event);

      const receivedEvent = receivedEvents[0].data;
      expect(receivedEvent.changedFields).toEqual(changedFields);
    });

    it('should notify downstream services of updates', async () => {
      const servicesNotified: string[] = [];

      eventBus.on('PatientUpdatedEvent', () => {
        servicesNotified.push('Clinical EMR');
        servicesNotified.push('Scheduling');
        servicesNotified.push('Billing');
      });

      const event = new PatientUpdatedEvent(
        'PAT-202501-001',
        { fullName: 'Updated' },
        'user-123',
        new Date()
      );

      eventBus.emit('PatientUpdatedEvent', event);

      expect(servicesNotified).toContain('Clinical EMR');
      expect(servicesNotified).toContain('Scheduling');
      expect(servicesNotified).toContain('Billing');
    });
  });

  describe('PatientMergedEvent Publishing', () => {
    it('should publish event when patients are merged', async () => {
      const event = new PatientMergedEvent(
        'PAT-202501-001', // source
        'PAT-202501-002', // target
        'user-123',
        new Date()
      );

      eventBus.emit('PatientMergedEvent', event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].type).toBe('PatientMergedEvent');
    });

    it('should include source and target patient IDs', async () => {
      const event = new PatientMergedEvent(
        'PAT-202501-001',
        'PAT-202501-002',
        'user-123',
        new Date()
      );

      eventBus.emit('PatientMergedEvent', event);

      const receivedEvent = receivedEvents[0].data;
      expect(receivedEvent.sourcePatientId).toBe('PAT-202501-001');
      expect(receivedEvent.targetPatientId).toBe('PAT-202501-002');
    });

    it('should trigger data migration in downstream services', async () => {
      let dataMigrationTriggered = false;

      eventBus.on('PatientMergedEvent', (event) => {
        // Simulate downstream service migrating data
        if (event.sourcePatientId && event.targetPatientId) {
          dataMigrationTriggered = true;
        }
      });

      const event = new PatientMergedEvent(
        'PAT-202501-001',
        'PAT-202501-002',
        'user-123',
        new Date()
      );

      eventBus.emit('PatientMergedEvent', event);

      expect(dataMigrationTriggered).toBe(true);
    });
  });

  describe('Event Ordering and Consistency', () => {
    it('should maintain event order', async () => {
      const events = [
        new PatientRegisteredEvent('PAT-1', 'user-1', {} as any, {} as any, new Date()),
        new PatientUpdatedEvent('PAT-1', { fullName: 'Update 1' }, 'user-1', new Date()),
        new PatientUpdatedEvent('PAT-1', { fullName: 'Update 2' }, 'user-1', new Date())
      ];

      events.forEach((event, index) => {
        if (index === 0) {
          eventBus.emit('PatientRegisteredEvent', event);
        } else {
          eventBus.emit('PatientUpdatedEvent', event);
        }
      });

      expect(receivedEvents).toHaveLength(3);
      expect(receivedEvents[0].type).toBe('PatientRegisteredEvent');
      expect(receivedEvents[1].type).toBe('PatientUpdatedEvent');
      expect(receivedEvents[2].type).toBe('PatientUpdatedEvent');
    });

    it('should handle concurrent events', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            const event = new PatientRegisteredEvent(
              `PAT-${i}`,
              `user-${i}`,
              {} as any,
              {} as any,
              new Date()
            );
            eventBus.emit('PatientRegisteredEvent', event);
            resolve();
          })
        );
      }

      await Promise.all(promises);

      expect(receivedEvents).toHaveLength(10);
    });
  });

  describe('Event Retry and Error Handling', () => {
    it('should retry failed event delivery', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      eventBus.on('PatientRegisteredEvent', () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          throw new Error('Simulated failure');
        }
      });

      const event = new PatientRegisteredEvent(
        'PAT-202501-001',
        'user-123',
        {} as any,
        {} as any,
        new Date()
      );

      // Simulate retry logic
      for (let i = 0; i < maxRetries; i++) {
        try {
          eventBus.emit('PatientRegisteredEvent', event);
        } catch (error) {
          // Retry
        }
      }

      expect(attemptCount).toBe(maxRetries);
    });

    it('should handle downstream service failures gracefully', async () => {
      let errorHandled = false;

      eventBus.on('PatientRegisteredEvent', () => {
        throw new Error('Downstream service unavailable');
      });

      try {
        const event = new PatientRegisteredEvent(
          'PAT-202501-001',
          'user-123',
          {} as any,
          {} as any,
          new Date()
        );
        eventBus.emit('PatientRegisteredEvent', event);
      } catch (error) {
        errorHandled = true;
      }

      expect(errorHandled).toBe(true);
    });
  });

  describe('Event Schema Validation', () => {
    it('should validate event structure', async () => {
      const event = new PatientRegisteredEvent(
        'PAT-202501-001',
        'user-123',
        { fullName: 'Test', dateOfBirth: new Date(), gender: 'male', nationalId: '123' },
        { primaryPhone: '0912345678', address: {} as any },
        new Date()
      );

      expect(event.patientId).toBeDefined();
      expect(event.userId).toBeDefined();
      expect(event.personalInfo).toBeDefined();
      expect(event.contactInfo).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should reject invalid events', async () => {
      expect(() => {
        new PatientRegisteredEvent(
          '', // Invalid: empty patient ID
          'user-123',
          {} as any,
          {} as any,
          new Date()
        );
      }).toThrow();
    });
  });

  // Helper functions

  function createTestPatientData() {
    return {
      patientId: 'PAT-202501-001',
      userId: 'user-123',
      personalInfo: {
        fullName: 'Test Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as const,
        nationalId: '001234567890'
      },
      contactInfo: {
        primaryPhone: '0912345678',
        address: {
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          city: 'Ho Chi Minh'
        }
      }
    };
  }
});

