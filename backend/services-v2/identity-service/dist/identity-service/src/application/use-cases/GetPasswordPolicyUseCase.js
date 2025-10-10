"use strict";
/**
 * Get Password Policy Use Case
 * Retrieves the current active password policy
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPasswordPolicyUseCase = void 0;
const error_utils_1 = require("../utils/error-utils");
class GetPasswordPolicyUseCase {
    constructor(policyRepository, logger) {
        this.policyRepository = policyRepository;
        this.logger = logger;
    }
    async execute() {
        try {
            this.logger.info('Getting current password policy');
            const policy = await this.policyRepository.getCurrent();
            const description = policy.getStrengthDescription();
            return {
                success: true,
                policy: policy.toObject(),
                description
            };
        }
        catch (error) {
            this.logger.error('Error getting password policy:', error instanceof Error ? error : new Error(String(error)));
            throw new Error(`Failed to get password policy: ${(0, error_utils_1.getErrorMessage)(error)}`);
        }
    }
}
exports.GetPasswordPolicyUseCase = GetPasswordPolicyUseCase;
//# sourceMappingURL=GetPasswordPolicyUseCase.js.map