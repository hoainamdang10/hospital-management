/**
 * Manage Appointment Reminders Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService, CustomReminderWindow } from '../services/IReminderService';
import { IAuthorizationService } from '../services/IAuthorizationService';
export interface ManageAppointmentRemindersRequest {
    appointmentId: string;
    action: 'enable' | 'disable' | 'reschedule';
    reminderWindows?: CustomReminderWindow[];
}
export interface ManageAppointmentRemindersResponse {
    success: boolean;
    message: string;
    reminders?: {
        appointmentId: string;
        enabled: boolean;
        windows: Array<{
            window: string;
            scheduledFor: string;
            channels: string[];
        }>;
    };
    errors?: string[];
}
/**
 * Manage Appointment Reminders Use Case
 *
 * Business Rules:
 * 1. Default reminders: 24h, 2h, 30m before appointment
 * 2. Channels: SMS, Email, App notification
 * 3. Respect quiet hours (21:00 - 06:00)
 * 4. Can enable/disable/reschedule reminders
 * 5. Integration with Scheduler Service
 */
export declare class ManageAppointmentRemindersUseCase extends BaseHealthcareUseCase<ManageAppointmentRemindersRequest, ManageAppointmentRemindersResponse> {
    private readonly appointmentRepository;
    private readonly reminderService;
    private readonly authorizationService;
    private readonly DEFAULT_REMINDER_WINDOWS;
    constructor(appointmentRepository: IAppointmentRepository, reminderService: IReminderService, authorizationService: IAuthorizationService);
    protected executeInternal(request: ManageAppointmentRemindersRequest): Promise<ManageAppointmentRemindersResponse>;
    /**
     * Enable reminders
     */
    private enableReminders;
    /**
     * Disable reminders
     */
    private disableReminders;
    /**
     * Reschedule reminders
     */
    private rescheduleReminders;
    /**
     * Calculate reminder time based on window
     */
    private calculateReminderTime;
    /**
     * Adjust time to avoid quiet hours
     */
    private adjustForQuietHours;
    authorize(request: ManageAppointmentRemindersRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ManageAppointmentRemindersRequest): boolean;
    getPatientId(request: ManageAppointmentRemindersRequest): string | null;
}
//# sourceMappingURL=ManageAppointmentReminders.use-case.d.ts.map