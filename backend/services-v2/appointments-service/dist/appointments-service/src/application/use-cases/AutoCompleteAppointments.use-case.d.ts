import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
/**
 * Auto-Complete Past Appointments Use Case
 *
 * Automatically marks past appointments as completed
 * Runs periodically via cron job
 *
 * Business Rule:
 * - Appointments with status CONFIRMED or SCHEDULED (auto check-in/start)
 * - Appointments with status ARRIVED or IN_PROGRESS (already in workflow)
 * - Appointment time + buffer (e.g., 30 minutes) has passed
 * - Auto-mark as COMPLETED
 */
export declare class AutoCompleteAppointmentsUseCase {
    private readonly appointmentRepository;
    private readonly bufferMinutes;
    constructor(appointmentRepository: IAppointmentRepository, bufferMinutes?: number);
    /**
     * Execute use case
     * Finds and completes all past appointments
     *
     * @returns Count of completed appointments
     */
    execute(): Promise<{
        completedCount: number;
        errors: string[];
    }>;
}
//# sourceMappingURL=AutoCompleteAppointments.use-case.d.ts.map