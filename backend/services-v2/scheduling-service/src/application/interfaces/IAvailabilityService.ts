/**
 * Availability Service Interface - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Provider availability checking and management
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

/**
 * Availability Service Interface
 * Defines contract for provider availability operations
 */
export interface IAvailabilityService {
  /**
   * Check if a provider is available for a specific time slot
   */
  checkAvailability(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean>;

  /**
   * Get provider's schedule for a specific date
   */
  getProviderSchedule(
    providerId: string,
    date: Date
  ): Promise<ProviderSchedule>;

  /**
   * Get all providers in a department
   */
  getDepartmentProviders(departmentCode: string): Promise<ProviderInfo[]>;

  /**
   * Get all active providers
   */
  getAllProviders(): Promise<ProviderInfo[]>;

  /**
   * Get available time slots for a provider
   */
  getAvailableSlots(
    providerId: string,
    date: Date,
    duration?: number
  ): Promise<TimeSlotInfo[]>;

  /**
   * Get available time slots for a department
   */
  getDepartmentAvailableSlots(
    departmentCode: string,
    date: Date,
    duration?: number
  ): Promise<TimeSlotInfo[]>;

  /**
   * Block time slots for maintenance or other purposes
   */
  blockTimeSlots(
    providerId: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    blockedBy: string
  ): Promise<void>;

  /**
   * Unblock previously blocked time slots
   */
  unblockTimeSlots(
    providerId: string,
    startTime: Date,
    endTime: Date,
    unblockedBy: string
  ): Promise<void>;

  /**
   * Get provider's working hours for a specific date
   */
  getWorkingHours(
    providerId: string,
    date: Date
  ): Promise<WorkingHours>;

  /**
   * Update provider's working hours
   */
  updateWorkingHours(
    providerId: string,
    workingHours: WorkingHours,
    updatedBy: string
  ): Promise<void>;

  /**
   * Get provider's break times
   */
  getBreakTimes(
    providerId: string,
    date: Date
  ): Promise<BreakTime[]>;

  /**
   * Add break time for a provider
   */
  addBreakTime(
    providerId: string,
    breakTime: BreakTime,
    addedBy: string
  ): Promise<void>;

  /**
   * Remove break time for a provider
   */
  removeBreakTime(
    providerId: string,
    breakTimeId: string,
    removedBy: string
  ): Promise<void>;

  /**
   * Check for scheduling conflicts
   */
  checkConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictInfo[]>;

  /**
   * Get next available appointment slot
   */
  getNextAvailableSlot(
    providerId: string,
    fromDate: Date,
    duration: number
  ): Promise<TimeSlotInfo | null>;

  /**
   * Get alternative providers for a time slot
   */
  getAlternativeProviders(
    departmentCode: string,
    startTime: Date,
    endTime: Date,
    excludeProviderId?: string
  ): Promise<ProviderInfo[]>;
}

/**
 * Provider Schedule Information
 */
export interface ProviderSchedule {
  providerId: string;
  providerName: string;
  department: string;
  departmentCode: string;
  date: Date;
  workingHours: WorkingHours;
  breakTimes: BreakTime[];
  blockedSlots: BlockedSlot[];
  roomId?: string;
  roomName?: string;
  isActive: boolean;
  specialNotes?: string;
}

/**
 * Provider Information
 */
export interface ProviderInfo {
  id: string;
  name: string;
  department: string;
  departmentCode: string;
  specialization?: string;
  licenseNumber?: string;
  isActive: boolean;
  phone?: string;
  email?: string;
}

/**
 * Time Slot Information
 */
export interface TimeSlotInfo {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  providerId: string;
  providerName: string;
  department: string;
  roomId?: string;
  roomName?: string;
  isAvailable: boolean;
  conflictReason?: string;
}

/**
 * Working Hours
 */
export interface WorkingHours {
  start: number; // Hour (0-23)
  end: number; // Hour (0-23)
  startMinute?: number; // Minute (0-59)
  endMinute?: number; // Minute (0-59)
  dayOfWeek?: number; // 0 = Sunday, 1 = Monday, etc.
  isWorkingDay: boolean;
  lunchBreak?: {
    start: number; // Hour
    end: number; // Hour
    startMinute?: number;
    endMinute?: number;
  };
}

/**
 * Break Time
 */
export interface BreakTime {
  id?: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  type: 'lunch' | 'meeting' | 'personal' | 'emergency' | 'other';
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  createdBy: string;
  createdAt: Date;
}

/**
 * Blocked Slot
 */
export interface BlockedSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  type: 'maintenance' | 'training' | 'meeting' | 'personal' | 'other';
  blockedBy: string;
  blockedAt: Date;
  isActive: boolean;
}

/**
 * Recurring Pattern
 */
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly pattern
  dayOfMonth?: number; // For monthly pattern
  endDate?: Date;
  maxOccurrences?: number;
}

/**
 * Conflict Information
 */
export interface ConflictInfo {
  conflictType: 'appointment' | 'break' | 'blocked' | 'outside_hours';
  startTime: Date;
  endTime: Date;
  reason: string;
  appointmentId?: string;
  breakTimeId?: string;
  blockedSlotId?: string;
}

/**
 * Availability Query Options
 */
export interface AvailabilityQueryOptions {
  includePastSlots?: boolean;
  includeBlockedSlots?: boolean;
  includeBreakTimes?: boolean;
  minDuration?: number; // Minimum slot duration in minutes
  maxDuration?: number; // Maximum slot duration in minutes
  preferredTimes?: PreferredTime[];
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
}

/**
 * Preferred Time
 */
export interface PreferredTime {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startHour: number;
  endHour: number;
  priority: number; // Higher number = higher priority
}
