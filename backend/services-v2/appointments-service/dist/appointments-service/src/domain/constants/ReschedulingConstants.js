"use strict";
/**
 * Rescheduling Queue Constants
 * Type-safe constants for rescheduling workflow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS_TRANSITIONS = exports.RESCHEDULING_WORKFLOW = exports.CONFLICT_REASONS = exports.RESCHEDULING_PRIORITY = exports.RESCHEDULING_STATUS = void 0;
exports.isValidStatusTransition = isValidStatusTransition;
exports.getExpiryHoursForPriority = getExpiryHoursForPriority;
exports.isTerminalStatus = isTerminalStatus;
exports.requiresNotification = requiresNotification;
exports.RESCHEDULING_STATUS = {
    PENDING_RESCHEDULE: 'PENDING_RESCHEDULE',
    SEARCHING_ALTERNATIVES: 'SEARCHING_ALTERNATIVES',
    NOTIFIED: 'NOTIFIED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED'
};
exports.RESCHEDULING_PRIORITY = {
    EMERGENCY: 'EMERGENCY',
    URGENT: 'URGENT',
    NORMAL: 'NORMAL',
    LOW: 'LOW'
};
exports.CONFLICT_REASONS = {
    STAFF_UNAVAILABLE: 'staff_unavailable',
    STAFF_SICK_LEAVE: 'staff_sick_leave',
    EMERGENCY_CASE: 'emergency_case',
    DOUBLE_BOOKING: 'double_booking',
    EQUIPMENT_UNAVAILABLE: 'equipment_unavailable',
    DEPARTMENT_CLOSED: 'department_closed',
    PATIENT_REQUEST: 'patient_request',
    SYSTEM_ERROR: 'system_error'
};
exports.RESCHEDULING_WORKFLOW = {
    DEFAULT_EXPIRY_HOURS: 168, // 7 days
    URGENT_EXPIRY_HOURS: 24, // 1 day
    EMERGENCY_EXPIRY_HOURS: 4, // 4 hours
    MAX_RETRY_ATTEMPTS: 3,
    NOTIFICATION_RETRY_DELAY_MS: 5000
};
// Status transition rules
exports.VALID_STATUS_TRANSITIONS = {
    [exports.RESCHEDULING_STATUS.PENDING_RESCHEDULE]: [
        exports.RESCHEDULING_STATUS.SEARCHING_ALTERNATIVES,
        exports.RESCHEDULING_STATUS.NOTIFIED,
        exports.RESCHEDULING_STATUS.EXPIRED,
        exports.RESCHEDULING_STATUS.REJECTED
    ],
    [exports.RESCHEDULING_STATUS.SEARCHING_ALTERNATIVES]: [
        exports.RESCHEDULING_STATUS.NOTIFIED,
        exports.RESCHEDULING_STATUS.PENDING_RESCHEDULE,
        exports.RESCHEDULING_STATUS.EXPIRED,
        exports.RESCHEDULING_STATUS.REJECTED
    ],
    [exports.RESCHEDULING_STATUS.NOTIFIED]: [
        exports.RESCHEDULING_STATUS.ACCEPTED,
        exports.RESCHEDULING_STATUS.REJECTED,
        exports.RESCHEDULING_STATUS.EXPIRED
    ],
    [exports.RESCHEDULING_STATUS.ACCEPTED]: [
        exports.RESCHEDULING_STATUS.COMPLETED
    ],
    [exports.RESCHEDULING_STATUS.REJECTED]: [
        exports.RESCHEDULING_STATUS.COMPLETED
    ],
    [exports.RESCHEDULING_STATUS.COMPLETED]: [], // Terminal state
    [exports.RESCHEDULING_STATUS.EXPIRED]: [] // Terminal state
};
// Helper functions
function isValidStatusTransition(currentStatus, newStatus) {
    return exports.VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}
function getExpiryHoursForPriority(priority) {
    switch (priority) {
        case exports.RESCHEDULING_PRIORITY.EMERGENCY:
            return exports.RESCHEDULING_WORKFLOW.EMERGENCY_EXPIRY_HOURS;
        case exports.RESCHEDULING_PRIORITY.URGENT:
            return exports.RESCHEDULING_WORKFLOW.URGENT_EXPIRY_HOURS;
        default:
            return exports.RESCHEDULING_WORKFLOW.DEFAULT_EXPIRY_HOURS;
    }
}
function isTerminalStatus(status) {
    return status === exports.RESCHEDULING_STATUS.COMPLETED || status === exports.RESCHEDULING_STATUS.EXPIRED;
}
function requiresNotification(status) {
    return status === exports.RESCHEDULING_STATUS.NOTIFIED ||
        status === exports.RESCHEDULING_STATUS.ACCEPTED ||
        status === exports.RESCHEDULING_STATUS.REJECTED;
}
//# sourceMappingURL=ReschedulingConstants.js.map