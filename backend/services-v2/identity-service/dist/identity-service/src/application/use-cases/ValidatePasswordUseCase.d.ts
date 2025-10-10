/**
 * Validate Password Use Case
 * Validates a password against the current policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { ILogger } from '../services/ILogger';
export interface ValidatePasswordRequest {
    password: string;
}
export interface ValidatePasswordResponse {
    isValid: boolean;
    errors: string[];
    strength?: 'weak' | 'medium' | 'strong';
}
export declare class ValidatePasswordUseCase {
    private readonly policyRepository;
    private readonly logger;
    constructor(policyRepository: IPasswordPolicyRepository, logger: ILogger);
    execute(request: ValidatePasswordRequest): Promise<ValidatePasswordResponse>;
    /**
     * Calculate password strength based on various factors
     */
    private calculateStrength;
}
//# sourceMappingURL=ValidatePasswordUseCase.d.ts.map