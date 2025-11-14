/**
 * ❌ DISABLED - SchedulingEventConsumer
 * 
 * THIS FILE HAS BEEN DISABLED DUE TO BOUNDED CONTEXT VIOLATION
 * 
 * VIOLATION: This consumer handles real-time availability and shift assignments
 * which belong to the Appointment Service, not Provider Staff Service.
 * 
 * Provider Staff Service should ONLY manage:
 * - Fixed work schedules (recurring patterns)
 * - Staff profiles and credentials  
 * - Department assignments
 * - Employment status
 * 
 * Appointment Service should manage:
 * - Real-time availability for appointments
 * - Shift assignments and dynamic scheduling
 * - Appointment-based schedule changes
 * 
 * To properly handle scheduling events:
 * 1. Remove this file completely (or keep as DISABLED_*)
 * 2. Let Appointment Service consume scheduling events
 * 3. Provider Staff Service only publishes StaffScheduleUpdatedEvent
 * 
 * @author Hospital Management Team
 * @version 2.0.0 - DISABLED
 * @compliance Clean Architecture, Event-Driven Architecture, Bounded Contexts
 */

import { ConsumeMessage } from 'amqplib';
import { ILogger } from '../../application/interfaces/ILogger';
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';
import { UpdateStaffScheduleUseCase } from '../../application/use-cases/UpdateStaffScheduleUseCase';

export interface SchedulingEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

// Appointment Events Data Interfaces
export interface StaffScheduleUpdatedEventData {
  staffId: string;
  scheduleId?: string;
  scheduleType?: string;
  startDate?: string;
  endDate?: string;
  shiftPattern?: string;
  departmentId?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  consultationFee: number;
  createdBy: string;
  scheduledAt: Date;
  reason?: string;
}

export interface StaffShiftAssignedEventData {
  staffId: string;
  staffName: string;
  shiftId: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night' | 'on_call';
  date: Date;
  startTime: string;
  endTime: string;
  departmentId: string;
  departmentName: string;
  assignedBy: string;
  assignedAt: Date;
  isRecurring: boolean;
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface StaffShiftCancelledEventData {
  staffId: string;
  staffName: string;
  shiftId: string;
  date: Date;
  startTime: string;
  endTime: string;
  departmentId: string;
  cancelledBy: string;
  cancelledAt: Date;
  reason: string;
  isRecurring: boolean;
  affectedDates?: Date[];
}

export interface StaffAvailabilityChangedEventData {
  staffId: string;
  staffName: string;
  availabilityType: 'available' | 'unavailable' | 'on_call' | 'off_duty';
  startDate: Date;
  endDate?: Date;
  reason?: string;
  changedBy: string;
  changedAt: Date;
  departmentId?: string;
  isTemporary: boolean;
}

export interface StaffOvertimeApprovedEventData {
  staffId: string;
  staffName: string;
  overtimeId: string;
  date: Date;
  regularHours: number;
  overtimeHours: number;
  overtimeRate: number;
  approvedBy: string;
  approvedAt: Date;
  reason: string;
  departmentId: string;
}

/**
 * SchedulingEventConsumer - Handles scheduling events for staff management
 */
// ❌ DISABLED CLASS - DO NOT USE
export class DISABLED_SchedulingEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: SchedulingEventConsumerConfig,
    private logger: ILogger,
    private getStaffProfileUseCase: GetStaffProfileUseCase,
    private updateStaffScheduleUseCase: UpdateStaffScheduleUseCase,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Scheduling events', {
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
      this.logger.info('Scheduling event consumer connected successfully');

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

