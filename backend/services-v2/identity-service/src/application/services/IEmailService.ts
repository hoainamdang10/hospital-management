/**
 * IEmailService - Application Service Interface
 * Defines contract for email operations
 * 
 * This interface follows Clean Architecture principles:
 * - Defined in Application layer
 * - Implemented by Infrastructure layer (ResendEmailService)
 * - Used by Use Cases
 * 
 * Benefits:
 * - Testability: Easy to mock for unit tests
 * - Flexibility: Can switch email providers (Resend, SendGrid, AWS SES)
 * - Dependency Inversion: Application doesn't depend on infrastructure
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Dependency Inversion Principle
 */

export interface EmailVerificationData {
  email: string;
  userName: string;
  verificationUrl: string;
}

export interface EmailSuccessData {
  email: string;
  userName: string;
}

export interface StaffInvitationData {
  email: string;
  userName: string;
  role: string;
  invitationUrl: string;
  expiresAt: Date;
}

/**
 * Email Service Interface
 * Handles email sending operations
 */
export interface IEmailService {
  /**
   * Send email verification email
   * Sends email with verification link to user
   * 
   * @param data Email verification data
   * @throws Error if email sending fails
   */
  sendVerificationEmail(data: EmailVerificationData): Promise<void>;

  /**
   * Send verification success notification
   * Sends confirmation email after successful verification
   * 
   * @param data Email success data
   * @throws Error if email sending fails
   */
  sendVerificationSuccessEmail(data: EmailSuccessData): Promise<void>;

  /**
   * Send password reset email
   * Sends email with password reset link
   * 
   * @param email User email
   * @param resetUrl Password reset URL
   * @param userName User's full name
   * @throws Error if email sending fails
   */
  sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    userName: string
  ): Promise<void>;

  /**
   * Send welcome email
   * Sends welcome email to new users
   *
   * @param email User email
   * @param userName User's full name
   * @throws Error if email sending fails
   */
  sendWelcomeEmail(email: string, userName: string): Promise<void>;

  /**
   * Send staff invitation email
   * Sends email with invitation link for staff to activate account
   *
   * @param data Staff invitation data
   * @throws Error if email sending fails
   */
  sendStaffInvitationEmail(data: StaffInvitationData): Promise<void>;
}

