/**
 * Domain Events for Inter-Service Communication
 * Hospital Management System V2
 * 
 * These events replace cross-schema foreign keys and enable
 * event-driven architecture between microservices.
 */

import { DomainEvent } from '../base/domain-event';

// ============================================================================
// IDENTITY SERVICE EVENTS
// ============================================================================

/**
 * Published when a new user is created
 * Subscribers: Patient Service, Doctor Service, Notification Service
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public override readonly userId: string,
    public readonly email: string,
    public readonly fullName: string,
    public readonly roleType: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist' | 'technician',
    public readonly citizenId?: string,
    public readonly phoneNumber?: string
  ) {
    super(
      'UserCreated',
      userId,
      'User',
      { email, fullName, roleType, citizenId, phoneNumber },
      1,
      undefined,
      undefined,
      userId
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      fullName: this.fullName,
      roleType: this.roleType,
      citizenId: this.citizenId,
      phoneNumber: this.phoneNumber
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.roleType === 'patient' ? this.userId : null;
  }
}

/**
 * Published when user is authenticated
 * Subscribers: Audit Service, Security Service
 */
export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    public override readonly userId: string,
    public readonly email: string,
    public readonly sessionId: string,
    public readonly ipAddress: string,
    public readonly userAgent: string,
    public readonly timestamp: Date
  ) {
    super(
      'UserAuthenticated',
      userId,
      'User',
      { email, sessionId, ipAddress, userAgent, timestamp },
      1,
      undefined,
      undefined,
      userId
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      sessionId: this.sessionId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: this.timestamp.toISOString()
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return null;
  }
}

/**
 * Published when user role changes
 * Subscribers: All services (for permission updates)
 */
export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public override readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    public readonly changedBy: string,
    public readonly reason?: string
  ) {
    super(
      'UserRoleChanged',
      userId,
      'User',
      { oldRole, newRole, changedBy, reason },
      1,
      undefined,
      undefined,
      changedBy
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      oldRole: this.oldRole,
      newRole: this.newRole,
      changedBy: this.changedBy,
      reason: this.reason
    };
  }

  containsPHI(): boolean {
    return false;
  }

  getPatientId(): string | null {
    return null;
  }
}

/**
 * Published when user is deactivated
 * Subscribers: All services (to cleanup user data)
 */
export class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public override readonly userId: string,
    public readonly email: string,
    public readonly reason: string,
    public readonly deactivatedBy: string
  ) {
    super(
      'UserDeactivated',
      userId,
      'User',
      { email, reason, deactivatedBy },
      1,
      undefined,
      undefined,
      deactivatedBy
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      reason: this.reason,
      deactivatedBy: this.deactivatedBy
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return null;
  }
}

// ============================================================================
// PATIENT SERVICE EVENTS
// ============================================================================

/**
 * Published when a new patient is registered
 * Subscribers: Appointment Service, Notification Service, Billing Service
 */
