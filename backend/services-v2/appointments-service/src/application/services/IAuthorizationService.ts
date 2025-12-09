/**
 * Authorization Service Interface
 * Handles RBAC (Role-Based Access Control) for appointments service
 */

export interface IAuthorizationService {
  /**
   * Check if user can schedule appointments
   * @param userId - User requesting the action
   * @param patientId - Patient for whom appointment is being scheduled
   * @returns true if authorized
   */
  canScheduleAppointment(userId: string, patientId: string): Promise<boolean>;

  /**
   * Check if user can cancel appointments
   * @param userId - User requesting the action
   * @param appointmentId - Appointment being cancelled
   * @param appointment - Appointment details (for ownership check)
   */
  canCancelAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can reschedule appointments
   */
  canRescheduleAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can confirm appointments
   */
  canConfirmAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can complete appointments (mark as completed)
   * Only DOCTOR/NURSE can complete appointments
   */
  canCompleteAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can start appointments
   * Only the assigned doctor can start, admin can override
   */
  canStartAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can check in appointments
   * Patient can check in their own, staff can check in any
   */
  canCheckInAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can call next patient from queue
   * Only doctors, nurses, and staff can call patients
   */
  canCallNextPatient(userId: string, doctorId: string): Promise<boolean>;

  /**
   * Check if user can remove patient from queue
   * Patient can leave their own queue, staff can remove any
   */
  canLeaveQueue(userId: string, patientId: string): Promise<boolean>;

  /**
   * Check if user can transfer appointments to another doctor
   * Only admin or the original doctor can transfer
   */
  canTransferAppointment(
    userId: string,
    appointmentId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  // ===== ARCHIVED FOR POST-MVP: BulkReschedule Authorization =====
  // /**
  //  * Check if user can bulk reschedule appointments
  //  * Only admin or the doctor whose appointments are being rescheduled
  //  */
  // canBulkReschedule(
  //   userId: string,
  //   doctorId: string
  // ): Promise<boolean>;

  /**
   * Check if user can create emergency appointments
   * Only doctor, nurse, or admin can create emergency appointments
   */
  canCreateEmergencyAppointment(userId: string): Promise<boolean>;

  /**
   * Check if user can view appointment history
   * Patient can view their own, doctor can view their own, admin can view any
   */
  canViewAppointmentHistory(
    userId: string,
    patientId?: string,
    doctorId?: string,
  ): Promise<boolean>;

  /**
   * Check if user can view appointment statistics
   * Only admin and doctors can view statistics
   */
  canViewStatistics(userId: string, doctorId?: string): Promise<boolean>;

  /**
   * Check if user can view appointment details
   */
  canViewAppointment(
    userId: string,
    appointment: { patientId: string; doctorId: string },
  ): Promise<boolean>;

  /**
   * Check if user can manage appointment reminders
   * Patient can manage their own reminders, Staff can manage any reminders
   */
  canManageAppointmentReminders(
    userId: string,
    patientId: string,
  ): Promise<boolean>;

  /**
   * Check if user can view queue status
   * Patient can view their own queue status, Doctor/Nurse/Staff can view any queue
   */
  canViewQueueStatus(
    userId: string,
    patientId?: string,
    doctorId?: string,
  ): Promise<boolean>;

  /**
   * Resolve canonical patientId (PAT-YYYYMM-XXX) from identity userId.
   * Returns null if user does not have a patient profile.
   */
  resolvePatientIdForUser(userId: string): Promise<string | null>;

  /**
   * Check if user has specific role
   */
  hasRole(userId: string, role: UserRole): Promise<boolean>;

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean>;

  /**
   * Get user's role
   */
  getUserRole(userId: string): Promise<UserRole | null>;
}

/**
 * User roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  NURSE = "NURSE",
  RECEPTIONIST = "RECEPTIONIST",
  PATIENT = "PATIENT",
}

/**
 * Authorization error
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly userId: string,
    public readonly action: string,
    public readonly resource?: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}
