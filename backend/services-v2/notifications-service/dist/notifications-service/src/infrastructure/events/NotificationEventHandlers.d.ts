/**
 * NotificationEventHandlers - Event Handlers
 * Event handlers for cross-service integration with Vietnamese healthcare context
 * Implements Inbox Pattern for idempotent event processing
 *
 * BOUNDED CONTEXT RESPONSIBILITIES:
 * ✅ IN SCOPE:
 *    - Receive scheduled notification events from Scheduler Service
 *    - Send immediate notifications from other services
 *    - Idempotent event processing (Inbox Pattern)
 *    - Multi-channel delivery (EMAIL, SMS, PUSH, IN_APP, VOICE)
 *    - Delivery tracking and retry logic
 *
 * ❌ OUT OF SCOPE:
 *    - Scheduling logic (belongs to Scheduler Service)
 *    - Business logic to create notifications (belongs to domain services)
 *    - User preferences management (belongs to Identity Service)
 *
 * EVENT FLOW:
 * 1. Scheduled Notifications:
 *    Appointments Service → Scheduler Service → (RabbitMQ) → Notifications Service
 *    - Appointments Service creates schedule via SchedulerServiceClient
 *    - Scheduler Service fires event when due
 *    - Notifications Service receives event and sends notification
 *
 * 2. Immediate Notifications:
 *    Any Service → Notifications Service (direct API call)
 *    - Service calls Notifications API directly
 *    - Notification sent immediately
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Vietnamese Healthcare Standards, Inbox Pattern
 */
import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';
import { IInboxRepository } from '../../domain/repositories/IInboxRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
export interface DomainEvent {
    eventId: string;
    eventType: string;
    aggregateId: string;
    aggregateType: string;
    eventData: any;
    occurredAt: Date;
    version: number;
    metadata?: {
        correlationId?: string;
        causationId?: string;
        userId?: string;
        source?: string;
    };
}
export interface IntegrationEvent extends DomainEvent {
    serviceName: string;
    eventVersion: string;
    headers?: {
        idempotency_key?: string;
        schedule_id?: string;
        run_id?: string;
        correlation_id?: string;
        causation_id?: string;
        tenant_id?: string;
    };
}
/**
 * Event payload from Scheduler Service
 */
export interface ScheduleRunDueEvent {
    type: string;
    payload: {
        recipient: {
            recipientId: string;
            recipientType: string;
        };
        template: {
            templateType: string;
            templateData: Record<string, any>;
        };
        content: any;
        channels: string[];
        priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        metadata?: {
            correlationId?: string;
            healthcareContext?: {
                patientId?: string;
                doctorId?: string;
                appointmentId?: string;
                medicalRecordId?: string;
            };
            tags?: string[];
            source?: string;
        };
    };
    headers: {
        idempotency_key: string;
        schedule_id: string;
        run_id: string;
        correlation_id?: string;
        causation_id?: string;
        tenant_id?: string;
    };
}
export declare class NotificationEventHandlers {
    private readonly notificationService;
    private readonly inboxRepo;
    private readonly sendNotificationUseCase;
    constructor(notificationService: NotificationApplicationService, inboxRepo: IInboxRepository, sendNotificationUseCase: SendNotificationUseCase);
    /**
     * Handle schedule run due event from Scheduler Service
     * This is the ONLY entry point for scheduled notifications
     * Implements Inbox Pattern for idempotent processing
     */
    handleScheduleRunDue(event: ScheduleRunDueEvent): Promise<void>;
    /**
     * Handle appointment scheduled event (IMMEDIATE CONFIRMATION ONLY)
     * NOTE: Reminder scheduling is handled by Appointments Service → Scheduler Service
     */
    handleAppointmentScheduled(event: IntegrationEvent): Promise<void>;
    /**
     * Handle appointment cancelled event
     */
    handleAppointmentCancelled(event: IntegrationEvent): Promise<void>;
    /**
     * Handle medical record updated event
     */
    handleMedicalRecordUpdated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle invoice generated event (IMMEDIATE NOTIFICATION ONLY)
     * NOTE: Payment reminder scheduling is handled by Billing Service → Scheduler Service
     */
    handleInvoiceGenerated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle payment completed event
     */
    handlePaymentCompleted(event: IntegrationEvent): Promise<void>;
    /**
     * Handle emergency alert event
     */
    handleEmergencyAlert(event: IntegrationEvent): Promise<void>;
    /**
     * Handle medication reminder event
     */
    handleMedicationReminder(event: IntegrationEvent): Promise<void>;
    /**
     * Handle user created event from Identity Service
     */
    handleUserCreated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle user activated event from Identity Service
     */
    handleUserActivated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle password reset event from Identity Service
     */
    handlePasswordReset(event: IntegrationEvent): Promise<void>;
    /**
     * Handle user role changed event from Identity Service
     */
    handleUserRoleChanged(event: IntegrationEvent): Promise<void>;
    /**
     * Handle staff invitation created event from Identity Service
     */
    handleStaffInvitationCreated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle patient registered event from Patient Registry Service
     */
    handlePatientRegistered(event: IntegrationEvent): Promise<void>;
    /**
     * Handle patient updated event from Patient Registry Service
     */
    handlePatientUpdated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle patient deactivated event from Patient Registry Service
     */
    handlePatientDeactivated(event: IntegrationEvent): Promise<void>;
    /**
     * Handle patient consent granted event from Patient Registry Service
     */
    handlePatientConsentGranted(event: IntegrationEvent): Promise<void>;
    /**
     * Generic event handler dispatcher
     */
    handleEvent(event: IntegrationEvent | ScheduleRunDueEvent): Promise<void>;
}
//# sourceMappingURL=NotificationEventHandlers.d.ts.map