      this.logger.debug('Received scheduling event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'schedule.staff.updated':
          await this.handleStaffScheduleUpdated(event.payload as StaffScheduleUpdatedEventData);
          break;

        case 'shift.staff.assigned':
          await this.handleStaffShiftAssigned(event.payload as StaffShiftAssignedEventData);
          break;

        case 'shift.staff.cancelled':
          await this.handleStaffShiftCancelled(event.payload as StaffShiftCancelledEventData);
          break;

        case 'availability.staff.changed':
          await this.handleStaffAvailabilityChanged(event.payload as StaffAvailabilityChangedEventData);
          break;

        case 'overtime.staff.approved':
          await this.handleStaffOvertimeApproved(event.payload as StaffOvertimeApprovedEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing scheduling event', {
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
   * Handle staff schedule updated event
   */
  private async handleStaffScheduleUpdated(data: StaffScheduleUpdatedEventData): Promise<void> {
    this.logger.info('Processing staff schedule update', {
      staffId: data.staffId,
      scheduleId: data.scheduleId,
      scheduleType: data.scheduleType,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute({
        staffId: data.staffId,
        requestedBy: 'system',
        requestedByRole: 'system'
      });
      if (!staffProfile) {
        this.logger.error('Staff not found for schedule update', {
          staffId: data.staffId,
          scheduleId: data.scheduleId,
        });
        return;
      }

      // Update staff schedule
      await this.updateStaffScheduleUseCase.execute({
        staffId: data.staffId,
        workSchedule: {
          workingDays: [], // TODO: Map from scheduling data
          workingHours: { start: '08:00', end: '17:00' }, // TODO: Map from scheduling data
          timeZone: 'Asia/Ho_Chi_Minh',
          isFlexible: false
        },
        effectiveDate: data.startDate || new Date().toISOString(),
        updatedBy: data.updatedBy || 'system',
        updatedByRole: 'system'
      });

      this.logger.info('Staff schedule updated successfully', {
        staffId: data.staffId,
        scheduleId: data.scheduleId,
        scheduleType: data.scheduleType,
      });

    } catch (error) {
      this.logger.error('Failed to process staff schedule update', {
        staffId: data.staffId,
        scheduleId: data.scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff shift assigned event
   */
  private async handleStaffShiftAssigned(data: StaffShiftAssignedEventData): Promise<void> {
    this.logger.info('Processing staff shift assignment', {
      staffId: data.staffId,
      shiftId: data.shiftId,
      shiftType: data.shiftType,
      date: data.date,
      departmentId: data.departmentId,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(data.staffId);
      if (!staffProfile) {
        this.logger.error('Staff not found for shift assignment', {
          staffId: data.staffId,
          shiftId: data.shiftId,
        });
        return;
      }

      // Update staff schedule with new shift
      await this.updateStaffScheduleUseCase.execute({
        staffId: data.staffId,
        shiftId: data.shiftId,
        action: 'assign_shift',
        shiftType: data.shiftType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        assignedBy: data.assignedBy,
        assignedAt: data.assignedAt,
        isRecurring: data.isRecurring,
        recurrencePattern: data.recurrencePattern,
      });

      this.logger.info('Staff shift assignment processed successfully', {
        staffId: data.staffId,
        shiftId: data.shiftId,
        shiftType: data.shiftType,
        date: data.date,
      });

    } catch (error) {
      this.logger.error('Failed to process staff shift assignment', {
        staffId: data.staffId,
        shiftId: data.shiftId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff shift cancelled event
   */
  private async handleStaffShiftCancelled(data: StaffShiftCancelledEventData): Promise<void> {
    this.logger.info('Processing staff shift cancellation', {
      staffId: data.staffId,
      shiftId: data.shiftId,
      date: data.date,
      cancelledBy: data.cancelledBy,
      reason: data.reason,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(data.staffId);
      if (!staffProfile) {
        this.logger.error('Staff not found for shift cancellation', {
          staffId: data.staffId,
          shiftId: data.shiftId,
        });
        return;
      }

      // Update staff schedule to remove shift
      await this.updateStaffScheduleUseCase.execute({
        staffId: data.staffId,
        shiftId: data.shiftId,
        action: 'cancel_shift',
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        departmentId: data.departmentId,
        cancelledBy: data.cancelledBy,
        cancelledAt: data.cancelledAt,
        reason: data.reason,
        isRecurring: data.isRecurring,
        affectedDates: data.affectedDates,
      });

      this.logger.info('Staff shift cancellation processed successfully', {
        staffId: data.staffId,
        shiftId: data.shiftId,
        date: data.date,
      });

    } catch (error) {
      this.logger.error('Failed to process staff shift cancellation', {
        staffId: data.staffId,
        shiftId: data.shiftId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff availability changed event
   */
  private async handleStaffAvailabilityChanged(data: StaffAvailabilityChangedEventData): Promise<void> {
    this.logger.info('Processing staff availability change', {
      staffId: data.staffId,
      availabilityType: data.availabilityType,
      startDate: data.startDate,
      endDate: data.endDate,
      isTemporary: data.isTemporary,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(data.staffId);
      if (!staffProfile) {
        this.logger.error('Staff not found for availability change', {
          staffId: data.staffId,
        });
        return;
      }

      // Update staff availability
      await this.updateStaffScheduleUseCase.execute({
        staffId: data.staffId,
        action: 'update_availability',
        availabilityType: data.availabilityType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        changedBy: data.changedBy,
        changedAt: data.changedAt,
        departmentId: data.departmentId,
        isTemporary: data.isTemporary,
      });

      this.logger.info('Staff availability updated successfully', {
        staffId: data.staffId,
        availabilityType: data.availabilityType,
        isTemporary: data.isTemporary,
      });

    } catch (error) {
      this.logger.error('Failed to process staff availability change', {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff overtime approved event
   */
  private async handleStaffOvertimeApproved(data: StaffOvertimeApprovedEventData): Promise<void> {
    this.logger.info('Processing staff overtime approval', {
      staffId: data.staffId,
      overtimeId: data.overtimeId,
      date: data.date,
      regularHours: data.regularHours,
      overtimeHours: data.overtimeHours,
      approvedBy: data.approvedBy,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(data.staffId);
      if (!staffProfile) {
        this.logger.error('Staff not found for overtime approval', {
          staffId: data.staffId,
          overtimeId: data.overtimeId,
        });
        return;
      }

      // Update staff schedule with overtime information
      await this.updateStaffScheduleUseCase.execute({
        staffId: data.staffId,
        overtimeId: data.overtimeId,
        action: 'approve_overtime',
        date: data.date,
        regularHours: data.regularHours,
        overtimeHours: data.overtimeHours,
        overtimeRate: data.overtimeRate,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        reason: data.reason,
        departmentId: data.departmentId,
      });

      this.logger.info('Staff overtime approval processed successfully', {
        staffId: data.staffId,
        overtimeId: data.overtimeId,
        overtimeHours: data.overtimeHours,
      });

    } catch (error) {
      this.logger.error('Failed to process staff overtime approval', {
        staffId: data.staffId,
        overtimeId: data.overtimeId,
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
      this.logger.info('Scheduling event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting scheduling event consumer', {
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
