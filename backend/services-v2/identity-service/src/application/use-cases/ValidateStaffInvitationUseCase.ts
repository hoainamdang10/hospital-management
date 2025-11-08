/**
 * ValidateStaffInvitationUseCase
 * Validates staff invitation token without accepting it
 * Used by frontend to check token validity before showing activation form
 *
 * Flow:
 * 1. Staff receives invitation email with token
 * 2. Staff clicks link → Frontend calls this endpoint
 * 3. System validates token and returns invitation details
 * 4. Frontend shows activation form if valid
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface ValidateStaffInvitationRequest {
  invitationToken: string;
}

export interface ValidateStaffInvitationResponse {
  success: boolean;
  isValid: boolean;
  invitation?: {
    email: string;
    role: string;
    fullName?: string;
    phoneNumber?: string;
    expiresAt: Date;
  };
  error?: string;
  errorCode?: string;
}

export class ValidateStaffInvitationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: ValidateStaffInvitationRequest): Promise<ValidateStaffInvitationResponse> {
    try {
      this.logger.info('Validating staff invitation token', {
        token: request.invitationToken.substring(0, 10) + '...'
      });

      // 1. Validate input
      if (!request.invitationToken || request.invitationToken.trim().length === 0) {
        return {
          success: false,
          isValid: false,
          error: 'Token không hợp lệ',
          errorCode: 'INVALID_TOKEN'
        };
      }

      // 2. Verify invitation token
      const invitation = await this.userRepository.verifyStaffInvitation(request.invitationToken);
      
      if (!invitation.isValid || !invitation.email || !invitation.role) {
        this.logger.warn('Invalid or expired invitation token', {
          token: request.invitationToken.substring(0, 10) + '...'
        });
        return {
          success: true,
          isValid: false,
          error: 'Liên kết mời không hợp lệ hoặc đã hết hạn',
          errorCode: 'INVALID_INVITATION'
        };
      }

      // 3. Extract invitation data
      const invitationData = invitation.invitationData || {};
      const fullName = invitationData.fullName as string | undefined;
      const phoneNumber = invitationData.phoneNumber as string | undefined;

      this.logger.info('Staff invitation token validated successfully', {
        email: invitation.email,
        role: invitation.role
      });

      return {
        success: true,
        isValid: true,
        invitation: {
          email: invitation.email,
          role: invitation.role,
          fullName,
          phoneNumber,
          expiresAt: new Date() // This will be replaced by actual expiry from DB
        }
      };

    } catch (error) {
      this.logger.error('Validate staff invitation failed', {
        error: getErrorMessage(error)
      });

      return {
        success: false,
        isValid: false,
        error: `Xác thực token thất bại: ${getErrorMessage(error)}`,
        errorCode: 'VALIDATION_FAILED'
      };
    }
  }
}
