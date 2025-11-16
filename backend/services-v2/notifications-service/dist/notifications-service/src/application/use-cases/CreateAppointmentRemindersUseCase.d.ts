/**
 * CreateAppointmentRemindersUseCase
 * Creates reminder records in database when appointment is scheduled
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { Result } from '@shared/core/Result';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
export interface CreateAppointmentRemindersRequest {
    appointmentId: string;
    tenantId?: string;
    patientId: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientLanguage?: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialization?: string;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentType?: string;
    reason?: string;
}
export declare class CreateAppointmentRemindersUseCase {
    private reminderRepo;
    constructor(reminderRepo: IAppointmentReminderRepository);
    /**
     * Execute use case - create 3 reminders for an appointment
     */
    execute(request: CreateAppointmentRemindersRequest): Promise<Result<{
        created: number;
    }>>;
    /**
     * Combine date and time into single datetime
     */
    private combineDateTime;
    /**
     * Determine notification channels based on patient contact info
     */
    private determineChannels;
    /**
     * Determine preferred channel
     */
    private determinePreferredChannel;
}
//# sourceMappingURL=CreateAppointmentRemindersUseCase.d.ts.map