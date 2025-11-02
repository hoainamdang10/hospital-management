"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const IAuthorizationService_1 = require("../../application/services/IAuthorizationService");
/**
 * Authorization Service Implementation
 * Uses Supabase to check user roles from identity service
 */
class AuthorizationService {
    constructor(supabaseUrl, supabaseKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
        });
    }
    /**
     * Schedule appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can schedule for anyone
     * - DOCTOR/NURSE: Can schedule for any patient
     * - PATIENT: Can only schedule for themselves
     */
    async canScheduleAppointment(userId, patientId) {
        console.log('[AuthorizationService] Checking canScheduleAppointment:', { userId, patientId });
        const role = await this.getUserRole(userId);
        console.log('[AuthorizationService] User role:', role);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'schedule_appointment', patientId);
        }
        // Admins and staff can schedule for anyone
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.DOCTOR ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            console.log('[AuthorizationService] Staff user - authorized');
            return true;
        }
        // Patients can only schedule for themselves
        // Need to resolve userId to patientId business code
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            const isAuthorized = userPatientId === patientId;
            console.log('[AuthorizationService] Patient check:', { userId, userPatientId, patientId, isAuthorized });
            return isAuthorized;
        }
        console.log('[AuthorizationService] No matching role - denied');
        return false;
    }
    /**
     * Cancel appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can cancel any appointment
     * - DOCTOR: Can cancel their own appointments
     * - NURSE: Can cancel any appointment
     * - PATIENT: Can cancel their own appointments
     */
    async canCancelAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'cancel_appointment', appointmentId);
        }
        // Admins can cancel any appointment
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN) {
            return true;
        }
        // Nurses can cancel any appointment
        if (role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Doctors can cancel their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Patients can cancel their own appointments
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === appointment.patientId;
        }
        return false;
    }
    /**
     * Reschedule appointment authorization
     * Same rules as cancel
     */
    async canRescheduleAppointment(userId, appointmentId, appointment) {
        return this.canCancelAppointment(userId, appointmentId, appointment);
    }
    /**
     * Confirm appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can confirm any appointment
     * - DOCTOR: Can confirm their own appointments
     * - PATIENT: Can confirm their own appointments
     */
    async canConfirmAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'confirm_appointment', appointmentId);
        }
        // Admins and nurses can confirm any appointment
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Doctors can confirm their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Patients can confirm their own appointments
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === appointment.patientId;
        }
        return false;
    }
    /**
     * Complete appointment authorization
     * Rules:
     * - Only DOCTOR/NURSE can complete appointments
     * - DOCTOR can only complete their own appointments
     */
    async canCompleteAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'complete_appointment', appointmentId);
        }
        // Nurses can complete any appointment
        if (role === IAuthorizationService_1.UserRole.NURSE || role === IAuthorizationService_1.UserRole.ADMIN || role === IAuthorizationService_1.UserRole.SUPER_ADMIN) {
            return true;
        }
        // Doctors can only complete their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Patients cannot complete appointments
        return false;
    }
    /**
     * Start appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can start any appointment (override)
     * - DOCTOR: Can only start their own appointments
     * - NURSE/PATIENT: Cannot start appointments
     */
    async canStartAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'start_appointment', appointmentId);
        }
        // Admins can start any appointment (override)
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN) {
            return true;
        }
        // Doctors can only start their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Nurses and patients cannot start appointments
        return false;
    }
    /**
     * Check in appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can check in any appointment
     * - DOCTOR: Cannot check in appointments
     * - PATIENT: Can check in their own appointments
     */
    async canCheckInAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'checkin_appointment', appointmentId);
        }
        // Admins and nurses can check in any appointment
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN || role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Patients can check in their own appointments
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === appointment.patientId;
        }
        // Doctors cannot check in appointments
        return false;
    }
    /**
     * Call next patient authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can call any patient
     * - DOCTOR: Can only call from their own queue
     * - PATIENT: Cannot call patients
     */
    async canCallNextPatient(userId, doctorId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'call_next_patient', doctorId);
        }
        // Admins, nurses, and receptionists can call from any queue
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN || role === IAuthorizationService_1.UserRole.NURSE || role === IAuthorizationService_1.UserRole.RECEPTIONIST) {
            return true;
        }
        // Doctors can only call from their own queue
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === doctorId;
        }
        // Patients cannot call patients
        return false;
    }
    /**
     * Leave queue authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can remove any patient from queue
     * - DOCTOR: Cannot remove patients from queue
     * - PATIENT: Can only leave their own queue
     */
    async canLeaveQueue(userId, patientId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'leave_queue', patientId);
        }
        // Admins, nurses, and receptionists can remove any patient from queue
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN || role === IAuthorizationService_1.UserRole.NURSE || role === IAuthorizationService_1.UserRole.RECEPTIONIST) {
            return true;
        }
        // Patients can only leave their own queue
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === patientId;
        }
        // Doctors cannot remove patients from queue
        return false;
    }
    /**
     * Transfer appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can transfer any appointment
     * - DOCTOR: Can only transfer their own appointments
     * - NURSE/PATIENT: Cannot transfer appointments
     */
    async canTransferAppointment(userId, appointmentId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'transfer_appointment', appointmentId);
        }
        // Admins can transfer any appointment
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN) {
            return true;
        }
        // Doctors can only transfer their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Nurses and patients cannot transfer appointments
        return false;
    }
    /**
     * Bulk reschedule authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can bulk reschedule any doctor's appointments
     * - DOCTOR: Can only bulk reschedule their own appointments
     * - NURSE/PATIENT: Cannot bulk reschedule
     */
    async canBulkReschedule(userId, doctorId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'bulk_reschedule', doctorId);
        }
        // Admins can bulk reschedule any doctor's appointments
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN) {
            return true;
        }
        // Doctors can only bulk reschedule their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === doctorId;
        }
        // Nurses and patients cannot bulk reschedule
        return false;
    }
    /**
     * Create emergency appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/DOCTOR/NURSE: Can create emergency appointments
     * - PATIENT: Cannot create emergency appointments
     */
    async canCreateEmergencyAppointment(userId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            throw new IAuthorizationService_1.AuthorizationError('User not found or has no role', userId, 'create_emergency_appointment', 'emergency');
        }
        // Admins, doctors, and nurses can create emergency appointments
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.DOCTOR ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Patients cannot create emergency appointments
        return false;
    }
    /**
     * View appointment history authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can view any history
     * - DOCTOR: Can view history for their own appointments
     * - PATIENT: Can view their own history
     * - NURSE: Can view all history
     */
    async canViewAppointmentHistory(userId, patientId, doctorId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            return false;
        }
        // Admins and nurses can view all history
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Doctors can view history for their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            if (!doctorId)
                return false;
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === doctorId;
        }
        // Patients can view their own history
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            if (!patientId)
                return false;
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === patientId;
        }
        return false;
    }
    /**
     * View appointment statistics authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN: Can view any statistics
     * - DOCTOR: Can view statistics for their own appointments
     * - NURSE/PATIENT: Cannot view statistics
     */
    async canViewStatistics(userId, doctorId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            return false;
        }
        // Admins can view all statistics
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN || role === IAuthorizationService_1.UserRole.ADMIN) {
            return true;
        }
        // Doctors can view statistics for their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            if (!doctorId)
                return true; // Can view own stats if no doctorId specified
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === doctorId;
        }
        // Nurses and patients cannot view statistics
        return false;
    }
    /**
     * View appointment authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can view all appointments
     * - DOCTOR: Can view their own appointments
     * - PATIENT: Can view their own appointments
     */
    async canViewAppointment(userId, appointment) {
        const role = await this.getUserRole(userId);
        if (!role) {
            return false;
        }
        // Admins and nurses can view all appointments
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Doctors can view their own appointments
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            const userDoctorId = await this.resolveUserIdToDoctorId(userId);
            return userDoctorId === appointment.doctorId;
        }
        // Patients can view their own appointments
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === appointment.patientId;
        }
        return false;
    }
    /**
     * Manage appointment reminders authorization
     * Rules:
     * - SUPER_ADMIN/ADMIN/NURSE: Can manage any reminders
     * - DOCTOR: Can manage reminders for their appointments
     * - PATIENT: Can only manage their own reminders
     */
    async canManageAppointmentReminders(userId, patientId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            return false;
        }
        // Admins and nurses can manage any reminders
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.NURSE) {
            return true;
        }
        // Doctors can manage any reminders (for their patients)
        if (role === IAuthorizationService_1.UserRole.DOCTOR) {
            return true;
        }
        // Patients can only manage their own reminders
        if (role === IAuthorizationService_1.UserRole.PATIENT) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === patientId;
        }
        return false;
    }
    /**
     * Check if user can view queue status
     * Patient can view their own queue, Staff can view any queue
     */
    async canViewQueueStatus(userId, patientId, doctorId) {
        const role = await this.getUserRole(userId);
        if (!role) {
            return false;
        }
        // Admins and staff can view any queue
        if (role === IAuthorizationService_1.UserRole.SUPER_ADMIN ||
            role === IAuthorizationService_1.UserRole.ADMIN ||
            role === IAuthorizationService_1.UserRole.NURSE ||
            role === IAuthorizationService_1.UserRole.DOCTOR ||
            role === IAuthorizationService_1.UserRole.RECEPTIONIST) {
            return true;
        }
        // Patients can only view their own queue
        if (role === IAuthorizationService_1.UserRole.PATIENT && patientId) {
            const userPatientId = await this.resolveUserIdToPatientId(userId);
            return userPatientId === patientId;
        }
        return false;
    }
    /**
     * Check if user has specific role
     */
    async hasRole(userId, role) {
        const userRole = await this.getUserRole(userId);
        return userRole === role;
    }
    /**
     * Check if user has any of the specified roles
     */
    async hasAnyRole(userId, roles) {
        const userRole = await this.getUserRole(userId);
        if (!userRole)
            return false;
        return roles.includes(userRole);
    }
    /**
     * Get user's role from database
     * Caches result for performance
     */
    async getUserRole(userId) {
        try {
            const { data, error } = await this.supabase
                .schema('auth_schema')
                .from('user_profiles')
                .select('role_type')
                .eq('id', userId)
                .single();
            if (error || !data) {
                console.warn(`Failed to get role for user ${userId}:`, error);
                return null;
            }
            console.log('[getUserRole] Raw DB value:', data.role_type);
            const upperRole = data.role_type.toUpperCase();
            console.log('[getUserRole] Converted to:', upperRole);
            return upperRole;
        }
        catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }
    /**
     * Resolve user UUID to patient business ID (PAT-XXXXXX-XXX)
     */
    async resolveUserIdToPatientId(userId) {
        try {
            const { data, error } = await this.supabase
                .schema('patient_schema')
                .from('patients')
                .select('patient_id')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                console.warn(`Failed to resolve patient ID for user ${userId}:`, error);
                return null;
            }
            return data.patient_id;
        }
        catch (error) {
            console.error('Error resolving patient ID:', error);
            return null;
        }
    }
    /**
     * Resolve user UUID to doctor business ID (DEPT-DOC-XXXXXX-XXX)
     */
    async resolveUserIdToDoctorId(userId) {
        try {
            const { data, error } = await this.supabase
                .schema('provider_schema')
                .from('staff_profiles')
                .select('staff_id')
                .eq('user_id', userId)
                .eq('staff_type', 'doctor')
                .single();
            if (error || !data) {
                console.warn(`Failed to resolve doctor ID for user ${userId}:`, error);
                return null;
            }
            return data.staff_id;
        }
        catch (error) {
            console.error('Error resolving doctor ID:', error);
            return null;
        }
    }
}
exports.AuthorizationService = AuthorizationService;
//# sourceMappingURL=AuthorizationService.js.map