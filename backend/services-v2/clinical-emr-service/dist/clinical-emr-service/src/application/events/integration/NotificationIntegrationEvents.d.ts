/**
 * NotificationIntegrationEvents - Application Layer
 * Integration events for notification service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
import { IntegrationEvent } from '@shared/domain/base/domain-event';
/**
 * Medical Record Notification Event
 * Triggered when notifications need to be sent regarding medical records
 */
export declare class MedicalRecordNotificationEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly notificationType: 'record_completed' | 'critical_findings' | 'medication_alert' | 'follow_up_reminder' | 'test_results_available';
    readonly recipients: Array<{
        type: 'patient' | 'doctor' | 'nurse' | 'family' | 'insurance' | 'pharmacy';
        id: string;
        contactInfo: {
            email?: string;
            phone?: string;
            address?: string;
        };
        preferredMethod: 'email' | 'sms' | 'push' | 'postal' | 'phone_call';
        language: 'vi' | 'en';
    }>;
    readonly notificationContent: {
        title: string;
        message: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        category: 'medical' | 'administrative' | 'billing' | 'appointment' | 'emergency';
        attachments?: Array<{
            type: 'pdf' | 'image' | 'document';
            name: string;
            url: string;
            size: number;
        }>;
        actionRequired?: {
            action: string;
            deadline?: Date;
            url?: string;
        };
    };
    readonly medicalContext: {
        diagnosisCodes?: string[];
        medicationCodes?: string[];
        criticalFindings?: string[];
        followUpRequired?: boolean;
        urgentAction?: boolean;
    };
    readonly triggeredBy: string;
    readonly triggeredAt: Date;
    constructor(recordId: string, patientId: string, doctorId: string, notificationType: 'record_completed' | 'critical_findings' | 'medication_alert' | 'follow_up_reminder' | 'test_results_available', recipients: Array<{
        type: 'patient' | 'doctor' | 'nurse' | 'family' | 'insurance' | 'pharmacy';
        id: string;
        contactInfo: {
            email?: string;
            phone?: string;
            address?: string;
        };
        preferredMethod: 'email' | 'sms' | 'push' | 'postal' | 'phone_call';
        language: 'vi' | 'en';
    }>, notificationContent: {
        title: string;
        message: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        category: 'medical' | 'administrative' | 'billing' | 'appointment' | 'emergency';
        attachments?: Array<{
            type: 'pdf' | 'image' | 'document';
            name: string;
            url: string;
            size: number;
        }>;
        actionRequired?: {
            action: string;
            deadline?: Date;
            url?: string;
        };
    }, medicalContext: {
        diagnosisCodes?: string[];
        medicationCodes?: string[];
        criticalFindings?: string[];
        followUpRequired?: boolean;
        urgentAction?: boolean;
    }, triggeredBy: string, triggeredAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get Vietnamese notification type
     */
    private getVietnameseNotificationType;
    /**
     * Get Vietnamese priority
     */
    private getVietnamesePriority;
    /**
     * Get Vietnamese category
     */
    private getVietnameseCategory;
    /**
     * Check if requires immediate delivery
     */
    requiresImmediateDelivery(): boolean;
    /**
     * Get delivery deadline
     */
    getDeliveryDeadline(): Date;
    /**
     * Get recipients by type
     */
    getRecipientsByType(type: string): Array<any>;
    /**
     * Check if has attachments
     */
    hasAttachments(): boolean;
    /**
     * Get total attachment size
     */
    getTotalAttachmentSize(): number;
}
/**
 * Critical Alert Notification Event
 * Triggered when critical medical alerts need immediate attention
 */
