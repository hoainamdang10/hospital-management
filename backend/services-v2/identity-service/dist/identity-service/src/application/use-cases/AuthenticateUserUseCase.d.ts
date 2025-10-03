/**
 * Authenticate User Use Case - Enhanced with Circuit Breaker
 * Handles user authentication with graceful degradation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ServiceMode } from '../services/IDegradationService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IUserRepository } from '../repositories/IUserRepository';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IDegradationService } from '../services/IDegradationService';
import { ILogger } from '../../application/services/ILogger';
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
    roles?: string[];
    permissions?: string[];
    expiresAt?: Date;
    mode: ServiceMode;
    degradationReason?: string;
    requiresMFA?: boolean;
    error?: string;
}
/**
 * Use Case for authenticating users with enhanced error handling
 * Implements circuit breaker pattern and graceful degradation
 */
export declare class AuthenticateUserUseCase implements IUseCase<AuthenticateUserRequest, AuthenticateUserResponse> {
    private userRepository;
    private authService;
    private degradationService;
    private circuitBreaker;
    private logger;
    constructor(userRepository: IUserRepository, authService: IAuthenticationService, degradationService: IDegradationService, circuitBreaker: ICircuitBreaker, logger: ILogger);
    /**
     * Execute authentication with comprehensive error handling
     */
    execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse>;
    /**
     * Primary authentication flow
     */
    private performAuthentication;
    /**
     * Fallback authentication using degradation service
     */
    private performFallbackAuthentication;
    /**
     * Validate authentication request
     */
    private validateRequest;
    /**
     * Get permissions for roles
     */
    private getPermissionsForRoles;
    /**
     * Map AuthResult to response format
     */
    private mapToResponse;
    /**
     * Generate session token (simplified)
     */
    private generateSessionToken;
    /**
     * Determine if MFA is required
     */
    private shouldRequireMFA;
}
//# sourceMappingURL=AuthenticateUserUseCase.d.ts.map