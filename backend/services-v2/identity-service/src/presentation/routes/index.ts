/**
 * Routes Setup - Presentation Layer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { Express, Router } from "express";
import { body, validationResult } from "express-validator";
import { DIContainer } from "../../../shared/infrastructure/di/container";
import { ServiceTokens } from "../../infrastructure/di/setup";

export function setupRoutes(app: Express, container: DIContainer): void {
  const apiRouter = Router();

  // Validation middleware
  const handleValidationErrors = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: errors.array().map((error: any) => ({
          field: error.param,
          message: error.msg,
          value: error.value,
        })),
      });
    }
    next();
  };

  // Authentication validation rules
  const loginValidation = [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự"),
  ];

  const registerValidation = [
    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      ),
    body("fullName")
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2-100 ký tự"),
    body("phoneNumber")
      .optional()
      .matches(/^0\d{9}$/)
      .withMessage("Số điện thoại phải có 10 chữ số bắt đầu bằng 0"),
    body("role")
      .optional()
      .isIn(["admin", "doctor", "patient", "receptionist"])
      .withMessage("Vai trò không hợp lệ"),
  ];

  // =====================================================
  // AUTHENTICATION ENDPOINTS
  // =====================================================

  // POST /api/v1/auth/login - User login
  apiRouter.post(
    "/auth/login",
    loginValidation,
    handleValidationErrors,
    async (req, res) => {
      try {
        const { email, password, rememberMe } = req.body;
        const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
        const userAgent = req.headers["user-agent"] || "unknown";

        // Get authentication use case from container
        const authenticateUserUseCase = container.get(ServiceTokens.AUTHENTICATE_USER_USE_CASE);

        const result = await authenticateUserUseCase.execute({
          email,
          password,
          ipAddress,
          userAgent,
          rememberMe: rememberMe || false
        });

        if (!result.success) {
          return res.status(401).json({
            success: false,
            message: result.message,
            error: result.error
          });
        }

        res.json({
          success: true,
          message: result.message,
          data: result.data
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi hệ thống",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/v1/auth/register - User registration
  apiRouter.post(
    "/auth/register",
    registerValidation,
    handleValidationErrors,
    async (req, res) => {
      try {
        const {
          email,
          password,
          fullName,
          phoneNumber,
          dateOfBirth,
          role = "patient",
        } = req.body;

        // Get create user use case from container
        const createUserUseCase = container.get(ServiceTokens.CREATE_USER_USE_CASE);

        // Parse full name into first and last name
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = await createUserUseCase.execute({
          email,
          password,
          personalInfo: {
            firstName,
            lastName,
            phoneNumber: phoneNumber || '',
            dateOfBirth: dateOfBirth || new Date().toISOString(),
          },
          healthcareRole: {
            name: role,
            permissions: role === 'admin' ? ['*'] : ['read:own', 'write:own'],
            department: role === 'doctor' ? 'GENERAL' : undefined
          },
          createdBy: 'system'
        });

        if (!result.success) {
          return res.status(400).json({
            success: false,
            message: result.message,
            error: result.error
          });
        }

        res.status(201).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi hệ thống",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST /api/v1/auth/logout - User logout
  apiRouter.post("/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer '

      // TODO: Implement logout use case
      // const result = await logoutUserUseCase.execute({ token });

      res.json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET /api/v1/auth/me - Get current user profile
  apiRouter.get("/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7); // Remove 'Bearer '

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token xác thực không được cung cấp",
        });
      }

      // Get JWT service and user profile use case from container
      const jwtService = container.get(ServiceTokens.JWT_SERVICE);
      const getUserProfileUseCase = container.get(ServiceTokens.GET_USER_PROFILE_USE_CASE);

      // Verify and decode token
      const tokenPayload = await jwtService.verifyAccessToken(token);
      if (!tokenPayload) {
        return res.status(401).json({
          success: false,
          message: "Token không hợp lệ hoặc đã hết hạn",
        });
      }

      const result = await getUserProfileUseCase.execute({
        userId: tokenPayload.userId,
        requestedBy: tokenPayload.userId
      });

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: "Lấy thông tin người dùng thành công",
        data: result.data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST /api/v1/auth/refresh - Refresh access token
  apiRouter.post("/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token không được cung cấp",
        });
      }

      // TODO: Implement refresh token use case
      // const result = await refreshTokenUseCase.execute({ refreshToken });

      // Temporary mock response
      res.json({
        success: true,
        message: "Token đã được làm mới",
        data: {
          token: "new-jwt-token",
          refreshToken: "new-refresh-token",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Sample endpoint for testing
  apiRouter.get("/sample", (req, res) => {
    res.json({
      message: "Identity & Access Service API",
      features: [
        "Authentication",
        "Authorization",
        "Session Management",
        "Role Management",
      ],
      patterns: ["Strategy", "Decorator", "Repository"],
      endpoints: {
        "POST /api/v1/auth/login": "User login",
        "POST /api/v1/auth/register": "User registration",
        "POST /api/v1/auth/logout": "User logout",
        "GET /api/v1/auth/me": "Get current user",
        "POST /api/v1/auth/refresh": "Refresh token",
      },
    });
  });

  // Mount API routes
  app.use("/api/v1", apiRouter);
}
