/**
 * Get Password Policy Use Case
 * Retrieves the current active password policy
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IPasswordPolicyRepository } from '../../domain/repositories/IPasswordPolicyRepository';
import { PasswordPolicyProps } from '../../domain/value-objects/PasswordPolicy';

export interface GetPasswordPolicyResponse {
  success: boolean;
  policy: PasswordPolicyProps;
  description: string;
}

export class GetPasswordPolicyUseCase {
  constructor(
    private readonly policyRepository: IPasswordPolicyRepository,
    private readonly logger: any
  ) {}

  async execute(): Promise<GetPasswordPolicyResponse> {
    try {
      this.logger.info('Getting current password policy');

      const policy = await this.policyRepository.getCurrent();
      const description = policy.getStrengthDescription();

      return {
        success: true,
        policy: policy.toObject(),
        description
      };
    } catch (error: any) {
      this.logger.error('Error getting password policy:', error);
      throw new Error(`Failed to get password policy: ${error.message}`);
    }
  }
}

