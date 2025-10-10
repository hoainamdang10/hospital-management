/**
 * Password Policy Repository Interface
 * Defines contract for password policy persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { PasswordPolicy } from '../value-objects/PasswordPolicy';
export interface IPasswordPolicyRepository {
    /**
     * Get the current active password policy
     * Returns default policy if none exists
     */
    getCurrent(): Promise<PasswordPolicy>;
    /**
     * Update the password policy
     * Only one policy can be active at a time
     */
    update(policy: PasswordPolicy, updatedBy: string): Promise<PasswordPolicy>;
    /**
     * Get policy history (for audit purposes)
     */
    getHistory(limit?: number): Promise<PasswordPolicy[]>;
}
//# sourceMappingURL=IPasswordPolicyRepository.d.ts.map