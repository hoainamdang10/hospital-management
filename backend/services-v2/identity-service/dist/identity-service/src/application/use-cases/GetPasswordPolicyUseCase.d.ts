/**
 * Get Password Policy Use Case
 * Retrieves the current active password policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicyProps } from '../../domain/value-objects/PasswordPolicy';
import { ILogger } from '../services/ILogger';
export interface GetPasswordPolicyResponse {
    success: boolean;
    policy: PasswordPolicyProps;
    description: string;
}
export declare class GetPasswordPolicyUseCase {
    private readonly policyRepository;
    private readonly logger;
    constructor(policyRepository: IPasswordPolicyRepository, logger: ILogger);
    execute(): Promise<GetPasswordPolicyResponse>;
}
//# sourceMappingURL=GetPasswordPolicyUseCase.d.ts.map