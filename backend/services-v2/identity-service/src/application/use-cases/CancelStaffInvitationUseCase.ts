/**
 * CancelStaffInvitationUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Cancels a pending staff invitation
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface CancelStaffInvitationRequest {
  invitationId: string;
  requesterId: string; // Admin who is cancelling the invitation
  reason?: string; // Optional cancellation reason
}

export interface CancelStaffInvitationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class CancelStaffInvitationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger
  ) {}

  async execute(request: CancelStaffInvitationRequest): Promise<CancelStaffInvitationResponse> {
    try {
      this.logger.info('Cancelling staff invitation', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        reason: request.reason
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
        this.logger.warn('Cannot cancel non-pending invitation', {
          invitationId: request.invitationId,
          requesterId: request.requesterId,
          currentStatus: invitation.status
        });

        return {
          success: false,
          error: `Không thể hủy lời mời với trạng thái ${invitation.status}. Chỉ có thể hủy lời mời đang chờ (PENDING).`
        };
      }

      // Cancel the invitation
      await this.userRepository.cancelStaffInvitation(request.invitationId, request.requesterId);

      this.logger.info('Staff invitation cancelled successfully', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        email: invitation.email,
        role: invitation.role
      });

      return {
        success: true,
        message: 'Lời mời đã được hủy thành công'
      };
    } catch (error) {
      this.logger.error('Failed to cancel staff invitation', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Không thể hủy lời mời. Vui lòng thử lại sau.'
      };
    }
  }
}

