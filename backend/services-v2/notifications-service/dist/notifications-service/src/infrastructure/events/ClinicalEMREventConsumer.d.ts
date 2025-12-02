/**
 * Clinical EMR Event Consumer - Infrastructure Layer
 * Consumes clinical events from Clinical EMR Service
 * Handles clinical notifications, test results, vital alerts, and medical updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
import { SendNotificationUseCase } from "../../application/use-cases/SendNotificationUseCase";
export interface ClinicalEMREventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface PatientClinicalProfileUpdatedEventData {
    patientId: string;
    patientName: string;
    clinicalData: {
        allergies: string[];
        medications: string[];
        conditions: string[];
        lastVisitDate?: Date;
        primaryPhysician?: string;
        riskLevel: "low" | "medium" | "high" | "critical";
        specialRequirements?: string[];
    };
    updatedAt: Date;
    updatedBy: string;
}
export interface TreatmentPlanCreatedEventData {
    treatmentPlanId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    treatmentType: string;
    frequency: string;
    duration: string;
    startDate: Date;
    endDate?: Date;
    requiredProcedures: string[];
    requiredEquipment: string[];
    specialInstructions?: string[];
    createdAt: Date;
    createdBy: string;
}
export interface MedicalTestOrderedEventData {
    testId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    testType: string;
    testCategory: "laboratory" | "radiology" | "cardiology" | "pathology" | "other";
    urgencyLevel: "routine" | "urgent" | "stat";
    orderedAt: Date;
    orderedBy: string;
    preparationInstructions?: string[];
    estimatedDuration: number;
}
export interface MedicalTestResultReadyEventData {
    testId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    testType: string;
    testCategory: "laboratory" | "radiology" | "cardiology" | "pathology" | "other";
    resultStatus: "normal" | "abnormal" | "critical" | "pending_review";
    completedAt: Date;
    completedBy: string;
    criticalValues?: {
        parameter: string;
        value: string;
        normalRange: string;
        severity: "mild" | "moderate" | "severe";
    }[];
    requiresFollowUp: boolean;
    followUpInstructions?: string;
}
export interface ClinicalDocumentAddedEventData {
    documentId: string;
    patientId: string;
    patientName: string;
    documentType: "referral" | "prescription" | "lab_result" | "imaging" | "discharge_summary" | "other";
    documentTitle: string;
    physicianId?: string;
    physicianName?: string;
    addedAt: Date;
    addedBy: string;
    requiresFollowUp: boolean;
    followUpInstructions?: string;
}
export interface VitalSignsRecordedEventData {
    recordingId: string;
    patientId: string;
    patientName: string;
    recordedBy: string;
    recordedAt: Date;
    vitalSigns: {
        bloodPressure?: {
            systolic: number;
            diastolic: number;
        };
        heartRate?: number;
        temperature?: number;
        oxygenSaturation?: number;
        respiratoryRate?: number;
        weight?: number;
        height?: number;
    };
    alerts?: {
        type: string;
        severity: "low" | "medium" | "high" | "critical";
        message: string;
    }[];
}
export interface MedicationPrescribedEventData {
    prescriptionId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }[];
    prescribedAt: Date;
    prescribedBy: string;
    requiresPharmacyPickup: boolean;
    pharmacyInstructions?: string;
}
export interface EmergencyAlertTriggeredEventData {
    alertId: string;
    patientId: string;
    patientName: string;
    location: string;
    alertType: "cardiac_arrest" | "respiratory_distress" | "severe_bleeding" | "fall" | "other";
    severity: "low" | "medium" | "high" | "critical";
    triggeredAt: Date;
    triggeredBy: string;
    description: string;
    immediateActions: string[];
    responseTeamRequired: string[];
}
/**
 * ClinicalEMREventConsumer - Handles clinical events for notifications
 */
export declare class ClinicalEMREventConsumer {
    private config;
    private sendNotificationUseCase;
    private getNotificationPreferencesUseCase;
    private inboxRepo;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: ClinicalEMREventConsumerConfig, sendNotificationUseCase: SendNotificationUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase, inboxRepo: IInboxRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle patient clinical profile updated event
     */
    private handlePatientClinicalProfileUpdated;
    /**
     * Handle treatment plan created event
     */
    private handleTreatmentPlanCreated;
    /**
     * Handle medical test ordered event
     */
    private handleMedicalTestOrdered;
    /**
     * Handle medical test result ready event
     */
    private handleMedicalTestResultReady;
    /**
     * Handle clinical document added event
     */
    private handleClinicalDocumentAdded;
    /**
     * Handle vital signs recorded event
     */
    private handleVitalSignsRecorded;
    /**
     * Handle medication prescribed event
     */
    private handleMedicationPrescribed;
    /**
     * Handle emergency alert triggered event
     */
    private handleEmergencyAlertTriggered;
    /**
     * Send clinical profile update notification to patient
     */
    private sendClinicalProfileUpdateNotification;
    /**
     * Send high-risk profile notification to physician
     */
    private sendHighRiskProfileNotification;
    /**
     * Send allergy alert notification
     */
    private sendAllergyAlertNotification;
    /**
     * Send treatment plan notification to patient
     */
    private sendTreatmentPlanNotification;
    /**
     * Send treatment plan notification to physician
     */
    private sendTreatmentPlanPhysicianNotification;
    /**
     * Schedule treatment reminders
     */
    private scheduleTreatmentReminders;
    /**
     * Send test order notification to patient
     */
    private sendTestOrderNotification;
    /**
     * Send urgent test notification to physician
     */
    private sendUrgentTestNotification;
    /**
     * Send test preparation instructions
     */
    private sendTestPreparationInstructions;
    /**
     * Send test result notification to patient
     */
    private sendTestResultNotification;
    /**
     * Send critical result notification to physician
     */
    private sendCriticalResultNotification;
    /**
     * Send test follow-up notification
     */
    private sendTestFollowUpNotification;
    /**
     * Send document notification to patient
     */
    private sendDocumentNotification;
    /**
     * Send document notification to physician
     */
    private sendDocumentPhysicianNotification;
    /**
     * Send document follow-up notification
     */
    private sendDocumentFollowUpNotification;
    /**
     * Handle vital signs alerts
     */
    private handleVitalSignsAlerts;
    /**
     * Send vital signs notification to patient
     */
    private sendVitalSignsNotification;
    /**
     * Send critical vital signs alert
     */
    private sendCriticalVitalSignsAlert;
    /**
     * Send vital signs alert notification to patient
     */
    private sendVitalSignsAlertNotification;
    /**
     * Send prescription notification to patient
     */
    private sendPrescriptionNotification;
    /**
     * Send pharmacy pickup notification
     */
    private sendPharmacyPickupNotification;
    /**
     * Schedule medication reminders
     */
    private scheduleMedicationReminders;
    /**
     * Send emergency alert notification
     */
    private sendEmergencyAlertNotification;
    /**
     * Send emergency contact notification
     */
    private sendEmergencyContactNotification;
    /**
     * Send department emergency notification
     */
    private sendDepartmentEmergencyNotification;
    /**
     * Log emergency notification for compliance
     */
    private logEmergencyNotification;
    /**
     * Helper methods
     */
    private getEnabledChannels;
    private getTreatmentFrequency;
    private getNextTreatmentDate;
    private getMedicationReminderTimes;
    private formatVitalSigns;
    private formatDate;
    private dispatchNotification;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=ClinicalEMREventConsumer.d.ts.map