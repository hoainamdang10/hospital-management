"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisionStaffUseCase = void 0;
const Email_1 = require("../../domain/value-objects/Email");
const crypto = __importStar(require("crypto"));
const StaffInvitationCreatedEvent_1 = require("../../domain/events/StaffInvitationCreatedEvent");
class ProvisionStaffUseCase {
    constructor(userRepository, logger, emailService, frontendUrl, eventPublisher) {
        this.userRepository = userRepository;
        this.logger = logger;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
        try {
            this.logger.info("Provisioning staff account", {
                email: request.email,
                roleType: request.roleType,
                requesterId: request.requesterId,
            });
            // Validate input
            if (!request.email || !request.fullName || !request.roleType) {
                return {
                    success: false,
                    error: "Email, full name, and role type are required",
                    errorCode: "INVALID_INPUT",
                };
            }
            // Validate role type (only staff roles allowed - scope reduced)
            // Normalize to uppercase for case-insensitive comparison
            const normalizedRole = request.roleType.toUpperCase();
            const allowedRoles = [
                "ADMIN",
                "DOCTOR",
                "RECEPTIONIST",
            ];
            if (!allowedRoles.includes(normalizedRole)) {
                return {
                    success: false,
                    error: "Invalid role type. Only ADMIN, DOCTOR, RECEPTIONIST roles are allowed.",
                    errorCode: "INVALID_ROLE",
                };
            }
            // Keep UPPERCASE for domain logic (matches HealthcareRoleType)
            // request.roleType stays as normalizedRole (UPPERCASE)
            // Check if email already exists
            const email = Email_1.Email.create(request.email);
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                this.logger.warn("Email already exists", {
                    email: email.getMaskedEmail(),
                });
                return {
                    success: false,
                    error: "Email đã tồn tại trong hệ thống",
                    errorCode: "EMAIL_EXISTS",
                };
            }
            // Generate invitation token (expires in 7 days)
            const invitationToken = this.generateInvitationToken();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            // Bổ sung dữ liệu chuyên môn mặc định để downstream (provider-staff) có đủ thông tin,
            // tránh fallback UI (GENERAL, license tạm, lịch làm việc cứng).
            const defaultProfessionalData = {
                departmentCode: "INTE", // Nội tổng quát mặc định
                specializationCode: "GENMED",
                specialization: "GENMED",
                specializationName: "General Medicine",
                title: "Bác sĩ",
                position: "Bác sĩ điều trị",
                licenseNumber: `TEMP-${invitationToken.slice(0, 8)}`,
                yearsOfExperience: 0,
                education: ["General Medicine"],
                employmentType: "full_time",
                workSchedule: {
                    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                    workingHours: { start: "08:00", end: "17:00" },
                    timeZone: "Asia/Ho_Chi_Minh",
                    isFlexible: false,
                },
            };
            // Merge với dữ liệu admin nhập (ưu tiên request)
            const mergedProfessionalData = {
                departmentCode: request.departmentCode ?? defaultProfessionalData.departmentCode,
                department: request.departmentCode ?? defaultProfessionalData.departmentCode, // compatibility key
                specializationCode: request.specializationCode ??
                    request.specialization ??
                    defaultProfessionalData.specializationCode,
                specialization: request.specialization ??
                    request.specializationCode ??
                    defaultProfessionalData.specialization,
                specializationName: request.specializationName ??
                    defaultProfessionalData.specializationName,
                title: request.title ?? defaultProfessionalData.title,
                position: request.position ?? defaultProfessionalData.position,
                licenseNumber: request.licenseNumber ?? defaultProfessionalData.licenseNumber,
                yearsOfExperience: request.yearsOfExperience ??
                    defaultProfessionalData.yearsOfExperience,
                education: request.education && request.education.length > 0
                    ? request.education
                    : defaultProfessionalData.education,
                employmentType: request.employmentType ?? defaultProfessionalData.employmentType,
                workSchedule: {
                    workingDays: request.workSchedule?.workingDays ??
                        defaultProfessionalData.workSchedule.workingDays,
                    workingHours: {
                        start: request.workSchedule?.workingHours?.start ??
                            defaultProfessionalData.workSchedule.workingHours.start,
                        end: request.workSchedule?.workingHours?.end ??
                            defaultProfessionalData.workSchedule.workingHours.end,
                    },
                    timeZone: request.workSchedule?.timeZone ??
                        defaultProfessionalData.workSchedule.timeZone,
                    isFlexible: request.workSchedule?.isFlexible ??
                        defaultProfessionalData.workSchedule.isFlexible,
                },
            };
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
                    phoneNumber: request.phoneNumber,
                    ...mergedProfessionalData,
                },
            });
            // Generate invitation URL
            const invitationUrl = `${this.frontendUrl}/auth/activate?token=${invitationToken}`;
            this.logger.info("Staff invitation created successfully", {
                email: email.getMaskedEmail(),
                roleType: request.roleType,
                invitedBy: request.requesterId,
            });
            // Send staff invitation email
            try {
                await this.emailService.sendStaffInvitationEmail({
                    email: request.email,
                    userName: request.fullName,
                    role: request.roleType,
                    invitationUrl,
                    expiresAt,
                });
                this.logger.info("Staff invitation email sent successfully", {
                    email: email.getMaskedEmail(),
                });
            }
            catch (error) {
                this.logger.error("Failed to send staff invitation email", {
                    email: email.getMaskedEmail(),
                    error: error instanceof Error ? error.message : String(error),
                });
                // Don't fail invitation if email sending fails
                // Admin can manually send the invitation URL
            }
            // Publish StaffInvitationCreated event for Notification service to send email
            if (this.eventPublisher) {
                try {
                    const event = new StaffInvitationCreatedEvent_1.StaffInvitationCreatedEvent(request.email, request.roleType, request.requesterId, invitationToken, expiresAt);
                    await this.eventPublisher.publishDomainEvents([event]);
                    this.logger.info("Staff invitation event published", {
                        email: email.getMaskedEmail(),
                    });
                }
                catch (error) {
                    this.logger.error("Failed to publish staff invitation event", {
                        email: email.getMaskedEmail(),
                        error: error instanceof Error ? error.message : String(error),
                    });
                    // Don't fail invitation if event publishing fails
                }
            }
            return {
                success: true,
                invitationToken,
                invitationUrl,
                expiresAt,
            };
        }
        catch (error) {
            this.logger.error("Provision staff use case error", {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            return {
                success: false,
                error: "An unexpected error occurred while provisioning staff account",
                errorCode: "PROVISION_ERROR",
            };
        }
    }
    /**
     * Generate secure invitation token
     */
    generateInvitationToken() {
        // Generate 32-byte random token
        const token = crypto.randomBytes(32).toString("hex");
        return token;
    }
}
exports.ProvisionStaffUseCase = ProvisionStaffUseCase;
//# sourceMappingURL=ProvisionStaffUseCase.js.map