/**
 * Rescheduling Queue Constants
 * Type-safe constants for rescheduling workflow
 */
export declare const RESCHEDULING_STATUS: {
    readonly PENDING_RESCHEDULE: "PENDING_RESCHEDULE";
    readonly SEARCHING_ALTERNATIVES: "SEARCHING_ALTERNATIVES";
    readonly NOTIFIED: "NOTIFIED";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly COMPLETED: "COMPLETED";
    readonly EXPIRED: "EXPIRED";
};
export declare const RESCHEDULING_PRIORITY: {
    readonly EMERGENCY: "EMERGENCY";
    readonly URGENT: "URGENT";
    readonly NORMAL: "NORMAL";
    readonly LOW: "LOW";
};
export declare const CONFLICT_REASONS: {
    readonly STAFF_UNAVAILABLE: "staff_unavailable";
    readonly STAFF_SICK_LEAVE: "staff_sick_leave";
    readonly EMERGENCY_CASE: "emergency_case";
    readonly DOUBLE_BOOKING: "double_booking";
    readonly EQUIPMENT_UNAVAILABLE: "equipment_unavailable";
    readonly DEPARTMENT_CLOSED: "department_closed";
    readonly PATIENT_REQUEST: "patient_request";
    readonly SYSTEM_ERROR: "system_error";
};
export declare const RESCHEDULING_WORKFLOW: {
    readonly DEFAULT_EXPIRY_HOURS: 168;
    readonly URGENT_EXPIRY_HOURS: 24;
    readonly EMERGENCY_EXPIRY_HOURS: 4;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly NOTIFICATION_RETRY_DELAY_MS: 5000;
};
export type ReschedulingStatus = typeof RESCHEDULING_STATUS[keyof typeof RESCHEDULING_STATUS];
export type ReschedulingPriority = typeof RESCHEDULING_PRIORITY[keyof typeof RESCHEDULING_PRIORITY];
export type ConflictReason = typeof CONFLICT_REASONS[keyof typeof CONFLICT_REASONS];
export declare const VALID_STATUS_TRANSITIONS: Record<ReschedulingStatus, ReschedulingStatus[]>;
export declare function isValidStatusTransition(currentStatus: ReschedulingStatus, newStatus: ReschedulingStatus): boolean;
export declare function getExpiryHoursForPriority(priority: ReschedulingPriority): number;
export declare function isTerminalStatus(status: ReschedulingStatus): boolean;
export declare function requiresNotification(status: ReschedulingStatus): boolean;
//# sourceMappingURL=ReschedulingConstants.d.ts.map