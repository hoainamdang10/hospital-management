"use strict";
/**
 * AcceptStaffInvitationUseCase
 * Handles staff account activation from invitation link
 *
 * Flow:
 * 1. Staff receives invitation email with token
 * 2. Staff clicks link and provides password
 * 3. System verifies token validity
 * 4. System creates auth user + profile
 * 5. System marks invitation as used
 * 6. System publishes UserCreated and UserActivated events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptStaffInvitationUseCase = void 0;
const Email_1 = require("../../domain/value-objects/Email");
const error_helper_1 = require("../../utils/error-helper");
class AcceptStaffInvitationUseCase {
    constructor(userRepository, logger, eventPublisher) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        try {
            this.logger.info('Processing staff invitation acceptance', {
                token: request.invitationToken.substring(0, 10) + '...'
            });
            // 1. Validate input
            const validationError = this.validateRequest(request);
            if (validationError) {
                return {
                    success: false,
                    error: validationError,
                    errorCode: 'VALIDATION_ERROR'
                };
            }
            // 2. Verify invitation token
            const invitation = await this.userRepository.verifyStaffInvitation(request.invitationToken);
            if (!invitation.isValid || !invitation.email || !invitation.role) {
                this.logger.warn('Invalid or expired invitation token', {
                    token: request.invitationToken.substring(0, 10) + '...'
                });
                return {
                    success: false,
                    error: 'Liên kết mời không hợp lệ hoặc đã hết hạn',
                    errorCode: 'INVALID_INVITATION'
                };
            }
            // 3. Check if user already exists
            const email = Email_1.Email.create(invitation.email);
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                this.logger.warn('User already exists for invitation', {
                    email: invitation.email
                });
                return {
                    success: false,
                    error: 'Tài khoản đã được kích hoạt trước đó',
                    errorCode: 'USER_ALREADY_EXISTS'
                };
            }
            // 4. Create auth user + profile
            const user = await this.userRepository.createAuthUser({
                email: invitation.email,
                password: request.password,
                fullName: request.fullName,
                roleType: invitation.role,
                phoneNumber: request.phoneNumber,
                emailConfirm: true, // Staff accounts are pre-verified
                metadata: {
                    invitationToken: request.invitationToken,
                    activatedViaInvitation: true,
                    invitationData: invitation.invitationData
                }
            });
            this.logger.info('Staff account created successfully', {
                userId: user.id,
                email: invitation.email,
                role: invitation.role
            });
            // 5. Mark invitation as used
            try {
                await this.userRepository.markInvitationAsUsed(request.invitationToken, user.id);
            }
            catch (error) {
                this.logger.error('Failed to mark invitation as used', {
                    userId: user.id,
                    error: (0, error_helper_1.getErrorMessage)(error)
                });
                // Don't fail the whole process if this fails
            }
            // 6. Publish domain events
            if (this.eventPublisher) {
                try {
                    const domainEvents = user.getUncommittedEvents();
                    await this.eventPublisher.publishDomainEvents(domainEvents);
                    user.markEventsAsCommitted();
                    this.logger.info('Domain events published for staff activation', {
                        userId: user.id,
                        eventCount: domainEvents.length
                    });
                }
                catch (error) {
                    this.logger.error('Failed to publish domain events', {
                        userId: user.id,
                        error: (0, error_helper_1.getErrorMessage)(error)
                    });
                    // Don't fail activation if event publishing fails
                }
            }
            return {
                success: true,
                userId: user.id,
                email: user.email.value,
                role: invitation.role,
                message: 'Tài khoản nhân viên đã được kích hoạt thành công'
            };
        }
        catch (error) {
            this.logger.error('Staff invitation acceptance failed', {
                error: (0, error_helper_1.getErrorMessage)(error)
            });
            return {
                success: false,
                error: `Kích hoạt tài khoản thất bại: ${(0, error_helper_1.getErrorMessage)(error)}`,
                errorCode: 'ACTIVATION_FAILED'
            };
        }
    }
    validateRequest(request) {
        if (!request.invitationToken || request.invitationToken.trim().length === 0) {
            return 'Token mời không hợp lệ';
        }
        if (!request.password || request.password.length < 8) {
            return 'Mật khẩu phải có ít nhất 8 ký tự';
        }
        if (request.password !== request.confirmPassword) {
            return 'Mật khẩu xác nhận không khớp';
        }
        if (!request.fullName || request.fullName.trim().length < 2) {
            return 'Họ tên phải có ít nhất 2 ký tự';
        }
        if (request.phoneNumber && !/^[0-9]{10,11}$/.test(request.phoneNumber)) {
            return 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)';
        }
        return null;
    }
}
exports.AcceptStaffInvitationUseCase = AcceptStaffInvitationUseCase;
//# sourceMappingURL=AcceptStaffInvitationUseCase.js.map