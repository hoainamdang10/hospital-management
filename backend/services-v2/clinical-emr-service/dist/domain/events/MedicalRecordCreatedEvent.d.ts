/**
 * MedicalRecordCreatedEvent - Domain Event
 * Published when a new medical record is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
export interface MedicalRecordCreatedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    visitDate: Date;
    symptoms?: string;
    diagnosis?: string;
    createdBy: string;
    createdAt: Date;
}
export declare class MedicalRecordCreatedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentId?: string;
    readonly visitDate: Date;
    readonly symptoms?: string;
    readonly diagnosis?: string;
    readonly createdBy: string;
    constructor(data: MedicalRecordCreatedEventData);
    /**
     * Get event summary in Vietnamese
     */
    getVietnameseSummary(): string;
    /**
     * Get notification message for patient
     */
    getPatientNotificationMessage(): string;
    /**
     * Get notification message for doctor
     */
    getDoctorNotificationMessage(): string;
    /**
     * Check if event should trigger billing
     */
    shouldTriggerBilling(): boolean;
    /**
     * Check if event should trigger notifications
     */
    shouldTriggerNotifications(): boolean;
    /**
     * Get integration event data for other services
     */
    getIntegrationEventData(): any;
    /**
     * Get audit trail data
     */
    getAuditTrailData(): any;
    /**
     * Get FHIR event data (for future FHIR compliance)
     */
    getFHIREventData(): any;
    /**
     * Serialize event for message queue
     */
    serialize(): string;
    /**
     * Deserialize event from message queue
     */
    static deserialize(data: string): MedicalRecordCreatedEvent;
}
//# sourceMappingURL=MedicalRecordCreatedEvent.d.ts.map