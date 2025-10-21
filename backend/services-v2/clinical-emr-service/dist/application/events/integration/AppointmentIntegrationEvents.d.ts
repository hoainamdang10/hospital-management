/**
 * AppointmentIntegrationEvents - Application Layer
 * Integration events for appointment service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
import { IntegrationEvent } from '../../../../shared/domain/events/IntegrationEvent';
/**
 * Appointment Completed Event
 * Triggered when an appointment is completed and medical record is created
 */
export declare class AppointmentCompletedEvent extends IntegrationEvent {
    readonly appointmentId: string;
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentDetails: {
        scheduledDate: Date;
        actualStartTime: Date;
        actualEndTime: Date;
        appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
        specialtyCode?: string;
        departmentCode?: string;
        roomNumber?: string;
    };
    readonly completionDetails: {
        status: 'completed' | 'completed_with_follow_up' | 'partially_completed';
        completionNotes?: string;
        followUpRequired: boolean;
        followUpDate?: Date;
        followUpType?: 'routine' | 'urgent' | 'monitoring';
        referralRequired: boolean;
        referralSpecialty?: string;
        patientNoShow: boolean;
    };
    readonly medicalSummary: {
        chiefComplaint?: string;
        diagnosisCount: number;
        medicationCount: number;
        procedureCount: number;
        vitalSignsRecorded: boolean;
        criticalFindings: boolean;
        requiresHospitalization: boolean;
    };
    readonly completedBy: string;
    readonly completedAt: Date;
    constructor(appointmentId: string, recordId: string, patientId: string, doctorId: string, appointmentDetails: {
        scheduledDate: Date;
        actualStartTime: Date;
        actualEndTime: Date;
        appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
        specialtyCode?: string;
        departmentCode?: string;
        roomNumber?: string;
    }, completionDetails: {
        status: 'completed' | 'completed_with_follow_up' | 'partially_completed';
        completionNotes?: string;
        followUpRequired: boolean;
        followUpDate?: Date;
        followUpType?: 'routine' | 'urgent' | 'monitoring';
        referralRequired: boolean;
        referralSpecialty?: string;
        patientNoShow: boolean;
    }, medicalSummary: {
        chiefComplaint?: string;
        diagnosisCount: number;
        medicationCount: number;
        procedureCount: number;
        vitalSignsRecorded: boolean;
        criticalFindings: boolean;
        requiresHospitalization: boolean;
    }, completedBy: string, completedAt?: Date);
    /**
     * Get Vietnamese appointment type
     */
    private getVietnameseAppointmentType;
    /**
     * Get Vietnamese completion status
     */
    private getVietnameseCompletionStatus;
    /**
     * Get Vietnamese summary
     */
    private getVietnameseSummary;
    /**
     * Get appointment duration in minutes
     */
    getAppointmentDuration(): number;
    /**
     * Check if appointment was on time
     */
    wasOnTime(): boolean;
    /**
     * Get delay in minutes
     */
    getDelayMinutes(): number;
    /**
     * Check if requires immediate follow-up
     */
    requiresImmediateFollowUp(): boolean;
    /**
     * Check if has critical findings
     */
    hasCriticalFindings(): boolean;
}
/**
 * Follow-up Appointment Required Event
 * Triggered when a follow-up appointment needs to be scheduled
 */
export declare class FollowUpAppointmentRequiredEvent extends IntegrationEvent {
    readonly originalAppointmentId: string;
    readonly originalRecordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly followUpDetails: {
        type: 'routine' | 'urgent' | 'monitoring' | 'test_results' | 'medication_review';
        priority: 'low' | 'medium' | 'high' | 'critical';
        suggestedDate?: Date;
        maxDelayDays: number;
        specialInstructions?: string;
        requiredTests?: string[];
        continuedMedications?: string[];
    };
    readonly clinicalReason: {
        diagnosisCodes: string[];
        monitoringRequired: string[];
        treatmentPlan: string;
        expectedOutcome: string;
    };
    readonly requestedBy: string;
    readonly requestedAt: Date;
    constructor(originalAppointmentId: string, originalRecordId: string, patientId: string, doctorId: string, followUpDetails: {
        type: 'routine' | 'urgent' | 'monitoring' | 'test_results' | 'medication_review';
        priority: 'low' | 'medium' | 'high' | 'critical';
        suggestedDate?: Date;
        maxDelayDays: number;
        specialInstructions?: string;
        requiredTests?: string[];
        continuedMedications?: string[];
    }, clinicalReason: {
        diagnosisCodes: string[];
        monitoringRequired: string[];
        treatmentPlan: string;
        expectedOutcome: string;
    }, requestedBy: string, requestedAt?: Date);
    /**
     * Get Vietnamese follow-up type
     */
    private getVietnameseFollowUpType;
    /**
     * Get Vietnamese priority
     */
    private getVietnamesePriority;
    /**
     * Get Vietnamese reason
     */
    private getVietnameseReason;
    /**
     * Get suggested appointment window
     */
    getSuggestedAppointmentWindow(): {
        earliest: Date;
        latest: Date;
    };
    /**
     * Check if follow-up is overdue
     */
    isOverdue(): boolean;
    /**
     * Get days until overdue
     */
    getDaysUntilOverdue(): number;
}
/**
 * Referral Required Event
 * Triggered when a patient needs to be referred to another specialist
 */
