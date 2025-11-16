import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
/**
 * Expire Unpaid Appointments Use Case
 *
 * Automatically cancels appointments with expired payment deadlines
 * Runs periodically via cron job (every 5 minutes)
 *
 * Flow 3 - Phase 1B: Payment Timeout Handling
 */
export declare class ExpireUnpaidAppointmentsUseCase {
    private readonly appointmentRepository;
    constructor(appointmentRepository: IAppointmentRepository);
    /**
     * Execute use case
     * Finds and cancels all appointments with expired payment deadlines
     *
     * @returns Count of expired appointments
     */
    execute(): Promise<{
        expiredCount: number;
        errors: string[];
    }>;
}
//# sourceMappingURL=ExpireUnpaidAppointments.use-case.d.ts.map