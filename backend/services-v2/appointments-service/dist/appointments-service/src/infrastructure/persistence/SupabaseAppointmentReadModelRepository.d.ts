/**
 * Supabase Appointment Read Model Repository - Infrastructure Layer
 * CQRS Read Model Repository implementation with Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { AppointmentReadModel, CreateAppointmentReadModelData, PatientData, DoctorData, AppointmentReadModelFilters } from "../../domain/read-models/AppointmentReadModel";
export declare class SupabaseAppointmentReadModelRepository implements IAppointmentReadModelRepository {
    private client;
    private readonly tableName;
    private readonly schema;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Create new read model entry
     */
    create(data: CreateAppointmentReadModelData): Promise<AppointmentReadModel>;
    /**
     * Update patient data for all appointments
     */
    updatePatientData(patientId: string, patientData: PatientData): Promise<number>;
    /**
     * Update doctor data for all appointments
     */
    updateDoctorData(doctorId: string, doctorData: DoctorData): Promise<number>;
    /**
     * Update appointment status
     */
    updateStatus(appointmentId: string, status: string): Promise<void>;
    /**
     * Update payment status
     */
    updatePaymentStatus(appointmentId: string, paymentStatus: string): Promise<void>;
    /**
     * Update cancellation metadata
     */
    updateCancellationDetails(appointmentId: string, cancelledAt?: Date, cancellationReason?: string): Promise<void>;
    /**
     * Update appointment schedule (date/time/duration) after reschedule
     */
    updateSchedule(appointmentId: string, appointmentDate: Date, appointmentTime: string, durationMinutes: number, status?: string): Promise<void>;
    /**
     * Find by appointment ID
     */
    findById(appointmentId: string): Promise<AppointmentReadModel | null>;
    /**
     * Find by patient ID
     */
    findByPatientId(patientId: string): Promise<AppointmentReadModel[]>;
    /**
     * Find by doctor ID
     */
    findByDoctorId(doctorId: string): Promise<AppointmentReadModel[]>;
    /**
     * Find by date range
     */
    findByDateRange(startDate: Date, endDate: Date): Promise<AppointmentReadModel[]>;
    /**
     * Find with filters
     */
    findWithFilters(filters: AppointmentReadModelFilters): Promise<AppointmentReadModel[]>;
    /**
     * Count with filters
     */
    countWithFilters(filters: AppointmentReadModelFilters): Promise<number>;
    /**
     * Delete read model entry
     */
    delete(appointmentId: string): Promise<void>;
    /**
     * Map database record to domain model
     */
    private toDomain;
}
//# sourceMappingURL=SupabaseAppointmentReadModelRepository.d.ts.map