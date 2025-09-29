/**
 * Service Integration Events - Cross-Service Communication
 * Events for eliminating cross-schema access violations
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Microservices, Schema Isolation, Event-Driven Architecture
 */

import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Base Service Integration Event
 */
export abstract class ServiceIntegrationEvent extends DomainEvent {
  public readonly sourceService: string;
  public readonly targetService: string;
  public readonly requestId: string;

  protected constructor(
    eventType: string,
    sourceService: string,
    targetService: string,
    requestId: string,
    eventData: any,
    userId?: string,
    correlationId?: string
  ) {
    super(
      eventType,
      requestId,
      'ServiceIntegration',
      eventData,
      1,
      correlationId,
      undefined,
      userId
    );
    
    this.sourceService = sourceService;
    this.targetService = targetService;
    this.requestId = requestId;
  }

  public containsPHI(): boolean {
    return true; // Most healthcare integration events contain PHI
  }
}

/**
 * Patient Data Request Event
 * Replaces direct patient_schema access
 */
export class PatientDataRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    patientId: string,
    requestedFields: string[],
    accessReason: string,
    userId?: string,
    correlationId?: string
  ) {
    super(
      'PatientDataRequested',
      sourceService,
      'patient-service',
      requestId,
      {
        patientId,
        requestedFields,
        accessReason,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getPatientId(): string {
    return this.eventData.patientId;
  }

  public getRequestedFields(): string[] {
    return this.eventData.requestedFields;
  }

  public getAccessReason(): string {
    return this.eventData.accessReason;
  }
}

/**
 * Patient Data Provided Event
 * Response to PatientDataRequestedEvent
 */
export class PatientDataProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    patientId: string,
    patientData: any,
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'PatientDataProvided',
      'patient-service',
      '', // Will be set by event bus
      requestId,
      {
        patientId,
        patientData,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getPatientData(): any {
    return this.eventData.patientData;
  }

  public isSuccess(): boolean {
    return this.eventData.success;
  }

  public getError(): string | undefined {
    return this.eventData.error;
  }
}

/**
 * Doctor Availability Request Event
 * Replaces direct doctor_schema access
 */
export class DoctorAvailabilityRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    doctorId: string,
    dateRange: { from: Date; to: Date },
    userId?: string,
    correlationId?: string
  ) {
    super(
      'DoctorAvailabilityRequested',
      sourceService,
      'doctor-service',
      requestId,
      {
        doctorId,
        dateRange,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getDoctorId(): string {
    return this.eventData.doctorId;
  }

  public getDateRange(): { from: Date; to: Date } {
    return this.eventData.dateRange;
  }
}

/**
 * Doctor Availability Provided Event
 * Response to DoctorAvailabilityRequestedEvent
 */
export class DoctorAvailabilityProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    doctorId: string,
    availabilitySlots: any[],
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'DoctorAvailabilityProvided',
      'doctor-service',
      '',
      requestId,
      {
        doctorId,
        availabilitySlots,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getAvailabilitySlots(): any[] {
    return this.eventData.availabilitySlots;
  }

  public isSuccess(): boolean {
    return this.eventData.success;
  }
}

/**
 * Appointment Validation Request Event
 * Replaces direct appointment_schema access
 */
export class AppointmentValidationRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    appointmentData: {
      doctorId: string;
      patientId: string;
      appointmentDate: Date;
      duration: number;
      appointmentType: string;
    },
    userId?: string,
    correlationId?: string
  ) {
    super(
      'AppointmentValidationRequested',
      sourceService,
      'appointment-service',
      requestId,
      {
        appointmentData,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getAppointmentData(): any {
    return this.eventData.appointmentData;
  }
}

/**
 * Appointment Validation Provided Event
 * Response to AppointmentValidationRequestedEvent
 */
export class AppointmentValidationProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    validationResult: {
      isValid: boolean;
      conflicts: any[];
      suggestedSlots: Date[];
      validationErrors: string[];
    },
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'AppointmentValidationProvided',
      'appointment-service',
      '',
      requestId,
      {
        validationResult,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getValidationResult(): any {
    return this.eventData.validationResult;
  }

  public isValid(): boolean {
    return this.eventData.validationResult.isValid;
  }

  public getConflicts(): any[] {
    return this.eventData.validationResult.conflicts;
  }

  public getSuggestedSlots(): Date[] {
    return this.eventData.validationResult.suggestedSlots;
  }
}

/**
 * Medical Records Request Event
 * Replaces direct medical_records_schema access
 */
export class MedicalRecordsRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    patientId: string,
    recordTypes: string[],
    dateRange?: { from: Date; to: Date },
    accessReason?: string,
    userId?: string,
    correlationId?: string
  ) {
    super(
      'MedicalRecordsRequested',
      sourceService,
      'medical-records-service',
      requestId,
      {
        patientId,
        recordTypes,
        dateRange,
        accessReason,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getPatientId(): string {
    return this.eventData.patientId;
  }

  public getRecordTypes(): string[] {
    return this.eventData.recordTypes;
  }

  public getDateRange(): { from: Date; to: Date } | undefined {
    return this.eventData.dateRange;
  }
}

/**
 * Medical Records Provided Event
 * Response to MedicalRecordsRequestedEvent
 */
export class MedicalRecordsProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    patientId: string,
    medicalRecords: any[],
    recordsSummary: {
      totalRecords: number;
      recordTypes: Record<string, number>;
      dateRange: { from: Date; to: Date };
    },
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'MedicalRecordsProvided',
      'medical-records-service',
      '',
      requestId,
      {
        patientId,
        medicalRecords,
        recordsSummary,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getMedicalRecords(): any[] {
    return this.eventData.medicalRecords;
  }

  public getRecordsSummary(): any {
    return this.eventData.recordsSummary;
  }
}

/**
 * Insurance Verification Request Event
 * Replaces direct payment_schema access
 */
export class InsuranceVerificationRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    patientId: string,
    insuranceInfo: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
      subscriberName: string;
    },
    serviceType: string,
    userId?: string,
    correlationId?: string
  ) {
    super(
      'InsuranceVerificationRequested',
      sourceService,
      'payment-service',
      requestId,
      {
        patientId,
        insuranceInfo,
        serviceType,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getInsuranceInfo(): any {
    return this.eventData.insuranceInfo;
  }

  public getServiceType(): string {
    return this.eventData.serviceType;
  }
}

/**
 * Insurance Verification Provided Event
 * Response to InsuranceVerificationRequestedEvent
 */
export class InsuranceVerificationProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    patientId: string,
    verificationResult: {
      isValid: boolean;
      isActive: boolean;
      coverageDetails: any;
      copayAmount?: number;
      deductibleRemaining?: number;
      authorizationRequired: boolean;
    },
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'InsuranceVerificationProvided',
      'payment-service',
      '',
      requestId,
      {
        patientId,
        verificationResult,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getVerificationResult(): any {
    return this.eventData.verificationResult;
  }

  public isInsuranceValid(): boolean {
    return this.eventData.verificationResult.isValid;
  }

  public isInsuranceActive(): boolean {
    return this.eventData.verificationResult.isActive;
  }

  public requiresAuthorization(): boolean {
    return this.eventData.verificationResult.authorizationRequired;
  }
}

/**
 * User Permission Validation Request Event
 * Replaces direct auth_schema access
 */
export class UserPermissionValidationRequestedEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    requestId: string,
    userId: string,
    requiredPermissions: string[],
    resourceId?: string,
    resourceType?: string,
    correlationId?: string
  ) {
    super(
      'UserPermissionValidationRequested',
      sourceService,
      'auth-service',
      requestId,
      {
        userId,
        requiredPermissions,
        resourceId,
        resourceType,
        requestedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getRequiredPermissions(): string[] {
    return this.eventData.requiredPermissions;
  }

  public getResourceId(): string | undefined {
    return this.eventData.resourceId;
  }

  public getResourceType(): string | undefined {
    return this.eventData.resourceType;
  }

  public containsPHI(): boolean {
    return false; // Permission validation doesn't contain PHI
  }
}

/**
 * User Permission Validation Provided Event
 * Response to UserPermissionValidationRequestedEvent
 */
export class UserPermissionValidationProvidedEvent extends ServiceIntegrationEvent {
  constructor(
    requestId: string,
    userId: string,
    validationResult: {
      hasPermissions: boolean;
      grantedPermissions: string[];
      deniedPermissions: string[];
      userRoles: string[];
    },
    success: boolean,
    error?: string,
    correlationId?: string
  ) {
    super(
      'UserPermissionValidationProvided',
      'auth-service',
      '',
      requestId,
      {
        userId,
        validationResult,
        success,
        error,
        providedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getValidationResult(): any {
    return this.eventData.validationResult;
  }

  public hasPermissions(): boolean {
    return this.eventData.validationResult.hasPermissions;
  }

  public getGrantedPermissions(): string[] {
    return this.eventData.validationResult.grantedPermissions;
  }

  public getDeniedPermissions(): string[] {
    return this.eventData.validationResult.deniedPermissions;
  }

  public containsPHI(): boolean {
    return false; // Permission validation doesn't contain PHI
  }
}

/**
 * Service Health Status Event
 * For monitoring service health across the system
 */
export class ServiceHealthStatusEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    healthStatus: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: Date;
      details: {
        database: 'connected' | 'disconnected';
        dependencies: Record<string, 'healthy' | 'unhealthy'>;
        metrics: Record<string, number>;
      };
    },
    correlationId?: string
  ) {
    super(
      'ServiceHealthStatus',
      sourceService,
      'all-services',
      `health_${sourceService}_${Date.now()}`,
      {
        healthStatus,
        reportedAt: new Date()
      },
      undefined,
      correlationId
    );
  }

  public getHealthStatus(): any {
    return this.eventData.healthStatus;
  }

  public isHealthy(): boolean {
    return this.eventData.healthStatus.status === 'healthy';
  }

  public containsPHI(): boolean {
    return false; // Health status doesn't contain PHI
  }
}

/**
 * Cross-Service Data Sync Event
 * For maintaining eventual consistency across services
 */
export class CrossServiceDataSyncEvent extends ServiceIntegrationEvent {
  constructor(
    sourceService: string,
    targetService: string,
    syncType: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    entityData: any,
    userId?: string,
    correlationId?: string
  ) {
    super(
      'CrossServiceDataSync',
      sourceService,
      targetService,
      `sync_${entityType}_${entityId}_${Date.now()}`,
      {
        syncType,
        entityType,
        entityId,
        entityData,
        syncedAt: new Date()
      },
      userId,
      correlationId
    );
  }

  public getSyncType(): 'create' | 'update' | 'delete' {
    return this.eventData.syncType;
  }

  public getEntityType(): string {
    return this.eventData.entityType;
  }

  public getEntityId(): string {
    return this.eventData.entityId;
  }

  public getEntityData(): any {
    return this.eventData.entityData;
  }
}