export declare class CriticalAlertNotificationEvent extends IntegrationEvent {
    readonly alertId: string;
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly alertDetails: {
        type: 'critical_diagnosis' | 'drug_interaction' | 'allergy_alert' | 'vital_signs_critical' | 'lab_results_critical';
        severity: 'high' | 'critical' | 'life_threatening';
        description: string;
        clinicalSignificance: string;
        recommendedAction: string;
        timeWindow?: number;
    };
    readonly medicalData: {
        relevantDiagnoses?: string[];
        relevantMedications?: string[];
        relevantAllergies?: string[];
        vitalSigns?: {
            temperature?: number;
            bloodPressure?: string;
            heartRate?: number;
            oxygenSaturation?: number;
        };
        labResults?: Array<{
            testName: string;
            value: string;
            normalRange: string;
            critical: boolean;
        }>;
    };
    readonly escalationChain: Array<{
        level: number;
        recipientType: 'attending_doctor' | 'department_head' | 'emergency_team' | 'family' | 'administration';
        recipientId: string;
        contactMethod: 'phone_call' | 'sms' | 'pager' | 'email' | 'push';
        timeoutMinutes: number;
    }>;
    readonly triggeredBy: string;
    readonly triggeredAt: Date;
    constructor(alertId: string, recordId: string, patientId: string, doctorId: string, alertDetails: {
        type: 'critical_diagnosis' | 'drug_interaction' | 'allergy_alert' | 'vital_signs_critical' | 'lab_results_critical';
        severity: 'high' | 'critical' | 'life_threatening';
        description: string;
        clinicalSignificance: string;
        recommendedAction: string;
        timeWindow?: number;
    }, medicalData: {
        relevantDiagnoses?: string[];
        relevantMedications?: string[];
        relevantAllergies?: string[];
        vitalSigns?: {
            temperature?: number;
            bloodPressure?: string;
            heartRate?: number;
            oxygenSaturation?: number;
        };
        labResults?: Array<{
            testName: string;
            value: string;
            normalRange: string;
            critical: boolean;
        }>;
    }, escalationChain: Array<{
        level: number;
        recipientType: 'attending_doctor' | 'department_head' | 'emergency_team' | 'family' | 'administration';
        recipientId: string;
        contactMethod: 'phone_call' | 'sms' | 'pager' | 'email' | 'push';
        timeoutMinutes: number;
    }>, triggeredBy: string, triggeredAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get Vietnamese alert type
     */
    private getVietnameseAlertType;
    /**
     * Get Vietnamese severity
     */
    private getVietnameseSeverity;
    /**
     * Check if requires immediate escalation
     */
    requiresImmediateEscalation(): boolean;
    /**
     * Get next escalation level
     */
    getNextEscalationLevel(currentLevel?: number): any | null;
    /**
     * Get escalation timeout
     */
    getEscalationTimeout(level: number): Date;
    /**
     * Check if alert has expired
     */
    isExpired(): boolean;
    /**
     * Get minutes remaining for action
     */
    getMinutesRemaining(): number;
}
/**
 * Medication Reminder Notification Event
 * Triggered when medication reminders need to be sent
 */
export declare class MedicationReminderNotificationEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly medicationDetails: {
        medicationCode: string;
        medicationName: string;
        dosage: string;
        frequency: string;
        instructions: string;
        startDate: Date;
        endDate?: Date;
        remainingDoses?: number;
        nextDoseTime: Date;
        missedDoses: number;
    };
    readonly reminderType: 'dose_reminder' | 'refill_reminder' | 'missed_dose_alert' | 'medication_review' | 'side_effects_check';
    readonly patientContact: {
        preferredMethod: 'sms' | 'email' | 'push' | 'phone_call';
        contactValue: string;
        language: 'vi' | 'en';
        timeZone: string;
    };
    readonly reminderContent: {
        title: string;
        message: string;
        instructions: string;
        sideEffectsToWatch?: string[];
        emergencyContact?: string;
    };
    readonly scheduledFor: Date;
    readonly createdBy: string;
    readonly createdAt: Date;
    constructor(recordId: string, patientId: string, medicationDetails: {
        medicationCode: string;
        medicationName: string;
        dosage: string;
        frequency: string;
        instructions: string;
        startDate: Date;
        endDate?: Date;
        remainingDoses?: number;
        nextDoseTime: Date;
        missedDoses: number;
    }, reminderType: 'dose_reminder' | 'refill_reminder' | 'missed_dose_alert' | 'medication_review' | 'side_effects_check', patientContact: {
        preferredMethod: 'sms' | 'email' | 'push' | 'phone_call';
        contactValue: string;
        language: 'vi' | 'en';
        timeZone: string;
    }, reminderContent: {
        title: string;
        message: string;
        instructions: string;
        sideEffectsToWatch?: string[];
        emergencyContact?: string;
    }, scheduledFor: Date, createdBy: string, createdAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get Vietnamese reminder type
     */
    private getVietnameseReminderType;
    /**
     * Get Vietnamese next dose time
     */
    private getVietnameseNextDoseTime;
    /**
     * Check if reminder is overdue
     */
    isOverdue(): boolean;
    /**
     * Get minutes until scheduled time
     */
    getMinutesUntilScheduled(): number;
    /**
     * Check if medication is ending soon
     */
    isMedicationEndingSoon(): boolean;
    /**
     * Check if refill is needed
     */
    needsRefill(): boolean;
    /**
     * Get adherence status
     */
    getAdherenceStatus(): 'good' | 'fair' | 'poor';
    /**
     * Get Vietnamese adherence status
     */
    getVietnameseAdherenceStatus(): string;
}
/**
 * Test Results Notification Event
 * Triggered when test results are available and need to be communicated
 */
export declare class TestResultsNotificationEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly testResults: Array<{
        testId: string;
        testName: string;
        testType: 'blood' | 'urine' | 'imaging' | 'biopsy' | 'culture' | 'other';
        result: string;
        normalRange?: string;
        unit?: string;
        status: 'normal' | 'abnormal' | 'critical' | 'pending';
        performedDate: Date;
        resultDate: Date;
        interpretation?: string;
        followUpRequired: boolean;
    }>;
    readonly notificationTargets: Array<{
        recipientType: 'patient' | 'doctor' | 'referring_doctor' | 'family';
        recipientId: string;
        deliveryMethod: 'secure_portal' | 'email' | 'phone_call' | 'postal';
        urgency: 'routine' | 'urgent' | 'critical';
    }>;
    readonly resultSummary: {
        totalTests: number;
        normalResults: number;
        abnormalResults: number;
        criticalResults: number;
        pendingResults: number;
        overallAssessment: 'normal' | 'requires_attention' | 'critical';
        doctorNotes?: string;
    };
    readonly releasedBy: string;
    readonly releasedAt: Date;
    constructor(recordId: string, patientId: string, doctorId: string, testResults: Array<{
        testId: string;
        testName: string;
        testType: 'blood' | 'urine' | 'imaging' | 'biopsy' | 'culture' | 'other';
        result: string;
        normalRange?: string;
        unit?: string;
        status: 'normal' | 'abnormal' | 'critical' | 'pending';
        performedDate: Date;
        resultDate: Date;
        interpretation?: string;
        followUpRequired: boolean;
    }>, notificationTargets: Array<{
        recipientType: 'patient' | 'doctor' | 'referring_doctor' | 'family';
        recipientId: string;
        deliveryMethod: 'secure_portal' | 'email' | 'phone_call' | 'postal';
        urgency: 'routine' | 'urgent' | 'critical';
    }>, resultSummary: {
        totalTests: number;
        normalResults: number;
        abnormalResults: number;
        criticalResults: number;
        pendingResults: number;
        overallAssessment: 'normal' | 'requires_attention' | 'critical';
        doctorNotes?: string;
    }, releasedBy: string, releasedAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get Vietnamese overall status
     */
    private getVietnameseOverallStatus;
    /**
     * Get Vietnamese summary
     */
    private getVietnameseSummary;
    /**
     * Check if has critical results
     */
    hasCriticalResults(): boolean;
    /**
     * Get critical tests
     */
    getCriticalTests(): Array<any>;
    /**
     * Check if requires immediate doctor consultation
     */
    requiresImmediateDoctorConsultation(): boolean;
    /**
     * Get delivery priority
     */
    getDeliveryPriority(): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Get recommended delivery timeframe (in minutes)
     */
    getRecommendedDeliveryTimeframe(): number;
}
//# sourceMappingURL=NotificationIntegrationEvents.d.ts.map