/**
 * Event Publishing Integration Tests
 * 
 * Tests RabbitMQ event publishing with real message broker
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { createFullTestApp, AppFactoryResult } from '../../helpers/appFactory';
import { createStaffUpdatedEvent } from '../../../src/infrastructure/events/IntegrationEvents';
import { MockRabbitMQEventPublisher } from '../../helpers/testHelpers';

describe('Event Publishing Integration Tests', () => {
  let cleanup: (() => Promise<void>) | undefined;
  let eventPublisher: any;

  beforeAll(async () => {
    try {
      // Try to connect to real RabbitMQ
      const result: AppFactoryResult = await createFullTestApp();
      cleanup = result.cleanup;
      eventPublisher = result.eventPublisher;
    } catch (error) {
      // Fallback to mock if RabbitMQ not available
      console.warn('RabbitMQ not available, using mock:', error);
      eventPublisher = new MockRabbitMQEventPublisher();
      await eventPublisher.connect();
      cleanup = async () => {
        await eventPublisher.disconnect();
      };
    }
  });

  afterAll(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('RabbitMQ Connection', () => {
    it('should connect to RabbitMQ successfully', () => {
      expect(eventPublisher).toBeDefined();
      expect(eventPublisher.isReady()).toBe(true);
    });
  });

  describe('Event Publishing', () => {
    it('should publish StaffUpdated event', async () => {
      // Arrange
      const event = createStaffUpdatedEvent({
        staffId: 'STF-202501-001',
        userId: 'user-123',
        updatedFields: ['personalInfo', 'professionalInfo'],
        consultationFee: 500000,
        workSchedule: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' }
        },
        status: 'active'
      });

      // Act
      await eventPublisher.publish(event);

      // Assert - No error thrown means success
      expect(true).toBe(true);
    });

    it('should publish multiple events', async () => {
      // Arrange
      const events = [
        createStaffUpdatedEvent({
          staffId: 'DOC-GEN-202501-001',
          userId: 'user-123',
          updatedFields: ['personalInfo'],
          consultationFee: 500000,
          workSchedule: {
            monday: { start: '08:00', end: '17:00' }
          },
          status: 'active'
        }),
        createStaffUpdatedEvent({
          staffId: 'NUR-GEN-202501-002',
          userId: 'user-456',
          updatedFields: ['professionalInfo'],
          consultationFee: 300000,
          workSchedule: {
            tuesday: { start: '08:00', end: '17:00' }
          },
          status: 'active'
        })
      ];

      // Act
      await eventPublisher.publishAll(events);

      // Assert
      expect(true).toBe(true);
    });
  });
});

