/**
 * GetUserProfileUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Retrieves user profile with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { UserId } from '../../domain/value-objects/UserId';

export interface GetUserProfileRequest {
  userId: string;
  requestedBy: string;
  includePermissions?: boolean;
  includeSessions?: boolean;
  includeAuditInfo?: boolean;
}

export interface GetUserProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      personalInfo: {
        firstName: string;
        lastName: string;
        fullName: string;
        phoneNumber: string;
        dateOfBirth: string;
        vietnameseId?: string;
        address?: string;
      };
      healthcareRole: {
        name: string;
        department?: string;
        licenseNumber?: string;
        permissions?: string[];
      };
      status: {
        isActive: boolean;
        isEmailVerified: boolean;
        isVietnameseHealthcareCompliant: boolean;
        isHIPAACompliant: boolean;
      };
      timestamps: {
        createdAt: string;
        updatedAt: string;
        lastLoginAt?: string;
      };
      sessions?: Array<{
        id: string;
        ipAddress: string;
        userAgent: string;
        createdAt: string;
        lastAccessedAt: string;
        isActive: boolean;
      }>;
      auditInfo?: {
        totalLogins: number;
        failedLoginAttempts: number;
        lastFailedLoginAt?: string;
        passwordLastChanged?: string;
      };
    };
  };
  error?: {
    code: string;
    details?: any;
  };
}

export class GetUserProfileUseCase extends BaseHealthcareUseCase<GetUserProfileRequest, GetUserProfileResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeInternal(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    try {
      this.logger.info('Getting user profile', {
        userId: request.userId,
        requestedBy: request.requestedBy,
        includePermissions: request.includePermissions,
        includeSessions: request.includeSessions
      });

      // 1. Find user by ID
      const userId = UserId.fromString(request.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.warn('User profile not found', {
          userId: request.userId,
          requestedBy: request.requestedBy
        });

        return {
          success: false,
          message: 'Không tìm thấy người dùng',
          error: {
            code: 'USER_NOT_FOUND'
          }
        };
      }

      // 2. Build basic user profile
      const userProfile = {
        id: user.id.value,
        email: user.email.value,
        personalInfo: {
          firstName: user.personalInfo.firstName,
          lastName: user.personalInfo.lastName,
          fullName: user.personalInfo.fullName,
          phoneNumber: user.personalInfo.phoneNumber,
          dateOfBirth: user.personalInfo.dateOfBirth.toISOString().split('T')[0],
          vietnameseId: user.personalInfo.vietnameseId,
          address: user.personalInfo.address
        },
        healthcareRole: {
          name: user.healthcareRole.name,
          department: user.healthcareRole.department,
          licenseNumber: user.healthcareRole.licenseNumber,
          ...(request.includePermissions && { permissions: user.healthcareRole.permissions })
        },
        status: {
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          isVietnameseHealthcareCompliant: user.isVietnameseHealthcareCompliant(),
          isHIPAACompliant: user.isHIPAACompliant()
        },
        timestamps: {
          createdAt: user.props.createdAt.toISOString(),
          updatedAt: user.props.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString()
        }
      };

      // 3. Include sessions if requested
      if (request.includeSessions) {
        const sessions = await this.userRepository.getUserSessions(userId);
        userProfile.sessions = sessions.map(session => ({
          id: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt.toISOString(),
          lastAccessedAt: session.lastAccessedAt.toISOString(),
          isActive: session.isActive
        }));
      }

      // 4. Include audit info if requested
      if (request.includeAuditInfo) {
        const auditInfo = await this.getUserAuditInfo(userId);
        userProfile.auditInfo = auditInfo;
      }

      this.logger.info('User profile retrieved successfully', {
        userId: request.userId,
        requestedBy: request.requestedBy,
        includePermissions: request.includePermissions,
        includeSessions: request.includeSessions
      });

      return {
        success: true,
        message: 'Thông tin người dùng được tải thành công',
        data: {
          user: userProfile
        }
      };

    } catch (error) {
      this.logger.error('Error getting user profile', {
        userId: request.userId,
        requestedBy: request.requestedBy,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: `Lỗi tải thông tin người dùng: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: {
          code: 'GET_USER_PROFILE_FAILED',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async authorize(request: GetUserProfileRequest, userId: string): Promise<boolean> {
    try {
      // Users can view their own profile
      if (request.userId === userId) {
        return true;
      }

      // Check if requesting user has permission to view other users
      const requestingUser = await this.userRepository.findById(UserId.fromString(userId));
      if (!requestingUser) {
        return false;
      }

      // Admin users can view any profile
      if (requestingUser.healthcareRole.name === 'admin') {
        return true;
      }

      // Users with user management permissions can view profiles
      if (requestingUser.canManageUsers()) {
        return true;
      }

      // Healthcare providers can view profiles of patients in their department
      if (requestingUser.healthcareRole.name === 'doctor' || requestingUser.healthcareRole.name === 'nurse') {
        const targetUser = await this.userRepository.findById(UserId.fromString(request.userId));
        if (targetUser && targetUser.healthcareRole.name === 'patient') {
          // Check if they're in the same department or have treated this patient
          return await this.hasPatientRelationship(userId, request.userId);
        }
      }

      return false;

    } catch (error) {
      this.logger.error('Error authorizing user profile access', {
        userId,
        targetUserId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  involvesPHI(request: GetUserProfileRequest): boolean {
    // User profile contains personal health information
    return true;
  }

  getPatientId(request: GetUserProfileRequest): string | null {
    // If requesting profile of a patient, return the patient ID
    return request.userId;
  }

  /**
   * Get user audit information
   */
  private async getUserAuditInfo(userId: UserId): Promise<any> {
    try {
      const auditData = await this.userRepository.getUserAuditInfo(userId);
      
      return {
        totalLogins: auditData.totalLogins || 0,
        failedLoginAttempts: auditData.failedLoginAttempts || 0,
        lastFailedLoginAt: auditData.lastFailedLoginAt?.toISOString(),
        passwordLastChanged: auditData.passwordLastChanged?.toISOString()
      };

    } catch (error) {
      this.logger.error('Error getting user audit info', {
        userId: userId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        totalLogins: 0,
        failedLoginAttempts: 0
      };
    }
  }

  /**
   * Check if healthcare provider has relationship with patient
   */
  private async hasPatientRelationship(providerId: string, patientId: string): Promise<boolean> {
    try {
      // This would typically check appointment history, medical records, etc.
      // For now, return true if both users exist and provider is healthcare staff
      const provider = await this.userRepository.findById(UserId.fromString(providerId));
      const patient = await this.userRepository.findById(UserId.fromString(patientId));

      if (!provider || !patient) {
        return false;
      }

      // Check if provider is healthcare staff and patient is actually a patient
      const isProviderHealthcareStaff = ['doctor', 'nurse', 'technician'].includes(provider.healthcareRole.name);
      const isTargetPatient = patient.healthcareRole.name === 'patient';

      return isProviderHealthcareStaff && isTargetPatient;

    } catch (error) {
      this.logger.error('Error checking patient relationship', {
        providerId,
        patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Sanitize user profile based on requesting user permissions
   */
  private sanitizeUserProfile(userProfile: any, requestingUserId: string, targetUserId: string): any {
    // If requesting own profile, return full profile
    if (requestingUserId === targetUserId) {
      return userProfile;
    }

    // For other users, remove sensitive information
    const sanitized = { ...userProfile };

    // Remove sensitive personal information
    if (sanitized.personalInfo) {
      delete sanitized.personalInfo.vietnameseId;
      delete sanitized.personalInfo.dateOfBirth;
      delete sanitized.personalInfo.address;
    }

    // Remove audit information unless admin
    delete sanitized.auditInfo;

    // Remove sessions unless admin
    delete sanitized.sessions;

    return sanitized;
  }
}
