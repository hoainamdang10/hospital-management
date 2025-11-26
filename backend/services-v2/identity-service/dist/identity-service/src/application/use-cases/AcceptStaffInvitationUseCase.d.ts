/**
 * AcceptStaffInvitationUseCase
 * Handles staff account activation from invitation link
 *
 * Flow:
 * 1. Staff receives invitation email with token
 * 2. Staff clicks link and provides password
 * 3. System verifies token validity
 * 4. System creates auth user + profile
 * 5. System marks invitation as used
 * 6. System publishes UserCreated and UserActivated events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUserRepository } from "../repositories/IUserRepository";
import { ILogger } from "../services/ILogger";
import { IEventPublisher } from "../services/IEventPublisher";
export interface AcceptStaffInvitationRequest {
    invitationToken: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phoneNumber?: string;
}
export interface AcceptStaffInvitationResponse {
    success: boolean;
    userId?: string;
    email?: string;
    role?: string;
    message?: string;
    error?: string;
    errorCode?: string;
}
export declare class AcceptStaffInvitationUseCase {
    private readonly userRepository;
    private readonly logger;
    private readonly eventPublisher?;
    constructor(userRepository: IUserRepository, logger: ILogger, eventPublisher?: IEventPublisher | undefined);
    execute(request: AcceptStaffInvitationRequest): Promise<AcceptStaffInvitationResponse>;
    private validateRequest;
}
//# sourceMappingURL=AcceptStaffInvitationUseCase.d.ts.map