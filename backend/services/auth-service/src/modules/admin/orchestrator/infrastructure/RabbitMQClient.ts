import amqp, { Connection, Channel, Message } from 'amqplib';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface RabbitMQMessage {
  content: any;
  properties: any;
  fields: any;
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

export interface ExchangeOptions {
  type: 'direct' | 'topic' | 'fanout' | 'headers';
  durable?: boolean;
  autoDelete?: boolean;
  arguments?: any;
}

export class RabbitMQClient extends EventEmitter {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private logger: Logger;
  private connectionUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;

  constructor(logger: Logger, connectionUrl?: string) {
    super();
    this.logger = logger;
    this.connectionUrl = connectionUrl || process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      this.setupConnectionHandlers();
      
      this.logger.info('RabbitMQ connection established');
      this.emit('connected');
      
    } catch (error: any) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.logger.info(`Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay);
      } else {
        this.logger.error('Max reconnection attempts reached. Giving up.');
        this.emit('error', error);
      }
      
      throw error;
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (this.connection) {
      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error:', error);
        this.isConnected = false;
        this.emit('error', error);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        this.emit('disconnected');
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay);
        }
      });
    }

    if (this.channel) {
      this.channel.on('error', (error) => {
        this.logger.error('RabbitMQ channel error:', error);
        this.emit('error', error);
      });

      this.channel.on('close', () => {
        this.logger.warn('RabbitMQ channel closed');
      });
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      this.logger.info('RabbitMQ connection closed');
      this.emit('disconnected');
      
    } catch (error: any) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && this.connection !== null && this.channel !== null;
  }

  /**
   * Assert queue exists
   */
  async assertQueue(queue: string, options: QueueOptions = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const defaultOptions: QueueOptions = {
      durable: true,
      exclusive: false,
      autoDelete: false,
      ...options
    };

    try {
      await this.channel.assertQueue(queue, defaultOptions);
      this.logger.debug(`Queue '${queue}' asserted`);
    } catch (error: any) {
      this.logger.error(`Failed to assert queue '${queue}':`, error);
      throw error;
    }
  }

  /**
   * Assert exchange exists
   */
  async assertExchange(exchange: string, options: ExchangeOptions): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const defaultOptions = {
      durable: true,
      autoDelete: false,
      ...options
    };

    try {
      await this.channel.assertExchange(exchange, options.type, defaultOptions);
      this.logger.debug(`Exchange '${exchange}' asserted`);
    } catch (error: any) {
      this.logger.error(`Failed to assert exchange '${exchange}':`, error);
      throw error;
    }
  }

  /**
   * Publish message to queue
   */
  async sendToQueue(queue: string, message: any, options: any = {}): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        ...options
      });

      this.logger.debug(`Message sent to queue '${queue}'`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to send message to queue '${queue}':`, error);
      throw error;
    }
  }

  /**
   * Publish message to exchange
   */
  async publish(exchange: string, routingKey: string, message: any, options: any = {}): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        ...options
      });

      this.logger.debug(`Message published to exchange '${exchange}' with routing key '${routingKey}'`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to publish message to exchange '${exchange}':`, error);
      throw error;
    }
  }

  /**
   * Consume messages from queue
   */
  async consume(
    queue: string, 
    callback: (message: RabbitMQMessage | null) => void,
    options: any = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      await this.channel.consume(queue, (msg: Message | null) => {
        if (msg) {
          const message: RabbitMQMessage = {
            content: JSON.parse(msg.content.toString()),
            properties: msg.properties,
            fields: msg.fields
          };
          
          callback(message);
          
          // Acknowledge message
          if (!options.noAck) {
            this.channel!.ack(msg);
          }
        } else {
          callback(null);
        }
      }, {
        noAck: false,
        ...options
      });

      this.logger.debug(`Started consuming from queue '${queue}'`);
    } catch (error: any) {
      this.logger.error(`Failed to consume from queue '${queue}':`, error);
      throw error;
    }
  }

  /**
   * Bind queue to exchange
   */
  async bindQueue(queue: string, exchange: string, routingKey: string = ''): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      await this.channel.bindQueue(queue, exchange, routingKey);
      this.logger.debug(`Queue '${queue}' bound to exchange '${exchange}' with routing key '${routingKey}'`);
    } catch (error: any) {
      this.logger.error(`Failed to bind queue '${queue}' to exchange '${exchange}':`, error);
      throw error;
    }
  }

  /**
   * Get channel for advanced operations
   */
  getChannel(): Channel | null {
    return this.channel;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; connection: boolean; channel: boolean }> {
    try {
      const connectionOk = this.connection !== null && !this.connection.connection.destroyed;
      const channelOk = this.channel !== null;
      
      return {
        status: connectionOk && channelOk ? 'healthy' : 'unhealthy',
        connection: connectionOk,
        channel: channelOk
      };
    } catch (error: any) {
      this.logger.error('RabbitMQ health check failed:', error);
      return {
        status: 'unhealthy',
        connection: false,
        channel: false
      };
    }
  }
}
