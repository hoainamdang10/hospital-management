/**
 * Auth Controller - Presentation Layer
 * Comprehensive authentication endpoints with Supabase integration
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Supabase Auth, Vietnamese Localization, Healthcare Security
 */

import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { ILogger } from "../../../../shared/infrastructure/logging/logger.interface";
import { AuthenticateUserUseCase } from "../../application/use-cases/authenticate-user.use-case";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/refresh-token.use-case";
import { RegisterUserUseCase } from "../../application/use-cases/register-user.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case";
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.use-case";

export interface AuthControllerDependencies {
  authenticateUserUseCase: AuthenticateUserUseCase;
  registerUserUseCase: RegisterUserUseCase;
  refreshTokenUseCase: RefreshTokenUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  logger: ILogger;
}

/**
 * Auth Controller
 * Handles all authentication-related HTTP requests
 */
export class AuthController {
  private readonly authenticateUserUseCase: AuthenticateUserUseCase;
  private readonly registerUserUseCase: RegisterUserUseCase;
  private readonly refreshTokenUseCase: RefreshTokenUseCase;
  private readonly resetPasswordUseCase: ResetPasswordUseCase;
  private readonly verifyEmailUseCase: VerifyEmailUseCase;
  private readonly getCurrentUserUseCase: GetCurrentUserUseCase;
  private readonly logger: ILogger;

  constructor(dependencies: AuthControllerDependencies) {
    this.authenticateUserUseCase = dependencies.authenticateUserUseCase;
    this.registerUserUseCase = dependencies.registerUserUseCase;
    this.refreshTokenUseCase = dependencies.refreshTokenUseCase;
    this.resetPasswordUseCase = dependencies.resetPasswordUseCase;
    this.verifyEmailUseCase = dependencies.verifyEmailUseCase;
    this.getCurrentUserUseCase = dependencies.getCurrentUserUseCase;
    this.logger = dependencies.logger;
  }

