"use strict";
/**
 * Domain Events for Inter-Service Communication
 * Hospital Management System V2
 *
 * These events replace cross-schema foreign keys and enable
 * event-driven architecture between microservices.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_TYPE_REGISTRY = exports.NotificationFailedEvent = exports.NotificationSentEvent = exports.InsuranceClaimProcessedEvent = exports.InsuranceClaimSubmittedEvent = exports.InvoiceOverdueEvent = exports.PaymentReceivedEvent = exports.InvoiceGeneratedEvent = exports.LabResultsReadyEvent = exports.PrescriptionCreatedEvent = exports.MedicalRecordCreatedEvent = exports.AppointmentCompletedEvent = exports.AppointmentCancelledEvent = exports.AppointmentConfirmedEvent = exports.AppointmentStartedEvent = exports.AppointmentCheckedInEvent = exports.AppointmentRescheduledEvent = exports.AppointmentScheduledEvent = exports.DoctorAvailabilityChangedEvent = exports.DoctorScheduleUpdatedEvent = exports.DoctorRegisteredEvent = exports.PatientInsuranceUpdatedEvent = exports.PatientUpdatedEvent = exports.PatientRegisteredEvent = exports.UserDeactivatedEvent = exports.UserRoleChangedEvent = exports.UserAuthenticatedEvent = exports.UserCreatedEvent = void 0;
const domain_event_1 = require("../base/domain-event");
// ============================================================================
// IDENTITY SERVICE EVENTS
// ============================================================================
/**
 * Published when a new user is created
 * Subscribers: Patient Service, Doctor Service, Notification Service
 */
