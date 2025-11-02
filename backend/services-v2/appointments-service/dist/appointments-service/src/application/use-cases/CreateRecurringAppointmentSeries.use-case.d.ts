/**
 * Create Recurring Appointment Series Use Case
 * Creates a series of recurring appointments based on a pattern
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { ScheduleAppointmentUseCase } from './ScheduleAppointment.use-case';
export declare enum RecurrenceType {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}
export interface CreateRecurringSeriesRequest {
    patientId: string;
    doctorId: string;
    recurrenceType: RecurrenceType;
    recurrenceInterval: number;
    recurrenceDaysOfWeek?: number[];
    recurrenceDayOfMonth?: number;
    startDate: string;
    endDate?: string;
    maxOccurrences?: number;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    reason: string;
    consultationFee: number;
    createdBy: string;
}
export interface CreateRecurringSeriesResponse {
    success: boolean;
    message: string;
    series?: {
        seriesId: string;
        totalAppointments: number;
        generatedAppointments: string[];
    };
    errors?: string[];
}
/**
 * Create Recurring Appointment Series Use Case
 * Generates multiple appointments based on recurrence pattern
 */
export declare class CreateRecurringAppointmentSeriesUseCase extends BaseHealthcareUseCase<CreateRecurringSeriesRequest, CreateRecurringSeriesResponse> {
    private readonly scheduleAppointmentUseCase;
    constructor(scheduleAppointmentUseCase: ScheduleAppointmentUseCase);
    protected executeInternal(request: CreateRecurringSeriesRequest): Promise<CreateRecurringSeriesResponse>;
    private validateRequest;
    private calculateRecurrenceDates;
    private dateMatchesPattern;
    private incrementDate;
    private formatDate;
    authorize(request: CreateRecurringSeriesRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreateRecurringSeriesRequest): boolean;
    getPatientId(request: CreateRecurringSeriesRequest): string | null;
}
//# sourceMappingURL=CreateRecurringAppointmentSeries.use-case.d.ts.map