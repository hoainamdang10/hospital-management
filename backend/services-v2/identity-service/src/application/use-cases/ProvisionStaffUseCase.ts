/**
 * ProvisionStaffUseCase
 * Admin-only endpoint to create staff accounts (DOCTOR, NURSE, RECEPTIONIST, ADMIN)
 *
 * Flow:
 * 1. Admin creates staff account with email + role
 * 2. System generates invitation token (expires in 7 days)
 * 3. System sends invitation email
 * 4. Staff clicks link → sets password → activates account
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { ILogger } from '../services/ILogger';
import { IEmailService } from '../services/IEmailService';
import { Email } from '../../domain/value-objects/Email';
import * as crypto from 'crypto';
import { IEventPublisher } from '../services/IEventPublisher';
import { StaffInvitationCreatedEvent } from '../../domain/events/StaffInvitationCreatedEvent';

export interface ProvisionStaffRequest {
  email: string;
  fullName: string;
  roleType: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  phoneNumber?: string;
  requesterId: string; // Admin user ID
}

export interface ProvisionStaffResponse {
  success: boolean;
  userId?: string;
  invitationToken?: string;
  invitationUrl?: string;
  expiresAt?: Date;
  error?: string;
  errorCode?: string;
}

export class ProvisionStaffUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger,
    private readonly emailService: IEmailService,
    private readonly frontendUrl: string,
    private readonly eventPublisher?: IEventPublisher // Optional for backward compatibility
  ) {}

  async execute(request: ProvisionStaffRequest): Promise<ProvisionStaffResponse> {
    try {
      this.logger.info('Provisioning staff account', {
        email: request.email,
        roleType: request.roleType,
        requesterId: request.requesterId
      });

      // Validate input
      if (!request.email || !request.fullName || !request.roleType) {
        return {
          success: false,
          error: 'Email, full name, and role type are required',
          errorCode: 'INVALID_INPUT'
        };
      }

      // Validate role type (only staff roles allowed)
      // Normalize to uppercase for case-insensitive comparison
      const normalizedRole = request.roleType.toUpperCase() as 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
      const allowedRoles: Array<'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'> = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

      if (!allowedRoles.includes(normalizedRole)) {
        return {
          success: false,
          error: 'Invalid role type. Only staff roles are allowed.',
          errorCode: 'INVALID_ROLE'
        };
      }

      // Keep UPPERCASE for domain logic (matches HealthcareRoleType)
      // request.roleType stays as normalizedRole (UPPERCASE)

      // Check if email already exists
      const email = Email.create(request.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        this.logger.warn('Email already exists', {
          email: email.getMaskedEmail()
        });
        return {
          success: false,
          error: 'Email đã tồn tại trong hệ thống',
          errorCode: 'EMAIL_EXISTS'
        };
      }

      // Generate invitation token (expires in 7 days)
      const invitationToken = this.generateInvitationToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store invitation in staff_invitations table
      // Note: Convert to lowercase to match database constraint (consistent with user_profiles.role_type)
      await this.userRepository.storeStaffInvitation({
        email: request.email,
        role: normalizedRole.toLowerCase(), // Convert to lowercase for database
        invitedBy: request.requesterId,
        invitationToken,
        expiresAt,
        invitationData: {
          fullName: request.fullName,
          phoneNumber: request.phoneNumber
        }
      });

      // Generate invitation URL
      const invitationUrl = `${this.frontendUrl}/auth/activate?token=${invitationToken}`;

      this.logger.info('Staff invitation created successfully', {
        email: email.getMaskedEmail(),
        roleType: request.roleType,
        invitedBy: request.requesterId
      });

      // Send staff invitation email
      try {
        await this.emailService.sendStaffInvitationEmail({
          email: request.email,
          userName: request.fullName,
          role: request.roleType,
          invitationUrl,
          expiresAt
        });

        this.logger.info('Staff invitation email sent successfully', {
          email: email.getMaskedEmail()
        });
      } catch (error) {
        this.logger.error('Failed to send staff invitation email', {
          email: email.getMaskedEmail(),
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail invitation if email sending fails
        // Admin can manually send the invitation URL
      }

      // Publish StaffInvitationCreated event for Notification service to send email
      if (this.eventPublisher) {
        try {
          const event = new StaffInvitationCreatedEvent(
            request.email,
            request.roleType,
            request.requesterId,
            invitationToken,
            expiresAt
          );

          await this.eventPublisher.publishDomainEvents([event]);

          this.logger.info('Staff invitation event published', {
            email: email.getMaskedEmail()
          });
        } catch (error) {
          this.logger.error('Failed to publish staff invitation event', {
            email: email.getMaskedEmail(),
            error: error instanceof Error ? error.message : String(error)
          });
          // Don't fail invitation if event publishing fails
        }
      }

      return {
        success: true,
        invitationToken,
        invitationUrl,
        expiresAt
      };
    } catch (error) {
      this.logger.error('Provision staff use case error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: 'An unexpected error occurred while provisioning staff account',
        errorCode: 'PROVISION_ERROR'
      };
    }
  }

  /**
   * Generate secure invitation token
   */
  private generateInvitationToken(): string {
    // Generate 32-byte random token
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  }
}
