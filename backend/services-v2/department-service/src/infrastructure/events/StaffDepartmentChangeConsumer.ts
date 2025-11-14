/**
 * Staff Department Change Consumer - Infrastructure Layer
 * Consumes staff-related events from Provider Staff Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { Logger } from '@infrastructure/logging/Logger';
import { IDepartmentRepository } from '@domain/repositories/IDepartmentRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { DepartmentStaffCountChangedEvent } from '@domain/events/DepartmentEvents';

export interface StaffDepartmentChangeConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface StaffDepartmentChangedEventData {
  staffId: string;
  staffName: string;
  staffEmail: string;
  previousDepartmentId?: string;
  newDepartmentId: string;
  newDepartmentCode: string;
  newDepartmentName: string;
  changedAt: Date;
  changedBy?: string;
  changeType: 'assigned' | 'transferred' | 'removed';
}

export interface StaffRoleChangedEventData {
  staffId: string;
  staffName: string;
  staffEmail: string;
  previousRole?: string;
  newRole: string;
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  changedAt: Date;
  changedBy?: string;
}

export interface StaffDepartmentAssignedEventData {
  staffId: string;
  staffName: string;
  departmentId: string;
  departmentName: string;
  assignmentType: 'primary' | 'secondary' | 'temporary';
  assignedBy: string;
  assignedAt: Date;
  role?: string;
}

export interface StaffStatusChangedEventData {
  staffId: string;
  staffName?: string;
  userId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
  changedAt: Date;
  departmentId?: string;
}

export interface DepartmentCreatedEventData {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  departmentType?: string;
  operatingHours?: Record<string, { open: string; close: string; isClosed: boolean }>;
  capacity?: {
    maxAppointmentsPerDay: number;
    maxPatientsPerDay: number;
  };
  createdAt: Date;
  createdBy?: string;
}

export interface DepartmentUpdatedEventData {
  departmentId: string;
  departmentCode: string;
  updatedFields: string[];
  newOperatingHours?: Record<string, { open: string; close: string; isClosed: boolean }>;
  newCapacity?: {
    maxAppointmentsPerDay: number;
    maxPatientsPerDay: number;
  };
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * StaffDepartmentChangeConsumer - Handles staff events for department management
 */
