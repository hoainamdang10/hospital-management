/**
 * IntegrationEventHandlers - Application Layer
 * Event handlers for processing integration events from Clinical EMR Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
import { IDomainEventHandler } from '../../../../shared/domain/events/IDomainEventHandler';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordCreatedEvent } from '../../domain/events/MedicalRecordCreatedEvent';
import { MedicalRecordUpdatedEvent } from '../../domain/events/MedicalRecordUpdatedEvent';
import { DiagnosisAddedEvent } from '../../domain/events/DiagnosisAddedEvent';
import { MedicationAddedEvent } from '../../domain/events/MedicationAddedEvent';
/**
 * Medical Record Created Event Handler
 * Handles when a new medical record is created
 */
export declare class MedicalRecordCreatedEventHandler implements IDomainEventHandler<MedicalRecordCreatedEvent> {
    private readonly eventPublisher;
    private readonly medicalRecordRepository;
    constructor(eventPublisher: IDomainEventPublisher, medicalRecordRepository: IMedicalRecordRepository);
    handle(event: MedicalRecordCreatedEvent): Promise<void>;
}
/**
 * Medical Record Updated Event Handler
 * Handles when a medical record is updated
 */
export declare class MedicalRecordUpdatedEventHandler implements IDomainEventHandler<MedicalRecordUpdatedEvent> {
    private readonly eventPublisher;
    private readonly medicalRecordRepository;
    constructor(eventPublisher: IDomainEventPublisher, medicalRecordRepository: IMedicalRecordRepository);
    handle(event: MedicalRecordUpdatedEvent): Promise<void>;
    private checkBillingImpact;
    private isSignificantUpdate;
}
/**
 * Diagnosis Added Event Handler
 * Handles when a diagnosis is added to a medical record
 */
export declare class DiagnosisAddedEventHandler implements IDomainEventHandler<DiagnosisAddedEvent> {
    private readonly eventPublisher;
    private readonly medicalRecordRepository;
    constructor(eventPublisher: IDomainEventPublisher, medicalRecordRepository: IMedicalRecordRepository);
    handle(event: DiagnosisAddedEvent): Promise<void>;
}
/**
 * Medication Added Event Handler
 * Handles when a medication is added to a medical record
 */
export declare class MedicationAddedEventHandler implements IDomainEventHandler<MedicationAddedEvent> {
    private readonly eventPublisher;
    private readonly medicalRecordRepository;
    constructor(eventPublisher: IDomainEventPublisher, medicalRecordRepository: IMedicalRecordRepository);
    handle(event: MedicationAddedEvent): Promise<void>;
    private calculateNextDoseTime;
}
/**
 * Integration Event Publisher Service
 * Centralized service for publishing integration events
 */
export declare class IntegrationEventPublisherService {
    private readonly eventPublisher;
    constructor(eventPublisher: IDomainEventPublisher);
    /**
     * Publish medical record completion for billing
     */
    publishMedicalRecordCompleted(recordId: string, patientId: string, doctorId: string, appointmentId: string, visitDate: Date, diagnoses: any[], medications: any[], procedures: any[], billingInfo: any, completedBy: string): Promise<void>;
    /**
     * Publish insurance verification requirement
     */
    publishInsuranceVerificationRequired(recordId: string, patientId: string, insuranceInfo: any, verificationReason: any, estimatedCost: number, urgency: any, requestedBy: string): Promise<void>;
    /**
     * Publish payment requirement
     */
    publishPaymentRequired(recordId: string, patientId: string, paymentInfo: any, itemizedCharges: any[], priority: any, generatedBy: string): Promise<void>;
    /**
     * Publish follow-up appointment requirement
     */
    publishFollowUpRequired(originalAppointmentId: string, originalRecordId: string, patientId: string, doctorId: string, followUpDetails: any, clinicalReason: any, requestedBy: string): Promise<void>;
    /**
     * Publish referral requirement
     */
    publishReferralRequired(originalAppointmentId: string, originalRecordId: string, patientId: string, referringDoctorId: string, referralDetails: any, diagnosticInfo: any, referredBy: string): Promise<void>;
}
//# sourceMappingURL=IntegrationEventHandlers.d.ts.map