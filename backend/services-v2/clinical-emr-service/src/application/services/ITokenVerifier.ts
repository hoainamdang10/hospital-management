/**
 * ITokenVerifier - Token Verification Service Interface
 * Interface for JWT token verification
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion
 */

export interface TokenPayload {
  id: string;
  email?: string;
  role?: string;
  sessionId?: string;
  exp?: number;
  iat?: number;
}

export interface ITokenVerifier {
  /**
   * Verify JWT token and return user data
   */
  verifyToken(token: string): Promise<TokenPayload | null>;
}
