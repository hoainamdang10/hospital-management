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
import { Email } from '../../domain/value-objects/Email';
import * as crypto from 'crypto';
import { IEventPublisher } from '../../infrastructure/events/RabbitMQEventPublisher';
import { StaffInvitationCreatedEvent } from '../../domain/events/StaffInvitationCreatedEvent';

export interface ProvisionStaffRequest {
  email: string;
  fullName: string;
  roleType: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'BILLING_STAFF'; // All staff roles
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

      // Use normalized role for consistency
      request.roleType = normalizedRole;

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
      // Note: User profile will be created when staff accepts invitation and sets password
      await this.userRepository.storeStaffInvitation({
        email: request.email,
        role: request.roleType,
        invitedBy: request.requesterId,
        invitationToken,
        expiresAt,
        invitationData: {
          fullName: request.fullName,
          phoneNumber: request.phoneNumber
        }
      });

      // Generate invitation URL
      const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/activate?token=${invitationToken}`;

      this.logger.info('Staff invitation created successfully', {
        email: email.getMaskedEmail(),
        roleType: request.roleType,
        invitedBy: request.requesterId
      });

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

          await this.eventPublisher.publish({
            eventType: event.constructor.name,
            aggregateId: request.email,
            aggregateType: 'StaffInvitation',
            occurredAt: event.occurredAt,
            payload: {
              email: request.email,
              role: request.roleType,
              invitedBy: request.requesterId,
              invitationToken,
              expiresAt
            }
          });

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

