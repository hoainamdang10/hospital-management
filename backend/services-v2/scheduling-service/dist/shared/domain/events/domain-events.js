"use strict";
/**
 * Domain Events for Inter-Service Communication
 * Hospital Management System V2
 *
 * These events replace cross-schema foreign keys and enable
 * event-driven architecture between microservices.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPE_REGISTRY = exports.NotificationFailedEvent = exports.NotificationSentEvent = exports.InsuranceClaimProcessedEvent = exports.InsuranceClaimSubmittedEvent = exports.InvoiceOverdueEvent = exports.PaymentReceivedEvent = exports.InvoiceGeneratedEvent = exports.LabResultsReadyEvent = exports.PrescriptionCreatedEvent = exports.MedicalRecordCreatedEvent = exports.AppointmentCompletedEvent = exports.AppointmentCancelledEvent = exports.AppointmentConfirmedEvent = exports.AppointmentScheduledEvent = exports.DoctorAvailabilityChangedEvent = exports.DoctorScheduleUpdatedEvent = exports.DoctorRegisteredEvent = exports.PatientInsuranceUpdatedEvent = exports.PatientUpdatedEvent = exports.PatientRegisteredEvent = exports.UserDeactivatedEvent = exports.UserRoleChangedEvent = exports.UserAuthenticatedEvent = exports.UserCreatedEvent = void 0;
const domain_event_1 = require("../base/domain-event");
// ============================================================================
// IDENTITY SERVICE EVENTS
// ============================================================================
/**
 * Published when a new user is created
 * Subscribers: Patient Service, Doctor Service, Notification Service
 */
