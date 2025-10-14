/**
 * Event Publishing Integration Tests
 * 
 * Tests RabbitMQ event publishing with real message broker
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createFullTestApp, AppFactoryResult } from '../../helpers/appFactory';
import { MockRabbitMQEventPublisher } from '../../helpers/testHelpers';
import { createStaffRegisteredEvent } from '../../../src/infrastructure/events/IntegrationEvents';
import { TestUtils } from '../../setup';

describe('Event Publishing Integration Tests', () => {
  let cleanup: () => Promise<void>;
  let eventPublisher: any;

  beforeAll(async () => {
    const result: AppFactoryResult = await createFullTestApp();
    cleanup = result.cleanup;
    eventPublisher = result.eventPublisher;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('RabbitMQ Connection', () => {
    it('should connect to RabbitMQ successfully', () => {
      expect(eventPublisher).toBeDefined();
      expect(eventPublisher.isReady()).toBe(true);
    });
  });

  describe('Event Publishing', () => {
    it('should publish StaffRegistered event', async () => {
      // Arrange
      const event = createStaffRegisteredEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        staffType: 'doctor',
        fullName: 'Bác sĩ Test',
        department: 'Khoa Nội',
        specialization: 'Tim mạch',
        licenseNumber: 'BYS-12345',
        registrationDate: new Date().toISOString()
      });

      // Act
      await eventPublisher.publish(event);

      // Assert - No error thrown means success
      expect(true).toBe(true);
    });

    it('should publish multiple events', async () => {
      // Arrange
      const events = [
        createStaffRegisteredEvent({
          staffId: 'STF-202501-001',
          userId: 'user-123',
          staffType: 'doctor',
          fullName: 'Doctor 1'
        }),
        createStaffRegisteredEvent({
          staffId: 'STF-202501-002',
          userId: 'user-456',
          staffType: 'nurse',
          fullName: 'Nurse 1'
        })
      ];

      // Act
      await eventPublisher.publishAll(events);

      // Assert
      expect(true).toBe(true);
    });
  });
});

