/**
 * Enhanced Department Event Consumer - Infrastructure Layer
 * Consumes department events from Department Service
 * Handles staff department assignments, transfers, and department head changes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import * as amqp from 'amqplib';
import { ILogger } from '../../application/interfaces/ILogger';
import { GetStaffProfileUseCase } from "../../application/use-cases/GetStaffProfileUseCase";
import { SetDepartmentHeadUseCase } from "../../application/use-cases/SetDepartmentHeadUseCase";
import { UpdateStaffDepartmentUseCase } from "../../application/use-cases/UpdateStaffDepartmentUseCase";

// Utility function to convert assignment types from event data to database format
function normalizeAssignmentType(type: 'primary' | 'secondary' | 'temporary'): string {
  // Convert from lowercase enum to database role strings
  const roleMapping = {
    'primary': 'Attending Physician',
    'secondary': 'Consulting Physician', 
    'temporary': 'Temporary Staff'
  };
  return roleMapping[type] || 'Attending Physician';
}

export interface EnhancedDepartmentEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface DepartmentStaffAssignedEventData {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  assignedAt: Date;
  assignedBy: string;
  assignmentType: 'primary' | 'secondary' | 'temporary';
}

export interface DepartmentStaffRemovedEventData {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  removedAt: Date;
  removedBy: string;
  reason: string;
}

export interface DepartmentHeadAssignedEventData {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  previousHeadId?: string;
  newHeadId: string;
  newHeadName: string;
  newHeadEmail: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface DepartmentStaffTransferredEventData {
  fromDepartmentId: string;
  fromDepartmentCode: string;
  fromDepartmentName: string;
  toDepartmentId: string;
  toDepartmentCode: string;
  toDepartmentName: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffRole: string;
  transferredAt: Date;
  transferredBy: string;
  reason?: string;
}

/**
 * EnhancedDepartmentEventConsumer - Handles department events for staff management
 */
