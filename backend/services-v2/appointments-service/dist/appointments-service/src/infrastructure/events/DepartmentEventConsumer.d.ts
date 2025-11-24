/**
 * Department Event Consumer - Infrastructure Layer
 * Consumes department events from Department Service
 * Handles department resource constraints, capacity limits, and operational changes for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { InboxRepository } from '../inbox/InboxRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { IConflictResolutionService } from '../../application/services/IConflictResolutionService';
import { IReminderService } from '../../application/services/IReminderService';
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
    capacity?: {
        maxPatients: number;
        maxAppointmentsPerDay: number;
        maxAppointmentsPerSlot: number;
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
export interface DepartmentCapacityUpdatedEventData {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    previousCapacity: {
        maxPatients: number;
        maxAppointmentsPerDay: number;
        maxAppointmentsPerSlot: number;
    };
    newCapacity: {
        maxPatients: number;
        maxAppointmentsPerDay: number;
        maxAppointmentsPerSlot: number;
    };
    updatedAt: Date;
    updatedBy: string;
    reason?: string;
}
/**
 * DepartmentEventConsumer - Handles department events for appointment management
 */
export declare class DepartmentEventConsumer {
    private config;
    private appointmentRepository;
    private queueRepository;
    private conflictResolutionService;
    private reminderService;
    private inboxRepo;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: DepartmentEventConsumerConfig, appointmentRepository: IAppointmentRepository, queueRepository: IQueueRepository, conflictResolutionService: IConflictResolutionService, reminderService: IReminderService, inboxRepo: InboxRepository);
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
     * Handle department capacity updated event
     */
    private handleDepartmentCapacityUpdated;
    /**
     * ❌ REMOVED: initializeDepartmentAppointmentSettings
     * DEPRECATED: Department settings management is out of scope
     * This functionality belongs to Department Service
     *
     * Appointment Service should only:
     * - Consume department events for appointment conflict detection
     * - Update availability patterns based on department changes
     * - Handle appointment-specific operations
     */
    /**
     * Validate appointments against operating hours
     */
    private validateAppointmentsAgainstOperatingHours;
    /**
     * Check department capacity compliance
     */
    private checkDepartmentCapacityCompliance;
    /**
     * ❌ REMOVED: setupDefaultAppointmentTypes
     * DEPRECATED: Department appointment types belong to Department Service
     *
     * This functionality should be handled by Department Service:
     * - Create default appointment types for new departments
     * - Manage department-specific appointment configurations
     * - Update appointment type settings
     */
    /**
     * Check if appointment is outside operating hours
     */
    private isAppointmentOutsideOperatingHours;
    /**
     * Handle operating hours conflict
     */
    private handleOperatingHoursConflict;
    /**
     * Find appointments conflicting with new operating hours
     */
    private findAppointmentsConflictingWithHours;
    /**
     * Update department appointment availability
     * NOTE: This violates bounded context - Department Service should handle this
     * TODO: Move to Department Service or implement proper service communication
     */
    private updateDepartmentAppointmentAvailability;
    /**
     * Notify patients about operating hours changes
     */
    private notifyPatientsAboutOperatingHoursChanges;
    /**
     * Find appointments exceeding capacity
     */
    private findAppointmentsExceedingCapacity;
    /**
     * Handle capacity conflict
     * FIXED: Use proper aggregate pattern
     */
    private handleCapacityConflict;
    /**
     * Update department capacity settings
     * DEPRECATED: Department capacity belongs to Department Service
     */
    private updateDepartmentCapacitySettings;
    /**
     * Process waitlist for increased capacity
     * DEPRECATED: Waitlist management belongs to Waitlist Service
     */
    private processWaitlistForIncreasedCapacity;
    /**
     * Schedule appointment from waitlist
     * DEPRECATED: Waitlist management belongs to Waitlist Service
     */
    private scheduleFromWaitlist;
    /**
     * Handle facility resource update
     * DEPRECATED: Resource management belongs to Resource Management Service
     */
    private handleFacilityResourceUpdate;
    /**
     * Handle equipment resource update
     * DEPRECATED: Resource management belongs to Resource Management Service
     */
    private handleEquipmentResourceUpdate;
    /**
     * Handle bed resource update
     */
    private handleBedResourceUpdate;
    /**
     * Handle resource conflict
     * FIXED: Use proper aggregate pattern and method calls
     */
    private handleResourceConflict;
    /**
     * Handle department overload
     * FIXED: Use proper aggregate pattern and remove violating method calls
     */
    private handleDepartmentOverload;
    /**
     * ❌ REMOVED: updateStaffAppointmentPermissions
     * DEPRECATED: Staff permissions belong to Provider/Staff Service
     *
     * This functionality should be handled by Provider Staff Service:
     * - Manage staff appointment permissions
     * - Update staff credentials and access rights
     * - Handle staff authorization for appointments
     */
    /**
     * Update staff appointment availability
     * THUỘC Appointment Service: Quản lý real-time availability cho appointments
     */
    private updateStaffAppointmentAvailability;
    /**
     * Process pending appointments for staff
     * FIXED: Remove violating method calls and use proper alternatives
     */
    private processPendingAppointmentsForStaff;
    /**
     * Check if staff is suitable for appointment
     * FIXED: Use proper method signature for checkStaffAvailability
     */
    private isStaffSuitableForAppointment;
    /**
     * Assign appointment to staff
     * FIXED: Use proper aggregate pattern and method calls
     */
    private assignAppointmentToStaff;
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