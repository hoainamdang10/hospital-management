/**
 * RabbitMQEventPublisher Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for Event Publisher with mocked RabbitMQ
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import { RabbitMQEventPublisher, RabbitMQConfig } from '../../../../src/infrastructure/events/RabbitMQEventPublisher';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { DomainEventPublisherConfig } from '@shared/domain/events/IDomainEventPublisher';
import { ILogger } from '@shared/application/services/logger.interface';
import { v4 as uuidv4 } from 'uuid';

// Mock amqplib
const mockChannel = {
  publish: jest.fn(),
  assertExchange: jest.fn(),
  close: jest.fn()
};

const mockConnection = {
  createChannel: jest.fn(() => Promise.resolve(mockChannel)),
  on: jest.fn(),
  close: jest.fn()
};

jest.mock('amqplib', () => ({
  connect: jest.fn(() => Promise.resolve(mockConnection))
}));

import * as amqp from 'amqplib';

// Test domain event class
class TestDomainEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly testData: string
  ) {
    super(
      'TestEvent',
      aggregateId,
      'Patient',
      { testData },
      1
    );
  }

  override getEventData() {
    return { testData: this.testData };
  }

  override containsPHI(): boolean {
    return false;
  }

  override getPatientId(): string | null {
    return this.aggregateId;
  }

  override toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventVersion: this.eventVersion,
      occurredAt: this.occurredAt.toISOString(),
      eventData: this.getEventData(),
      metadata: this.metadata
    };
  }
}

describe('RabbitMQEventPublisher', () => {
  let publisher: RabbitMQEventPublisher;
  let mockLogger: jest.Mocked<ILogger>;
  let config: RabbitMQConfig;
  let publisherConfig: DomainEventPublisherConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Test configuration
    config = {
      url: 'amqp://localhost:5672',
      exchange: 'patient-registry-events',
      exchangeType: 'topic',
      durable: true,
      autoDelete: false,
      serviceName: 'patient-registry'
    };

    publisherConfig = {
      enableRetry: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      enableLogging: true
    };

    // Reset mock implementations
    mockChannel.publish.mockReturnValue(true);
    mockChannel.assertExchange.mockResolvedValue(undefined);
    mockConnection.createChannel.mockResolvedValue(mockChannel);
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    // Create publisher instance
    publisher = new RabbitMQEventPublisher(config, publisherConfig, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      // Act
      const newPublisher = new RabbitMQEventPublisher(config, publisherConfig, mockLogger);

      // Assert
      expect(newPublisher).toBeInstanceOf(RabbitMQEventPublisher);
    });
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      // Act
      await publisher.connect();

      // Assert
      expect(amqp.connect).toHaveBeenCalledWith(config.url);
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
        'RabbitMQ Event Publisher connected',
        expect.objectContaining({
          exchange: config.exchange
        })
      );
    });

    it('should handle connection errors', async () => {
      // Arrange
      const connectionError = new Error('Connection failed');
      (amqp.connect as jest.Mock).mockRejectedValue(connectionError);

      // Act & Assert
      await expect(publisher.connect()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to RabbitMQ',
        expect.objectContaining({
          error: 'Connection failed'
        })
      );
    });

    it('should handle channel creation errors', async () => {
      // Arrange
      const channelError = new Error('Channel creation failed');
      mockConnection.createChannel.mockRejectedValue(channelError);

      // Act & Assert
      await expect(publisher.connect()).rejects.toThrow('Channel creation failed');
    });

    it('should handle exchange assertion errors', async () => {
      // Arrange
      const exchangeError = new Error('Exchange assertion failed');
      mockChannel.assertExchange.mockRejectedValue(exchangeError);

      // Act & Assert
      await expect(publisher.connect()).rejects.toThrow('Exchange assertion failed');
    });

    it('should set up connection event handlers', async () => {
      // Act
      await publisher.connect();

      // Assert
      expect(mockConnection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should mask credentials in logs', async () => {
      // Arrange
      const configWithCredentials = {
        ...config,
        url: 'amqp://user:password@localhost:5672'
      };
      const publisherWithCredentials = new RabbitMQEventPublisher(
        configWithCredentials,
        publisherConfig,
        mockLogger
      );

      // Act
      await publisherWithCredentials.connect();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Connecting to RabbitMQ...',
        expect.objectContaining({
          url: 'amqp://***@localhost:5672'
        })
      );
    });
  });

  describe('publish', () => {
    let testEvent: TestDomainEvent;

    beforeEach(async () => {
      testEvent = new TestDomainEvent('patient-123', 'test data');
      await publisher.connect();
    });

    it('should publish event successfully', async () => {
      // Act
      await publisher.publish(testEvent);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        config.exchange,
        'patient-registry.patient.testevent',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          contentType: 'application/json',
          messageId: testEvent.eventId,
          type: testEvent.eventType,
          headers: expect.objectContaining({
            aggregateId: testEvent.aggregateId,
            occurredAt: testEvent.occurredAt.toISOString()
          })
        })
      );
    });

    it('should serialize event correctly', async () => {
      // Act
      await publisher.publish(testEvent);

      // Assert
      const publishCall = mockChannel.publish.mock.calls[0];
      const messageBuffer = publishCall[2] as Buffer;
      const messageContent = JSON.parse(messageBuffer.toString());

      expect(messageContent).toEqual({
        eventId: testEvent.eventId,
        eventType: testEvent.eventType,
        aggregateId: testEvent.aggregateId,
        aggregateType: testEvent.aggregateType,
        eventVersion: testEvent.eventVersion,
        occurredAt: testEvent.occurredAt.toISOString(),
        eventData: {
          testData: testEvent.testData
        },
        metadata: testEvent.metadata
      });
    });

    it('should generate correct routing key', async () => {
      // Act
      await publisher.publish(testEvent);

      // Assert
      const publishCall = mockChannel.publish.mock.calls[0];
      const routingKey = publishCall[1];
      expect(routingKey).toBe('patient-registry.patient.testevent');
    });

    it('should log event publication when logging is enabled', async () => {
      // Act
      await publisher.publish(testEvent);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Event published',
        expect.objectContaining({
          eventType: testEvent.eventType,
          eventId: testEvent.eventId,
          routingKey: 'patient-registry.patient.testevent'
        })
      );
    });

    it('should not log when logging is disabled', async () => {
      // Arrange
      const configWithoutLogging = { ...publisherConfig, enableLogging: false };
      const publisherWithoutLogging = new RabbitMQEventPublisher(config, configWithoutLogging, mockLogger);
      await publisherWithoutLogging.connect();

      // Act
      await publisherWithoutLogging.publish(testEvent);

      // Assert
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Event published',
        expect.any(Object)
      );
    });

    it('should throw error when not connected', async () => {
      // Arrange
      const disconnectedPublisher = new RabbitMQEventPublisher(config, publisherConfig, mockLogger);

      // Act & Assert
      await expect(disconnectedPublisher.publish(testEvent)).rejects.toThrow(
        'RabbitMQ publisher is not connected'
      );
    });

    it('should handle channel buffer full error', async () => {
      // Arrange
      mockChannel.publish.mockReturnValue(false);

      // Act & Assert
      await expect(publisher.publish(testEvent)).rejects.toThrow(
        'Failed to publish event - channel buffer full'
      );
    });

    it('should handle publish errors', async () => {
      // Arrange
      const publishError = new Error('Publish failed');
      mockChannel.publish.mockImplementation(() => {
        throw publishError;
      });

      // Act & Assert
      await expect(publisher.publish(testEvent)).rejects.toThrow('Publish failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish event',
        expect.objectContaining({
          eventType: testEvent.eventType,
          error: 'Publish failed'
        })
      );
    });
  });

  describe('publishBatch', () => {
    let testEvents: TestDomainEvent[];

    beforeEach(async () => {
      testEvents = [
        new TestDomainEvent('patient-123', 'test data 1'),
        new TestDomainEvent('patient-456', 'test data 2'),
        new TestDomainEvent('patient-789', 'test data 3')
      ];
      await publisher.connect();
    });

    it('should publish multiple events successfully', async () => {
      // Act
      await publisher.publishBatch(testEvents);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledTimes(3);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Batch events published',
        { count: 3 }
      );
    });

    it('should throw error when not connected', async () => {
      // Arrange
      const disconnectedPublisher = new RabbitMQEventPublisher(config, publisherConfig, mockLogger);

      // Act & Assert
      await expect(disconnectedPublisher.publishBatch(testEvents)).rejects.toThrow(
        'RabbitMQ publisher is not connected'
      );
    });

    it('should handle batch publish errors', async () => {
      // Arrange
      mockChannel.publish.mockImplementation(() => {
        throw new Error('Batch publish failed');
      });

      // Act & Assert
      await expect(publisher.publishBatch(testEvents)).rejects.toThrow('Batch publish failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to publish batch events',
        expect.objectContaining({
          error: 'Batch publish failed'
        })
      );
    });
  });

  describe('publishWithRetry', () => {
    let testEvent: TestDomainEvent;

    beforeEach(async () => {
      testEvent = new TestDomainEvent('patient-123', 'test data');
      await publisher.connect();
      // Mock setTimeout to avoid actual delays in tests
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return {} as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should succeed on first attempt', async () => {
      // Act
      await publisher.publishWithRetry(testEvent, 3);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should retry on failure and eventually succeed', async () => {
      // Arrange
      let attemptCount = 0;
      mockChannel.publish.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return true;
      });

      // Act
      await publisher.publishWithRetry(testEvent, 3);

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Publish attempt 1/3 failed',
        expect.objectContaining({
          eventType: testEvent.eventType,
          error: 'Temporary failure'
        })
      );
    });

    it('should fail after max retries', async () => {
      // Arrange
      mockChannel.publish.mockImplementation(() => {
        throw new Error('Persistent failure');
      });

      // Act & Assert
      await expect(publisher.publishWithRetry(testEvent, 3)).rejects.toThrow(
        'Failed to publish event after 3 attempts: Persistent failure'
      );
      expect(mockChannel.publish).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(3);
    });

    it('should use default max retries when not specified', async () => {
      // Arrange
      mockChannel.publish.mockImplementation(() => {
        throw new Error('Failure');
      });

      // Act & Assert
      await expect(publisher.publishWithRetry(testEvent)).rejects.toThrow(
        'Failed to publish event after 3 attempts'
      );
    });
  });

  describe('isHealthy', () => {
    it('should return true when connected', async () => {
      // Arrange
      await publisher.connect();

      // Act
      const isHealthy = await publisher.isHealthy();

      // Assert
      expect(isHealthy).toBe(true);
    });

    it('should return false when not connected', async () => {
      // Act
      const isHealthy = await publisher.isHealthy();

      // Assert
      expect(isHealthy).toBe(false);
    });

    it('should return false when channel is null', async () => {
      // Arrange
      await publisher.connect();
      // Simulate channel being null
      (publisher as any).channel = null;

      // Act
      const isHealthy = await publisher.isHealthy();

      // Assert
      expect(isHealthy).toBe(false);
    });
  });

  describe('close', () => {
    it('should close connection gracefully', async () => {
      // Arrange
      await publisher.connect();

      // Act
      await publisher.close();

      // Assert
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('RabbitMQ Event Publisher disconnected');
    });

    it('should handle close when not connected', async () => {
      // Act
      await publisher.close();

      // Assert
      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      // Arrange
      await publisher.connect();
      mockChannel.close.mockRejectedValue(new Error('Close failed'));

      // Act
      await publisher.close();

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error closing RabbitMQ connection',
        expect.objectContaining({
          error: 'Close failed'
        })
      );
    });
  });

  describe('connection event handlers', () => {
    it('should handle connection errors', async () => {
      // Arrange
      await publisher.connect();
      const errorHandler = mockConnection.on.mock.calls.find(call => call[0] === 'error')[1];

      // Act
      errorHandler(new Error('Connection error'));

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'RabbitMQ connection error',
        { error: 'Connection error' }
      );
    });

    it('should handle connection close and attempt reconnect', async () => {
      // Arrange
      await publisher.connect();
      const closeHandler = mockConnection.on.mock.calls.find(call => call[0] === 'close')[1];

      // Mock setTimeout for reconnect
      const mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        // Don't actually call the function to avoid infinite recursion in tests
        return {} as any;
      });

      // Act
      closeHandler();

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith('RabbitMQ connection closed');
      expect(mockSetTimeout).toHaveBeenCalled();

      // Cleanup
      mockSetTimeout.mockRestore();
    });

    it('should not reconnect when intentionally closed', async () => {
      // Arrange
      await publisher.connect();
      await publisher.close(); // This sets intentionallyClosed = true

      const closeHandler = mockConnection.on.mock.calls.find(call => call[0] === 'close')[1];
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');

      // Act
      closeHandler();

      // Assert
      expect(mockSetTimeout).not.toHaveBeenCalled();

      // Cleanup
      mockSetTimeout.mockRestore();
    });
  });

  describe('private methods', () => {
    let testEvent: TestDomainEvent;

    beforeEach(() => {
      testEvent = new TestDomainEvent('patient-123', 'test data');
    });

    it('should generate correct routing key', () => {
      // Act
      const routingKey = (publisher as any).getRoutingKey(testEvent);

      // Assert
      expect(routingKey).toBe('patient-registry.patient.testevent');
    });

    it('should serialize event correctly', () => {
      // Act
      const serialized = (publisher as any).serializeEvent(testEvent);

      // Assert
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual({
        eventId: testEvent.eventId,
        eventType: testEvent.eventType,
        aggregateId: testEvent.aggregateId,
        aggregateType: testEvent.aggregateType,
        eventVersion: testEvent.eventVersion,
        occurredAt: testEvent.occurredAt.toISOString(),
        eventData: {
          testData: testEvent.testData
        },
        metadata: testEvent.metadata
      });
    });

    it('should handle different event types in routing key', () => {
      // Arrange
      const eventWithCamelCase = new (class extends DomainEvent {
        constructor() {
          super(
            'PatientRegistered',
            'test-id',
            'Patient',
            {},
            1
          );
        }
        override getEventData() {
          return {};
        }
        override containsPHI(): boolean {
          return false;
        }
        override getPatientId(): string | null {
          return this.aggregateId;
        }
        override toJSON() {
          return {
            eventId: this.eventId,
            eventType: this.eventType,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            eventVersion: this.eventVersion,
            occurredAt: this.occurredAt.toISOString(),
            eventData: this.getEventData(),
            metadata: this.metadata
          };
        }
      })();

      // Act
      const routingKey = (publisher as any).getRoutingKey(eventWithCamelCase);

      // Assert
      expect(routingKey).toBe('patient-registry.patient.patientregistered');
    });
  });

  describe('reconnection logic', () => {
    beforeEach(() => {
      // Mock setTimeout to control timing
      jest.spyOn(global, 'setTimeout').mockImplementation((fn: any, delay?: number) => {
        // Store the function to call it manually
        (global as any).pendingReconnect = fn;
        return {} as any;
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
      delete (global as any).pendingReconnect;
    });

    it('should stop reconnecting after max attempts', async () => {
      // Arrange
      await publisher.connect();

      // Simulate connection failures
      (amqp.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      // Trigger reconnection multiple times
      for (let i = 0; i < 11; i++) {
        await (publisher as any).reconnect();
        if ((global as any).pendingReconnect) {
          try {
            await (global as any).pendingReconnect();
          } catch (error) {
            // Expected to fail
          }
        }
      }

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith('Max reconnect attempts reached. Giving up.');
    });

    it('should reset reconnect attempts on successful connection', async () => {
      // Arrange
      await publisher.connect();

      // Simulate a few failed reconnections
      (amqp.connect as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      await (publisher as any).reconnect();

      // Then simulate successful reconnection
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
      if ((global as any).pendingReconnect) {
        await (global as any).pendingReconnect();
      }

      // Assert that reconnect attempts were reset (no error about max attempts)
      expect(mockLogger.error).not.toHaveBeenCalledWith('Max reconnect attempts reached. Giving up.');
    });
  });
});