export declare class ReferralRequiredEvent extends IntegrationEvent {
    readonly originalAppointmentId: string;
    readonly originalRecordId: string;
    readonly patientId: string;
    readonly referringDoctorId: string;
    readonly referralDetails: {
        targetSpecialty: string;
        targetDoctorId?: string;
        targetDepartment?: string;
        urgency: 'routine' | 'urgent' | 'emergency';
        preferredDate?: Date;
        maxWaitDays: number;
        clinicalReason: string;
        relevantHistory: string;
        requiredTests?: string[];
        currentMedications?: string[];
    };
    readonly diagnosticInfo: {
        primaryDiagnosis: string;
        secondaryDiagnoses?: string[];
        symptoms: string[];
        testResults?: Array<{
            testName: string;
            result: string;
            date: Date;
            abnormal: boolean;
        }>;
    };
    readonly referredBy: string;
    readonly referredAt: Date;
    constructor(originalAppointmentId: string, originalRecordId: string, patientId: string, referringDoctorId: string, referralDetails: {
        targetSpecialty: string;
        targetDoctorId?: string;
        targetDepartment?: string;
        urgency: 'routine' | 'urgent' | 'emergency';
        preferredDate?: Date;
        maxWaitDays: number;
        clinicalReason: string;
        relevantHistory: string;
        requiredTests?: string[];
        currentMedications?: string[];
    }, diagnosticInfo: {
        primaryDiagnosis: string;
        secondaryDiagnoses?: string[];
        symptoms: string[];
        testResults?: Array<{
            testName: string;
            result: string;
            date: Date;
            abnormal: boolean;
        }>;
    }, referredBy: string, referredAt?: Date);
    /**
     * Get Vietnamese specialty
     */
    private getVietnameseSpecialty;
    /**
     * Get Vietnamese urgency
     */
    private getVietnameseUrgency;
    /**
     * Get Vietnamese reason
     */
    private getVietnameseReason;
    /**
     * Check if referral is time-sensitive
     */
    isTimeSensitive(): boolean;
    /**
     * Get maximum wait time in days
     */
    getMaxWaitDays(): number;
    /**
     * Get referral priority score
     */
    getReferralPriorityScore(): number;
    /**
     * Get referral summary
     */
    getReferralSummary(): string;
}
/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their appointment
 */
export declare class AppointmentNoShowEvent extends IntegrationEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly scheduledDate: Date;
    readonly noShowDetails: {
        waitTime: number;
        contactAttempts: number;
        lastContactTime?: Date;
        reason?: 'no_contact' | 'patient_cancelled_late' | 'emergency' | 'unknown';
        reschedulingRequested: boolean;
        suggestedRescheduleDate?: Date;
    };
    readonly impactAssessment: {
        lostRevenue: number;
        affectedFollowingAppointments: number;
        patientRiskLevel: 'low' | 'medium' | 'high';
        clinicalImpact: 'none' | 'low' | 'medium' | 'high';
    };
    readonly recordedBy: string;
    readonly recordedAt: Date;
    constructor(appointmentId: string, patientId: string, doctorId: string, scheduledDate: Date, noShowDetails: {
        waitTime: number;
        contactAttempts: number;
        lastContactTime?: Date;
        reason?: 'no_contact' | 'patient_cancelled_late' | 'emergency' | 'unknown';
        reschedulingRequested: boolean;
        suggestedRescheduleDate?: Date;
    }, impactAssessment: {
        lostRevenue: number;
        affectedFollowingAppointments: number;
        patientRiskLevel: 'low' | 'medium' | 'high';
        clinicalImpact: 'none' | 'low' | 'medium' | 'high';
    }, recordedBy: string, recordedAt?: Date);
    /**
     * Get Vietnamese no-show reason
     */
    private getVietnameseNoShowReason;
    /**
     * Get Vietnamese impact
     */
    private getVietnameseImpact;
    /**
     * Check if requires immediate follow-up
     */
    requiresImmediateFollowUp(): boolean;
    /**
     * Get recommended action
     */
    getRecommendedAction(): string;
    /**
     * Calculate no-show penalty (if applicable)
     */
    calculateNoShowPenalty(): number;
}
//# sourceMappingURL=AppointmentIntegrationEvents.d.ts.map