/**
 * Authenticate User Use Case - Simplified with Supabase Auth
 * Handles user authentication with Supabase Auth integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { SupabaseAuthService } from '../../infrastructure/auth/SupabaseAuthService';
import { SupabaseUserRepository } from '../../infrastructure/repositories/SupabaseUserRepository';
export interface AuthenticateUserRequest {
    email: string;
    password: string;
    mfaCode?: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: any;
}
export interface AuthenticateUserResponse {
    success: boolean;
    userId?: string;
    sessionToken?: string;
    accessToken?: string;
    refreshToken?: string;
    roles?: string[];
    permissions?: string[];
    expiresAt?: Date;
    requiresMFA?: boolean;
    error?: string;
}
export declare class AuthenticateUserUseCase implements IUseCase<AuthenticateUserRequest, AuthenticateUserResponse> {
    private authService;
    private userRepository;
    private logger;
    private circuitBreaker;
    constructor(authService: SupabaseAuthService, userRepository: SupabaseUserRepository, logger: any);
    execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse>;
    private executeImpl;
    /**
     * Check if user requires MFA
     */
    private shouldRequireMFA;
    private getPermissionsForRoles;
}
//# sourceMappingURL=AuthenticateUserUseCase.simplified.d.ts.map