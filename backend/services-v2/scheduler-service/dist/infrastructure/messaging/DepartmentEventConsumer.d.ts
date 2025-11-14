/**
 * Department Event Consumer - Infrastructure Layer
 * Consumes department events from Department Service
 * Handles department-level automation, resource scheduling, and operational tasks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { CreateScheduleUseCase } from '../../application/use-cases/CreateScheduleUseCase';
import { UpdateScheduleUseCase } from '../../application/use-cases/UpdateScheduleUseCase';
import { CancelScheduleUseCase } from '../../application/use-cases/CancelScheduleUseCase';
import { SupabaseScheduleRepository } from '../persistence/SupabaseScheduleRepository';
export interface DepartmentEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface DepartmentCreatedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    departmentType: 'clinical' | 'administrative' | 'support' | 'emergency';
    headOfDepartmentId?: string;
    headOfDepartmentName?: string;
    location?: {
        floor: string;
        wing: string;
        roomNumber?: string;
    };
    contactInfo?: {
        phone: string;
        email: string;
    };
    operatingHours?: {
        monday: {
            open: string;
            close: string;
        };
        tuesday: {
            open: string;
            close: string;
        };
        wednesday: {
            open: string;
            close: string;
        };
        thursday: {
            open: string;
            close: string;
        };
        friday: {
            open: string;
            close: string;
        };
        saturday: {
            open: string;
            close: string;
        };
        sunday: {
            open: string;
            close: string;
        };
    };
    createdAt: Date;
    createdBy: string;
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
export interface DepartmentResourceUpdatedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    resourceType: 'equipment' | 'facility' | 'bed' | 'room' | 'other';
    resourceId: string;
    resourceName: string;
    action: 'added' | 'updated' | 'removed' | 'maintenance';
    updatedAt: Date;
    updatedBy: string;
    details?: {
        capacity?: number;
        status?: string;
        location?: string;
        specifications?: any;
    };
}
export interface DepartmentOperationalHoursChangedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    previousHours: {
        [key: string]: {
            open: string;
            close: string;
        };
    };
    newHours: {
        [key: string]: {
            open: string;
            close: string;
        };
    };
    changedAt: Date;
    changedBy: string;
    reason?: string;
}
/**
 * DepartmentEventConsumer - Handles department events for operational automation
 */
export declare class DepartmentEventConsumer {
    private config;
    private scheduleRepository;
    private createScheduleUseCase;
    private updateScheduleUseCase;
    private cancelScheduleUseCase;
    private connection?;
    private channel?;
    private isConnected;
    private logger;
    constructor(config: DepartmentEventConsumerConfig, scheduleRepository: SupabaseScheduleRepository, createScheduleUseCase: CreateScheduleUseCase, updateScheduleUseCase: UpdateScheduleUseCase, cancelScheduleUseCase: CancelScheduleUseCase);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle department created event
     */
    private handleDepartmentCreated;
    /**
     * Handle department staff assigned event
     */
    private handleDepartmentStaffAssigned;
    /**
     * Handle department resource updated event
     */
    private handleDepartmentResourceUpdated;
    /**
     * Handle department operational hours changed event
     */
    private handleDepartmentOperationalHoursChanged;
    /**
     * Create operating hours schedules
     */
    private createOperatingHoursSchedules;
    /**
     * Get day number for cron expression
     */
    private getDayNumber;
    /**
     * Generate cron expression for one-time event
     */
    private generateCronForOneTime;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=DepartmentEventConsumer.d.ts.map