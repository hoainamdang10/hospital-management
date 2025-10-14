import { JWTToken } from '../value-objects/JWTToken';
import { AuthenticatedUser } from '../entities/AuthenticatedUser';

export interface TokenVerificationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

export interface ITokenVerifier {
  verify(token: JWTToken): Promise<TokenVerificationResult>;
  
  verifyAndDecode(tokenString: string): Promise<TokenVerificationResult>;
}

