/**
 * FindAvailableTimeSlots Use Case - Application Layer
 * V2 Clean Architecture + DDD Implementation
 *
 * Business Logic: Calculate available time slots for provider
 * Formula: Available Slots = Work Schedule Template - Booked Appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 *
 * Security Note (2025-10-23):
 * - Current RLS: Service role bypass + authenticated read access
 * - Data Classification: Operational data (non-PHI)
 *
 * Multi-Tenancy Support (Future Enhancement):
 * When implementing multi-tenancy, add:
 * 1. tenantId to FindAvailableTimeSlotsCommand
 * 2. Provider active status filter via IProviderService
 * 3. Tenant-level RLS policies in provider_schema and appointments_schema
 * 4. Filter bookedAppointments by tenant_id in repository
 */
import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
export interface FindAvailableTimeSlotsCommand {
    providerId: string;
    date: Date;
    durationMinutes: number;
}
export interface AvailableTimeSlotDTO {
    startTime: Date;
    endTime: Date;
    appointmentDate: string;
    appointmentTime: string;
    formattedTime: string;
    dayOfWeek: string;
    isAvailable: boolean;
}
/**
 * FindAvailableTimeSlots Use Case
 *
 * Bounded Context: Scheduling Context (Appointments Service)
 * Responsibility: Calculate runtime availability based on work schedule template
 *
 * Flow:
 * 1. Get cached work schedule template from ProviderScheduleRepository
 * 2. Get booked appointments for the date from AppointmentRepository
 * 3. Calculate available slots = template - booked
 * 4. Return available time slots
 */
export declare class FindAvailableTimeSlotsUseCase {
    private readonly providerScheduleRepository;
    private readonly appointmentRepository;
    constructor(providerScheduleRepository: IProviderScheduleRepository, appointmentRepository: IAppointmentRepository);
    /**
     * Execute use case
     *
     * @param command - Command with providerId, date, durationMinutes
     * @returns Array of available time slots
     * @throws Error if provider schedule not found
     */
    execute(command: FindAvailableTimeSlotsCommand): Promise<AvailableTimeSlotDTO[]>;
    /**
     * Validate command inputs
     */
    private validateCommand;
    /**
     * Get day of week in lowercase (monday, tuesday, etc.)
     */
    private getDayOfWeek;
    /**
     * Generate all possible time slots from work schedule
     */
    private generateTimeSlotsFromSchedule;
    /**
     * Filter out booked slots from all possible slots
     */
    private filterAvailableSlots;
    /**
     * Convert time slot to DTO
     */
    private toDTO;
    /**
     * Get Vietnamese day name
     */
    private getVietnameseDayName;
}
//# sourceMappingURL=FindAvailableTimeSlotsUseCase.d.ts.map