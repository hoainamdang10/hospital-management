/**
 * Domain Events for Inter-Service Communication
 * Hospital Management System V2
 *
 * These events replace cross-schema foreign keys and enable
 * event-driven architecture between microservices.
 */
import { DomainEvent } from '../base/domain-event';
/**
 * Published when a new user is created
 * Subscribers: Patient Service, Doctor Service, Notification Service
 */
export declare class UserCreatedEvent extends DomainEvent {
    readonly userId: string;
    readonly email: string;
    readonly fullName: string;
    readonly roleType: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist';
    readonly citizenId?: string | undefined;
    readonly phoneNumber?: string | undefined;
    constructor(userId: string, email: string, fullName: string, roleType: 'admin' | 'doctor' | 'nurse' | 'patient' | 'receptionist', citizenId?: string | undefined, phoneNumber?: string | undefined);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when user is authenticated
 * Subscribers: Audit Service, Security Service
 */
export declare class UserAuthenticatedEvent extends DomainEvent {
    readonly userId: string;
    readonly email: string;
    readonly sessionId: string;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly timestamp: Date;
    constructor(userId: string, email: string, sessionId: string, ipAddress: string, userAgent: string, timestamp: Date);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when user role changes
 * Subscribers: All services (for permission updates)
 */
export declare class UserRoleChangedEvent extends DomainEvent {
    readonly userId: string;
    readonly oldRole: string;
    readonly newRole: string;
    readonly changedBy: string;
    readonly reason?: string | undefined;
    constructor(userId: string, oldRole: string, newRole: string, changedBy: string, reason?: string | undefined);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when user is deactivated
 * Subscribers: All services (to cleanup user data)
 */
export declare class UserDeactivatedEvent extends DomainEvent {
    readonly userId: string;
    readonly email: string;
    readonly reason: string;
    readonly deactivatedBy: string;
    constructor(userId: string, email: string, reason: string, deactivatedBy: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when a new patient is registered
 * Subscribers: Appointment Service, Notification Service, Billing Service
 */
export declare class PatientRegisteredEvent extends DomainEvent {
    readonly patientId: string;
    readonly userId: string;
    readonly patientIdCode: string;
    readonly fullName: string;
    readonly dateOfBirth: Date;
    readonly phoneNumber: string;
    readonly email?: string | undefined;
    readonly insuranceType?: string | undefined;
    constructor(patientId: string, userId: string, patientIdCode: string, // PAT-YYYYMM-XXX
    fullName: string, dateOfBirth: Date, phoneNumber: string, email?: string | undefined, insuranceType?: string | undefined);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when patient information is updated
 * Subscribers: Appointment Service, Notification Service
 */
export declare class PatientUpdatedEvent extends DomainEvent {
    readonly patientId: string;
    readonly userId: string;
    readonly updatedFields: string[];
    readonly updatedBy: string;
    constructor(patientId: string, userId: string, updatedFields: string[], updatedBy: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when patient insurance is updated
 * Subscribers: Billing Service, Appointment Service
 */
export declare class PatientInsuranceUpdatedEvent extends DomainEvent {
    readonly patientId: string;
    readonly insuranceType: string;
    readonly insuranceNumber: string;
    readonly expiryDate?: Date | undefined;
    constructor(patientId: string, insuranceType: string, insuranceNumber: string, expiryDate?: Date | undefined);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when a new doctor is registered
 * Subscribers: Appointment Service, Notification Service
 */
export declare class DoctorRegisteredEvent extends DomainEvent {
    readonly doctorId: string;
    readonly userId: string;
    readonly doctorIdCode: string;
    readonly fullName: string;
    readonly specialty: string;
    readonly departmentCode: string;
    readonly licenseNumber: string;
    readonly isAcceptingPatients: boolean;
    constructor(doctorId: string, userId: string, doctorIdCode: string, // DEPT-DOC-YYYYMM-XXX
    fullName: string, specialty: string, departmentCode: string, licenseNumber: string, isAcceptingPatients: boolean);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when doctor schedule is updated
 * Subscribers: Appointment Service
 */
export declare class DoctorScheduleUpdatedEvent extends DomainEvent {
    readonly doctorId: string;
    readonly scheduleId: string;
    readonly effectiveDate: Date;
    readonly updatedBy: string;
    constructor(doctorId: string, scheduleId: string, effectiveDate: Date, updatedBy: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when doctor availability changes
 * Subscribers: Appointment Service, Notification Service
 */
export declare class DoctorAvailabilityChangedEvent extends DomainEvent {
    readonly doctorId: string;
    readonly date: Date;
    readonly isAvailable: boolean;
    readonly reason?: string | undefined;
    constructor(doctorId: string, date: Date, isAvailable: boolean, reason?: string | undefined);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when appointment is scheduled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
export declare class AppointmentScheduledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly appointmentIdCode: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentDate: Date;
    readonly startTime: string;
    readonly endTime: string;
    readonly appointmentType: string;
    readonly reason: string;
    readonly priority: string;
    constructor(appointmentId: string, appointmentIdCode: string, // TYPE-DEPT-YYYYMM-SEQ
    patientId: string, doctorId: string, appointmentDate: Date, startTime: string, endTime: string, appointmentType: string, reason: string, priority: string);
    getEventData(): Record<string, unknown>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 */
export declare class AppointmentConfirmedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly confirmedAt: Date;
    readonly confirmationMethod: string;
    constructor(appointmentId: string, patientId: string, doctorId: string, confirmedAt: Date, confirmationMethod: string);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when appointment is cancelled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
export declare class AppointmentCancelledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly cancelledBy: string;
    readonly cancellationType: 'patient' | 'doctor' | 'system' | 'emergency';
    readonly reason: string;
    readonly cancelledAt: Date;
    constructor(appointmentId: string, patientId: string, doctorId: string, cancelledBy: string, cancellationType: 'patient' | 'doctor' | 'system' | 'emergency', reason: string, cancelledAt: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 */
export declare class AppointmentCompletedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly completedAt: Date;
    readonly duration: number;
    readonly notes?: string | undefined;
    readonly consultationFee?: number | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, completedAt: Date, duration: number, notes?: string | undefined, consultationFee?: number | undefined);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when medical record is created
 * Subscribers: Patient Service, Billing Service, Notification Service
 */
export declare class MedicalRecordCreatedEvent extends DomainEvent {
    readonly recordId: string;
    readonly recordIdCode: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentId: string | undefined;
    readonly visitDate: Date;
    readonly primaryDiagnosis?: string | undefined;
    readonly createdBy?: string | undefined;
    constructor(recordId: string, recordIdCode: string, // MED-YYYYMM-XXX
    patientId: string, doctorId: string, appointmentId: string | undefined, visitDate: Date, primaryDiagnosis?: string | undefined, createdBy?: string | undefined);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when prescription is created
 * Subscribers: Notification Service, Billing Service
 */
export declare class PrescriptionCreatedEvent extends DomainEvent {
    readonly prescriptionId: string;
    readonly prescriptionNumber: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly medicationName: string;
    readonly dosage: string;
    readonly duration: number;
    readonly prescribedBy: string;
    constructor(prescriptionId: string, prescriptionNumber: string, patientId: string, doctorId: string, medicationName: string, dosage: string, duration: number, prescribedBy: string);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when lab results are ready
 * Subscribers: Notification Service, Patient Service
 */
export declare class LabResultsReadyEvent extends DomainEvent {
    readonly labOrderId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly testName: string;
    readonly hasAbnormalResults: boolean;
    readonly resultDate: Date;
    constructor(labOrderId: string, patientId: string, doctorId: string, testName: string, hasAbnormalResults: boolean, resultDate: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when invoice is generated
 * Subscribers: Patient Service, Notification Service
 */
export declare class InvoiceGeneratedEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly totalAmount: number;
    readonly dueDate: Date;
    readonly invoiceDate: Date;
    constructor(invoiceId: string, invoiceNumber: string, patientId: string, appointmentId: string | undefined, totalAmount: number, dueDate: Date, invoiceDate: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when payment is received
 * Subscribers: Patient Service, Notification Service, Appointment Service
 */
export declare class PaymentReceivedEvent extends DomainEvent {
    readonly paymentId: string;
    readonly paymentNumber: string;
    readonly invoiceId: string;
    readonly patientId: string;
    readonly amount: number;
    readonly paymentMethod: string;
    readonly paymentDate: Date;
    constructor(paymentId: string, paymentNumber: string, invoiceId: string, patientId: string, amount: number, paymentMethod: string, paymentDate: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when invoice is overdue
 * Subscribers: Notification Service, Patient Service
 */
export declare class InvoiceOverdueEvent extends DomainEvent {
    readonly invoiceId: string;
    readonly invoiceNumber: string;
    readonly patientId: string;
    readonly totalAmount: number;
    readonly dueDate: Date;
    readonly daysOverdue: number;
    constructor(invoiceId: string, invoiceNumber: string, patientId: string, totalAmount: number, dueDate: Date, daysOverdue: number);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when insurance claim is submitted
 * Subscribers: Notification Service, Patient Service
 */
export declare class InsuranceClaimSubmittedEvent extends DomainEvent {
    readonly claimId: string;
    readonly claimNumber: string;
    readonly patientId: string;
    readonly invoiceId: string;
    readonly claimedAmount: number;
    readonly insuranceProvider: string;
    readonly submittedAt: Date;
    constructor(claimId: string, claimNumber: string, patientId: string, invoiceId: string, claimedAmount: number, insuranceProvider: string, submittedAt: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when insurance claim is approved/rejected
 * Subscribers: Notification Service, Patient Service, Billing Service
 */
export declare class InsuranceClaimProcessedEvent extends DomainEvent {
    readonly claimId: string;
    readonly claimNumber: string;
    readonly patientId: string;
    readonly status: 'approved' | 'rejected' | 'partially_approved';
    readonly approvedAmount: number;
    readonly rejectedAmount: number;
    readonly reason?: string | undefined;
    constructor(claimId: string, claimNumber: string, patientId: string, status: 'approved' | 'rejected' | 'partially_approved', approvedAmount: number, rejectedAmount: number, reason?: string | undefined);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when notification is sent
 * Subscribers: Audit Service
 */
export declare class NotificationSentEvent extends DomainEvent {
    readonly notificationId: string;
    readonly userId: string;
    readonly notificationType: string;
    readonly channel: string;
    readonly sentAt: Date;
    readonly success: boolean;
    constructor(notificationId: string, userId: string, notificationType: string, channel: string, sentAt: Date, success: boolean);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Published when notification delivery fails
 * Subscribers: Notification Service (for retry), Audit Service
 */
export declare class NotificationFailedEvent extends DomainEvent {
    readonly notificationId: string;
    readonly userId: string;
    readonly channel: string;
    readonly errorMessage: string;
    readonly retryCount: number;
    readonly failedAt: Date;
    constructor(notificationId: string, userId: string, channel: string, errorMessage: string, retryCount: number, failedAt: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
export declare const EVENT_TYPE_REGISTRY: Record<string, new (...args: any[]) => DomainEvent>;
//# sourceMappingURL=domain-events.d.ts.map