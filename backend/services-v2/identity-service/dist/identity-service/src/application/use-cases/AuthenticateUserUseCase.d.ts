/**
 * Authenticate User Use Case - Enhanced with Circuit Breaker
 * Handles user authentication with graceful degradation
 *
 * Pure RBAC: Uses IPermissionRepository for permission management
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Pure RBAC
 * @compliance Production-Ready, HIPAA-Compliant, Anti-Pattern Mitigation
 */
import { IUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { ServiceMode } from '../services/IDegradationService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { IUserRepository } from '../repositories/IUserRepository';
import { IAuthenticationService } from '../services/IAuthenticationService';
import { IDegradationService } from '../services/IDegradationService';
import { ILogger } from '../../application/services/ILogger';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { IEventPublisher } from '../services/IEventPublisher';
export interface AuthenticateUserRequest {
    email: string;
    password: string;
    mfaCode?: string;
    ipAddress: string;
    userAgent: string;
    deviceInfo?: Record<string, unknown>;
}
export interface AuthenticateUserResponse {
    success: boolean;
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
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
    private permissionRepository;
    private eventPublisher?;
    constructor(userRepository: IUserRepository, authService: IAuthenticationService, degradationService: IDegradationService, circuitBreaker: ICircuitBreaker, logger: ILogger, permissionRepository: IPermissionRepository, eventPublisher?: IEventPublisher | undefined);
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
     * Map AuthResult to response format
     */
    private mapToResponse;
    /**
     * Determine if MFA is required
     */
    private shouldRequireMFA;
}
//# sourceMappingURL=AuthenticateUserUseCase.d.ts.map