class UserCreatedEvent extends domain_event_1.DomainEvent {
    constructor(userId, email, fullName, roleType, citizenId, phoneNumber, dateOfBirth, gender, address, 
    // Professional fields (optional to keep backward compatibility)
    department, specializationCode, specializationName, licenseNumber, education, yearsOfExperience, position, title, employmentType, workSchedule, consultationFee) {
        super("UserCreated", userId, "User", {
            email,
            fullName,
            roleType,
            citizenId,
            phoneNumber,
            dateOfBirth,
            gender,
            address,
            department,
            specializationCode,
            specializationName,
            licenseNumber,
            education,
            yearsOfExperience,
            position,
            title,
            employmentType,
            workSchedule,
            consultationFee,
        }, 1, undefined, undefined, userId);
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.roleType = roleType;
        this.citizenId = citizenId;
        this.phoneNumber = phoneNumber;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.department = department;
        this.specializationCode = specializationCode;
        this.specializationName = specializationName;
        this.licenseNumber = licenseNumber;
        this.education = education;
        this.yearsOfExperience = yearsOfExperience;
        this.position = position;
        this.title = title;
        this.employmentType = employmentType;
        this.workSchedule = workSchedule;
        this.consultationFee = consultationFee;
    }
    getEventData() {
        return {
            userId: this.userId,
            email: this.email,
            fullName: this.fullName,
            roleType: this.roleType,
            citizenId: this.citizenId,
            phoneNumber: this.phoneNumber,
            dateOfBirth: this.dateOfBirth,
            gender: this.gender,
            address: this.address,
            department: this.department,
            specializationCode: this.specializationCode,
            specializationName: this.specializationName,
            licenseNumber: this.licenseNumber,
            education: this.education,
            yearsOfExperience: this.yearsOfExperience,
            position: this.position,
            title: this.title,
            employmentType: this.employmentType,
            workSchedule: this.workSchedule,
            consultationFee: this.consultationFee,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.roleType === "patient" ? this.userId : null;
    }
}
exports.UserCreatedEvent = UserCreatedEvent;
/**
 * Published when user is authenticated
 * Subscribers: Audit Service, Security Service
 */
class UserAuthenticatedEvent extends domain_event_1.DomainEvent {
    constructor(userId, email, sessionId, ipAddress, userAgent, timestamp) {
        super("UserAuthenticated", userId, "User", { email, sessionId, ipAddress, userAgent, timestamp }, 1, undefined, undefined, userId);
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
            timestamp: this.timestamp.toISOString(),
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
        super("UserRoleChanged", userId, "User", { oldRole, newRole, changedBy, reason }, 1, undefined, undefined, changedBy);
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
            reason: this.reason,
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
        super("UserDeactivated", userId, "User", { email, reason, deactivatedBy }, 1, undefined, undefined, deactivatedBy);
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
            deactivatedBy: this.deactivatedBy,
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
        super("PatientRegistered", patientId, "Patient", {
            userId,
            patientIdCode,
            fullName,
            dateOfBirth,
            phoneNumber,
            email,
            insuranceType,
        }, 1, undefined, undefined, userId);
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
            insuranceType: this.insuranceType,
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
        super("PatientUpdated", patientId, "Patient", { userId, updatedFields, updatedBy }, 1, undefined, undefined, updatedBy);
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
            updatedBy: this.updatedBy,
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
        super("PatientInsuranceUpdated", patientId, "Patient", { insuranceType, insuranceNumber, expiryDate }, 1);
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
            expiryDate: this.expiryDate?.toISOString(),
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
        super("DoctorRegistered", doctorId, "Doctor", {
            userId,
            doctorIdCode,
            fullName,
            specialty,
            departmentCode,
            licenseNumber,
            isAcceptingPatients,
        }, 1, undefined, undefined, userId);
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
            isAcceptingPatients: this.isAcceptingPatients,
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
        super("DoctorScheduleUpdated", doctorId, "Doctor", { scheduleId, effectiveDate, updatedBy }, 1, undefined, undefined, updatedBy);
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
            updatedBy: this.updatedBy,
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
        super("DoctorAvailabilityChanged", doctorId, "Doctor", { date, isAvailable, reason }, 1);
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
            reason: this.reason,
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
 * PLACEHOLDER: AppointmentScheduledEvent
 *
 * This is a placeholder class for EVENT_TYPE_REGISTRY.
 * The actual implementation is in appointments-service/src/domain/events/AppointmentScheduledEvent.ts
 *
 * FIXED: Constructor now accepts all 11 parameters to properly initialize readonly properties
 * during deserialization.
 */
class AppointmentScheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, durationMinutes, type, priority, status, consultationFee, createdBy, correlationId, causationId, userId) {
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            durationMinutes,
            type,
            priority,
            status,
            consultationFee,
            createdBy,
            scheduledAt: new Date(),
        };
        super("AppointmentScheduled", appointmentId, "Appointment", eventData, 1, correlationId, causationId, userId);
        // Assign readonly properties
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.durationMinutes = durationMinutes;
        this.type = type;
        this.priority = priority;
        this.status = status;
        this.consultationFee = consultationFee;
        this.createdBy = createdBy;
        this.scheduledAt = eventData.scheduledAt;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            durationMinutes: this.durationMinutes,
            type: this.type,
            priority: this.priority,
            status: this.status,
            consultationFee: this.consultationFee,
            createdBy: this.createdBy,
            scheduledAt: this.scheduledAt,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || null;
    }
}
exports.AppointmentScheduledEvent = AppointmentScheduledEvent;
/**
 * PLACEHOLDER: AppointmentRescheduledEvent
 *
 * Lightweight definition for deserialization in EVENT_TYPE_REGISTRY.
 * Full domain logic lives inside appointments-service.
 */
class AppointmentRescheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, newStartTime, newEndTime, rescheduleReason, rescheduledBy, correlationId, causationId, userId) {
        const start = new Date(newStartTime);
        const end = new Date(newEndTime);
        const eventData = {
            appointmentId,
            patientId,
            doctorId,
            newStartTime: start,
            newEndTime: end,
            rescheduleReason,
            rescheduledBy,
        };
        super("AppointmentRescheduled", appointmentId, "Appointment", eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.newStartTime = start;
        this.newEndTime = end;
        this.rescheduleReason = rescheduleReason;
        this.rescheduledBy = rescheduledBy;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            newStartTime: this.newStartTime,
            newEndTime: this.newEndTime,
            rescheduleReason: this.rescheduleReason,
            rescheduledBy: this.rescheduledBy,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || null;
    }
}
exports.AppointmentRescheduledEvent = AppointmentRescheduledEvent;
/**
 * PLACEHOLDER: AppointmentCheckedInEvent
 * Lightweight definition for EVENT_TYPE_REGISTRY.
 */
class AppointmentCheckedInEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, checkedInAt, priority, correlationId, causationId, userId) {
        const checkedInDate = checkedInAt instanceof Date ? checkedInAt : new Date(checkedInAt);
        super("AppointmentCheckedIn", appointmentId, "Appointment", {
            appointmentId,
            patientId,
            doctorId,
            checkedInAt: checkedInDate,
            priority,
        }, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.checkedInAt = checkedInAt;
        this.priority = priority;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            checkedInAt: this.checkedInAt,
            priority: this.priority,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || null;
    }
}
exports.AppointmentCheckedInEvent = AppointmentCheckedInEvent;
/**
 * PLACEHOLDER: AppointmentStartedEvent
 * Lightweight definition for EVENT_TYPE_REGISTRY.
 */
class AppointmentStartedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, appointmentDate, appointmentTime, startedBy, correlationId, causationId, userId) {
        super("AppointmentStarted", appointmentId, "Appointment", {
            appointmentId,
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            startedAt: new Date(),
            startedBy,
        }, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.startedBy = startedBy;
    }
    getEventData() {
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentDate: this.appointmentDate,
            appointmentTime: this.appointmentTime,
            startedAt: this.occurredAt,
            startedBy: this.startedBy,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId || null;
    }
}
exports.AppointmentStartedEvent = AppointmentStartedEvent;
/**
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 */
class AppointmentConfirmedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, confirmedAt, confirmationMethod) {
        super("AppointmentConfirmed", appointmentId, "Appointment", {
            patientId,
            doctorId,
            confirmedAt,
            confirmationMethod,
        }, 1, undefined, undefined, patientId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.confirmedAt = confirmedAt;
        this.confirmationMethod = confirmationMethod;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            doctorId: this.doctorId,
            confirmedAt: this.confirmedAt,
            confirmationMethod: this.confirmationMethod,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentConfirmedEvent = AppointmentConfirmedEvent;
/**
 * Published when appointment is cancelled
 * Subscribers: Patient Service, Doctor Service, Notification Service, Billing Service
 */
class AppointmentCancelledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, cancelledBy, cancellationType, reason, cancelledAt) {
        super("AppointmentCancelled", appointmentId, "Appointment", {
            patientId,
            doctorId,
            cancelledBy,
            cancellationType,
            reason,
            cancelledAt,
        }, 1, undefined, undefined, cancelledBy);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.cancelledBy = cancelledBy;
        this.cancellationType = cancellationType;
        this.reason = reason;
        this.cancelledAt = cancelledAt;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            doctorId: this.doctorId,
            cancelledBy: this.cancelledBy,
            cancellationType: this.cancellationType,
            reason: this.reason,
            cancelledAt: this.cancelledAt,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.AppointmentCancelledEvent = AppointmentCancelledEvent;
/**
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 */
class AppointmentCompletedEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, doctorId, completedAt, duration, notes, consultationFee) {
        super("AppointmentCompleted", appointmentId, "Appointment", {
            patientId,
            doctorId,
            completedAt,
            duration,
            notes,
            consultationFee,
        }, 1, undefined, undefined, doctorId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.completedAt = completedAt;
        this.duration = duration;
        this.notes = notes;
        this.consultationFee = consultationFee;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            doctorId: this.doctorId,
            completedAt: this.completedAt,
            duration: this.duration,
            notes: this.notes,
            consultationFee: this.consultationFee,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
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
        super("MedicalRecordCreated", recordId, "MedicalRecord", {
            recordIdCode,
            patientId,
            doctorId,
            appointmentId,
            visitDate,
            primaryDiagnosis,
            createdBy,
        }, 1, undefined, undefined, createdBy);
        this.recordId = recordId;
        this.recordIdCode = recordIdCode;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.appointmentId = appointmentId;
        this.visitDate = visitDate;
        this.primaryDiagnosis = primaryDiagnosis;
        this.createdBy = createdBy;
    }
    getEventData() {
        return {
            recordIdCode: this.recordIdCode,
            patientId: this.patientId,
            doctorId: this.doctorId,
            appointmentId: this.appointmentId,
            visitDate: this.visitDate,
            primaryDiagnosis: this.primaryDiagnosis,
            createdBy: this.createdBy,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.MedicalRecordCreatedEvent = MedicalRecordCreatedEvent;
/**
 * Published when prescription is created
 * Subscribers: Notification Service, Billing Service
 */
class PrescriptionCreatedEvent extends domain_event_1.DomainEvent {
    constructor(prescriptionId, prescriptionNumber, patientId, doctorId, medicationName, dosage, duration, prescribedBy) {
        super("PrescriptionCreated", prescriptionId, "Prescription", {
            prescriptionNumber,
            patientId,
            doctorId,
            medicationName,
            dosage,
            duration,
            prescribedBy,
        }, 1, undefined, undefined, prescribedBy);
        this.prescriptionId = prescriptionId;
        this.prescriptionNumber = prescriptionNumber;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.medicationName = medicationName;
        this.dosage = dosage;
        this.duration = duration;
        this.prescribedBy = prescribedBy;
    }
    getEventData() {
        return {
            prescriptionNumber: this.prescriptionNumber,
            patientId: this.patientId,
            doctorId: this.doctorId,
            medicationName: this.medicationName,
            dosage: this.dosage,
            duration: this.duration,
            prescribedBy: this.prescribedBy,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PrescriptionCreatedEvent = PrescriptionCreatedEvent;
/**
 * Published when lab results are ready
 * Subscribers: Notification Service, Patient Service
 */
class LabResultsReadyEvent extends domain_event_1.DomainEvent {
    constructor(labOrderId, patientId, doctorId, testName, hasAbnormalResults, resultDate) {
        super("LabResultsReady", labOrderId, "LabOrder", {
            patientId,
            doctorId,
            testName,
            hasAbnormalResults,
            resultDate,
        }, 1, undefined, undefined, doctorId);
        this.labOrderId = labOrderId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.testName = testName;
        this.hasAbnormalResults = hasAbnormalResults;
        this.resultDate = resultDate;
    }
    getEventData() {
        return {
            patientId: this.patientId,
            doctorId: this.doctorId,
            testName: this.testName,
            hasAbnormalResults: this.hasAbnormalResults,
            resultDate: this.resultDate,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
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
        super("InvoiceGenerated", invoiceId, "Invoice", {
            invoiceNumber,
            patientId,
            appointmentId,
            totalAmount,
            dueDate,
            invoiceDate,
        });
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
        this.invoiceDate = invoiceDate;
    }
    getEventData() {
        return {
            invoiceNumber: this.invoiceNumber,
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            totalAmount: this.totalAmount,
            dueDate: this.dueDate,
            invoiceDate: this.invoiceDate,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.InvoiceGeneratedEvent = InvoiceGeneratedEvent;
/**
 * Published when payment is received
 * Subscribers: Patient Service, Notification Service, Appointment Service
 */
class PaymentReceivedEvent extends domain_event_1.DomainEvent {
    constructor(paymentId, paymentNumber, invoiceId, patientId, amount, paymentMethod, paymentDate) {
        super("PaymentReceived", paymentId, "Payment", {
            paymentNumber,
            invoiceId,
            patientId,
            amount,
            paymentMethod,
            paymentDate,
        });
        this.paymentId = paymentId;
        this.paymentNumber = paymentNumber;
        this.invoiceId = invoiceId;
        this.patientId = patientId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentDate = paymentDate;
    }
    getEventData() {
        return {
            paymentNumber: this.paymentNumber,
            invoiceId: this.invoiceId,
            patientId: this.patientId,
            amount: this.amount,
            paymentMethod: this.paymentMethod,
            paymentDate: this.paymentDate,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.PaymentReceivedEvent = PaymentReceivedEvent;
/**
 * Published when invoice is overdue
 * Subscribers: Notification Service, Patient Service
 */
class InvoiceOverdueEvent extends domain_event_1.DomainEvent {
    constructor(invoiceId, invoiceNumber, patientId, totalAmount, dueDate, daysOverdue) {
        super("InvoiceOverdue", invoiceId, "Invoice", {
            invoiceNumber,
            patientId,
            totalAmount,
            dueDate,
            daysOverdue,
        });
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.patientId = patientId;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
        this.daysOverdue = daysOverdue;
    }
    getEventData() {
        return {
            invoiceNumber: this.invoiceNumber,
            patientId: this.patientId,
            totalAmount: this.totalAmount,
            dueDate: this.dueDate,
            daysOverdue: this.daysOverdue,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.InvoiceOverdueEvent = InvoiceOverdueEvent;
/**
 * Published when insurance claim is submitted
 * Subscribers: Notification Service, Patient Service
 */
class InsuranceClaimSubmittedEvent extends domain_event_1.DomainEvent {
    constructor(claimId, claimNumber, patientId, invoiceId, claimedAmount, insuranceProvider, submittedAt) {
        super("InsuranceClaimSubmitted", claimId, "InsuranceClaim", {
            claimNumber,
            patientId,
            invoiceId,
            claimedAmount,
            insuranceProvider,
            submittedAt,
        });
        this.claimId = claimId;
        this.claimNumber = claimNumber;
        this.patientId = patientId;
        this.invoiceId = invoiceId;
        this.claimedAmount = claimedAmount;
        this.insuranceProvider = insuranceProvider;
        this.submittedAt = submittedAt;
    }
    getEventData() {
        return {
            claimNumber: this.claimNumber,
            patientId: this.patientId,
            invoiceId: this.invoiceId,
            claimedAmount: this.claimedAmount,
            insuranceProvider: this.insuranceProvider,
            submittedAt: this.submittedAt,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.InsuranceClaimSubmittedEvent = InsuranceClaimSubmittedEvent;
/**
 * Published when insurance claim is approved/rejected
 * Subscribers: Notification Service, Patient Service, Billing Service
 */
class InsuranceClaimProcessedEvent extends domain_event_1.DomainEvent {
    constructor(claimId, claimNumber, patientId, status, approvedAmount, rejectedAmount, reason) {
        super("InsuranceClaimProcessed", claimId, "InsuranceClaim", {
            claimNumber,
            patientId,
            status,
            approvedAmount,
            rejectedAmount,
            reason,
        });
        this.claimId = claimId;
        this.claimNumber = claimNumber;
        this.patientId = patientId;
        this.status = status;
        this.approvedAmount = approvedAmount;
        this.rejectedAmount = rejectedAmount;
        this.reason = reason;
    }
    getEventData() {
        return {
            claimNumber: this.claimNumber,
            patientId: this.patientId,
            status: this.status,
            approvedAmount: this.approvedAmount,
            rejectedAmount: this.rejectedAmount,
            reason: this.reason,
        };
    }
    containsPHI() {
        return true;
    }
    getPatientId() {
        return this.patientId;
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
        super("NotificationSent", notificationId, "Notification", {
            userId,
            notificationType,
            channel,
            sentAt,
            success,
        });
        this.notificationId = notificationId;
        this.userId = userId;
        this.notificationType = notificationType;
        this.channel = channel;
        this.sentAt = sentAt;
        this.success = success;
    }
    getEventData() {
        return {
            userId: this.userId,
            notificationType: this.notificationType,
            channel: this.channel,
            sentAt: this.sentAt,
            success: this.success,
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
    }
}
exports.NotificationSentEvent = NotificationSentEvent;
/**
 * Published when notification delivery fails
 * Subscribers: Notification Service (for retry), Audit Service
 */
class NotificationFailedEvent extends domain_event_1.DomainEvent {
    constructor(notificationId, userId, channel, errorMessage, retryCount, failedAt) {
        super("NotificationFailed", notificationId, "Notification", {
            userId,
            channel,
            errorMessage,
            retryCount,
            failedAt,
        });
        this.notificationId = notificationId;
        this.userId = userId;
        this.channel = channel;
        this.errorMessage = errorMessage;
        this.retryCount = retryCount;
        this.failedAt = failedAt;
    }
    getEventData() {
        return {
            userId: this.userId,
            channel: this.channel,
            errorMessage: this.errorMessage,
            retryCount: this.retryCount,
            failedAt: this.failedAt,
        };
    }
    containsPHI() {
        return false;
    }
    getPatientId() {
        return null;
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
    AppointmentRescheduled: AppointmentRescheduledEvent,
    AppointmentCheckedIn: AppointmentCheckedInEvent,
    AppointmentStarted: AppointmentStartedEvent,
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