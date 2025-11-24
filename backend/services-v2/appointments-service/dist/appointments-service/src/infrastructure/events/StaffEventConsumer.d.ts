/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff availability, schedule updates, and resource constraints for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { InboxRepository } from '../inbox/InboxRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
import { IConflictResolutionService } from '../../application/services/IConflictResolutionService';
import { IReminderService } from '../../application/services/IReminderService';
import { ReschedulingService } from '../../application/services/ReschedulingService';
export interface StaffEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
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
export interface StaffScheduleUpdatedEventData {
    staffId: string;
    staffName: string;
    scheduleId: string;
    scheduleType: 'regular' | 'on_call' | 'vacation' | 'sick_leave' | 'personal_leave';
    startDate: Date;
    endDate: Date;
    shiftPattern: {
        monday?: {
            start: string;
            end: string;
            type: string;
        };
        tuesday?: {
            start: string;
            end: string;
            type: string;
        };
        wednesday?: {
            start: string;
            end: string;
            type: string;
        };
        thursday?: {
            start: string;
            end: string;
            type: string;
        };
        friday?: {
            start: string;
            end: string;
            type: string;
        };
        saturday?: {
            start: string;
            end: string;
            type: string;
        };
        sunday?: {
            start: string;
            end: string;
            type: string;
        };
    };
    departmentId?: string;
    updatedBy: string;
    updatedAt: Date;
    reason?: string;
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
export interface DepartmentCreatedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    departmentType?: string;
    operatingHours?: Record<string, {
        open: string;
        close: string;
        isClosed: boolean;
    }>;
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
    newOperatingHours?: Record<string, {
        open: string;
        close: string;
        isClosed: boolean;
    }>;
    newCapacity?: {
        maxAppointmentsPerDay: number;
        maxPatientsPerDay: number;
    };
    updatedAt: Date;
    updatedBy?: string;
}
export interface DepartmentStaffCountChangedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    previousCount: number;
    newCount: number;
    changeType: 'added' | 'removed' | 'transferred_in' | 'transferred_out';
    staffId?: string;
    staffName?: string;
    changedAt: Date;
}
export interface DepartmentCapacityUpdatedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    newCapacity: {
        maxAppointmentsPerDay: number;
        maxPatientsPerDay: number;
    };
    previousCapacity: {
        maxAppointmentsPerDay: number;
        maxPatientsPerDay: number;
    };
    updatedBy?: string;
    updatedAt: Date;
}
/**
 * StaffEventConsumer - Handles staff events for appointment management
 */
export declare class StaffEventConsumer {
    private config;
    private appointmentRepository;
    private queueRepository;
    private providerScheduleRepository;
    private conflictResolutionService;
    private reminderService;
    private inboxRepo;
    private reschedulingService;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: StaffEventConsumerConfig, appointmentRepository: IAppointmentRepository, queueRepository: IQueueRepository, providerScheduleRepository: IProviderScheduleRepository, conflictResolutionService: IConflictResolutionService, reminderService: IReminderService, inboxRepo: InboxRepository, reschedulingService: ReschedulingService);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle staff availability changed event
     */
    private handleStaffAvailabilityChanged;
    /**
     * Handle staff shift assigned event
     */
    private handleStaffShiftAssigned;
    /**
     * Handle staff shift cancelled event
     */
    private handleStaffShiftCancelled;
    /**
     * Handle staff schedule updated event
     */
    private handleStaffScheduleUpdated;
    /**
     * Find conflicting appointments for staff within time range
     */
    private findConflictingAppointments;
    /**
     * Handle conflicting appointment
     */
    private handleConflictingAppointment;
    /**
     * Update provider schedule availability
     */
    private updateProviderScheduleAvailability;
    /**
     * Update provider schedule with new shift
     */
    private updateProviderScheduleShift;
    /**
     * Process waitlist for available staff
     * FIXED: Remove violating method call and add proper typing
     */
    private processWaitlistForAvailableStaff;
    /**
        });
  
      } catch (error) {
        console.error('Failed to schedule appointment from waitlist', {
          waitlistEntryId: waitlistEntry.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  
    /**
     * Update recurring shift schedule
     */
    private updateRecurringShiftSchedule;
    /**
     * Remove shift from provider schedule
     */
    private removeShiftFromProviderSchedule;
    /**
     * Remove recurring shift from schedule
     */
    private removeRecurringShiftFromSchedule;
    /**
     * Update provider schedule pattern
     */
    private updateProviderSchedulePattern;
    /**
     * Schedule waitlist processing for return date
     */
    private scheduleWaitlistProcessing;
    /**
     * Handle staff status changed event
     */
    private handleStaffStatusChanged;
    /**
     * Handle staff department assigned event
     */
    private handleStaffDepartmentAssigned;
    /**
     * Handle department created event
     */
    private handleDepartmentCreated;
    /**
     * Handle department updated event
     */
    private handleDepartmentUpdated;
    /**
     * Handle department staff count changed event
     */
    private handleDepartmentStaffCountChanged;
    /**
     * Update staff appointment availability
     */
    private updateStaffAppointmentAvailability;
    /**
     * Process pending appointments for staff
     */
    private processPendingAppointmentsForStaff;
    /**
     * Validate appointments against operating hours
     */
    private validateAppointmentsAgainstOperatingHours;
    /**
     * Check department capacity compliance
     */
    private checkDepartmentCapacityCompliance;
    /**
     * Handle department overload
     */
    private handleDepartmentOverload;
    /**
     * Process waitlist for increased capacity
     */
    private processWaitlistForIncreasedCapacity;
    /**
     * Helper methods for conflict handling
     */
    private isAppointmentOutsideOperatingHours;
    private findAppointmentsExceedingCapacity;
    private handleOperatingHoursConflict;
    private handleCapacityConflict;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=StaffEventConsumer.d.ts.map