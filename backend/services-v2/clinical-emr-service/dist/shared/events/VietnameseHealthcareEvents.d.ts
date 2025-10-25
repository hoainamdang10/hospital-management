/**
 * VietnameseHealthcareEvents - Vietnamese Healthcare Domain Events
 * Comprehensive event definitions for Vietnamese healthcare workflows
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, Event-Driven Architecture
 */
import { IntegrationEvent } from './EventBusConfiguration';
export interface PatientRegisteredEvent extends IntegrationEvent {
    eventType: 'patient.registered';
    eventData: {
        patientId: string;
        patientName: string;
        dateOfBirth: string;
        phoneNumber: string;
        email?: string;
        address: {
            street: string;
            ward: string;
            district: string;
            city: string;
            province: string;
        };
        emergencyContact: {
            name: string;
            relationship: string;
            phoneNumber: string;
        };
        insuranceInfo?: {
            bhytCardNumber?: string;
            bhtnCardNumber?: string;
            insuranceProvider?: string;
            validUntil?: string;
        };
        healthcareContext: {
            patientId: string;
            registrationHospital: string;
            registrationDate: string;
            primaryLanguage: 'vi-VN';
        };
    };
}
export interface PatientUpdatedEvent extends IntegrationEvent {
    eventType: 'patient.updated';
    eventData: {
        patientId: string;
        updatedFields: string[];
        previousValues: Record<string, any>;
        newValues: Record<string, any>;
        updatedBy: string;
        updateReason: string;
        healthcareContext: {
            patientId: string;
            updateType: 'PERSONAL_INFO' | 'INSURANCE' | 'EMERGENCY_CONTACT' | 'ADDRESS';
        };
    };
}
export interface AppointmentScheduledEvent extends IntegrationEvent {
    eventType: 'appointment.scheduled';
    eventData: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        patientName: string;
        doctorName: string;
        appointmentDate: string;
        appointmentTime: string;
        duration: number;
        appointmentType: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP';
        roomNumber?: string;
        notes?: string;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            appointmentId: string;
            departmentId: string;
            hospitalId: string;
            scheduledBy: string;
        };
    };
}
export interface AppointmentConfirmedEvent extends IntegrationEvent {
    eventType: 'appointment.confirmed';
    eventData: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        confirmationMethod: 'PHONE' | 'SMS' | 'EMAIL' | 'IN_PERSON';
        confirmedAt: string;
        confirmedBy: string;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            appointmentId: string;
        };
    };
}
export interface AppointmentCancelledEvent extends IntegrationEvent {
    eventType: 'appointment.cancelled';
    eventData: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        cancellationReason: string;
        cancelledBy: 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'SYSTEM';
        cancelledAt: string;
        refundRequired: boolean;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            appointmentId: string;
            originalAppointmentDate: string;
        };
    };
}
export interface AppointmentCompletedEvent extends IntegrationEvent {
    eventType: 'appointment.completed';
    eventData: {
        appointmentId: string;
        patientId: string;
        doctorId: string;
        completedAt: string;
        duration: number;
        diagnosis?: string;
        treatmentPlan?: string;
        followUpRequired: boolean;
        followUpDate?: string;
        prescriptions?: Array<{
            medicationName: string;
            dosage: string;
            frequency: string;
            duration: string;
        }>;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            appointmentId: string;
            medicalRecordId?: string;
        };
    };
}
export interface MedicalRecordCreatedEvent extends IntegrationEvent {
    eventType: 'medical-record.created';
    eventData: {
        medicalRecordId: string;
        patientId: string;
        doctorId: string;
        appointmentId?: string;
        recordType: 'CONSULTATION' | 'DIAGNOSIS' | 'TREATMENT' | 'TEST_RESULT' | 'PRESCRIPTION';
        chiefComplaint: string;
        diagnosis?: string;
        treatmentPlan?: string;
        createdAt: string;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            medicalRecordId: string;
            appointmentId?: string;
            departmentId: string;
        };
    };
}
export interface TestResultsReadyEvent extends IntegrationEvent {
    eventType: 'test-results.ready';
    eventData: {
        testResultId: string;
        patientId: string;
        doctorId: string;
        medicalRecordId: string;
        testType: string;
        testCode: string;
        testName: string;
        sampleDate: string;
        resultDate: string;
        results: Array<{
            parameter: string;
            value: string;
            unit: string;
            referenceRange: string;
            status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
        }>;
        overallStatus: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
        requiresConsultation: boolean;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            medicalRecordId: string;
            testResultId: string;
            laboratoryId: string;
        };
    };
}
export interface DiagnosisConfirmedEvent extends IntegrationEvent {
    eventType: 'diagnosis.confirmed';
    eventData: {
        diagnosisId: string;
        patientId: string;
        doctorId: string;
        medicalRecordId: string;
        diagnosisCode: string;
        diagnosisName: string;
        diagnosisDescription: string;
        severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
        confirmedAt: string;
        treatmentRequired: boolean;
        followUpRequired: boolean;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            medicalRecordId: string;
            diagnosisId: string;
        };
    };
}
export interface InvoiceGeneratedEvent extends IntegrationEvent {
    eventType: 'invoice.generated';
    eventData: {
        invoiceId: string;
        invoiceNumber: string;
        patientId: string;
        patientName: string;
        appointmentId?: string;
        medicalRecordId?: string;
        totalAmount: number;
        insuranceCoverage: number;
        patientPayable: number;
        currency: 'VND';
        dueDate: string;
        services: Array<{
            serviceCode: string;
            serviceName: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
        }>;
        insuranceInfo?: {
            bhytCoverage?: number;
            bhtnCoverage?: number;
            claimNumber?: string;
        };
        healthcareContext: {
            patientId: string;
            invoiceId: string;
            appointmentId?: string;
            medicalRecordId?: string;
            hospitalId: string;
        };
    };
}
export interface PaymentCompletedEvent extends IntegrationEvent {
    eventType: 'payment.completed';
    eventData: {
        paymentId: string;
        invoiceId: string;
        patientId: string;
        amount: number;
        currency: 'VND';
        paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'PAYOS' | 'INSURANCE';
        paymentStatus: 'COMPLETED' | 'PARTIAL' | 'FAILED';
        transactionId?: string;
        paidAt: string;
        remainingBalance: number;
        healthcareContext: {
            patientId: string;
            invoiceId: string;
            paymentId: string;
        };
    };
}
export interface InsuranceClaimSubmittedEvent extends IntegrationEvent {
    eventType: 'insurance.claim.submitted';
    eventData: {
        claimId: string;
        patientId: string;
        invoiceId: string;
        insuranceType: 'BHYT' | 'BHTN' | 'PRIVATE';
        claimAmount: number;
        submittedAt: string;
        expectedProcessingTime: string;
        claimDocuments: string[];
        healthcareContext: {
            patientId: string;
            invoiceId: string;
            claimId: string;
            insuranceProvider: string;
        };
    };
}
export interface EmergencyAlertEvent extends IntegrationEvent {
    eventType: 'emergency.alert';
    priority: 'URGENT';
    eventData: {
        alertId: string;
        patientId: string;
        patientName: string;
        alertType: 'CRITICAL_TEST_RESULT' | 'MEDICAL_EMERGENCY' | 'MEDICATION_ALLERGY' | 'VITAL_SIGNS_CRITICAL';
        alertMessage: string;
        severity: 'HIGH' | 'CRITICAL';
        triggeredAt: string;
        triggeredBy: string;
        requiresImmedateAction: boolean;
        emergencyContacts: Array<{
            contactId: string;
            name: string;
            relationship: string;
            phoneNumber: string;
        }>;
        healthcareContext: {
            patientId: string;
            alertId: string;
            medicalRecordId?: string;
            doctorId?: string;
            departmentId: string;
        };
    };
}
export interface MedicationPrescribedEvent extends IntegrationEvent {
    eventType: 'medication.prescribed';
    eventData: {
        prescriptionId: string;
        patientId: string;
        doctorId: string;
        medicalRecordId: string;
        medications: Array<{
            medicationId: string;
            medicationName: string;
            dosage: string;
            frequency: string;
            duration: string;
            instructions: string;
            startDate: string;
            endDate: string;
        }>;
        prescribedAt: string;
        pharmacyInstructions?: string;
        healthcareContext: {
            patientId: string;
            doctorId: string;
            prescriptionId: string;
            medicalRecordId: string;
        };
    };
}
export interface BHYTVerificationEvent extends IntegrationEvent {
    eventType: 'bhyt.verification';
    eventData: {
        patientId: string;
        bhytCardNumber: string;
        verificationStatus: 'VALID' | 'INVALID' | 'EXPIRED' | 'SUSPENDED';
        coverageLevel: number;
        validUntil?: string;
        verifiedAt: string;
        healthcareContext: {
            patientId: string;
            verificationId: string;
            hospitalId: string;
        };
    };
}
export interface MOHReportingEvent extends IntegrationEvent {
    eventType: 'moh.reporting';
    eventData: {
        reportId: string;
        reportType: 'MONTHLY_STATISTICS' | 'DISEASE_SURVEILLANCE' | 'QUALITY_METRICS' | 'COMPLIANCE_AUDIT';
        reportPeriod: string;
        hospitalId: string;
        reportData: any;
        submittedAt: string;
        healthcareContext: {
            reportId: string;
            hospitalId: string;
            reportingPeriod: string;
        };
    };
}
export declare class VietnameseHealthcareEventFactory {
    /**
     * Create patient registered event
     */
    static createPatientRegisteredEvent(patientData: any, serviceName: string, metadata?: any): PatientRegisteredEvent;
    /**
     * Create appointment scheduled event
     */
    static createAppointmentScheduledEvent(appointmentData: any, serviceName: string, metadata?: any): AppointmentScheduledEvent;
    /**
     * Create test results ready event
     */
    static createTestResultsReadyEvent(testResultData: any, serviceName: string, metadata?: any): TestResultsReadyEvent;
    /**
     * Create emergency alert event
     */
    static createEmergencyAlertEvent(alertData: any, serviceName: string, metadata?: any): EmergencyAlertEvent;
    /**
     * Create invoice generated event
     */
    static createInvoiceGeneratedEvent(invoiceData: any, serviceName: string, metadata?: any): InvoiceGeneratedEvent;
}
//# sourceMappingURL=VietnameseHealthcareEvents.d.ts.map