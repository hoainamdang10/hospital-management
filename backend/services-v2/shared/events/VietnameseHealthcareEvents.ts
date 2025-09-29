/**
 * VietnameseHealthcareEvents - Vietnamese Healthcare Domain Events
 * Comprehensive event definitions for Vietnamese healthcare workflows
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, HIPAA, Event-Driven Architecture
 */

import { IntegrationEvent } from './EventBusConfiguration';

// ================================
// PATIENT LIFECYCLE EVENTS
// ================================

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

// ================================
// APPOINTMENT WORKFLOW EVENTS
// ================================

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

// ================================
// CLINICAL WORKFLOW EVENTS
// ================================

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
    diagnosisCode: string; // ICD-10 code
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

// ================================
// BILLING WORKFLOW EVENTS
// ================================

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

// ================================
// EMERGENCY & CRITICAL EVENTS
// ================================

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

// ================================
// MEDICATION EVENTS
// ================================

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

// ================================
// VIETNAMESE HEALTHCARE COMPLIANCE EVENTS
// ================================

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

// ================================
// EVENT FACTORY
// ================================

export class VietnameseHealthcareEventFactory {
  /**
   * Create patient registered event
   */
  public static createPatientRegisteredEvent(
    patientData: any,
    serviceName: string,
    metadata?: any
  ): PatientRegisteredEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'patient.registered',
      aggregateId: patientData.patientId,
      aggregateType: 'Patient',
      serviceName,
      eventVersion: '1.0',
      eventData: patientData,
      occurredAt: new Date(),
      version: 1,
      priority: 'NORMAL',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create appointment scheduled event
   */
  public static createAppointmentScheduledEvent(
    appointmentData: any,
    serviceName: string,
    metadata?: any
  ): AppointmentScheduledEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'appointment.scheduled',
      aggregateId: appointmentData.appointmentId,
      aggregateType: 'Appointment',
      serviceName,
      eventVersion: '1.0',
      eventData: appointmentData,
      occurredAt: new Date(),
      version: 1,
      priority: 'HIGH',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create test results ready event
   */
  public static createTestResultsReadyEvent(
    testResultData: any,
    serviceName: string,
    metadata?: any
  ): TestResultsReadyEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'test-results.ready',
      aggregateId: testResultData.testResultId,
      aggregateType: 'TestResult',
      serviceName,
      eventVersion: '1.0',
      eventData: testResultData,
      occurredAt: new Date(),
      version: 1,
      priority: testResultData.overallStatus === 'CRITICAL' ? 'URGENT' : 'HIGH',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create emergency alert event
   */
  public static createEmergencyAlertEvent(
    alertData: any,
    serviceName: string,
    metadata?: any
  ): EmergencyAlertEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'emergency.alert',
      aggregateId: alertData.alertId,
      aggregateType: 'EmergencyAlert',
      serviceName,
      eventVersion: '1.0',
      eventData: alertData,
      occurredAt: new Date(),
      version: 1,
      priority: 'URGENT',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create invoice generated event
   */
  public static createInvoiceGeneratedEvent(
    invoiceData: any,
    serviceName: string,
    metadata?: any
  ): InvoiceGeneratedEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'invoice.generated',
      aggregateId: invoiceData.invoiceId,
      aggregateType: 'Invoice',
      serviceName,
      eventVersion: '1.0',
      eventData: invoiceData,
      occurredAt: new Date(),
      version: 1,
      priority: 'NORMAL',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }
}
