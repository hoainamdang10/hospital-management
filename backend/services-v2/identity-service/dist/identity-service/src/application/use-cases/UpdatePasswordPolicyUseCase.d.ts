/**
 * Update Password Policy Use Case
 * Updates the system password policy (Admin only)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicyProps } from '../../domain/value-objects/PasswordPolicy';
import { ILogger } from '../services/ILogger';
export interface UpdatePasswordPolicyRequest {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number | null;
    preventReuse: number;
    updatedBy: string;
}
export interface UpdatePasswordPolicyResponse {
    success: boolean;
    policy: PasswordPolicyProps;
    message: string;
}
export declare class UpdatePasswordPolicyUseCase {
    private readonly policyRepository;
    private readonly logger;
    constructor(policyRepository: IPasswordPolicyRepository, logger: ILogger);
    execute(request: UpdatePasswordPolicyRequest): Promise<UpdatePasswordPolicyResponse>;
}
//# sourceMappingURL=UpdatePasswordPolicyUseCase.d.ts.map