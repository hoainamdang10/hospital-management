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
import { AppointmentId } from '../../domain/value-objects/AppointmentId.vo';
import { IAppointmentRepository, AppointmentSearchCriteria, AppointmentSearchResult, AppointmentConflictCheck, AppointmentStatistics } from '../../domain/repositories/IAppointmentRepository';
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
     * Find appointment by AppointmentId
     */
    findById(appointmentId: AppointmentId): Promise<Appointment | null>;
    /**
     * Find appointment by appointment_id
     */
    findByAppointmentId(appointmentId: string): Promise<Appointment | null>;
    /**
     * Find appointments by patient ID
     */
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<Appointment[]>;
    /**
     * Find appointments by doctor ID
     */
    findByDoctorId(doctorId: string, limit?: number, offset?: number): Promise<Appointment[]>;
    /**
     * Find appointments by date range
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Appointment[]>;
    /**
     * Delete appointment
     */
    delete(appointmentId: AppointmentId): Promise<void>;
    findByIdString(appointmentId: string): Promise<Appointment | null>;
    findByProviderId(providerId: string, limit?: number, offset?: number): Promise<Appointment[]>;
    search(criteria: AppointmentSearchCriteria): Promise<AppointmentSearchResult>;
    checkConflicts(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<AppointmentConflictCheck>;
    findUpcomingByPatientId(patientId: string, limit?: number): Promise<Appointment[]>;
    findUpcomingByProviderId(providerId: string, limit?: number): Promise<Appointment[]>;
    findByStatus(status: string, limit?: number, offset?: number): Promise<Appointment[]>;
    findRequiringReminders(reminderType: '24h' | '2h' | '30min'): Promise<Appointment[]>;
    findOverdue(): Promise<Appointment[]>;
    getStatistics(dateFrom?: Date, dateTo?: Date, providerId?: string, department?: string): Promise<AppointmentStatistics>;
    count(criteria: Partial<AppointmentSearchCriteria>): Promise<number>;
    exists(appointmentId: AppointmentId): Promise<boolean>;
    findByIds(appointmentIds: AppointmentId[]): Promise<Appointment[]>;
    findByTimeSlot(providerId: string, startTime: Date, endTime: Date): Promise<Appointment[]>;
    findFollowUpAppointments(originalAppointmentId: string): Promise<Appointment[]>;
    getPatientHistory(patientId: string, limit?: number, offset?: number): Promise<{
        appointments: Appointment[];
        totalCount: number;
        completedCount: number;
        cancelledCount: number;
        noShowCount: number;
    }>;
    getProviderSchedule(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
    findByDepartment(department: string, dateFrom?: Date, dateTo?: Date, limit?: number, offset?: number): Promise<Appointment[]>;
    findEmergencyAppointments(limit?: number): Promise<Appointment[]>;
    findRequiringPreparation(dateFrom?: Date, dateTo?: Date): Promise<Appointment[]>;
    updateStatus(appointmentId: AppointmentId, status: string): Promise<void>;
    bulkUpdate(appointments: Appointment[]): Promise<void>;
    getDailySummary(date: Date, providerId?: string): Promise<{
        totalAppointments: number;
        scheduledAppointments: number;
        completedAppointments: number;
        cancelledAppointments: number;
        averageDuration: number;
        busyPeriods: {
            startTime: Date;
            endTime: Date;
            appointmentCount: number;
        }[];
    }>;
    findAvailableTimeSlots(providerId: string, date: Date, duration: number): Promise<{
        startTime: Date;
        endTime: Date;
    }[]>;
    getUtilizationRate(providerId?: string, department?: string, dateFrom?: Date, dateTo?: Date): Promise<{
        totalSlots: number;
        bookedSlots: number;
        utilizationRate: number;
        noShowRate: number;
        cancellationRate: number;
    }>;
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