  /**
   * Login endpoint
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu đăng nhập không hợp lệ",
          code: "VALIDATION_ERROR",
          errors: errors.array().map((error) => ({
            field: error.param,
            message: this.translateValidationError(error.msg),
            value: error.value,
          })),
          correlationId,
        });
        return;
      }

      const { email, password } = req.body;

      // Execute authentication use case
      const result = await this.authenticateUserUseCase.execute({
        email,
        password,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
        deviceInfo: {
          type: this.detectDeviceType(req.headers["user-agent"] || ""),
          os: this.detectOS(req.headers["user-agent"] || ""),
          browser: this.detectBrowser(req.headers["user-agent"] || ""),
        },
      });

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      // Set secure HTTP-only cookie for refresh token
      res.cookie("refreshToken", result.tokens!.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: result.user,
          accessToken: result.tokens!.accessToken,
          expiresAt: result.tokens!.expiresAt,
          metadata: result.metadata,
        },
        correlationId,
      });
    } catch (error) {
      this.logger.error("Login controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình đăng nhập",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Register endpoint
   * POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu đăng ký không hợp lệ",
          code: "VALIDATION_ERROR",
          errors: errors.array().map((error) => ({
            field: error.param,
            message: this.translateValidationError(error.msg),
            value: error.value,
          })),
          correlationId,
        });
        return;
      }

      const { email, password, fullName, phoneNumber, role, department } =
        req.body;

      // Execute registration use case
      const result = await this.registerUserUseCase.execute({
        email,
        password,
        profile: {
          fullName,
          phoneNumber,
          department,
        },
        role: role || "patient", // Default to patient role
        registeredBy: req.user?.id, // If admin is registering
        metadata: {
          registrationSource: "web",
          userAgent: req.headers["user-agent"],
          ipAddress: req.ip,
        },
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message:
          "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
        data: {
          user: result.user,
          requiresEmailVerification: result.requiresEmailVerification,
        },
        correlationId,
      });
    } catch (error) {
      this.logger.error("Register controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình đăng ký",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Logout endpoint
   * POST /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      // Clear refresh token cookie
      res.clearCookie("refreshToken");

      // Note: Supabase handles session invalidation automatically
      // when the client discards the token

      res.status(200).json({
        success: true,
        message: "Đăng xuất thành công",
        correlationId,
      });
    } catch (error) {
      this.logger.error("Logout controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình đăng xuất",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Refresh token endpoint
   * POST /auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token không được cung cấp",
          code: "MISSING_REFRESH_TOKEN",
          correlationId,
        });
        return;
      }

      // Execute refresh token use case
      const result = await this.refreshTokenUseCase.execute({
        refreshToken,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      });

      if (!result.success) {
        res.clearCookie("refreshToken");
        res.status(401).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      // Update refresh token cookie
      res.cookie("refreshToken", result.tokens!.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: "Token đã được làm mới",
        data: {
          accessToken: result.tokens!.accessToken,
          expiresAt: result.tokens!.expiresAt,
        },
        correlationId,
      });
    } catch (error) {
      this.logger.error("Refresh token controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình làm mới token",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Forgot password endpoint
   * POST /auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
          code: "VALIDATION_ERROR",
          errors: errors.array(),
          correlationId,
        });
        return;
      }

      const { email } = req.body;

      // Execute reset password use case
      const result = await this.resetPasswordUseCase.execute({
        email,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password`,
      });

      // Always return success for security (don't reveal if email exists)
      res.status(200).json({
        success: true,
        message:
          "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
        correlationId,
      });
    } catch (error) {
      this.logger.error("Forgot password controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình xử lý yêu cầu",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Reset password endpoint
   * POST /auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          code: "VALIDATION_ERROR",
          errors: errors.array(),
          correlationId,
        });
        return;
      }

      const { token, newPassword } = req.body;

      // Execute reset password use case
      const result = await this.resetPasswordUseCase.executeReset({
        token,
        newPassword,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Mật khẩu đã được đặt lại thành công",
        correlationId,
      });
    } catch (error) {
      this.logger.error("Reset password controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình đặt lại mật khẩu",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Verify email endpoint
   * POST /auth/verify-email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      const { token, type = "signup" } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token xác thực không được cung cấp",
          code: "MISSING_TOKEN",
          correlationId,
        });
        return;
      }

      // Execute verify email use case
      const result = await this.verifyEmailUseCase.execute({
        token,
        type: type as "signup" | "recovery",
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Email đã được xác thực thành công",
        data: result.user,
        correlationId,
      });
    } catch (error) {
      this.logger.error("Verify email controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình xác thực email",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Get current user endpoint
   * GET /auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers["x-correlation-id"] as string;

    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "Người dùng chưa được xác thực",
          code: "UNAUTHENTICATED",
          correlationId,
        });
        return;
      }

      // Execute get current user use case
      const result = await this.getCurrentUserUseCase.execute({
        userId: req.user.id,
      });

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error!.message,
          messageVietnamese: result.error!.messageVietnamese,
          code: result.error!.code,
          correlationId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.user,
        correlationId,
      });
    } catch (error) {
      this.logger.error("Get current user controller error", {
        error: error.message,
        stack: error.stack,
        correlationId,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống trong quá trình lấy thông tin người dùng",
        code: "INTERNAL_ERROR",
        correlationId,
      });
    }
  }

  /**
   * Validation rules for login
   */
  static getLoginValidation() {
    return [
      body("email")
        .isEmail()
        .withMessage("Email không hợp lệ")
        .normalizeEmail(),
      body("password")
        .isLength({ min: 8 })
        .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),
    ];
  }

  /**
   * Validation rules for registration
   */
  static getRegistrationValidation() {
    return [
      body("email")
        .isEmail()
        .withMessage("Email không hợp lệ")
        .normalizeEmail(),
      body("password")
        .isLength({ min: 8 })
        .withMessage("Mật khẩu phải có ít nhất 8 ký tự")
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
        )
        .withMessage(
          "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt"
        ),
      body("fullName")
        .isLength({ min: 2, max: 100 })
        .withMessage("Họ tên phải có từ 2-100 ký tự")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Họ tên chỉ được chứa chữ cái và khoảng trắng"),
      body("phoneNumber")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Số điện thoại phải có 10 chữ số và bắt đầu bằng 0"),
      body("role")
        .optional()
        .isIn([
          "admin",
          "doctor",
          "nurse",
          "patient",
          "receptionist",
          "pharmacist",
        ])
        .withMessage("Vai trò không hợp lệ"),
    ];
  }

  /**
   * Helper methods
   */
  private translateValidationError(error: string): string {
    const translations: Record<string, string> = {
      "Invalid value": "Giá trị không hợp lệ",
      "Invalid email": "Email không hợp lệ",
      "Password too short": "Mật khẩu quá ngắn",
      "Field is required": "Trường này là bắt buộc",
    };

    return translations[error] || error;
  }

  private detectDeviceType(userAgent: string): "web" | "mobile" | "tablet" {
    if (/Mobile|Android|iPhone/i.test(userAgent)) return "mobile";
    if (/Tablet|iPad/i.test(userAgent)) return "tablet";
    return "web";
  }

  private detectOS(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return "Windows";
    if (/Mac/i.test(userAgent)) return "macOS";
    if (/Linux/i.test(userAgent)) return "Linux";
    if (/Android/i.test(userAgent)) return "Android";
    if (/iOS/i.test(userAgent)) return "iOS";
    return "Unknown";
  }

  private detectBrowser(userAgent: string): string {
    if (/Chrome/i.test(userAgent)) return "Chrome";
    if (/Firefox/i.test(userAgent)) return "Firefox";
    if (/Safari/i.test(userAgent)) return "Safari";
    if (/Edge/i.test(userAgent)) return "Edge";
    return "Unknown";
  }
}