export class PatientRegisteredEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public override readonly userId: string,
    public readonly patientIdCode: string, // PAT-YYYYMM-XXX
    public readonly fullName: string,
    public readonly dateOfBirth: Date,
    public readonly phoneNumber: string,
    public readonly email?: string,
    public readonly insuranceType?: string
  ) {
    super(
      'PatientRegistered',
      patientId,
      'Patient',
      { userId, patientIdCode, fullName, dateOfBirth, phoneNumber, email, insuranceType },
      1,
      undefined,
      undefined,
      userId
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      patientId: this.patientId,
      userId: this.userId,
      patientIdCode: this.patientIdCode,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth.toISOString(),
      phoneNumber: this.phoneNumber,
      email: this.email,
      insuranceType: this.insuranceType
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when patient information is updated
 * Subscribers: Appointment Service, Notification Service
 */
export class PatientUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public override readonly userId: string,
    public readonly updatedFields: string[],
    public readonly updatedBy: string
  ) {
    super(
      'PatientUpdated',
      patientId,
      'Patient',
      { userId, updatedFields, updatedBy },
      1,
      undefined,
      undefined,
      updatedBy
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      patientId: this.patientId,
      userId: this.userId,
      updatedFields: this.updatedFields,
      updatedBy: this.updatedBy
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when patient insurance is updated
 * Subscribers: Billing Service, Appointment Service
 */
export class PatientInsuranceUpdatedEvent extends DomainEvent {
  constructor(
    public readonly patientId: string,
    public readonly insuranceType: string,
    public readonly insuranceNumber: string,
    public readonly expiryDate?: Date
  ) {
    super(
      'PatientInsuranceUpdated',
      patientId,
      'Patient',
      { insuranceType, insuranceNumber, expiryDate },
      1
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      patientId: this.patientId,
      insuranceType: this.insuranceType,
      insuranceNumber: this.insuranceNumber,
      expiryDate: this.expiryDate?.toISOString()
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}

// ============================================================================
// PROVIDER/STAFF SERVICE EVENTS
// ============================================================================

/**
 * Published when a new doctor is registered
 * Subscribers: Appointment Service, Notification Service
 */
export class DoctorRegisteredEvent extends DomainEvent {
  constructor(
    public readonly doctorId: string,
    public override readonly userId: string,
    public readonly doctorIdCode: string, // DEPT-DOC-YYYYMM-XXX
    public readonly fullName: string,
    public readonly specialty: string,
    public readonly departmentCode: string,
    public readonly licenseNumber: string,
    public readonly isAcceptingPatients: boolean
  ) {
    super(
      'DoctorRegistered',
      doctorId,
      'Doctor',
      { userId, doctorIdCode, fullName, specialty, departmentCode, licenseNumber, isAcceptingPatients },
      1,
      undefined,
      undefined,
      userId
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      doctorId: this.doctorId,
      userId: this.userId,
      doctorIdCode: this.doctorIdCode,
      fullName: this.fullName,
      specialty: this.specialty,
      departmentCode: this.departmentCode,
      licenseNumber: this.licenseNumber,
      isAcceptingPatients: this.isAcceptingPatients
    };
  }

  containsPHI(): boolean {
    return false;
  }

  getPatientId(): string | null {
    return null;
  }
}

/**
 * Published when doctor schedule is updated
 * Subscribers: Appointment Service
 */
export class DoctorScheduleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly doctorId: string,
    public readonly scheduleId: string,
    public readonly effectiveDate: Date,
    public readonly updatedBy: string
  ) {
    super(
      'DoctorScheduleUpdated',
      doctorId,
      'Doctor',
      { scheduleId, effectiveDate, updatedBy },
      1,
      undefined,
      undefined,
      updatedBy
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      doctorId: this.doctorId,
      scheduleId: this.scheduleId,
      effectiveDate: this.effectiveDate.toISOString(),
      updatedBy: this.updatedBy
    };
  }

  containsPHI(): boolean {
    return false;
  }

  getPatientId(): string | null {
    return null;
  }
}

/**
 * Published when doctor availability changes
 * Subscribers: Appointment Service, Notification Service
 */
export class DoctorAvailabilityChangedEvent extends DomainEvent {
  constructor(
    public readonly doctorId: string,
    public readonly date: Date,
    public readonly isAvailable: boolean,
    public readonly reason?: string
  ) {
    super(
      'DoctorAvailabilityChanged',
      doctorId,
      'Doctor',
      { date, isAvailable, reason },
      1
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      doctorId: this.doctorId,
      date: this.date.toISOString(),
      isAvailable: this.isAvailable,
      reason: this.reason
    };
  }

  containsPHI(): boolean {
    return false;
  }

  getPatientId(): string | null {
    return null;
  }
}

// ============================================================================
// SCHEDULING SERVICE EVENTS
// ============================================================================

/**
 * Published when appointment is scheduled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
export class AppointmentScheduledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly appointmentIdCode: string, // TYPE-DEPT-YYYYMM-SEQ
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentDate: Date,
    public readonly startTime: string,
    public readonly endTime: string,
    public readonly appointmentType: string,
    public readonly reason: string,
    public readonly priority: string
  ) {
    super(
      'AppointmentScheduled',
      appointmentId,
      'Appointment',
      { appointmentIdCode, patientId, doctorId, appointmentDate, startTime, endTime, appointmentType, reason, priority },
      1
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      appointmentId: this.appointmentId,
      appointmentIdCode: this.appointmentIdCode,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate.toISOString(),
      startTime: this.startTime,
      endTime: this.endTime,
      appointmentType: this.appointmentType,
      reason: this.reason,
      priority: this.priority
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 */
export class AppointmentConfirmedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly confirmedAt: Date,
    public readonly confirmationMethod: string
  ) {
    super(
      'AppointmentConfirmed',
      appointmentId,
      'Appointment',
      {
        patientId,
        doctorId,
        confirmedAt,
        confirmationMethod
      },
      1,
      undefined,
      undefined,
      patientId
    );
  }

  override getEventData(): any {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      confirmedAt: this.confirmedAt,
      confirmationMethod: this.confirmationMethod
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when appointment is cancelled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
export class AppointmentCancelledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly cancelledBy: string,
    public readonly cancellationType: 'patient' | 'doctor' | 'system' | 'emergency',
    public readonly reason: string,
    public readonly cancelledAt: Date
  ) {
    super(
      'AppointmentCancelled',
      appointmentId,
      'Appointment',
      {
        patientId,
        doctorId,
        cancelledBy,
        cancellationType,
        reason,
        cancelledAt
      },
      1,
      undefined,
      undefined,
      cancelledBy
    );
  }

  override getEventData(): any {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      cancelledBy: this.cancelledBy,
      cancellationType: this.cancellationType,
      reason: this.reason,
      cancelledAt: this.cancelledAt
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 */
export class AppointmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly completedAt: Date,
    public readonly duration: number,
    public readonly notes?: string,
    public readonly consultationFee?: number
  ) {
    super(
      'AppointmentCompleted',
      appointmentId,
      'Appointment',
      {
        patientId,
        doctorId,
        completedAt,
        duration,
        notes,
        consultationFee
      },
      1,
      undefined,
      undefined,
      doctorId
    );
  }

  override getEventData(): any {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      completedAt: this.completedAt,
      duration: this.duration,
      notes: this.notes,
      consultationFee: this.consultationFee
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

// ============================================================================
// CLINICAL EMR SERVICE EVENTS
// ============================================================================

/**
 * Published when medical record is created
 * Subscribers: Patient Service, Billing Service, Notification Service
 */
export class MedicalRecordCreatedEvent extends DomainEvent {
  constructor(
    public readonly recordId: string,
    public readonly recordIdCode: string, // MED-YYYYMM-XXX
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly appointmentId: string | undefined,
    public readonly visitDate: Date,
    public readonly primaryDiagnosis?: string,
    public readonly createdBy?: string
  ) {
    super(
      'MedicalRecordCreated',
      recordId,
      'MedicalRecord',
      {
        recordIdCode,
        patientId,
        doctorId,
        appointmentId,
        visitDate,
        primaryDiagnosis,
        createdBy
      },
      1,
      undefined,
      undefined,
      createdBy
    );
  }

  override getEventData(): any {
    return {
      recordIdCode: this.recordIdCode,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      visitDate: this.visitDate,
      primaryDiagnosis: this.primaryDiagnosis,
      createdBy: this.createdBy
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when prescription is created
 * Subscribers: Notification Service, Billing Service
 */
export class PrescriptionCreatedEvent extends DomainEvent {
  constructor(
    public readonly prescriptionId: string,
    public readonly prescriptionNumber: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly medicationName: string,
    public readonly dosage: string,
    public readonly duration: number,
    public readonly prescribedBy: string
  ) {
    super(
      'PrescriptionCreated',
      prescriptionId,
      'Prescription',
      {
        prescriptionNumber,
        patientId,
        doctorId,
        medicationName,
        dosage,
        duration,
        prescribedBy
      },
      1,
      undefined,
      undefined,
      prescribedBy
    );
  }

  override getEventData(): any {
    return {
      prescriptionNumber: this.prescriptionNumber,
      patientId: this.patientId,
      doctorId: this.doctorId,
      medicationName: this.medicationName,
      dosage: this.dosage,
      duration: this.duration,
      prescribedBy: this.prescribedBy
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when lab results are ready
 * Subscribers: Notification Service, Patient Service
 */
export class LabResultsReadyEvent extends DomainEvent {
  constructor(
    public readonly labOrderId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly testName: string,
    public readonly hasAbnormalResults: boolean,
    public readonly resultDate: Date
  ) {
    super(
      'LabResultsReady',
      labOrderId,
      'LabOrder',
      {
        patientId,
        doctorId,
        testName,
        hasAbnormalResults,
        resultDate
      },
      1,
      undefined,
      undefined,
      doctorId
    );
  }

  override getEventData(): any {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      testName: this.testName,
      hasAbnormalResults: this.hasAbnormalResults,
      resultDate: this.resultDate
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

// ============================================================================
// BILLING SERVICE EVENTS
// ============================================================================

/**
 * Published when invoice is generated
 * Subscribers: Patient Service, Notification Service
 */
export class InvoiceGeneratedEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly patientId: string,
    public readonly appointmentId: string | undefined,
    public readonly totalAmount: number,
    public readonly dueDate: Date,
    public readonly invoiceDate: Date
  ) {
    super(
      'InvoiceGenerated',
      invoiceId,
      'Invoice',
      {
        invoiceNumber,
        patientId,
        appointmentId,
        totalAmount,
        dueDate,
        invoiceDate
      }
    );
  }

  override getEventData(): any {
    return {
      invoiceNumber: this.invoiceNumber,
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      totalAmount: this.totalAmount,
      dueDate: this.dueDate,
      invoiceDate: this.invoiceDate
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when payment is received
 * Subscribers: Patient Service, Notification Service, Appointment Service
 */
export class PaymentReceivedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly paymentNumber: string,
    public readonly invoiceId: string,
    public readonly patientId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly paymentDate: Date
  ) {
    super(
      'PaymentReceived',
      paymentId,
      'Payment',
      {
        paymentNumber,
        invoiceId,
        patientId,
        amount,
        paymentMethod,
        paymentDate
      }
    );
  }

  override getEventData(): any {
    return {
      paymentNumber: this.paymentNumber,
      invoiceId: this.invoiceId,
      patientId: this.patientId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      paymentDate: this.paymentDate
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when invoice is overdue
 * Subscribers: Notification Service, Patient Service
 */
export class InvoiceOverdueEvent extends DomainEvent {
  constructor(
    public readonly invoiceId: string,
    public readonly invoiceNumber: string,
    public readonly patientId: string,
    public readonly totalAmount: number,
    public readonly dueDate: Date,
    public readonly daysOverdue: number
  ) {
    super(
      'InvoiceOverdue',
      invoiceId,
      'Invoice',
      {
        invoiceNumber,
        patientId,
        totalAmount,
        dueDate,
        daysOverdue
      }
    );
  }

  override getEventData(): any {
    return {
      invoiceNumber: this.invoiceNumber,
      patientId: this.patientId,
      totalAmount: this.totalAmount,
      dueDate: this.dueDate,
      daysOverdue: this.daysOverdue
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when insurance claim is submitted
 * Subscribers: Notification Service, Patient Service
 */
export class InsuranceClaimSubmittedEvent extends DomainEvent {
  constructor(
    public readonly claimId: string,
    public readonly claimNumber: string,
    public readonly patientId: string,
    public readonly invoiceId: string,
    public readonly claimedAmount: number,
    public readonly insuranceProvider: string,
    public readonly submittedAt: Date
  ) {
    super(
      'InsuranceClaimSubmitted',
      claimId,
      'InsuranceClaim',
      {
        claimNumber,
        patientId,
        invoiceId,
        claimedAmount,
        insuranceProvider,
        submittedAt
      }
    );
  }

  override getEventData(): any {
    return {
      claimNumber: this.claimNumber,
      patientId: this.patientId,
      invoiceId: this.invoiceId,
      claimedAmount: this.claimedAmount,
      insuranceProvider: this.insuranceProvider,
      submittedAt: this.submittedAt
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

/**
 * Published when insurance claim is approved/rejected
 * Subscribers: Notification Service, Patient Service, Billing Service
 */
export class InsuranceClaimProcessedEvent extends DomainEvent {
  constructor(
    public readonly claimId: string,
    public readonly claimNumber: string,
    public readonly patientId: string,
    public readonly status: 'approved' | 'rejected' | 'partially_approved',
    public readonly approvedAmount: number,
    public readonly rejectedAmount: number,
    public readonly reason?: string
  ) {
    super(
      'InsuranceClaimProcessed',
      claimId,
      'InsuranceClaim',
      {
        claimNumber,
        patientId,
        status,
        approvedAmount,
        rejectedAmount,
        reason
      }
    );
  }

  override getEventData(): any {
    return {
      claimNumber: this.claimNumber,
      patientId: this.patientId,
      status: this.status,
      approvedAmount: this.approvedAmount,
      rejectedAmount: this.rejectedAmount,
      reason: this.reason
    };
  }

  override containsPHI(): boolean {
    return true;
  }

  override getPatientId(): string | null {
    return this.patientId;
  }
}

// ============================================================================
// NOTIFICATION SERVICE EVENTS
// ============================================================================

/**
 * Published when notification is sent
 * Subscribers: Audit Service
 */
export class NotificationSentEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public override readonly userId: string,
    public readonly notificationType: string,
    public readonly channel: string,
    public readonly sentAt: Date,
    public readonly success: boolean
  ) {
    super(
      'NotificationSent',
      notificationId,
      'Notification',
      {
        userId,
        notificationType,
        channel,
        sentAt,
        success
      }
    );
  }

  override getEventData(): any {
    return {
      userId: this.userId,
      notificationType: this.notificationType,
      channel: this.channel,
      sentAt: this.sentAt,
      success: this.success
    };
  }

  override containsPHI(): boolean {
    return false;
  }

  override getPatientId(): string | null {
    return null;
  }
}

/**
 * Published when notification delivery fails
 * Subscribers: Notification Service (for retry), Audit Service
 */
export class NotificationFailedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public override readonly userId: string,
    public readonly channel: string,
    public readonly errorMessage: string,
    public readonly retryCount: number,
    public readonly failedAt: Date
  ) {
    super(
      'NotificationFailed',
      notificationId,
      'Notification',
      {
        userId,
        channel,
        errorMessage,
        retryCount,
        failedAt
      }
    );
  }

  override getEventData(): any {
    return {
      userId: this.userId,
      channel: this.channel,
      errorMessage: this.errorMessage,
      retryCount: this.retryCount,
      failedAt: this.failedAt
    };
  }

  override containsPHI(): boolean {
    return false;
  }

  override getPatientId(): string | null {
    return null;
  }
}

// Event type registry for deserialization
export const EVENT_TYPE_REGISTRY: Record<string, new (...args: any[]) => DomainEvent> = {
  // Identity Service Events
  UserCreated: UserCreatedEvent,
  UserAuthenticated: UserAuthenticatedEvent,
  UserRoleChanged: UserRoleChangedEvent,
  UserDeactivated: UserDeactivatedEvent,

  // Patient Service Events
  PatientRegistered: PatientRegisteredEvent,
  PatientUpdated: PatientUpdatedEvent,
  PatientInsuranceUpdated: PatientInsuranceUpdatedEvent,

  // Provider/Staff Service Events
  DoctorRegistered: DoctorRegisteredEvent,
  DoctorScheduleUpdated: DoctorScheduleUpdatedEvent,
  DoctorAvailabilityChanged: DoctorAvailabilityChangedEvent,

  // Scheduling Service Events
  AppointmentScheduled: AppointmentScheduledEvent,
  AppointmentConfirmed: AppointmentConfirmedEvent,
  AppointmentCancelled: AppointmentCancelledEvent,
  AppointmentCompleted: AppointmentCompletedEvent,

  // Clinical EMR Service Events
  MedicalRecordCreated: MedicalRecordCreatedEvent,
  PrescriptionCreated: PrescriptionCreatedEvent,
  LabResultsReady: LabResultsReadyEvent,

  // Billing Service Events
  InvoiceGenerated: InvoiceGeneratedEvent,
  PaymentReceived: PaymentReceivedEvent,
  InvoiceOverdue: InvoiceOverdueEvent,
  InsuranceClaimSubmitted: InsuranceClaimSubmittedEvent,
  InsuranceClaimProcessed: InsuranceClaimProcessedEvent,

  // Notification Service Events
  NotificationSent: NotificationSentEvent,
  NotificationFailed: NotificationFailedEvent,
};

