/**
 * PatientJourneyWorkflow - Complete Patient Care Journey Workflows
 * Orchestrates end-to-end patient care workflows across all healthcare services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Patient Care Workflows, HIPAA
 */
export interface PatientJourneyContext {
    patientId: string;
    patientInfo: {
        fullName: string;
        dateOfBirth: string;
        phoneNumber: string;
        email?: string;
        address: string;
        emergencyContact: {
            name: string;
            relationship: string;
            phoneNumber: string;
        };
    };
    insuranceInfo?: {
        bhytCardNumber?: string;
        bhtnCardNumber?: string;
        insuranceProvider?: string;
        coverageLevel?: string;
    };
    medicalHistory?: {
        allergies: string[];
        chronicConditions: string[];
        currentMedications: string[];
    };
    preferences: {
        language: string;
        communicationMethod: 'SMS' | 'EMAIL' | 'PHONE' | 'IN_APP';
        appointmentReminders: boolean;
        medicationReminders: boolean;
    };
}
export interface AppointmentContext {
    appointmentId: string;
    doctorId: string;
    departmentId: string;
    appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP';
    scheduledDateTime: Date;
    estimatedDuration: number;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    symptoms?: string;
    notes?: string;
}
export interface TreatmentContext {
    treatmentPlan: {
        diagnosis: string;
        treatments: string[];
        medications: Array<{
            name: string;
            dosage: string;
            frequency: string;
            duration: string;
        }>;
        followUpRequired: boolean;
        followUpDate?: Date;
    };
    testResults?: {
        testType: string;
        results: any;
        interpretation: string;
        criticalValues: boolean;
    }[];
}
export declare class PatientJourneyWorkflow {
    private static instance;
    private orchestrator;
    private constructor();
    static getInstance(): PatientJourneyWorkflow;
    /**
     * Register all patient journey workflows
     */
    private registerPatientJourneyWorkflows;
    /**
     * Patient Registration Workflow
     */
    private registerPatientRegistrationWorkflow;
    /**
     * Appointment Scheduling Workflow
     */
    private registerAppointmentSchedulingWorkflow;
    /**
     * Patient Check-in Workflow
     */
    private registerPatientCheckInWorkflow;
    /**
     * Consultation Workflow
     */
    private registerConsultationWorkflow;
    /**
     * Treatment Workflow
     */
    private registerTreatmentWorkflow;
    /**
     * Discharge Workflow
     */
    private registerDischargeWorkflow;
    /**
     * Follow-up Workflow
     */
    private registerFollowUpWorkflow;
    /**
     * Emergency Workflow
     */
    private registerEmergencyWorkflow;
    /**
     * Execute patient registration workflow
     */
    executePatientRegistration(context: PatientJourneyContext): Promise<any>;
    /**
     * Execute appointment scheduling workflow
     */
    executeAppointmentScheduling(patientContext: PatientJourneyContext, appointmentContext: AppointmentContext): Promise<any>;
    /**
     * Execute complete patient journey
     */
    executeCompletePatientJourney(patientContext: PatientJourneyContext, appointmentContext: AppointmentContext, treatmentContext?: TreatmentContext): Promise<any>;
    /**
     * Get patient journey status
     */
    getPatientJourneyStatus(): any;
}
//# sourceMappingURL=PatientJourneyWorkflow.d.ts.map