export class StaffDepartmentChangeConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: StaffDepartmentChangeConsumerConfig,
    private logger: Logger,
    private departmentRepository: IDepartmentRepository,
    private eventBus: IEventBus,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Staff events', {
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
      this.logger.info('Staff event consumer connected successfully');

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

      this.logger.debug('Received staff event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'provider.department.assigned':
          await this.handleStaffDepartmentAssigned(event.payload as StaffDepartmentAssignedEventData);
          break;

        case 'provider.department.changed':
          await this.handleStaffDepartmentChanged(event.payload as StaffDepartmentChangedEventData);
          break;

        case 'provider.role.changed':
          await this.handleStaffRoleChanged(event.payload as StaffRoleChangedEventData);
          break;

        case 'provider.status.changed':
          await this.handleStaffStatusChanged(event.payload as StaffStatusChangedEventData);
          break;

        case 'department.created':
          await this.handleDepartmentCreated(event.payload as DepartmentCreatedEventData);
          break;

        case 'department.updated':
          await this.handleDepartmentUpdated(event.payload as DepartmentUpdatedEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing staff event', {
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
   * Handle staff department changed event
   */
  private async handleStaffDepartmentChanged(data: StaffDepartmentChangedEventData): Promise<void> {
    this.logger.info('Processing staff department change', {
      staffId: data.staffId,
      staffName: data.staffName,
      previousDepartmentId: data.previousDepartmentId,
      newDepartmentId: data.newDepartmentId,
      changeType: data.changeType,
    });

    try {
      // Update previous department staff count (if applicable)
      if (data.previousDepartmentId && data.previousDepartmentId !== data.newDepartmentId) {
        const previousDepartment = await this.departmentRepository.findById(data.previousDepartmentId);
        if (previousDepartment) {
          const currentCount = previousDepartment.staffCount || 0;
          const newCount = Math.max(0, currentCount - 1);
          
          previousDepartment.updateStaffCount(
            newCount,
            'transferred_out',
            data.staffId,
            data.staffName
          );

          await this.departmentRepository.save(previousDepartment);
          await this.departmentRepository.removeStaffFromDepartment(data.staffId, data.previousDepartmentId);

          this.logger.info('Previous department staff count updated', {
            departmentId: data.previousDepartmentId,
            previousCount: currentCount,
            newCount,
          });
        }
      }

      // Update new department staff count (if applicable)
      if (data.newDepartmentId) {
        const newDepartment = await this.departmentRepository.findById(data.newDepartmentId);
        if (newDepartment) {
          const currentCount = newDepartment.staffCount || 0;
          const newCount = currentCount + 1;
          
          newDepartment.updateStaffCount(
            newCount,
            data.changeType === 'transferred' ? 'transferred_in' : 'added',
            data.staffId,
            data.staffName
          );

          await this.departmentRepository.save(newDepartment);
          await this.departmentRepository.assignStaffToDepartment(data.staffId, data.newDepartmentId, {
            staffName: data.staffName,
            assignmentType: data.changeType,
            assignedBy: data.changedBy,
          });

          this.logger.info('New department staff count updated', {
            departmentId: data.newDepartmentId,
            previousCount: currentCount,
            newCount,
          });
        } else {
          this.logger.warn('New department not found', {
            departmentId: data.newDepartmentId,
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to process staff department change', {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff role changed event
   */
  private async handleStaffRoleChanged(data: StaffRoleChangedEventData): Promise<void> {
    this.logger.info('Processing staff role change', {
      staffId: data.staffId,
      staffName: data.staffName,
      previousRole: data.previousRole,
      newRole: data.newRole,
      departmentId: data.departmentId,
    });

    try {
      // If staff has department, we might want to track role changes for analytics
      if (data.departmentId) {
        const department = await this.departmentRepository.findById(data.departmentId);
        if (department) {
          this.logger.info('Staff role changed in department', {
            departmentId: data.departmentId,
            departmentCode: department.code,
            staffId: data.staffId,
            staffName: data.staffName,
            newRole: data.newRole,
          });

          // Here we could add department-specific role tracking logic
          // For now, we just log the event for analytics purposes
        }
      }

    } catch (error) {
      this.logger.error('Failed to process staff role change', {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff department assigned event
   */
  private async handleStaffDepartmentAssigned(data: StaffDepartmentAssignedEventData): Promise<void> {
    this.logger.info('Processing staff department assignment', {
      staffId: data.staffId,
      departmentId: data.departmentId,
      assignmentType: data.assignmentType,
    });

    try {
      // Update department staff count
      const department = await this.departmentRepository.findById(data.departmentId);
      if (department) {
        const currentCount = department.staffCount || 0;
        const newCount = currentCount + 1;
        
        await this.departmentRepository.updateStaffCount(data.departmentId, newCount);
        await this.departmentRepository.assignStaffToDepartment(data.staffId, data.departmentId, {
          staffName: data.staffName,
          assignmentType: data.assignmentType,
          assignedBy: data.assignedBy,
        });
        
        const staffCountChangedEvent = DepartmentStaffCountChangedEvent.create(
          data.departmentId,
          department.code,
          department.nameEn,
          department.nameVi,
          currentCount,
          newCount,
          'added',
          data.staffId,
          data.staffName,
          data.assignedBy
        );
        
        await this.eventBus.publish(staffCountChangedEvent);
        
        this.logger.info('Department staff count updated', {
          departmentId: data.departmentId,
          previousCount: currentCount,
          newCount: newCount,
        });
      }
    } catch (error) {
      this.logger.error('Failed to process staff department assignment', {
        staffId: data.staffId,
        departmentId: data.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff status changed event
   */
  private async handleStaffStatusChanged(data: StaffStatusChangedEventData): Promise<void> {
    this.logger.info('Processing staff status change', {
      staffId: data.staffId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
    });

    try {
      const assignments = await this.departmentRepository.findByStaffId(data.staffId, { includeInactive: true });

      if (data.newStatus === 'suspended' || data.newStatus === 'terminated') {
        const activeAssignments = assignments.filter((assignment) => assignment.isActive);
        for (const assignment of activeAssignments) {
          const activeCount = Math.max(0, assignment.department.activeStaffCount - 1);
          await this.departmentRepository.updateActiveStaffCount(assignment.department.id, activeCount);

          this.logger.info('Department active staff count updated', {
            departmentId: assignment.department.id,
            staffId: data.staffId,
            newActiveCount: activeCount,
          });
        }

        if (activeAssignments.length > 0) {
          await this.departmentRepository.setStaffAssignmentsActive(data.staffId, false);
        }
      }
      
      if (data.newStatus === 'active' && data.previousStatus !== 'active') {
        const inactiveAssignments = assignments.filter((assignment) => !assignment.isActive);
        for (const assignment of inactiveAssignments) {
          const activeCount = assignment.department.activeStaffCount + 1;
          await this.departmentRepository.updateActiveStaffCount(assignment.department.id, activeCount);

          this.logger.info('Department active staff count updated', {
            departmentId: assignment.department.id,
            staffId: data.staffId,
            newActiveCount: activeCount,
          });
        }

        if (inactiveAssignments.length > 0) {
          await this.departmentRepository.setStaffAssignmentsActive(data.staffId, true);
        }
      }
    } catch (error) {
      this.logger.error('Failed to process staff status change', {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle department created event
   */
  private async handleDepartmentCreated(data: DepartmentCreatedEventData): Promise<void> {
    this.logger.info('Processing department creation', {
      departmentId: data.departmentId,
      departmentName: data.departmentName,
    });

    try {
      // Department service already handles this internally
      // This handler is for cross-service coordination if needed
      this.logger.debug('Department created event processed successfully', {
        departmentId: data.departmentId,
      });
    } catch (error) {
      this.logger.error('Failed to process department creation', {
        departmentId: data.departmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle department updated event
   */
  private async handleDepartmentUpdated(data: DepartmentUpdatedEventData): Promise<void> {
    this.logger.info('Processing department update', {
      departmentId: data.departmentId,
      updatedFields: data.updatedFields,
    });

    try {
      // Department service already handles this internally
      // This handler is for cross-service coordination if needed
      this.logger.debug('Department updated event processed successfully', {
        departmentId: data.departmentId,
        updatedFields: data.updatedFields,
      });
    } catch (error) {
      this.logger.error('Failed to process department update', {
        departmentId: data.departmentId,
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
      this.logger.info('Staff event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting staff event consumer', {
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
