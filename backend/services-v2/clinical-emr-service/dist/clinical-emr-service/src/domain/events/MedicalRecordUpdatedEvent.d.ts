/**
 * MedicalRecordUpdatedEvent - Domain Event
 * Published when a medical record is updated
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface MedicalRecordUpdatedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    updatedFields: string[];
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    updatedBy: string;
    updatedAt: Date;
    updateReason?: string;
}
export declare class MedicalRecordUpdatedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly updatedFields: string[];
    readonly previousValues?: Record<string, any>;
    readonly newValues?: Record<string, any>;
    readonly updatedBy: string;
    readonly updateReason?: string;
    constructor(data: MedicalRecordUpdatedEventData);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get event summary in Vietnamese
     */
    getVietnameseSummary(): string;
    /**
     * Get updated fields in Vietnamese
     */
    getUpdatedFieldsInVietnamese(): string[];
    /**
     * Check if critical fields were updated
     */
    hasCriticalUpdates(): boolean;
    /**
     * Check if vital signs were updated
     */
    hasVitalSignsUpdates(): boolean;
    /**
     * Get notification message for patient
     */
    getPatientNotificationMessage(): string;
    /**
     * Get notification message for doctor
     */
    getDoctorNotificationMessage(): string;
    /**
     * Check if event should trigger notifications
     */
    shouldTriggerNotifications(): boolean;
    /**
     * Check if event should trigger audit log
     */
    shouldTriggerAuditLog(): boolean;
    /**
     * Get change summary
     */
    getChangeSummary(): string;
    /**
     * Get integration event data for other services
     */
    getIntegrationEventData(): any;
    /**
     * Get audit trail data
     */
    getAuditTrailData(): any;
    /**
     * Serialize event for message queue
     */
    serialize(): string;
    /**
     * Deserialize event from message queue
     */
    static deserialize(data: string): MedicalRecordUpdatedEvent;
}
//# sourceMappingURL=MedicalRecordUpdatedEvent.d.ts.map