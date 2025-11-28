/**
 * ProvisionStaffUseCase
 * Admin-only endpoint to create staff accounts (DOCTOR, NURSE, RECEPTIONIST, ADMIN)
 *
 * Flow:
 * 1. Admin creates staff account with email + role
 * 2. System generates invitation token (expires in 7 days)
 * 3. System sends invitation email
 * 4. Staff clicks link → sets password → activates account
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUserRepository } from "../repositories/IUserRepository";
import { ILogger } from "../services/ILogger";
import { IEmailService } from "../services/IEmailService";
import { IEventPublisher } from "../services/IEventPublisher";
export interface ProvisionStaffRequest {
    email: string;
    fullName: string;
    roleType: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
    phoneNumber?: string;
    departmentCode?: string;
    specialization?: string;
    specializationCode?: string;
    specializationName?: string;
    title?: string;
    position?: string;
    licenseNumber?: string;
    yearsOfExperience?: number;
    education?: string[];
    bio?: string;
    departmentName?: string;
    employmentType?: "full_time" | "part_time" | "contract" | "intern" | "volunteer";
    workSchedule?: {
        workingDays?: string[];
        workingHours?: {
            start?: string;
            end?: string;
        };
        timeZone?: string;
        isFlexible?: boolean;
    };
    requesterId: string;
}
export interface ProvisionStaffResponse {
    success: boolean;
    userId?: string;
    invitationToken?: string;
    invitationUrl?: string;
    expiresAt?: Date;
    error?: string;
    errorCode?: string;
}
export declare class ProvisionStaffUseCase {
    private readonly userRepository;
    private readonly logger;
    private readonly emailService;
    private readonly frontendUrl;
    private readonly eventPublisher?;
    constructor(userRepository: IUserRepository, logger: ILogger, emailService: IEmailService, frontendUrl: string, eventPublisher?: IEventPublisher | undefined);
    execute(request: ProvisionStaffRequest): Promise<ProvisionStaffResponse>;
    /**
     * Generate secure invitation token
     */
    private generateInvitationToken;
}
//# sourceMappingURL=ProvisionStaffUseCase.d.ts.map