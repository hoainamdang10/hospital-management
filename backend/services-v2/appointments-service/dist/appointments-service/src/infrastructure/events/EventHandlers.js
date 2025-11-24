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
        const appointmentEvent = {
            eventId: event.eventId,
            eventType: "appointment.scheduled",
            appointmentId: event.appointmentId,
            patientId: event.patientId,
            doctorId: event.doctorId,
            appointmentDate: event.appointmentDate, // Keep as string (ISO format)
            appointmentTime: event.appointmentTime,
            durationMinutes: event.durationMinutes,
            type: event.type,
            priority: event.priority,
            status: event.status,
            roomId: event.roomId,
            departmentId: event.departmentId,
            consultationFee: event.consultationFee, // Billing reference only
            reason: event.reason,
            chiefComplaint: event.chiefComplaint,
            symptoms: event.symptoms,
            notes: event.notes,
            specialInstructions: event.specialInstructions,
            requiredEquipment: event.requiredEquipment,
            occurredAt: event.occurredAt,
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
        const patientEvent = {
            eventId: event.eventId,
            eventType: "patient.updated",
            patientId: event.patientId,
            updatedFields: event.updatedFields || [],
            newValues: {
                fullName: event.fullName,
                phone: event.phone,
                email: event.email,
                dateOfBirth: event.dateOfBirth
                    ? new Date(event.dateOfBirth)
                    : undefined,
                gender: event.gender,
                nationalId: event.nationalId,
                insuranceNumber: event.insuranceNumber,
                insuranceType: event.insuranceType,
                address: event.address,
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