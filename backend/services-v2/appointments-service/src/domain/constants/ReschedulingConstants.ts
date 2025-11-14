/**
 * Rescheduling Queue Constants
 * Type-safe constants for rescheduling workflow
 */

export const RESCHEDULING_STATUS = {
  PENDING_RESCHEDULE: 'PENDING_RESCHEDULE',
  SEARCHING_ALTERNATIVES: 'SEARCHING_ALTERNATIVES',
  NOTIFIED: 'NOTIFIED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED'
} as const;

export const RESCHEDULING_PRIORITY = {
  EMERGENCY: 'EMERGENCY',
  URGENT: 'URGENT',
  NORMAL: 'NORMAL',
  LOW: 'LOW'
} as const;

export const CONFLICT_REASONS = {
  STAFF_UNAVAILABLE: 'staff_unavailable',
  STAFF_SICK_LEAVE: 'staff_sick_leave',
  EMERGENCY_CASE: 'emergency_case',
  DOUBLE_BOOKING: 'double_booking',
  EQUIPMENT_UNAVAILABLE: 'equipment_unavailable',
  DEPARTMENT_CLOSED: 'department_closed',
  PATIENT_REQUEST: 'patient_request',
  SYSTEM_ERROR: 'system_error'
} as const;

export const RESCHEDULING_WORKFLOW = {
  DEFAULT_EXPIRY_HOURS: 168, // 7 days
  URGENT_EXPIRY_HOURS: 24,   // 1 day
  EMERGENCY_EXPIRY_HOURS: 4, // 4 hours
  MAX_RETRY_ATTEMPTS: 3,
  NOTIFICATION_RETRY_DELAY_MS: 5000
} as const;

// Type definitions
export type ReschedulingStatus = typeof RESCHEDULING_STATUS[keyof typeof RESCHEDULING_STATUS];
export type ReschedulingPriority = typeof RESCHEDULING_PRIORITY[keyof typeof RESCHEDULING_PRIORITY];
export type ConflictReason = typeof CONFLICT_REASONS[keyof typeof CONFLICT_REASONS];

// Status transition rules
export const VALID_STATUS_TRANSITIONS: Record<ReschedulingStatus, ReschedulingStatus[]> = {
  [RESCHEDULING_STATUS.PENDING_RESCHEDULE]: [
    RESCHEDULING_STATUS.SEARCHING_ALTERNATIVES,
    RESCHEDULING_STATUS.NOTIFIED,
    RESCHEDULING_STATUS.EXPIRED,
    RESCHEDULING_STATUS.REJECTED
  ],
  [RESCHEDULING_STATUS.SEARCHING_ALTERNATIVES]: [
    RESCHEDULING_STATUS.NOTIFIED,
    RESCHEDULING_STATUS.PENDING_RESCHEDULE,
    RESCHEDULING_STATUS.EXPIRED,
    RESCHEDULING_STATUS.REJECTED
  ],
  [RESCHEDULING_STATUS.NOTIFIED]: [
    RESCHEDULING_STATUS.ACCEPTED,
    RESCHEDULING_STATUS.REJECTED,
    RESCHEDULING_STATUS.EXPIRED
  ],
  [RESCHEDULING_STATUS.ACCEPTED]: [
    RESCHEDULING_STATUS.COMPLETED
  ],
  [RESCHEDULING_STATUS.REJECTED]: [
    RESCHEDULING_STATUS.COMPLETED
  ],
  [RESCHEDULING_STATUS.COMPLETED]: [], // Terminal state
  [RESCHEDULING_STATUS.EXPIRED]: []    // Terminal state
};

// Helper functions
export function isValidStatusTransition(
  currentStatus: ReschedulingStatus,
  newStatus: ReschedulingStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function getExpiryHoursForPriority(priority: ReschedulingPriority): number {
  switch (priority) {
    case RESCHEDULING_PRIORITY.EMERGENCY:
      return RESCHEDULING_WORKFLOW.EMERGENCY_EXPIRY_HOURS;
    case RESCHEDULING_PRIORITY.URGENT:
      return RESCHEDULING_WORKFLOW.URGENT_EXPIRY_HOURS;
    default:
      return RESCHEDULING_WORKFLOW.DEFAULT_EXPIRY_HOURS;
  }
}

export function isTerminalStatus(status: ReschedulingStatus): boolean {
  return status === RESCHEDULING_STATUS.COMPLETED || status === RESCHEDULING_STATUS.EXPIRED;
}

export function requiresNotification(status: ReschedulingStatus): boolean {
  return status === RESCHEDULING_STATUS.NOTIFIED || 
         status === RESCHEDULING_STATUS.ACCEPTED || 
         status === RESCHEDULING_STATUS.REJECTED;
}
