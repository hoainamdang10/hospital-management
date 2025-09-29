"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.EventType = exports.NotificationType = exports.PaymentStatus = exports.AppointmentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["DOCTOR"] = "doctor";
    UserRole["PATIENT"] = "patient";
    UserRole["RECEPTIONIST"] = "receptionist";
})(UserRole || (exports.UserRole = UserRole = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "scheduled";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["IN_PROGRESS"] = "in_progress";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
    PaymentStatus["CANCELLED"] = "cancelled";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "email";
    NotificationType["SMS"] = "sms";
    NotificationType["PUSH"] = "push";
    NotificationType["IN_APP"] = "in_app";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var EventType;
(function (EventType) {
    EventType["USER_CREATED"] = "user.created";
    EventType["USER_UPDATED"] = "user.updated";
    EventType["USER_DELETED"] = "user.deleted";
    EventType["USER_LOGIN"] = "user.login";
    EventType["USER_LOGOUT"] = "user.logout";
    EventType["DOCTOR_CREATED"] = "doctor.created";
    EventType["DOCTOR_UPDATED"] = "doctor.updated";
    EventType["DOCTOR_SCHEDULE_UPDATED"] = "doctor.schedule_updated";
    EventType["PATIENT_CREATED"] = "patient.created";
    EventType["PATIENT_UPDATED"] = "patient.updated";
    EventType["APPOINTMENT_CREATED"] = "appointment.created";
    EventType["APPOINTMENT_UPDATED"] = "appointment.updated";
    EventType["APPOINTMENT_CANCELLED"] = "appointment.cancelled";
    EventType["APPOINTMENT_COMPLETED"] = "appointment.completed";
    EventType["PAYMENT_CREATED"] = "payment.created";
    EventType["PAYMENT_COMPLETED"] = "payment.completed";
    EventType["PAYMENT_FAILED"] = "payment.failed";
    EventType["NOTIFICATION_SENT"] = "notification.sent";
    EventType["NOTIFICATION_FAILED"] = "notification.failed";
})(EventType || (exports.EventType = EventType = {}));
class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message = "Forbidden") {
        super(message);
        this.name = "ForbiddenError";
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "ConflictError";
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=common.types.js.map