class UserCreatedEvent extends domain_event_1.DomainEvent {
    constructor(userId, email, fullName, roleType, citizenId, phoneNumber) {
        super('UserCreated', userId, 'User', { email, fullName, roleType, citizenId, phoneNumber }, 1, undefined, undefined, userId);
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.roleType = roleType;
        this.citizenId = citizenId;
        this.phoneNumber = phoneNumber;
    }
    getEventData() {
        return {
            userId: this.userId,
            email: this.email,
            fullName: this.fullName,
            roleType: this.roleType,
            citizenId: this.citizenId,
            phoneNumber: this.phoneNumber
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.roleType === 'patient' ? this.userId : null;
    }
}
exports.UserCreatedEvent = UserCreatedEvent;
/**
 * Published when user is authenticated
 * Subscribers: Audit Service, Security Service
 */
class UserAuthenticatedEvent extends domain_event_1.DomainEvent {
    constructor(userId, email, sessionId, ipAddress, userAgent, timestamp) {
        super('UserAuthenticated', userId, 'User', { email, sessionId, ipAddress, userAgent, timestamp }, 1, undefined, undefined, userId);
        this.userId = userId;
        this.email = email;
        this.sessionId = sessionId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.timestamp = timestamp;
    }
    getEventData() {
        return {
            userId: this.userId,
            email: this.email,
            sessionId: this.sessionId,
            ipAddress: this.ipAddress,
            userAgent: this.userAgent,
            timestamp: this.timestamp.toISOString()
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return null;
    }
}
exports.UserAuthenticatedEvent = UserAuthenticatedEvent;
/**
 * Published when user role changes
 * Subscribers: All services (for permission updates)
 */
class UserRoleChangedEvent extends domain_event_1.DomainEvent {
    constructor(userId, oldRole, newRole, changedBy, reason) {
        super('UserRoleChanged', userId, 'User', { oldRole, newRole, changedBy, reason }, 1, undefined, undefined, changedBy);
        this.userId = userId;
        this.oldRole = oldRole;
        this.newRole = newRole;
        this.changedBy = changedBy;
        this.reason = reason;
    }
    getEventData() {
        return {
            userId: this.userId,
            oldRole: this.oldRole,
            newRole: this.newRole,
            changedBy: this.changedBy,
            reason: this.reason
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.UserRoleChangedEvent = UserRoleChangedEvent;
/**
 * Published when user is deactivated
 * Subscribers: All services (to cleanup user data)
 */
class UserDeactivatedEvent extends domain_event_1.DomainEvent {
    constructor(userId, email, reason, deactivatedBy) {
        super('UserDeactivated', userId, 'User', { email, reason, deactivatedBy }, 1, undefined, undefined, deactivatedBy);
        this.userId = userId;
        this.email = email;
        this.reason = reason;
        this.deactivatedBy = deactivatedBy;
    }
    getEventData() {
        return {
            userId: this.userId,
            email: this.email,
            reason: this.reason,
            deactivatedBy: this.deactivatedBy
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return null;
    }
}
exports.UserDeactivatedEvent = UserDeactivatedEvent;
// ============================================================================
// PATIENT SERVICE EVENTS
// ============================================================================
/**
 * Published when a new patient is registered
 * Subscribers: Appointment Service, Notification Service, Billing Service
 */
class PatientRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(patientId, userId, patientIdCode, // PAT-YYYYMM-XXX
    fullName, dateOfBirth, phoneNumber, email, insuranceType) {
        super('PatientRegistered', patientId, 'Patient', { userId, patientIdCode, fullName, dateOfBirth, phoneNumber, email, insuranceType }, 1, undefined, undefined, userId);
        this.patientId = patientId;
        this.userId = userId;
        this.patientIdCode = patientIdCode;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.insuranceType = insuranceType;
    }
    getEventData() {
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
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientRegisteredEvent = PatientRegisteredEvent;
/**
 * Published when patient information is updated
 * Subscribers: Appointment Service, Notification Service
 */
class PatientUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, userId, updatedFields, updatedBy) {
        super('PatientUpdated', patientId, 'Patient', { userId, updatedFields, updatedBy }, 1, undefined, undefined, updatedBy);
        this.patientId = patientId;
        this.userId = userId;
        this.updatedFields = updatedFields;
        this.updatedBy = updatedBy;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            userId: this.userId,
            updatedFields: this.updatedFields,
            updatedBy: this.updatedBy
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientUpdatedEvent = PatientUpdatedEvent;
/**
 * Published when patient insurance is updated
 * Subscribers: Billing Service, Appointment Service
 */
class PatientInsuranceUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(patientId, insuranceType, insuranceNumber, expiryDate) {
        super('PatientInsuranceUpdated', patientId, 'Patient', { insuranceType, insuranceNumber, expiryDate }, 1);
        this.patientId = patientId;
        this.insuranceType = insuranceType;
        this.insuranceNumber = insuranceNumber;
        this.expiryDate = expiryDate;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            insuranceType: this.insuranceType,
            insuranceNumber: this.insuranceNumber,
            expiryDate: this.expiryDate?.toISOString()
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PatientInsuranceUpdatedEvent = PatientInsuranceUpdatedEvent;
// ============================================================================
// PROVIDER/STAFF SERVICE EVENTS
// ============================================================================
/**
 * Published when a new doctor is registered
 * Subscribers: Appointment Service, Notification Service
 */
class DoctorRegisteredEvent extends domain_event_1.DomainEvent {
    constructor(doctorId, userId, doctorIdCode, // DEPT-DOC-YYYYMM-XXX
    fullName, specialty, departmentCode, licenseNumber, isAcceptingPatients) {
        super('DoctorRegistered', doctorId, 'Doctor', { userId, doctorIdCode, fullName, specialty, departmentCode, licenseNumber, isAcceptingPatients }, 1, undefined, undefined, userId);
        this.doctorId = doctorId;
        this.userId = userId;
        this.doctorIdCode = doctorIdCode;
        this.fullName = fullName;
        this.specialty = specialty;
        this.departmentCode = departmentCode;
        this.licenseNumber = licenseNumber;
        this.isAcceptingPatients = isAcceptingPatients;
    }
    getEventData() {
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
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.DoctorRegisteredEvent = DoctorRegisteredEvent;
/**
 * Published when doctor schedule is updated
 * Subscribers: Appointment Service
 */
class DoctorScheduleUpdatedEvent extends domain_event_1.DomainEvent {
    constructor(doctorId, scheduleId, effectiveDate, updatedBy) {
        super('DoctorScheduleUpdated', doctorId, 'Doctor', { scheduleId, effectiveDate, updatedBy }, 1, undefined, undefined, updatedBy);
        this.doctorId = doctorId;
        this.scheduleId = scheduleId;
        this.effectiveDate = effectiveDate;
        this.updatedBy = updatedBy;
    }
    getEventData() {
        return {
            doctorId: this.doctorId,
            scheduleId: this.scheduleId,
            effectiveDate: this.effectiveDate.toISOString(),
            updatedBy: this.updatedBy
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.DoctorScheduleUpdatedEvent = DoctorScheduleUpdatedEvent;
/**
 * Published when doctor availability changes
 * Subscribers: Appointment Service, Notification Service
 */
class DoctorAvailabilityChangedEvent extends domain_event_1.DomainEvent {
    constructor(doctorId, date, isAvailable, reason) {
        super('DoctorAvailabilityChanged', doctorId, 'Doctor', { date, isAvailable, reason }, 1);
        this.doctorId = doctorId;
        this.date = date;
        this.isAvailable = isAvailable;
        this.reason = reason;
    }
    getEventData() {
        return {
            doctorId: this.doctorId,
            date: this.date.toISOString(),
            isAvailable: this.isAvailable,
            reason: this.reason
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.DoctorAvailabilityChangedEvent = DoctorAvailabilityChangedEvent;
// ============================================================================
// SCHEDULING SERVICE EVENTS
// ============================================================================
/**
 * Published when appointment is scheduled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
class AppointmentScheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, appointmentIdCode, // TYPE-DEPT-YYYYMM-SEQ
    patientId, doctorId, appointmentDate, startTime, endTime, appointmentType, reason, priority) {
        super('AppointmentScheduled', appointmentId, 'Appointment', { appointmentIdCode, patientId, doctorId, appointmentDate, startTime, endTime, appointmentType, reason, priority }, 1);
        this.appointmentId = appointmentId;
        this.appointmentIdCode = appointmentIdCode;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.appointmentType = appointmentType;
        this.reason = reason;
        this.priority = priority;
    }
    getEventData() {
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
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentScheduledEvent = AppointmentScheduledEvent;
/**
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 */
class AppointmentConfirmedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, confirmedAt, confirmationMethod) {
        super();
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.confirmedAt = confirmedAt;
        this.confirmationMethod = confirmationMethod;
    }
    get eventType() {
        return 'AppointmentConfirmed';
    }
    get aggregateId() {
        return this.appointmentId;
    }
}
exports.AppointmentConfirmedEvent = AppointmentConfirmedEvent;
/**
 * Published when appointment is cancelled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
class AppointmentCancelledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, cancelledBy, cancellationType, reason, cancelledAt) {
        super();
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.cancelledBy = cancelledBy;
        this.cancellationType = cancellationType;
        this.reason = reason;
        this.cancelledAt = cancelledAt;
    }
    get eventType() {
        return 'AppointmentCancelled';
    }
    get aggregateId() {
        return this.appointmentId;
    }
}
exports.AppointmentCancelledEvent = AppointmentCancelledEvent;
/**
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 */
class AppointmentCompletedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, completedAt, duration, notes) {
        super();
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.completedAt = completedAt;
        this.duration = duration;
        this.notes = notes;
    }
    get eventType() {
        return 'AppointmentCompleted';
    }
    get aggregateId() {
        return this.appointmentId;
    }
}
exports.AppointmentCompletedEvent = AppointmentCompletedEvent;
// ============================================================================
// CLINICAL EMR SERVICE EVENTS
// ============================================================================
/**
 * Published when medical record is created
 * Subscribers: Patient Service, Billing Service, Notification Service
 */
class MedicalRecordCreatedEvent extends domain_event_1.DomainEvent {
    constructor(recordId, recordIdCode, // MED-YYYYMM-XXX
    patientId, doctorId, appointmentId, visitDate, primaryDiagnosis, createdBy) {
        super();
        this.recordId = recordId;
        this.recordIdCode = recordIdCode;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.visitDate = visitDate;
        this.primaryDiagnosis = primaryDiagnosis;
        this.createdBy = createdBy;
    }
    get eventType() {
        return 'MedicalRecordCreated';
    }
    get aggregateId() {
        return this.recordId;
    }
}
exports.MedicalRecordCreatedEvent = MedicalRecordCreatedEvent;
/**
 * Published when prescription is created
 * Subscribers: Notification Service, Billing Service
 */
class PrescriptionCreatedEvent extends domain_event_1.DomainEvent {
    constructor(prescriptionId, prescriptionNumber, patientId, doctorId, medicationName, dosage, duration, prescribedBy) {
        super();
        this.prescriptionId = prescriptionId;
        this.prescriptionNumber = prescriptionNumber;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.medicationName = medicationName;
        this.dosage = dosage;
        this.duration = duration;
        this.prescribedBy = prescribedBy;
    }
    get eventType() {
        return 'PrescriptionCreated';
    }
    get aggregateId() {
        return this.prescriptionId;
    }
}
exports.PrescriptionCreatedEvent = PrescriptionCreatedEvent;
/**
 * Published when lab results are ready
 * Subscribers: Notification Service, Patient Service
 */
class LabResultsReadyEvent extends domain_event_1.DomainEvent {
    constructor(labOrderId, patientId, doctorId, testName, hasAbnormalResults, resultDate) {
        super();
        this.labOrderId = labOrderId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.testName = testName;
        this.hasAbnormalResults = hasAbnormalResults;
        this.resultDate = resultDate;
    }
    get eventType() {
        return 'LabResultsReady';
    }
    get aggregateId() {
        return this.labOrderId;
    }
}
exports.LabResultsReadyEvent = LabResultsReadyEvent;
// ============================================================================
// BILLING SERVICE EVENTS
// ============================================================================
/**
 * Published when invoice is generated
 * Subscribers: Patient Service, Notification Service
 */
class InvoiceGeneratedEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, invoiceNumber, patientId, appointmentId, totalAmount, dueDate, invoiceDate) {
        super();
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
        this.invoiceDate = invoiceDate;
    }
    get eventType() {
        return 'InvoiceGenerated';
    }
    get aggregateId() {
        return this.invoiceId;
    }
}
exports.InvoiceGeneratedEvent = InvoiceGeneratedEvent;
/**
 * Published when payment is received
 * Subscribers: Patient Service, Notification Service, Appointment Service
 */
class PaymentReceivedEvent extends domain_event_1.DomainEvent {
    constructor(paymentId, paymentNumber, invoiceId, patientId, amount, paymentMethod, paymentDate) {
        super();
        this.paymentId = paymentId;
        this.paymentNumber = paymentNumber;
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentDate = paymentDate;
    }
    get eventType() {
        return 'PaymentReceived';
    }
    get aggregateId() {
        return this.paymentId;
    }
}
exports.PaymentReceivedEvent = PaymentReceivedEvent;
/**
 * Published when invoice is overdue
 * Subscribers: Notification Service, Patient Service
 */
class InvoiceOverdueEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, invoiceNumber, patientId, totalAmount, dueDate, daysOverdue) {
        super();
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
        this.daysOverdue = daysOverdue;
    }
    get eventType() {
        return 'InvoiceOverdue';
    }
    get aggregateId() {
        return this.invoiceId;
    }
}
exports.InvoiceOverdueEvent = InvoiceOverdueEvent;
/**
 * Published when insurance claim is submitted
 * Subscribers: Notification Service, Patient Service
 */
class InsuranceClaimSubmittedEvent extends domain_event_1.DomainEvent {
    constructor(claimId, claimNumber, patientId, invoiceId, claimedAmount, insuranceProvider, submittedAt) {
        super();
        this.claimId = claimId;
        this.claimNumber = claimNumber;
        this.patientId = patientId;
        this.invoiceId = invoiceId;
        this.claimedAmount = claimedAmount;
        this.insuranceProvider = insuranceProvider;
        this.submittedAt = submittedAt;
    }
    get eventType() {
        return 'InsuranceClaimSubmitted';
    }
    get aggregateId() {
        return this.claimId;
    }
}
exports.InsuranceClaimSubmittedEvent = InsuranceClaimSubmittedEvent;
/**
 * Published when insurance claim is approved/rejected
 * Subscribers: Notification Service, Patient Service, Billing Service
 */
class InsuranceClaimProcessedEvent extends domain_event_1.DomainEvent {
    constructor(claimId, claimNumber, patientId, status, approvedAmount, rejectedAmount, reason) {
        super();
        this.claimId = claimId;
        this.claimNumber = claimNumber;
        this.patientId = patientId;
        this.status = status;
        this.approvedAmount = approvedAmount;
        this.rejectedAmount = rejectedAmount;
        this.reason = reason;
    }
    get eventType() {
        return 'InsuranceClaimProcessed';
    }
    get aggregateId() {
        return this.claimId;
    }
}
exports.InsuranceClaimProcessedEvent = InsuranceClaimProcessedEvent;
// ============================================================================
// NOTIFICATION SERVICE EVENTS
// ============================================================================
/**
 * Published when notification is sent
 * Subscribers: Audit Service
 */
class NotificationSentEvent extends domain_event_1.DomainEvent {
    constructor(notificationId, userId, notificationType, channel, sentAt, success) {
        super();
        this.notificationId = notificationId;
        this.userId = userId;
        this.notificationType = notificationType;
        this.channel = channel;
        this.sentAt = sentAt;
        this.success = success;
    }
    get eventType() {
        return 'NotificationSent';
    }
    get aggregateId() {
        return this.notificationId;
    }
}
exports.NotificationSentEvent = NotificationSentEvent;
/**
 * Published when notification delivery fails
 * Subscribers: Notification Service (for retry), Audit Service
 */
class NotificationFailedEvent extends domain_event_1.DomainEvent {
    constructor(notificationId, userId, channel, errorMessage, retryCount, failedAt) {
        super();
        this.notificationId = notificationId;
        this.userId = userId;
        this.channel = channel;
        this.errorMessage = errorMessage;
        this.retryCount = retryCount;
        this.failedAt = failedAt;
    }
    get eventType() {
        return 'NotificationFailed';
    }
    get aggregateId() {
        return this.notificationId;
    }
}
exports.NotificationFailedEvent = NotificationFailedEvent;
// Event type registry for deserialization
exports.EVENT_TYPE_REGISTRY = {
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
//# sourceMappingURL=domain-events.js.map