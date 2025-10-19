/**
 * ListStaffInvitationsUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Lists staff invitations with pagination and filters
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { getErrorMessage } from '../../utils/error-helper';

export interface ListStaffInvitationsRequest {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  email?: string;
  requesterId: string; // Admin who is requesting the list
}

export interface StaffInvitationDTO {
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
}

export interface ListStaffInvitationsResponse {
  success: boolean;
  invitations?: StaffInvitationDTO[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

export class ListStaffInvitationsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger
  ) {}

  async execute(request: ListStaffInvitationsRequest): Promise<ListStaffInvitationsResponse> {
    try {
      this.logger.info('Listing staff invitations', {
        requesterId: request.requesterId,
        page: request.page,
        limit: request.limit,
        filters: {
          status: request.status,
          role: request.role,
          email: request.email
        }
      });

      // Validate pagination
      const page = Math.max(1, request.page || 1);
      const limit = Math.min(100, Math.max(1, request.limit || 20));
      const offset = (page - 1) * limit;

      // Validate filters
      if (request.status && !['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'].includes(request.status)) {
        return {
          success: false,
          error: 'Invalid status filter. Must be one of: PENDING, ACCEPTED, EXPIRED, CANCELLED'
        };
      }

      if (request.role && !['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'].includes(request.role)) {
        return {
          success: false,
          error: 'Invalid role filter. Must be one of: ADMIN, DOCTOR, NURSE, RECEPTIONIST'
        };
      }

      // Fetch invitations from repository
      const result = await this.userRepository.listStaffInvitations({
        limit,
        offset,
        status: request.status,
        role: request.role,
        email: request.email
      });

      // Map to DTOs and add isExpired flag
      const now = new Date();
      const invitations: StaffInvitationDTO[] = result.invitations.map(inv => ({
        ...inv,
        isExpired: inv.expiresAt < now && inv.status === 'PENDING'
      }));

      const totalPages = Math.ceil(result.total / limit);

      this.logger.info('Staff invitations listed successfully', {
        requesterId: request.requesterId,
        count: invitations.length,
        total: result.total,
        page,
        totalPages
      });

      return {
        success: true,
        invitations,
        total: result.total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error('Failed to list staff invitations', {
        requesterId: request.requesterId,
        error: getErrorMessage(error)
      });

      return {
        success: false,
        error: 'Không thể lấy danh sách lời mời. Vui lòng thử lại sau.'
      };
    }
  }
}

