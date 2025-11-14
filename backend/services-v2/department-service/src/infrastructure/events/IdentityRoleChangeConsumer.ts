/**
 * Identity Role Change Consumer - Infrastructure Layer
 * Consumes identity events from Identity Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { Logger } from '@infrastructure/logging/Logger';
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';

export interface IdentityRoleChangeConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface UserRoleChangedEventData {
  userId: string;
  userFullName: string;
  userEmail: string;
  previousRole?: string;
  newRole: string;
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  changedAt: Date;
  changedBy?: string;
}

export interface UserDeactivatedEventData {
  userId: string;
  userFullName: string;
  userEmail: string;
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  deactivatedAt: Date;
  deactivatedBy?: string;
  reason?: string;
}

/**
 * IdentityRoleChangeConsumer - Handles identity events for department access management
 */
export class IdentityRoleChangeConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: IdentityRoleChangeConsumerConfig,
    private logger: Logger,
    private departmentRepository: IDepartmentRepository,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Identity events', {
        queueName: this.config.queueName,
      });

      const amqp = require('amqplib');
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true,
      });

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey,
        );
        this.logger.info('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info('Identity event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', {
          error: error.message,
        });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;

      this.logger.debug('Received identity event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'user.role.changed':
          await this.handleUserRoleChanged(event.payload as UserRoleChangedEventData);
          break;

        case 'user.deactivated':
          await this.handleUserDeactivated(event.payload as UserDeactivatedEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing identity event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle user role changed event
   */
  private async handleUserRoleChanged(data: UserRoleChangedEventData): Promise<void> {
    this.logger.info('Processing user role change', {
      userId: data.userId,
      userFullName: data.userFullName,
      previousRole: data.previousRole,
      newRole: data.newRole,
      departmentId: data.departmentId,
    });

    try {
      // If user has department, log the role change for department access tracking
      if (data.departmentId) {
        const department = await this.departmentRepository.findById(data.departmentId);
        if (department) {
          this.logger.info('User role changed affecting department access', {
            departmentId: data.departmentId,
            departmentCode: department.code,
            userId: data.userId,
            userFullName: data.userFullName,
            previousRole: data.previousRole,
            newRole: data.newRole,
          });

          // Here we could implement department-specific access control logic
          // For example:
          // - Update department access permissions
          // - Notify department administrators
          // - Update department role statistics
          
          // For now, we just log the event for auditing purposes
        } else {
          this.logger.warn('Department not found for user role change', {
            departmentId: data.departmentId,
            userId: data.userId,
          });
        }
      }

      // Log role changes that might affect department management
      const departmentManagementRoles = ['admin', 'department_manager', 'hospital_admin'];
      if (departmentManagementRoles.includes(data.newRole) || 
          (data.previousRole && departmentManagementRoles.includes(data.previousRole))) {
        this.logger.info('Department management role changed', {
          userId: data.userId,
          userFullName: data.userFullName,
          previousRole: data.previousRole,
          newRole: data.newRole,
          affectsDepartmentManagement: true,
        });
      }

    } catch (error) {
      this.logger.error('Failed to process user role change', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle user deactivated event
   */
  private async handleUserDeactivated(data: UserDeactivatedEventData): Promise<void> {
    this.logger.info('Processing user deactivation', {
      userId: data.userId,
      userFullName: data.userFullName,
      departmentId: data.departmentId,
      reason: data.reason,
    });

    try {
      // If user has department, log the deactivation for department access tracking
      if (data.departmentId) {
        const department = await this.departmentRepository.findById(data.departmentId);
        if (department) {
          this.logger.info('User deactivated affecting department access', {
            departmentId: data.departmentId,
            departmentCode: department.code,
            userId: data.userId,
            userFullName: data.userFullName,
            deactivatedAt: data.deactivatedAt,
            reason: data.reason,
          });

          // Here we could implement department-specific deactivation logic
          // For example:
          // - Remove department access permissions
          // - Update department staff count if user was staff
          // - Notify department administrators
          
          // For now, we just log the event for auditing purposes
        }
      }

      // Log deactivations for department management roles
      this.logger.info('User deactivation recorded', {
        userId: data.userId,
        userFullName: data.userFullName,
        departmentId: data.departmentId,
        deactivatedAt: data.deactivatedAt,
        deactivatedBy: data.deactivatedBy,
        reason: data.reason,
      });

    } catch (error) {
      this.logger.error('Failed to process user deactivation', {
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info('Identity event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting identity event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
