/**
 * ResendStaffInvitationUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Resends a staff invitation with new token and expiry
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IEmailService } from '../services/IEmailService';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface ResendStaffInvitationRequest {
  invitationId: string;
  requesterId: string; // Admin who is resending the invitation
}

export interface ResendStaffInvitationResponse {
  success: boolean;
  invitationUrl?: string;
  expiresAt?: Date;
  message?: string;
  error?: string;
}

export class ResendStaffInvitationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private logger: ILogger,
    private frontendUrl: string
  ) {}

  async execute(request: ResendStaffInvitationRequest): Promise<ResendStaffInvitationResponse> {
    try {
      this.logger.info('Resending staff invitation', {
        invitationId: request.invitationId,
        requesterId: request.requesterId
      });

      // Validate invitation ID (UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(request.invitationId)) {
        return {
          success: false,
          error: 'ID lời mời không hợp lệ'
        };
      }

      // Check if invitation exists and is pending
      const invitation = await this.userRepository.getStaffInvitationById(request.invitationId);

      if (!invitation) {
        this.logger.warn('Staff invitation not found', {
          invitationId: request.invitationId,
          requesterId: request.requesterId
        });

        return {
          success: false,
          error: 'Không tìm thấy lời mời'
        };
      }

      if (invitation.status !== 'PENDING') {
        this.logger.warn('Cannot resend non-pending invitation', {
          invitationId: request.invitationId,
          requesterId: request.requesterId,
          currentStatus: invitation.status
        });

        return {
          success: false,
          error: `Không thể gửi lại lời mời với trạng thái ${invitation.status}. Chỉ có thể gửi lại lời mời đang chờ (PENDING).`
        };
      }

      // Resend invitation (generates new token and expiry)
      const result = await this.userRepository.resendStaffInvitation(request.invitationId);

      // Build invitation URL
      const invitationUrl = `${this.frontendUrl}/auth/activate?token=${result.invitationToken}`;

      // Send email
      try {
        await this.emailService.sendStaffInvitationEmail({
          email: invitation.email,
          userName: (invitation.invitationData?.fullName as string) || invitation.email,
          role: invitation.role,
          invitationUrl,
          expiresAt: result.expiresAt
        });

        this.logger.info('Staff invitation email resent successfully', {
          invitationId: request.invitationId,
          requesterId: request.requesterId,
          email: invitation.email
        });
      } catch (emailError) {
        this.logger.error('Failed to send staff invitation email', {
          invitationId: request.invitationId,
          requesterId: request.requesterId,
          email: invitation.email,
          error: getErrorMessage(emailError)
        });
        // Don't fail the entire operation if email sending fails
        // Admin can manually send the invitation URL
      }

      this.logger.info('Staff invitation resent successfully', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        email: invitation.email,
        role: invitation.role,
        expiresAt: result.expiresAt
      });

      return {
        success: true,
        invitationUrl,
        expiresAt: result.expiresAt,
        message: 'Lời mời đã được gửi lại thành công'
      };
    } catch (error) {
      this.logger.error('Failed to resend staff invitation', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Không thể gửi lại lời mời. Vui lòng thử lại sau.'
      };
    }
  }
}

