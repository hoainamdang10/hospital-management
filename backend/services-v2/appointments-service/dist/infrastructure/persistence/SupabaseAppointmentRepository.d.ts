/**
 * Supabase Appointment Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { Appointment } from '../../domain/aggregates/Appointment.aggregate';
export interface IAppointmentRepository {
    save(appointment: Appointment): Promise<void>;
    findById(id: string): Promise<Appointment | null>;
    findByAppointmentId(appointmentId: string): Promise<Appointment | null>;
    findByPatientId(patientId: string): Promise<Appointment[]>;
    findByDoctorId(doctorId: string): Promise<Appointment[]>;
    findByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
    delete(id: string): Promise<void>;
}
/**
 * Supabase Appointment Repository
 * Implements persistence for Appointment aggregate
 */
export declare class SupabaseAppointmentRepository implements IAppointmentRepository {
    private readonly supabase;
    private readonly schema;
    private readonly tableName;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Save appointment (create or update)
     */
    save(appointment: Appointment): Promise<void>;
    /**
     * Find appointment by UUID
     */
    findById(id: string): Promise<Appointment | null>;
    /**
     * Find appointment by appointment_id
     */
    findByAppointmentId(appointmentId: string): Promise<Appointment | null>;
    /**
     * Find appointments by patient ID
     */
    findByPatientId(patientId: string): Promise<Appointment[]>;
    /**
     * Find appointments by doctor ID
     */
    findByDoctorId(doctorId: string): Promise<Appointment[]>;
    /**
     * Find appointments by date range
     */
    findByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
    /**
     * Delete appointment
     */
    delete(id: string): Promise<void>;
    /**
     * Convert domain aggregate to database record
     */
    private toPersistence;
    /**
     * Convert database record to domain aggregate
     */
    private toDomain;
}
//# sourceMappingURL=SupabaseAppointmentRepository.d.ts.map