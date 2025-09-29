import { Appointment, AppointmentSearchFilters, AppointmentStats, AppointmentWithDetails, ConflictCheck, CreateAppointmentDto, UpdateAppointmentDto } from "../types/appointment.types";
export declare class AppointmentRepository {
    private supabase;
    private pool;
    getAllAppointments(filters?: AppointmentSearchFilters, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    getAppointmentById(appointment_id: string): Promise<AppointmentWithDetails | null>;
    getAppointmentsByDoctorId(doctor_id: string, filters?: Partial<AppointmentSearchFilters>, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    getAppointmentsByPatientId(patient_id: string, filters?: Partial<AppointmentSearchFilters>, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    createAppointment(appointmentData: CreateAppointmentDto): Promise<Appointment>;
    updateAppointment(appointment_id: string, updateData: UpdateAppointmentDto): Promise<Appointment>;
    cancelAppointment(appointment_id: string, reason?: string): Promise<boolean>;
    checkConflicts(doctor_id: string, appointmentDate: string, startTime: string, endTime: string, excludeAppointmentId?: string): Promise<ConflictCheck>;
    appointmentExists(appointment_id: string): Promise<boolean>;
    getAppointmentStats(): Promise<AppointmentStats>;
    getUpcomingAppointments(doctor_id: string, days?: number): Promise<AppointmentWithDetails[]>;
    getCalendarView(date: string, doctor_id?: string, view?: "day" | "week" | "month"): Promise<any>;
    getWeeklySchedule(doctor_id: string, startDate?: string): Promise<any>;
    getAvailableSlots(doctor_id: string, date: string, duration?: number): Promise<any[]>;
    getDoctorAppointmentStats(doctor_id: string): Promise<any>;
    getDoctorPatientCount(doctor_id: string): Promise<number>;
}
//# sourceMappingURL=appointment.repository.d.ts.map