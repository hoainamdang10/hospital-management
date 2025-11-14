/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff availability changes, schedule updates, and shift assignments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { CreateScheduleUseCase } from '../../application/use-cases/CreateScheduleUseCase';
import { UpdateScheduleUseCase } from '../../application/use-cases/UpdateScheduleUseCase';
import { CancelScheduleUseCase } from '../../application/use-cases/CancelScheduleUseCase';
import { SupabaseScheduleRepository } from '../persistence/SupabaseScheduleRepository';
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
/**
 * StaffEventConsumer - Handles staff events for scheduling
 */
export declare class StaffEventConsumer {
    private config;
    private scheduleRepository;
    private createScheduleUseCase;
    private updateScheduleUseCase;
    private cancelScheduleUseCase;
    private connection?;
    private channel?;
    private isConnected;
    private logger;
    constructor(config: StaffEventConsumerConfig, scheduleRepository: SupabaseScheduleRepository, createScheduleUseCase: CreateScheduleUseCase, updateScheduleUseCase: UpdateScheduleUseCase, cancelScheduleUseCase: CancelScheduleUseCase);
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
     * Generate cron expression for date range
     */
    private generateCronForDateRange;
    /**
     * Generate cron expression for one-time event
     */
    private generateCronForOneTime;
    /**
     * Generate cron expression for recurrence pattern
     */
    private generateCronForRecurrence;
    /**
     * Generate cron expression for shift pattern
     */
    private generateCronForShiftPattern;
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