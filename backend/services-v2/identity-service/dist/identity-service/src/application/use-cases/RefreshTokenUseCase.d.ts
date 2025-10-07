/**
 * RefreshTokenUseCase
 * Refreshes access token using refresh token
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IAuthenticationService } from '../services/IAuthenticationService';
import { ILogger } from '../services/ILogger';
export interface RefreshTokenRequest {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface RefreshTokenResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    user?: {
        userId: string;
        email: string;
        role: string;
    };
    error?: string;
    errorCode?: string;
}
export declare class RefreshTokenUseCase {
    private readonly authService;
    private readonly logger;
    constructor(authService: IAuthenticationService, logger: ILogger);
    execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
//# sourceMappingURL=RefreshTokenUseCase.d.ts.map