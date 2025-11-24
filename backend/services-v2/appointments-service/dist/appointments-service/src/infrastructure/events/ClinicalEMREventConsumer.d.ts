/**
 * Clinical EMR Event Consumer - Infrastructure Layer
 * Consumes clinical events from Clinical EMR Service
 * Handles clinical requirements, medical constraints, and health aspects for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { InboxRepository } from '../inbox/InboxRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService } from '../../application/services/IReminderService';
import { IConflictResolutionService } from '../../application/services/IConflictResolutionService';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
export declare class ClinicalEMREventConsumer {
    private inboxRepository;
    private appointmentRepository;
    private reminderService;
    private conflictResolutionService;
    private queueRepository;
    private connection?;
    private channel?;
    private isConnected;
    constructor(inboxRepository: InboxRepository, appointmentRepository: IAppointmentRepository, reminderService: IReminderService, conflictResolutionService: IConflictResolutionService, queueRepository: IQueueRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Handle patient clinical profile updates
     */
    private handlePatientClinicalProfileUpdated;
    /**
     * Evaluate appointment for clinical changes
     */
    private evaluateAppointmentForClinicalChanges;
    /**
     * Prioritize patient scheduling based on risk level
     */
    private prioritizePatientScheduling;
    /**
     * Update appointment requirements based on clinical data
     */
    private updateAppointmentRequirements;
    /**
     * Handle treatment plan creation
     */
    private handleTreatmentPlanCreated;
    /**
     * Generate treatment plan appointments
     */
    private generateTreatmentPlanAppointments;
    /**
     * Handle emergency case creation
     */
    private handleEmergencyCaseCreated;
    /**
     * Create urgent appointment
     */
    private createUrgentAppointment;
    /**
     * Handle surgical procedure scheduling
     */
    private handleSurgicalProcedureScheduled;
    /**
     * Create pre-operative appointment
     */
    private createPreOperativeAppointment;
    /**
     * Create post-operative appointments
     */
    private createPostOperativeAppointments;
    /**
     * Handle follow-up appointment request
     */
    private handleFollowUpAppointmentRequested;
    /**
     * Create follow-up appointment
     */
    private createFollowUpAppointment;
    /**
     * Get priority from risk level
     */
    private getPriorityFromRiskLevel;
    /**
     * Get priority from urgency
     */
    private getPriorityFromUrgency;
}
//# sourceMappingURL=ClinicalEMREventConsumer.d.ts.map