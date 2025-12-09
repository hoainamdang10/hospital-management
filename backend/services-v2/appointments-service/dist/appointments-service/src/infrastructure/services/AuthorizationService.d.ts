import { IAuthorizationService, UserRole } from "../../application/services/IAuthorizationService";
/**
 * Authorization Service Implementation
 * Uses Supabase to check user roles from identity service
 */
export declare class AuthorizationService implements IAuthorizationService {
    private supabase;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Schedule appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can schedule for anyone
     * - DOCTOR/NURSE: Can schedule for any patient
     * - PATIENT: Can only schedule for themselves
     */
    canScheduleAppointment(userId: string, patientId: string): Promise<boolean>;
    /**
     * Cancel appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can cancel any appointment
     * - DOCTOR: Can cancel their own appointments
     * - NURSE: Can cancel any appointment
     * - PATIENT: Can cancel their own appointments
     */
    canCancelAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Reschedule appointment authorization
     * Same rules as cancel
     */
    canRescheduleAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Confirm appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can confirm any appointment
     * - DOCTOR: Can confirm their own appointments
     * - PATIENT: Can confirm their own appointments
     */
    canConfirmAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Complete appointment authorization
     * Rules:
     * - Only DOCTOR/NURSE can complete appointments
     * - DOCTOR can only complete their own appointments
     */
    canCompleteAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Start appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can start any appointment (override)
     * - DOCTOR: Can only start their own appointments
     * - NURSE/PATIENT: Cannot start appointments
     */
    canStartAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Check in appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can check in any appointment
     * - DOCTOR: Cannot check in appointments
     * - PATIENT: Can check in their own appointments
     */
    canCheckInAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Call next patient authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can call any patient
     * - DOCTOR: Can only call from their own queue
     * - PATIENT: Cannot call patients
     */
    canCallNextPatient(userId: string, doctorId: string): Promise<boolean>;
    /**
     * Leave queue authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can remove any patient from queue
     * - DOCTOR: Cannot remove patients from queue
     * - PATIENT: Can only leave their own queue
     */
    canLeaveQueue(userId: string, patientId: string): Promise<boolean>;
    /**
     * Transfer appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can transfer any appointment
     * - DOCTOR: Can only transfer their own appointments
     * - NURSE/PATIENT: Cannot transfer appointments
     */
    canTransferAppointment(userId: string, appointmentId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Create emergency appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/DOCTOR/NURSE: Can create emergency appointments
     * - PATIENT: Cannot create emergency appointments
     */
    canCreateEmergencyAppointment(userId: string): Promise<boolean>;
    /**
     * View appointment history authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can view any history
     * - DOCTOR: Can view history for their own appointments
     * - PATIENT: Can view their own history
     * - NURSE: Can view all history
     */
    canViewAppointmentHistory(userId: string, patientId?: string, doctorId?: string): Promise<boolean>;
    /**
     * View appointment statistics authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can view any statistics
     * - DOCTOR: Can view statistics for their own appointments
     * - NURSE/PATIENT: Cannot view statistics
     */
    canViewStatistics(userId: string, doctorId?: string): Promise<boolean>;
    /**
     * View appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can view all appointments
     * - DOCTOR: Can view their own appointments
     * - PATIENT: Can view their own appointments
     */
    canViewAppointment(userId: string, appointment: {
        patientId: string;
        doctorId: string;
    }): Promise<boolean>;
    /**
     * Manage appointment reminders authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can manage any reminders
     * - DOCTOR: Can manage reminders for their appointments
     * - PATIENT: Can only manage their own reminders
     */
    canManageAppointmentReminders(userId: string, patientId: string): Promise<boolean>;
    /**
     * Check if user can view queue status
     * Patient can view their own queue, Staff can view any queue
     */
    canViewQueueStatus(userId: string, patientId?: string, doctorId?: string): Promise<boolean>;
    /**
     * Public helper to resolve canonical patientId for a given identity user.
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
     * Get user's role from database
     * Caches result for performance
     */
    getUserRole(userId: string): Promise<UserRole | null>;
    /**
     * Resolve user UUID to patient business ID (PAT-XXXXXX-XXX)
     */
    private resolveUserIdToPatientId;
    /**
     * Resolve user UUID to doctor business ID (DEPT-DOC-XXXXXX-XXX)
     */
    private resolveUserIdToDoctorId;
}
//# sourceMappingURL=AuthorizationService.d.ts.map