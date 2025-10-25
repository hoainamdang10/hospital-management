/**
 * MockEmailService - Mock Email Service for Development/Testing
 * Implements IEmailService without actually sending emails
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Development/Testing
 */

import {
  IEmailService,
  EmailVerificationData,
  EmailSuccessData,
  StaffInvitationData
} from '../../application/services/IEmailService';
import { ILogger } from '../../application/services/ILogger';

/**
 * Mock Email Service
 * Logs email operations instead of sending real emails
 * Useful for development and testing environments
 */
export class MockEmailService implements IEmailService {
  constructor(private logger: ILogger) {
    this.logger.info('MockEmailService initialized - emails will be logged, not sent');
  }

  /**
   * Mock send verification email
   */
  async sendVerificationEmail(data: EmailVerificationData): Promise<void> {
    this.logger.info('MOCK: Verification email would be sent', {
      to: data.email,
      userName: data.userName,
      verificationUrl: data.verificationUrl,
      mockService: true
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock send verification success email
   */
  async sendVerificationSuccessEmail(data: EmailSuccessData): Promise<void> {
    this.logger.info('MOCK: Verification success email would be sent', {
      to: data.email,
      userName: data.userName,
      mockService: true
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock send password reset email
   */
  async sendPasswordResetEmail(email: string, resetUrl: string, userName: string): Promise<void> {
    this.logger.info('MOCK: Password reset email would be sent', {
      to: email,
      userName,
      resetUrl,
      mockService: true
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    this.logger.info('MOCK: Welcome email would be sent', {
      to: email,
      userName,
      mockService: true
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Mock send staff invitation email
   */
  async sendStaffInvitationEmail(data: StaffInvitationData): Promise<void> {
    this.logger.info('MOCK: Staff invitation email would be sent', {
      to: data.email,
      userName: data.userName,
      role: data.role,
      invitationUrl: data.invitationUrl,
      expiresAt: data.expiresAt,
      mockService: true
    });

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

