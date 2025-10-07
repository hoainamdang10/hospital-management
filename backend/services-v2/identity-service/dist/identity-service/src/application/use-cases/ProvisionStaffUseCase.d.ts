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
import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { IEventPublisher } from '../../infrastructure/events/RabbitMQEventPublisher';
export interface ProvisionStaffRequest {
    email: string;
    fullName: string;
    roleType: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
    phoneNumber?: string;
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
    private readonly eventPublisher?;
    constructor(userRepository: IUserRepository, logger: ILogger, eventPublisher?: IEventPublisher | undefined);
    execute(request: ProvisionStaffRequest): Promise<ProvisionStaffResponse>;
    /**
     * Generate secure invitation token
     */
    private generateInvitationToken;
}
//# sourceMappingURL=ProvisionStaffUseCase.d.ts.map