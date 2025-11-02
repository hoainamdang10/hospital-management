/**
 * SupabaseTokenVerifier - JWT Token Verification Implementation
 * Verifies JWT tokens using Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Security
 */
import { ITokenVerifier, TokenPayload } from '../../application/services/ITokenVerifier';
import { ILogger } from '../../application/services/ILogger';
export declare class SupabaseTokenVerifier implements ITokenVerifier {
    private readonly logger;
    private readonly jwtSecret;
    constructor(logger: ILogger);
    verifyToken(token: string): Promise<TokenPayload | null>;
}
//# sourceMappingURL=SupabaseTokenVerifier.d.ts.map