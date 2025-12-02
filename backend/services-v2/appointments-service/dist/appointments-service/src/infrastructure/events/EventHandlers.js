"use strict";
/**
 * Event Handlers Wrapper
 * Wraps AppointmentReadModelEventHandler to implement EventHandler interface
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentNoShowEventHandler = exports.AppointmentCompletedEventHandler = exports.AppointmentConfirmedEventHandler = exports.AppointmentCancelledEventHandler = exports.AppointmentRescheduledEventHandler = exports.AppointmentStatusChangedEventHandler = exports.DoctorUpdatedEventHandler = exports.PatientUpdatedEventHandler = exports.AppointmentScheduledEventHandler = void 0;
/**
 * Appointment Scheduled Event Handler
 */
class AppointmentScheduledEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        const raw = event;
        const containers = [
            raw,
            raw.payload,
            raw.eventData,
            raw.payload?.eventData,
            raw.data,
        ];
        const pick = (field) => {
            for (const source of containers) {
                if (source && source[field] !== undefined && source[field] !== null) {
                    return source[field];
                }
            }
            return undefined;
        };
        const appointmentEvent = {
            eventId: event.eventId,
            eventType: "appointment.scheduled",
            appointmentId: pick("appointmentId"),
            patientId: pick("patientId"),
            doctorId: pick("doctorId"),
            appointmentDate: pick("appointmentDate"),
            appointmentTime: pick("appointmentTime"),
            durationMinutes: pick("durationMinutes"),
            type: pick("type"),
            priority: pick("priority"),
            status: pick("status"),
            roomId: pick("roomId"),
            departmentId: pick("departmentId"),
            consultationFee: pick("consultationFee"),
            reason: pick("reason"),
            chiefComplaint: pick("chiefComplaint"),
            symptoms: pick("symptoms"),
            notes: pick("notes"),
            specialInstructions: pick("specialInstructions"),
            requiredEquipment: pick("requiredEquipment"),
            occurredAt: raw.occurredAt || event.occurredAt,
            rawEvent: raw,
            payload: raw.payload,
            eventData: raw.eventData || raw.payload?.eventData,
            data: raw.data,
        };
        await this.readModelHandler.handleAppointmentScheduled(appointmentEvent);
    }
}
exports.AppointmentScheduledEventHandler = AppointmentScheduledEventHandler;
/**
 * Patient Updated Event Handler
 */
class PatientUpdatedEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        const raw = event;
        const payload = raw.payload || raw.data || raw.newValues || raw || {};
        const personalInfo = payload.personalInfo || raw.personalInfo || {};
        const contactInfo = payload.contactInfo || raw.contactInfo || {};
        const insurance = payload.insurance ||
            payload.insuranceInfo ||
            raw.insurance ||
            raw.insuranceInfo ||
            {};
        const parseDateValue = (value) => {
            if (!value) {
                return undefined;
            }
            const normalized = value instanceof Date ? value : new Date(value);
            return Number.isNaN(normalized.getTime()) ? undefined : normalized;
        };
        const resolveFullName = () => {
            const direct = raw.fullName ||
                payload.fullName ||
                raw.newValues?.fullName ||
                personalInfo.fullName;
            if (direct) {
                return direct;
            }
            const fallbackPieces = [
                payload.firstName || raw.firstName,
                payload.lastName || raw.lastName,
            ].filter(Boolean);
            return fallbackPieces.length > 0 ? fallbackPieces.join(" ") : undefined;
        };
        const resolvePhone = () => {
            return (raw.phone ||
                raw.newValues?.phone ||
                payload.phone ||
                contactInfo.primaryPhone ||
                contactInfo.phone);
        };
        const resolveEmail = () => {
            return (raw.email || raw.newValues?.email || payload.email || contactInfo.email);
        };
        const resolveNationalId = () => {
            return (raw.nationalId ||
                raw.newValues?.nationalId ||
                payload.nationalId ||
                personalInfo.nationalId);
        };
        const resolveGender = () => {
            return (raw.gender ||
                raw.newValues?.gender ||
                payload.gender ||
                personalInfo.gender);
        };
        const resolveInsuranceNumber = () => {
            return (raw.insuranceNumber ||
                raw.newValues?.insuranceNumber ||
                payload.insuranceNumber ||
                insurance.policyNumber ||
                insurance.bhytNumber);
        };
        const resolveInsuranceType = () => {
            return (raw.insuranceType ||
                raw.newValues?.insuranceType ||
                payload.insuranceType ||
                insurance.coverageType ||
                insurance.type);
        };
        const resolveAddress = () => {
            return (raw.address ||
                raw.newValues?.address ||
                payload.address ||
                contactInfo.address);
        };
        const resolveDateOfBirth = () => {
            return (parseDateValue(raw.dateOfBirth ||
                raw.newValues?.dateOfBirth ||
                payload.dateOfBirth ||
                personalInfo.dateOfBirth) || undefined);
        };
        const patientId = raw.patientId ||
            payload.patientId ||
            raw.aggregateId ||
            event.aggregateId;
        const patientEvent = {
            eventId: event.eventId,
            eventType: "patient.updated",
            patientId,
            updatedFields: raw.updatedFields || payload.updatedFields || [],
            newValues: {
                fullName: resolveFullName(),
                phone: resolvePhone(),
                email: resolveEmail(),
                dateOfBirth: resolveDateOfBirth(),
                gender: resolveGender(),
                nationalId: resolveNationalId(),
                insuranceNumber: resolveInsuranceNumber(),
                insuranceType: resolveInsuranceType(),
                address: resolveAddress(),
            },
            occurredAt: event.occurredAt,
        };
        await this.readModelHandler.handlePatientUpdated(patientEvent);
    }
}
exports.PatientUpdatedEventHandler = PatientUpdatedEventHandler;
/**
 * Doctor Updated Event Handler
 */
class DoctorUpdatedEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        const doctorEvent = {
            eventId: event.eventId,
            eventType: "staff.updated",
            staffId: event.staffId || event.providerId,
            staffType: event.staffType || "doctor",
            updatedFields: event.updatedFields || [],
            newValues: {
                fullName: event.fullName,
                specialization: event.specialization,
                department: event.department,
                licenseNumber: event.licenseNumber,
                phone: event.phone,
                email: event.email,
            },
            occurredAt: event.occurredAt,
        };
        await this.readModelHandler.handleDoctorUpdated(doctorEvent);
    }
}
exports.DoctorUpdatedEventHandler = DoctorUpdatedEventHandler;
/**
 * Appointment Status Changed Event Handler
 */
class AppointmentStatusChangedEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        await this.readModelHandler.handleAppointmentStatusChanged({
            appointmentId: event.appointmentId,
            newStatus: event.newStatus || event.status,
        });
    }
}
exports.AppointmentStatusChangedEventHandler = AppointmentStatusChangedEventHandler;
/**
 * Appointment Rescheduled Event Handler
 */
class AppointmentRescheduledEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        const payload = {
            eventId: event.eventId,
            eventType: "appointment.rescheduled",
            appointmentId: event.appointmentId,
            patientId: event.patientId,
            doctorId: event.doctorId,
            newStartTime: event.newStartTime ||
                event.newAppointmentTime ||
                event.newStart,
            newEndTime: event.newEndTime ||
                event.newEnd ||
                event.newAppointmentEndTime,
            rescheduleReason: event.rescheduleReason,
            rescheduledBy: event.rescheduledBy,
            occurredAt: event.occurredAt,
        };
        await this.readModelHandler.handleAppointmentRescheduled(payload);
    }
}
exports.AppointmentRescheduledEventHandler = AppointmentRescheduledEventHandler;
/**
 * Appointment Cancelled Event Handler
 */
class AppointmentCancelledEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        await this.readModelHandler.handleAppointmentCancelled({
            appointmentId: event.appointmentId,
        });
    }
}
exports.AppointmentCancelledEventHandler = AppointmentCancelledEventHandler;
/**
 * Appointment Confirmed Event Handler
 */
class AppointmentConfirmedEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        await this.readModelHandler.handleAppointmentConfirmed({
            appointmentId: event.appointmentId,
        });
    }
}
exports.AppointmentConfirmedEventHandler = AppointmentConfirmedEventHandler;
/**
 * Appointment Completed Event Handler
 */
class AppointmentCompletedEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        await this.readModelHandler.handleAppointmentCompleted({
            appointmentId: event.appointmentId,
        });
    }
}
exports.AppointmentCompletedEventHandler = AppointmentCompletedEventHandler;
/**
 * Appointment No-Show Event Handler
 */
class AppointmentNoShowEventHandler {
    constructor(readModelHandler) {
        this.readModelHandler = readModelHandler;
    }
    async handle(event) {
        await this.readModelHandler.handleAppointmentNoShow({
            appointmentId: event.appointmentId,
        });
    }
}
exports.AppointmentNoShowEventHandler = AppointmentNoShowEventHandler;
//# sourceMappingURL=EventHandlers.js.map