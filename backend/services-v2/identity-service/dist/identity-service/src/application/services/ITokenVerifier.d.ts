export interface TokenUser {
    id: string;
    email: string | null;
    user_metadata?: Record<string, unknown>;
}
/**
 * Abstraction for verifying opaque authentication tokens.
 * Presentation layer depends on this contract to avoid importing infrastructure adapters directly.
 */
export interface ITokenVerifier {
    verifyToken(token: string): Promise<TokenUser | null>;
}
//# sourceMappingURL=ITokenVerifier.d.ts.map