/**
 * GetWaitlistUseCase - Application Layer
 * Retrieves waitlist entries with filters
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IAppointmentWaitlistRepository } from '../../domain/repositories/IAppointmentWaitlistRepository';
import { WaitlistPriority, WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';
/**
 * Query DTO
 */
export interface GetWaitlistQuery {
    patientId?: string;
    doctorId?: string;
    departmentId?: string;
    date?: Date;
    appointmentType?: string;
    priority?: WaitlistPriority;
    status?: WaitlistStatus;
    isExpired?: boolean;
    limit?: number;
    offset?: number;
}
/**
 * Waitlist entry DTO
 */
export interface WaitlistEntryDTO {
    waitlistId: string;
    patientId: string;
    preferredDoctorId?: string;
    preferredDepartmentId?: string;
    preferredDate?: string;
    preferredTimeSlot?: string;
    appointmentType: string;
    priority: string;
    status: string;
    notes?: string;
    reason?: string;
    isFlexibleDate: boolean;
    isFlexibleTime: boolean;
    isFlexibleDoctor: boolean;
    matchedAppointmentId?: string;
    matchedAt?: string;
    expiresAt?: string;
    contactPhone?: string;
    contactEmail?: string;
    preferredContactMethod: string;
    createdAt: string;
    updatedAt: string;
    position?: number;
}
/**
 * Result DTO
 */
export interface GetWaitlistResult {
    success: boolean;
    entries?: WaitlistEntryDTO[];
    total?: number;
    error?: string;
}
/**
 * Use case for retrieving waitlist entries
 */
export declare class GetWaitlistUseCase {
    private readonly waitlistRepository;
    constructor(waitlistRepository: IAppointmentWaitlistRepository);
    execute(query: GetWaitlistQuery): Promise<GetWaitlistResult>;
}
//# sourceMappingURL=GetWaitlistUseCase.d.ts.map