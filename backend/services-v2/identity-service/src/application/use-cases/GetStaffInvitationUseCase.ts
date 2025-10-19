/**
 * GetStaffInvitationUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Gets staff invitation details by ID
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface GetStaffInvitationRequest {
  invitationId: string;
  requesterId: string; // Admin who is requesting the details
}

export interface GetStaffInvitationResponse {
  success: boolean;
  invitation?: {
    id: string;
    email: string;
    role: string;
    invitedBy: string;
    invitationToken: string;
    expiresAt: Date;
    acceptedAt?: Date;
    acceptedBy?: string;
    status: string;
    invitationData?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    isExpired: boolean;
  };
  error?: string;
}

export class GetStaffInvitationUseCase {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger
  ) {}

  async execute(request: GetStaffInvitationRequest): Promise<GetStaffInvitationResponse> {
    try {
      this.logger.info('Getting staff invitation details', {
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

      // Fetch invitation from repository
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

      // Check if expired
      const now = new Date();
      const isExpired = invitation.expiresAt < now && invitation.status === 'PENDING';

      this.logger.info('Staff invitation details retrieved successfully', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        status: invitation.status,
        isExpired
      });

      return {
        success: true,
        invitation: {
          ...invitation,
          isExpired
        }
      };
    } catch (error) {
      this.logger.error('Failed to get staff invitation details', {
        invitationId: request.invitationId,
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Không thể lấy thông tin lời mời. Vui lòng thử lại sau.'
      };
    }
  }
}

