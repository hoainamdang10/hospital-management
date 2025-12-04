/**
 * Supabase Appointment Repository - Infrastructure Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches 100% with scheduling_schema database
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
import { Appointment } from "../../domain/aggregates/Appointment.aggregate";
import { AppointmentId } from "../../domain/value-objects/AppointmentId.vo";
import { IAppointmentRepository, AppointmentSearchCriteria, AppointmentSearchResult, AppointmentConflictCheck, AppointmentStatistics } from "../../domain/repositories/IAppointmentRepository";
import { IDomainEventPublisher } from "../../../../shared/domain/events/IDomainEventPublisher";
/**
 * Supabase Appointment Repository
 * Implements persistence for Appointment aggregate
 */
export declare class SupabaseAppointmentRepository implements IAppointmentRepository {
    private readonly eventPublisher?;
    private readonly supabase;
    private readonly schema;
    private readonly tableName;
    private readonly outboxRepo;
    constructor(supabaseUrl: string, supabaseKey: string, eventPublisher?: IDomainEventPublisher | undefined);
    /**
     * Save appointment (create or update)
     */
    save(appointment: Appointment): Promise<void>;
    /**
     * Publish domain events from aggregate
     *
     * ✅ ENRICHMENT: Get data from appointment_read_model before publishing
     * This provides denormalized names for Notifications Service
     */
    private publishDomainEvents;
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
     * Find appointments by doctor ID and specific date
     * Convenience method that wraps findByTimeSlot for a full day
     */
    findByDoctorAndDate(doctorId: string, date: Date): Promise<Appointment[]>;
    /**
     * Find appointments by date range
     */
    findByDateRange(startDate: Date, endDate: Date, limit?: number, offset?: number): Promise<Appointment[]>;
    /**
     * Delete appointment
     */
    delete(appointmentId: AppointmentId): Promise<void>;
    findByIdString(id: string): Promise<Appointment | null>;
    findByProviderId(providerId: string, limit?: number, offset?: number): Promise<Appointment[]>;
    search(criteria: AppointmentSearchCriteria): Promise<AppointmentSearchResult>;
    checkConflicts(providerId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<AppointmentConflictCheck>;
    findUpcomingByPatientId(patientId: string, limit?: number): Promise<Appointment[]>;
    findUpcomingByProviderId(providerId: string, limit?: number): Promise<Appointment[]>;
    findByStatus(status: string, limit?: number, offset?: number): Promise<Appointment[]>;
    findRequiringReminders(reminderType: "24h" | "2h" | "30min"): Promise<Appointment[]>;
    findOverdue(): Promise<Appointment[]>;
    /**
     * Find expired unpaid appointments
     * Flow 3 - Phase 1B: Payment Timeout Handling
     * Query: payment_status = 'PENDING' AND payment_deadline < NOW()
     */
    findExpiredUnpaidAppointments(): Promise<Appointment[]>;
    /**
     * Find past appointments that should be auto-completed
     * Query: status IN ('CONFIRMED', 'SCHEDULED') AND appointment_datetime < cutoffTime
     */
    findPastAppointments(cutoffTime: Date): Promise<Appointment[]>;
    getStatistics(dateFrom?: Date, dateTo?: Date, providerId?: string, department?: string): Promise<AppointmentStatistics>;
    count(criteria: Partial<AppointmentSearchCriteria>): Promise<number>;
    exists(appointmentId: AppointmentId): Promise<boolean>;
    findByIds(appointmentIds: AppointmentId[]): Promise<Appointment[]>;
    findByTimeSlot(providerId: string, startTime: Date, endTime: Date): Promise<Appointment[]>;
    private formatDateInProviderTimezone;
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
    /**
     * Parse time string (HH:MM) on a specific date
     */
    private parseTimeOnDate;
    /**
     * Merge overlapping time intervals
     */
    private mergeIntervals;
    getUtilizationRate(providerId?: string, department?: string, dateFrom?: Date, dateTo?: Date): Promise<number>;
    /**
     * Convert domain aggregate to database record
     */
    private toPersistence;
    /**
     * Convert database record to domain aggregate
     */
    private toDomain;
    /**
     * Resolve internal patient UUID from business-facing patient code (e.g. PAT-202511-425)
     * Used to provide correct foreign keys for billing-service integration events.
     */
    private resolvePatientRecordId;
    /**
     * Update appointment (alias for save - uses aggregate pattern)
     * Used by event consumers for status changes and updates
     */
    update(appointment: Appointment): Promise<void>;
    /**
     * Create appointment (alias for save - uses aggregate pattern)
     * Used by event consumers when creating new appointments
     */
    create(appointment: Appointment): Promise<void>;
    /**
     * Find appointments by department ID
     * Used by department event consumers for department operations
     */
    findByDepartmentId(departmentId: string): Promise<Appointment[]>;
    /**
     * Find appointments by department and date
     * Used by department event consumers for daily operations
     */
    findByDepartmentAndDate(departmentId: string, date: Date): Promise<Appointment[]>;
    /**
     * Check staff availability for appointment
     * Used by staff event consumers for availability checks
     */
    checkStaffAvailability(staffId: string, startTime: Date, endTime: Date): Promise<boolean>;
    /**
     * Update patient appointment history
     * Patient history management is core to appointment service
     */
    updatePatientHistory(data: {
        patientId: string;
        appointmentId: string;
        visitType: string;
        diagnosis?: string;
        treatment?: string;
        notes?: string;
        updatedAt: Date;
    }): Promise<void>;
    /**
     * Update patient vital signs profile for appointments
     * Vital signs are linked to appointments (pre-op, post-op)
     */
    updatePatientVitalSignsProfile(data: {
        patientId: string;
        appointmentId: string;
        vitalSigns: {
            bloodPressure?: string;
            heartRate?: number;
            temperature?: number;
            weight?: number;
            height?: number;
        };
        recordedAt: Date;
        recordedBy: string;
    }): Promise<void>;
    /**
     * Add appointment to urgent care list
     * Urgent care appointments are appointment types managed by appointment service
     */
    addToUrgentCareList(appointmentId: string, priority: "urgent" | "emergency"): Promise<void>;
    /**
     * Update appointment status
     * Loads aggregate, updates status, saves back
     */
    updateStatus(appointmentId: AppointmentId, status: string): Promise<void>;
    /**
     * Update billing rates for appointments
     * Updates all appointments of a specific service type
     */
    updateBillingRates(data: {
        serviceType: string;
        newRate: number;
        effectiveDate: Date;
    }): Promise<void>;
    /**
     * Find appointments by service type and date
     */
    findByServiceTypeAndDate(serviceType: string, date: Date): Promise<Appointment[]>;
    /**
     * Find pending appointments by service type
     */
    findPendingByServiceType(serviceType: string): Promise<Appointment[]>;
    /**
     * Update patient insurance coverage
     * Updates all future appointments for a patient
     */
    updatePatientInsuranceCoverage(data: {
        patientId: string;
        insuranceProvider: string;
        policyNumber: string;
        coverageType: string;
        validFrom: Date;
        validUntil: Date;
    }): Promise<void>;
    /**
     * Update patient scheduling preferences
     * Note: This would typically be stored in a separate patient_preferences table
     */
    updatePatientSchedulingPreferences(data: {
        patientId: string;
        preferredDays: string[];
        preferredTimes: string[];
        preferredProviders: string[];
        specialRequirements: string[];
    }): Promise<void>;
}
//# sourceMappingURL=SupabaseAppointmentRepository.d.ts.map