export class EnhancedDepartmentEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: EnhancedDepartmentEventConsumerConfig,
    private logger: ILogger,
    private getStaffProfileUseCase: GetStaffProfileUseCase,
    private setDepartmentHeadUseCase: SetDepartmentHeadUseCase,
    private updateStaffDepartmentUseCase: UpdateStaffDepartmentUseCase,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Enhanced Department events', {
        queueName: this.config.queueName,
      });

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
      this.logger.info('Enhanced Department event consumer connected successfully');

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

      this.logger.debug('Received enhanced department event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'department.staff.assigned':
          await this.handleDepartmentStaffAssigned(event.payload as DepartmentStaffAssignedEventData);
          break;

        case 'department.staff.removed':
          await this.handleDepartmentStaffRemoved(event.payload as DepartmentStaffRemovedEventData);
          break;

        case 'department.head.assigned':
          await this.handleDepartmentHeadAssigned(event.payload as DepartmentHeadAssignedEventData);
          break;

        case 'department.staff.transferred':
          await this.handleDepartmentStaffTransferred(event.payload as DepartmentStaffTransferredEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing enhanced department event', {
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
   * Handle department staff assigned event
   */
  private async handleDepartmentStaffAssigned(data: DepartmentStaffAssignedEventData): Promise<void> {
    this.logger.info('Processing department staff assignment', {
      departmentId: data.departmentId,
      staffId: data.staffId,
      staffName: data.staffName,
      assignmentType: data.assignmentType,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute({
        staffId: data.staffId,
        requestedBy: 'system',
        requestedByRole: 'department-service'
      });
      if (!staffProfile) {
        this.logger.error('Staff not found for department assignment', {
          staffId: data.staffId,
          departmentId: data.departmentId,
        });
        return;
      }

      // Update staff department assignment
      await this.updateStaffDepartmentUseCase.execute({
        staffId: data.staffId,
        departmentId: data.departmentId,
        departmentCode: data.departmentCode,
        departmentName: data.departmentName,
        assignmentType: normalizeAssignmentType(data.assignmentType),
        assignedBy: data.assignedBy,
        assignedByRole: 'department-service', // Default role for system events
        assignedAt: data.assignedAt,
      });

      this.logger.info('Staff department assignment updated successfully', {
        staffId: data.staffId,
        departmentId: data.departmentId,
        assignmentType: data.assignmentType,
      });

    } catch (error) {
      this.logger.error('Failed to process department staff assignment', {
        staffId: data.staffId,
        departmentId: data.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle department staff removed event
   */
  private async handleDepartmentStaffRemoved(data: DepartmentStaffRemovedEventData): Promise<void> {
    this.logger.info('Processing department staff removal', {
      departmentId: data.departmentId,
      staffId: data.staffId,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute({
        staffId: data.staffId,
        requestedBy: 'system',
        requestedByRole: 'department-service'
      });
      if (!staffProfile) {
        this.logger.error('Staff not found for department removal', {
          staffId: data.staffId,
          departmentId: data.departmentId,
        });
        return;
      }

      // Remove staff from department
      await this.updateStaffDepartmentUseCase.execute({
        staffId: data.staffId,
        departmentId: data.departmentId,
        departmentCode: '', // Empty since removing
        departmentName: '', // Empty since removing
        assignmentType: 'Removed', // Mark as removed
        assignedBy: data.removedBy,
        assignedByRole: 'department-service',
        assignedAt: data.removedAt,
        reason: data.reason
      });

      this.logger.info('Staff department removal completed successfully', {
        staffId: data.staffId,
        departmentId: data.departmentId,
        removedBy: data.removedBy
      });

    } catch (error) {
      this.logger.error('Failed to process department staff removal', {
        staffId: data.staffId,
        departmentId: data.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle department head assigned event
   */
  private async handleDepartmentHeadAssigned(data: DepartmentHeadAssignedEventData): Promise<void> {
    this.logger.info('Processing department head assignment', {
      departmentId: data.departmentId,
      newHeadId: data.newHeadId,
      newHeadName: data.newHeadName,
      previousHeadId: data.previousHeadId,
    });

    try {
      // Update previous head (if exists) to remove head role
      if (data.previousHeadId) {
        const previousHeadProfile = await this.getStaffProfileUseCase.execute({
          staffId: data.previousHeadId,
          requestedBy: 'system',
          requestedByRole: 'department-service'
        });
        if (previousHeadProfile) {
          // Remove head role from previous head
          await this.setDepartmentHeadUseCase.execute({
            staffId: data.previousHeadId,
            departmentId: data.departmentId,
            assignedBy: data.assignedBy,
            assignedByRole: 'department-service'
          });
          this.logger.info('Previous department head role removed', {
            previousHeadId: data.previousHeadId,
            departmentId: data.departmentId
          });
        }
      }

      // Update new head to assign head role
      const newHeadProfile = await this.getStaffProfileUseCase.execute({
        staffId: data.newHeadId,
        requestedBy: 'system',
        requestedByRole: 'department-service'
      });
      if (!newHeadProfile) {
        this.logger.error('New department head not found', {
          staffId: data.newHeadId,
          departmentId: data.departmentId,
        });
        return;
      }

      // Ensure new head is assigned to the department first
      // TODO: Check if new head is already assigned to department, if not assign them
      this.logger.info('Processing new department head assignment', {
        newHeadId: data.newHeadId,
        departmentId: data.departmentId
      });

      // Set new head
      await this.setDepartmentHeadUseCase.execute({
        staffId: data.newHeadId,
        departmentId: data.departmentId,
        assignedBy: data.assignedBy,
        assignedByRole: 'department-service'
      });

      this.logger.info('Department head assignment completed successfully', {
        departmentId: data.departmentId,
        newHeadId: data.newHeadId,
        newHeadName: data.newHeadName,
      });

    } catch (error) {
      this.logger.error('Failed to process department head assignment', {
        departmentId: data.departmentId,
        newHeadId: data.newHeadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle department staff transferred event
   */
  private async handleDepartmentStaffTransferred(data: DepartmentStaffTransferredEventData): Promise<void> {
    this.logger.info('Processing department staff transfer', {
      staffId: data.staffId,
      staffName: data.staffName,
      fromDepartmentId: data.fromDepartmentId,
      toDepartmentId: data.toDepartmentId,
      reason: data.reason,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute({
        staffId: data.staffId,
        requestedBy: 'system',
        requestedByRole: 'department-service'
      });
      if (!staffProfile) {
        this.logger.error('Staff not found for department transfer', {
          staffId: data.staffId,
          fromDepartmentId: data.fromDepartmentId,
          toDepartmentId: data.toDepartmentId,
        });
        return;
      }

      // Transfer staff to new department
      // First, remove from old department
      if (data.fromDepartmentId) {
        await this.updateStaffDepartmentUseCase.execute({
          staffId: data.staffId,
          departmentId: data.fromDepartmentId,
          departmentCode: data.fromDepartmentCode,
          departmentName: data.fromDepartmentName,
          assignmentType: 'Former Staff', // Mark as former in old department
          assignedBy: data.transferredBy,
          assignedByRole: 'department-service',
          assignedAt: data.transferredAt,
          reason: data.reason
        });
      }

      // Then assign to new department
      await this.updateStaffDepartmentUseCase.execute({
        staffId: data.staffId,
        departmentId: data.toDepartmentId,
        departmentCode: data.toDepartmentCode,
        departmentName: data.toDepartmentName,
        assignmentType: normalizeAssignmentType('primary'), // Default to primary in new department
        assignedBy: data.transferredBy,
        assignedByRole: 'department-service',
        assignedAt: data.transferredAt,
        reason: data.reason
      });

      this.logger.info('Staff department transfer completed successfully', {
        staffId: data.staffId,
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
      });

    } catch (error) {
      this.logger.error('Failed to process department staff transfer', {
        staffId: data.staffId,
        fromDepartmentId: data.fromDepartmentId,
        toDepartmentId: data.toDepartmentId,
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
      this.logger.info('Enhanced Department event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting enhanced department event consumer', {
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
