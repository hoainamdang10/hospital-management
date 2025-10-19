import { getErrorMessage } from '../../utils/error-helper';
/**
 * Resend Verification Email Use Case
 * Handles resending email verification tokens for both V1 and verify-first flows
 *
 * @author Hospital Management Team
 * @version 3.0.0 - Added verify-first flow support
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IUserRepository } from '../repositories/IUserRepository';
import { IEmailVerificationTokenRepository } from '../repositories/IEmailVerificationTokenRepository';
import { IPendingRegistrationRepository } from '../../domain/repositories/IPendingRegistrationRepository';
import { IEmailService } from '../services/IEmailService';
import { ICircuitBreaker } from '../services/ICircuitBreaker';
import { Email } from '../../domain/value-objects/Email';
import { EmailVerificationToken } from '../../domain/value-objects/EmailVerificationToken';
import { ILogger } from '../services/ILogger';
import jwt from 'jsonwebtoken';

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ResendVerificationEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class ResendVerificationEmailUseCase implements IUseCase<ResendVerificationEmailRequest, ResendVerificationEmailResponse> {
  constructor(
    private userRepository: IUserRepository,
    private emailVerificationTokenRepository: IEmailVerificationTokenRepository,
    private pendingRegistrationRepository: IPendingRegistrationRepository,
    private emailService: IEmailService,
    private logger: ILogger,
    private circuitBreaker: ICircuitBreaker,
    private jwtSecret: string,
    private frontendUrl: string
  ) {}

  async execute(request: ResendVerificationEmailRequest): Promise<ResendVerificationEmailResponse> {
    return await this.circuitBreaker.execute(
      async () => this.executeImpl(request),
      async () => {
        this.logger.error('Circuit breaker open for ResendVerificationEmailUseCase');
        return {
          success: false,
          message: 'Dịch vụ gửi lại email xác thực tạm thời không khả dụng. Vui lòng thử lại sau.',
          error: 'SERVICE_UNAVAILABLE'
        };
      }
    );
  }

  private async executeImpl(request: ResendVerificationEmailRequest): Promise<ResendVerificationEmailResponse> {
    try {
      this.logger.info('Processing resend verification email request', { email: request.email });

      // 1. Validate email format
      if (!request.email || !request.email.includes('@')) {
        return {
          success: false,
          message: 'Email không hợp lệ',
          error: 'INVALID_EMAIL'
        };
      }

      const email = Email.create(request.email);

      // 2. VERIFY-FIRST FLOW: Check pending_registrations first
      const pendingReg = await this.pendingRegistrationRepository.findByEmail(email);

      if (pendingReg) {
        this.logger.info('Found pending registration, resending verification email', {
          pendingRegistrationId: pendingReg.id,
          email: email.getMaskedEmail()
        });

        // Check if expired
        if (pendingReg.isExpired()) {
          this.logger.warn('Pending registration expired', {
            pendingRegistrationId: pendingReg.id
          });
          return {
            success: false,
            message: 'Đăng ký đã hết hạn. Vui lòng đăng ký lại.',
            error: 'REGISTRATION_EXPIRED'
          };
        }

        // Generate new verification token (24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const tokenPayload = {
          email: email.value,
          type: 'email_verification',
          pendingRegistrationId: pendingReg.id
        };

        const newToken = jwt.sign(tokenPayload, this.jwtSecret, {
          expiresIn: '24h'
        });

        // Update pending_registration with new token
        await this.pendingRegistrationRepository.updateToken(
          pendingReg.id,
          newToken,
          expiresAt
        );

        // Send verification email
        const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${newToken}`;
        await this.emailService.sendVerificationEmail({
          email: email.value,
          userName: pendingReg.userData.fullName,
          verificationUrl
        });

        this.logger.info('Verification email resent successfully (verify-first flow)', {
          pendingRegistrationId: pendingReg.id,
          email: email.getMaskedEmail()
        });

        return {
          success: true,
          message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
        };
      }

      // 3. V1 FLOW: Find user in user_profiles
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        // Security: Don't reveal if email exists or not
        this.logger.warn('User not found for resend verification', { email: request.email });
        return {
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi lại email xác thực.'
        };
      }

      // 4. Check if user is already verified (V1 flow)
      if (user.isEmailVerified) {
        this.logger.info('User already verified', { userId: user.id });
        return {
          success: false,
          message: 'Email đã được xác thực. Bạn có thể đăng nhập ngay.',
          error: 'ALREADY_VERIFIED'
        };
      }

      // 5. Check rate limiting (max 3 active tokens per user) - V1 flow
      const activeTokenCount = await this.emailVerificationTokenRepository.countActiveForUser(user.id);
      if (activeTokenCount >= 3) {
        this.logger.warn('Too many active tokens', { userId: user.id, activeTokenCount });
        return {
          success: false,
          message: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng kiểm tra email hoặc thử lại sau 1 giờ.',
          error: 'RATE_LIMIT_EXCEEDED'
        };
      }

      // 6. Invalidate all existing tokens for this user
      await this.emailVerificationTokenRepository.invalidateAllForUser(user.id);

      // 7. Generate new verification token
      const verificationToken = EmailVerificationToken.generate(
        user.id,
        email,
        this.jwtSecret,
        24 // 24 hours
      );

      // 8. Store new token in database
      await this.emailVerificationTokenRepository.store({
        userId: user.id,
        email: email.value,
        token: verificationToken.token,
        expiresAt: verificationToken.expiresAt
      });

      // 9. Send verification email
      const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${verificationToken.token}`;
      await this.emailService.sendVerificationEmail({
        email: email.value,
        userName: user.personalInfo.fullName,
        verificationUrl
      });

      this.logger.info('Verification email resent successfully (V1 flow)', {
        userId: user.id,
        email: email.value
      });

      return {
        success: true,
        message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.'
      };

    } catch (error) {
      this.logger.error('Resend verification email failed', { 
        email: request.email, 
        error: getErrorMessage(error) 
      });

      return {
        success: false,
        message: 'Gửi lại email xác thực thất bại. Vui lòng thử lại sau.',
        error: 'RESEND_FAILED'
      };
    }
  }
}

