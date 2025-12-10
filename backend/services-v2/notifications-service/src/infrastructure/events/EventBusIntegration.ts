/**
 * EventBusIntegration - Event Bus Integration
 * RabbitMQ-based event bus integration for cross-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import * as amqp from 'amqplib';
import { NotificationEventHandlers, IntegrationEvent } from './NotificationEventHandlers';
import { RealTimeNotificationService } from '../realtime/RealTimeNotificationService';

export interface EventBusConfig {
  connectionUrl: string;
  exchangeName: string;
  queueName: string;
  routingKeys: string[];
  retryAttempts: number;
  retryDelay: number;
}

export class EventBusIntegration {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(
    private readonly config: EventBusConfig,
    private readonly eventHandlers: NotificationEventHandlers,
    private readonly realTimeService: RealTimeNotificationService
  ) {}

  /**
   * Initialize event bus connection
   */
  public async initialize(): Promise<void> {
    try {
      console.log(' Initializing Event Bus connection...');
      
      await this.connect();
      await this.setupExchangeAndQueue();
      await this.startConsuming();
      
      console.log(' Event Bus initialized successfully');

    } catch (error) {
      console.error(' Failed to initialize Event Bus:', error);
      throw new Error(`Event Bus initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to RabbitMQ
   */
  private async connect(): Promise<void> {
    try {
      this.connection = (await amqp.connect(this.config.connectionUrl)) as any;
      this.channel = await (this.connection as any).createChannel();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Handle connection events
      (this.connection as any).on('error', (error: any) => {
        console.error(' RabbitMQ connection error:', error);
        this.isConnected = false;
        this.scheduleReconnect();
      });

      (this.connection as any).on('close', () => {
        console.warn(' RabbitMQ connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      console.log(' Connected to RabbitMQ');

    } catch (error) {
      console.error(' Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Setup exchange and queue
   */
  private async setupExchangeAndQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    try {
      // Declare exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true
      });

      // Declare queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
          'x-max-retries': this.config.retryAttempts
        }
      });

      // Bind queue to exchange with routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
        console.log(` Queue bound to routing key: ${routingKey}`);
      }

      // Setup dead letter queue for failed messages
      await this.setupDeadLetterQueue();

      console.log(' Exchange and queue setup completed');

    } catch (error) {
      console.error(' Failed to setup exchange and queue:', error);
      throw error;
    }
  }

  /**
   * Setup dead letter queue for failed messages
   */
  private async setupDeadLetterQueue(): Promise<void> {
    if (!this.channel) return;

    try {
      const dlqName = `${this.config.queueName}.dlq`;
      const dlxName = `${this.config.exchangeName}.dlx`;

      // Declare dead letter exchange
      await this.channel.assertExchange(dlxName, 'direct', { durable: true });

      // Declare dead letter queue
      await this.channel.assertQueue(dlqName, { durable: true });

      // Bind dead letter queue
      await this.channel.bindQueue(dlqName, dlxName, 'failed');

      console.log(' Dead letter queue setup completed');

    } catch (error) {
      console.error(' Failed to setup dead letter queue:', error);
    }
  }

  /**
   * Start consuming messages
   */
  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    try {
      // Set prefetch count for better load balancing
      await this.channel.prefetch(10);

      // Start consuming
      await this.channel.consume(this.config.queueName, async (message) => {
        if (message) {
          await this.handleMessage(message);
        }
      }, {
        noAck: false // Manual acknowledgment
      });

      console.log(' Started consuming messages from queue');

    } catch (error) {
      console.error(' Failed to start consuming:', error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: amqp.ConsumeMessage): Promise<void> {
    const startTime = Date.now();
    let event: IntegrationEvent | null = null;

    try {
      // Parse message
      const messageContent = message.content.toString();
      event = JSON.parse(messageContent) as IntegrationEvent;

      console.log(` Received event: ${event.eventType} from ${event.serviceName}`);

      // Validate event structure
      if (!this.isValidEvent(event)) {
        throw new Error('Invalid event structure');
      }

      // Process event
      await this.eventHandlers.handleEvent(event);

      // Send real-time notification if applicable
      await this.handleRealTimeNotification(event);

      // Acknowledge message
      this.channel?.ack(message);

      const processingTime = Date.now() - startTime;
      console.log(` Event processed successfully in ${processingTime}ms: ${event.eventType}`);

    } catch (error) {
      console.error(` Failed to process event ${event?.eventType || 'unknown'}:`, error);

      // Handle retry logic
      await this.handleMessageError(message, error as Error);
    }
  }

  /**
   * Handle real-time notification for event
   */
  private async handleRealTimeNotification(event: IntegrationEvent): Promise<void> {
    try {
      // Only send real-time notifications for specific event types
      const realTimeEventTypes = [
        'AppointmentScheduled',
        'AppointmentCancelled',
        'TestResultsReady',
        'PaymentCompleted',
        'EmergencyAlert',
        'MedicationReminder'
      ];

      if (!realTimeEventTypes.includes(event.eventType)) {
        return;
      }

      // Create real-time notification
      const realTimeNotification = this.mapEventToRealTimeNotification(event);
      
      if (realTimeNotification) {
        await this.realTimeService.sendToUser(realTimeNotification.id, realTimeNotification);
      }

    } catch (error) {
      console.error(' Failed to send real-time notification:', error);
      // Don't throw error here to avoid affecting main event processing
    }
  }

  /**
   * Map integration event to real-time notification
   */
  private mapEventToRealTimeNotification(event: IntegrationEvent): any {
    const baseNotification = {
      notificationId: `rt_${event.eventId}`,
      recipientId: event.eventData.patientId || event.eventData.recipientId,
      recipientType: 'PATIENT',
      timestamp: new Date(),
      healthcareContext: {
        patientId: event.eventData.patientId,
        doctorId: event.eventData.doctorId,
        appointmentId: event.eventData.appointmentId,
        medicalRecordId: event.eventData.recordId
      }
    };

    switch (event.eventType) {
      case 'AppointmentScheduled':
        return {
          ...baseNotification,
          type: 'APPOINTMENT',
          priority: 'HIGH',
          title: 'Lịch hẹn mới',
          message: `Bạn có lịch hẹn với ${event.eventData.doctorName} vào ${new Date(event.eventData.appointmentDate).toLocaleDateString('vi-VN')}`,
          actionRequired: true,
          actionUrl: `/appointments/${event.eventData.appointmentId}`
        };

      case 'AppointmentCancelled':
        return {
          ...baseNotification,
          type: 'APPOINTMENT',
          priority: 'HIGH',
          title: 'Lịch hẹn bị hủy',
          message: `Lịch hẹn với ${event.eventData.doctorName} đã bị hủy`,
          actionRequired: true,
          actionUrl: '/appointments/book'
        };

      case 'TestResultsReady':
        return {
          ...baseNotification,
          type: 'MEDICAL_RECORD',
          priority: 'HIGH',
          title: 'Kết quả xét nghiệm',
          message: 'Kết quả xét nghiệm của bạn đã có',
          actionRequired: true,
          actionUrl: `/medical-records/${event.eventData.recordId}`
        };

      case 'PaymentCompleted':
        return {
          ...baseNotification,
          type: 'BILLING',
          priority: 'NORMAL',
          title: 'Thanh toán thành công',
          message: `Thanh toán ${event.eventData.amount?.toLocaleString('vi-VN')} VNĐ đã được xử lý`,
          actionRequired: false,
          actionUrl: `/billing/${event.eventData.invoiceId}`
        };

      case 'EmergencyAlert':
        return {
          ...baseNotification,
          type: 'EMERGENCY',
          priority: 'URGENT',
          title: 'Cảnh báo khẩn cấp',
          message: event.eventData.alertMessage || 'Có tình huống khẩn cấp cần xử lý',
          actionRequired: true,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        };

      case 'MedicationReminder':
        return {
          ...baseNotification,
          type: 'MEDICATION',
          priority: 'HIGH',
          title: 'Nhắc nhở uống thuốc',
          message: `Đã đến giờ uống ${event.eventData.medicationName}`,
          actionRequired: true,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        };

      default:
        return null;
    }
  }

  /**
   * Handle message processing error
   */
  private async handleMessageError(message: amqp.ConsumeMessage, error: Error): Promise<void> {
    try {
      const retryCount = this.getRetryCount(message);
      
      if (retryCount < this.config.retryAttempts) {
        // Retry message
        console.log(` Retrying message (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
        
        setTimeout(() => {
          this.channel?.nack(message, false, true);
        }, this.config.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        
      } else {
        // Send to dead letter queue
        console.log(' Sending message to dead letter queue');
        
        await this.sendToDeadLetterQueue(message, error);
        this.channel?.ack(message);
      }

    } catch (retryError) {
      console.error(' Failed to handle message error:', retryError);
      this.channel?.nack(message, false, false);
    }
  }

  /**
   * Get retry count from message headers
   */
  private getRetryCount(message: amqp.ConsumeMessage): number {
    return (message.properties.headers?.['x-retry-count'] as number) || 0;
  }

  /**
   * Send message to dead letter queue
   */
  private async sendToDeadLetterQueue(message: amqp.ConsumeMessage, error: Error): Promise<void> {
    if (!this.channel) return;

    try {
      const dlxName = `${this.config.exchangeName}.dlx`;
      
      await this.channel.publish(dlxName, 'failed', message.content, {
        headers: {
          ...message.properties.headers,
          'x-original-routing-key': message.fields.routingKey,
          'x-error-message': error.message,
          'x-failed-at': new Date().toISOString()
        }
      });

    } catch (dlqError) {
      console.error(' Failed to send to dead letter queue:', dlqError);
    }
  }

  /**
   * Validate event structure
   */
  private isValidEvent(event: any): event is IntegrationEvent {
    return (
      event &&
      typeof event.eventId === 'string' &&
      typeof event.eventType === 'string' &&
      typeof event.serviceName === 'string' &&
      event.eventData &&
      event.occurredAt
    );
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(' Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds

    console.log(` Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error(' Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Publish event to other services
   */
  public async publishEvent(event: IntegrationEvent, routingKey: string): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('Event bus not connected');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(event));
      
      await this.channel.publish(this.config.exchangeName, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        headers: {
          'content-type': 'application/json',
          'source-service': 'notifications-service'
        }
      });

      console.log(` Event published: ${event.eventType} with routing key: ${routingKey}`);

    } catch (error) {
      console.error(' Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Close connection
   */
  public async close(): Promise<void> {
    try {
      if (this.channel) {
        await (this.channel as any).close();
      }
      
      if (this.connection) {
        await (this.connection as any).close();
      }

      this.isConnected = false;
      console.log(' Event bus connection closed');

    } catch (error) {
      console.error(' Error closing event bus connection:', error);
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    queueName: string;
    exchangeName: string;
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      queueName: this.config.queueName,
      exchangeName: this.config.exchangeName
    };
  }
}
