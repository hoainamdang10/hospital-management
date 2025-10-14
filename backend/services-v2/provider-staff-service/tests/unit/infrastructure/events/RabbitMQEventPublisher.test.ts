/**
 * RabbitMQEventPublisher Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RabbitMQEventPublisher } from '../../../../src/infrastructure/events/RabbitMQEventPublisher';
import { createMockLogger, createMockIntegrationEvent } from '../../../helpers/mockFactories';
import * as amqplib from 'amqplib';

// Mock amqplib
jest.mock('amqplib');

describe('RabbitMQEventPublisher', () => {
  let eventPublisher: RabbitMQEventPublisher;
  let mockLogger: any;
  let mockConnection: any;
  let mockChannel: any;

  const config = {
    url: 'amqp://admin:admin@localhost:5672',
    exchange: 'hospital.events.test',
    exchangeType: 'topic' as const,
    durable: true,
    autoDelete: false
  };

  const options = {
    enableRetry: true,
    maxRetries: 3,
    retryDelayMs: 100,
    enableLogging: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = createMockLogger();

    // Mock channel
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined)
    };

    // Mock connection
    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };

    // Mock amqplib.connect
    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    eventPublisher = new RabbitMQEventPublisher(config, options, mockLogger);
  });

  afterEach(async () => {
    if (eventPublisher) {
      await eventPublisher.disconnect();
    }
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      await eventPublisher.connect();

      expect(amqplib.connect).toHaveBeenCalledWith(config.url);
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        config.exchange,
        config.exchangeType,
        {
          durable: config.durable,
          autoDelete: config.autoDelete
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Connected to RabbitMQ')
      );
    });

    it('should throw error if connection fails', async () => {
      const error = new Error('Connection failed');
      (amqplib.connect as jest.Mock).mockRejectedValue(error);

      await expect(eventPublisher.connect()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not connect twice', async () => {
      await eventPublisher.connect();
      await eventPublisher.connect();

      expect(amqplib.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from RabbitMQ successfully', async () => {
      await eventPublisher.connect();
      await eventPublisher.disconnect();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Disconnected from RabbitMQ')
      );
    });

    it('should handle disconnect when not connected', async () => {
      await eventPublisher.disconnect();

      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      await eventPublisher.connect();
      
      const error = new Error('Disconnect failed');
      mockChannel.close.mockRejectedValue(error);

      await eventPublisher.disconnect();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    beforeEach(async () => {
      await eventPublisher.connect();
    });

    it('should publish event successfully', async () => {
      const event = createMockIntegrationEvent('provider.staff.registered', {
        staffId: 'STF-202501-001',
        userId: 'user-123'
      });

      await eventPublisher.publish(event);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        config.exchange,
        'provider.staff.registered',
        expect.any(Buffer),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: expect.any(Number)
        }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Published event')
      );
    });

    it('should throw error if not connected', async () => {
      await eventPublisher.disconnect();

      const event = createMockIntegrationEvent('provider.staff.registered');

      await expect(eventPublisher.publish(event)).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });

    it('should retry on publish failure', async () => {
      mockChannel.publish
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const event = createMockIntegrationEvent('provider.staff.registered');

      await eventPublisher.publish(event);

      expect(mockChannel.publish).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Retrying')
      );
    });

    it('should throw error after max retries', async () => {
      mockChannel.publish.mockReturnValue(false);

      const event = createMockIntegrationEvent('provider.staff.registered');

      await expect(eventPublisher.publish(event)).rejects.toThrow(
        'Failed to publish event after'
      );
      expect(mockChannel.publish).toHaveBeenCalledTimes(options.maxRetries);
    });

    it('should serialize event data correctly', async () => {
      const event = createMockIntegrationEvent('provider.staff.registered', {
        staffId: 'STF-202501-001',
        userId: 'user-123',
        fullName: 'Bác sĩ Nguyễn Văn Test'
      });

      await eventPublisher.publish(event);

      const publishCall = mockChannel.publish.mock.calls[0];
      const buffer = publishCall[2] as Buffer;
      const publishedData = JSON.parse(buffer.toString());

      expect(publishedData).toMatchObject({
        eventType: 'provider.staff.registered',
        aggregateId: 'STF-202501-001',
        serviceName: 'provider-staff-service'
      });
    });
  });

  describe('publishAll', () => {
    beforeEach(async () => {
      await eventPublisher.connect();
    });

    it('should publish multiple events successfully', async () => {
      const events = [
        createMockIntegrationEvent('provider.staff.registered'),
        createMockIntegrationEvent('provider.staff.updated'),
        createMockIntegrationEvent('provider.doctor.availability.changed')
      ];

      await eventPublisher.publishAll(events);

      expect(mockChannel.publish).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      await eventPublisher.publishAll([]);

      expect(mockChannel.publish).not.toHaveBeenCalled();
    });

    it('should continue publishing even if one fails', async () => {
      mockChannel.publish
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const events = [
        createMockIntegrationEvent('provider.staff.registered'),
        createMockIntegrationEvent('provider.staff.updated'),
        createMockIntegrationEvent('provider.doctor.availability.changed')
      ];

      await expect(eventPublisher.publishAll(events)).rejects.toThrow();
      expect(mockChannel.publish).toHaveBeenCalled();
    });
  });

  describe('isReady', () => {
    it('should return false when not connected', () => {
      expect(eventPublisher.isReady()).toBe(false);
    });

    it('should return true when connected', async () => {
      await eventPublisher.connect();
      expect(eventPublisher.isReady()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await eventPublisher.connect();
      await eventPublisher.disconnect();
      expect(eventPublisher.isReady()).toBe(false);
    });
  });

  describe('routing key generation', () => {
    beforeEach(async () => {
      await eventPublisher.connect();
    });

    it('should use eventType as routing key', async () => {
      const event = createMockIntegrationEvent('provider.staff.registered');

      await eventPublisher.publish(event);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        config.exchange,
        'provider.staff.registered',
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it('should handle different event types', async () => {
      const eventTypes = [
        'provider.staff.registered',
        'provider.staff.updated',
        'provider.doctor.availability.changed',
        'provider.staff.status.changed'
      ];

      for (const eventType of eventTypes) {
        const event = createMockIntegrationEvent(eventType);
        await eventPublisher.publish(event);
      }

      expect(mockChannel.publish).toHaveBeenCalledTimes(eventTypes.length);
      
      eventTypes.forEach((eventType, index) => {
        expect(mockChannel.publish).toHaveBeenNthCalledWith(
          index + 1,
          config.exchange,
          eventType,
          expect.any(Buffer),
          expect.any(Object)
        );
      });
    });
  });
});

