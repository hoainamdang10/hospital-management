import logger from "@hospital/shared/dist/utils/logger";
import { SupabaseClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./config/database.config";
import { createDataLoaders } from "./dataloaders";
import { addVietnameseContext } from "./middleware/i18n.middleware";
import { RestApiService } from "./services/rest-api.service";

/**
 * GraphQL Context Interface
 * Contains all data and services needed by resolvers
 */
export interface GraphQLContext {
  // Request/Response objects
  req: Request;
  res?: Response;

  // Authentication
  user?: AuthenticatedUser;
  token?: string;

  // Services
  restApi: RestApiService;
  supabase: SupabaseClient;

  // DataLoaders for N+1 optimization
  dataloaders: ReturnType<typeof createDataLoaders>;

  // Request metadata
  requestId: string;
  startTime: number;
  userAgent?: string;
  ipAddress?: string;

  // Language preference
  language: "vi" | "en";

  // Internationalization
  i18n?: {
    translate: (key: string, params?: any) => string;
  };

  // Rate limiting info
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}

/**
 * Authenticated User Interface
 */
export interface AuthenticatedUser {
  id: string;
  profileId: string;
  email: string;
  role: UserRole;
  permissions: string[];

  // Role-specific IDs
  doctor_id?: string;
  patient_id?: string;

  // User details
  fullName: string;
  is_active: boolean;
  lastLoginAt?: Date;

  // Session info
  sessionId?: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
}

/**
 * User Roles
 */
export enum UserRole {
  ADMIN = "admin",
  DOCTOR = "doctor",
  PATIENT = "patient",
  RECEPTIONIST = "receptionist",
}

/**
 * Context creation parameters
 */
interface ContextParams {
  req: Request;
  res?: Response;
  connectionParams?: any; // For WebSocket subscriptions
}

/**
 * Create GraphQL Context
 * Sets up all services, authentication, and utilities needed by resolvers
 */
export async function createContext({
  req,
  res,
  connectionParams,
}: ContextParams): Promise<GraphQLContext> {
  // Extract request metadata
  const requestId =
    (req.headers["x-request-id"] as string) || generateRequestId();
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Determine language preference
  const acceptLanguage = req.headers["accept-language"] as string;
  const language: "vi" | "en" = acceptLanguage?.includes("vi") ? "vi" : "en";

  // Extract authentication token
  let token: string | undefined;
  let user: AuthenticatedUser | undefined;

  try {
    // Get token from Authorization header or connection params (for subscriptions)
    const authHeader =
      req.headers.authorization || connectionParams?.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      user = await authenticateUser(token!);
    }
  } catch (error) {
    logger.warn("Authentication failed:", {
      error: (error as Error).message,
      requestId,
    });
    // Don't throw error here - let resolvers handle unauthorized access
  }

  // Create REST API service
  const restApi = new RestApiService({
    baseURL: process.env.API_GATEWAY_URL || "http://localhost:3100",
    token,
    requestId,
    language,
  });

  // Create DataLoaders for N+1 optimization
  const dataloaders = createDataLoaders(restApi);

  // Create context object
  const context: GraphQLContext = {
    req,
    res,
    user,
    token,
    restApi,
    supabase: supabaseAdmin,
    dataloaders,
    requestId,
    userAgent,
    ipAddress,
    language,
    startTime: Date.now(),
  };

  // Add Vietnamese i18n support
  const contextWithI18n = addVietnameseContext(context);

  logger.debug("GraphQL context created:", {
    requestId,
    userId: user?.id,
    role: user?.role,
    language,
    hasToken: !!token,
  });

  return contextWithI18n;
}

/**
 * Authenticate user from JWT token
 * Updated to use only JWT_SECRET (Auth Service tokens)
 */
async function authenticateUser(token: string): Promise<AuthenticatedUser> {
  try {
    // Use only JWT_SECRET for Auth Service tokens
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    logger.debug("Verified Auth Service JWT token");

    // Extract user information from Auth Service JWT token
    const user: AuthenticatedUser = {
      id: decoded.id || decoded.sub || decoded.userId,
      profileId: decoded.profileId,
      email: decoded.email,
      role: decoded.role as UserRole,
      permissions: decoded.permissions || [],
      doctor_id: decoded.doctor_id,
      patient_id: decoded.patient_id,
      fullName: decoded.fullName || decoded.full_name || decoded.name,
      is_active: decoded.is_active !== false,
      lastLoginAt: decoded.lastLoginAt
        ? new Date(decoded.lastLoginAt)
        : undefined,
      sessionId: decoded.sessionId,
      tokenIssuedAt: new Date(decoded.iat * 1000),
      tokenExpiresAt: new Date(decoded.exp * 1000),
    };

    // Validate token expiration
    if (user.tokenExpiresAt < new Date()) {
      throw new Error("Token expired");
    }

    // Validate user is active
    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    return user;
  } catch (error) {
    logger.error("Token authentication failed:", error);
    throw new Error("Invalid or expired token");
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `gql-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: AuthenticatedUser | undefined,
  requiredRoles: UserRole[]
): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  user: AuthenticatedUser | undefined,
  requiredPermission: string
): boolean {
  if (!user) return false;
  return (
    user.permissions.includes(requiredPermission) ||
    user.role === UserRole.ADMIN
  );
}

/**
 * Get user's entity ID based on role
 */
export function getUserEntityId(user: AuthenticatedUser): string | undefined {
  switch (user.role) {
    case UserRole.DOCTOR:
      return user.doctor_id;
    case UserRole.PATIENT:
      return user.patient_id;
    default:
      return user.id;
  }
}

/**
 * Context utilities for resolvers
 */
export const contextUtils = {
  /**
   * Require authentication
   */
  requireAuth(context: GraphQLContext): AuthenticatedUser {
    if (!context.user) {
      throw new Error("Yêu cầu xác thực");
    }
    return context.user;
  },

  /**
   * Require specific role
   */
  requireRole(context: GraphQLContext, roles: UserRole[]): AuthenticatedUser {
    const user = this.requireAuth(context);
    if (!hasRole(user, roles)) {
      throw new Error("Không có quyền truy cập");
    }
    return user;
  },

  /**
   * Require specific permission
   */
  requirePermission(
    context: GraphQLContext,
    permission: string
  ): AuthenticatedUser {
    const user = this.requireAuth(context);
    if (!hasPermission(user, permission)) {
      throw new Error("Không có quyền thực hiện hành động này");
    }
    return user;
  },

  /**
   * Check if user can access entity
   */
  canAccessEntity(context: GraphQLContext, entityUserId: string): boolean {
    if (!context.user) return false;

    // Admin can access everything
    if (context.user.role === UserRole.ADMIN) return true;

    // Users can access their own data
    if (context.user.id === entityUserId) return true;

    // Doctors can access their patients' data (implement business logic)
    if (context.user.role === UserRole.DOCTOR) {
      // TODO: Check if patient is assigned to this doctor
      return true;
    }

    return false;
  },

  /**
   * Get Vietnamese error message
   */
  getVietnameseError(englishMessage: string): string {
    const translations: Record<string, string> = {
      "Authentication required": "Yêu cầu xác thực",
      "Access denied": "Không có quyền truy cập",
      "Not found": "Không tìm thấy",
      "Invalid input": "Dữ liệu không hợp lệ",
      "Internal error": "Lỗi hệ thống",
    };

    return translations[englishMessage] || englishMessage;
  },

  /**
   * Safe i18n translate function
   */
  translate(context: GraphQLContext, key: string, params?: any): string {
    if (context.i18n?.translate) {
      return context.i18n.translate(key, params);
    }

    // Fallback Vietnamese translations
    const fallbackTranslations: Record<string, string> = {
      "appointment.errors.missing_identifier":
        "Cần cung cấp ID hoặc mã cuộc hẹn",
      "appointment.errors.fetch_failed": "Không thể lấy thông tin cuộc hẹn",
      "appointment.errors.today_failed":
        "Không thể lấy danh sách cuộc hẹn hôm nay",
      "appointment.errors.upcoming_failed":
        "Không thể lấy danh sách cuộc hẹn sắp tới",
      "appointment.errors.stats_failed": "Không thể lấy thống kê cuộc hẹn",
      "appointment.errors.create_failed": "Không thể tạo cuộc hẹn",
      "appointment.errors.update_failed": "Không thể cập nhật cuộc hẹn",
      "appointment.errors.cancel_failed": "Không thể hủy cuộc hẹn",
      "appointment.errors.confirm_failed": "Không thể xác nhận cuộc hẹn",
      "appointment.errors.reschedule_failed": "Không thể đổi lịch cuộc hẹn",
      "appointment.errors.checkin_failed": "Không thể check-in cuộc hẹn",
      "appointment.errors.complete_failed": "Không thể hoàn thành cuộc hẹn",
      "medical_record.errors.missing_id": "Cần cung cấp ID hồ sơ y tế",
      "medical_record.errors.fetch_failed":
        "Không thể lấy thông tin hồ sơ y tế",
      "medical_record.errors.search_failed": "Không thể tìm kiếm hồ sơ y tế",
      "medical_record.errors.create_failed": "Không thể tạo hồ sơ y tế",
      "medical_record.errors.update_failed": "Không thể cập nhật hồ sơ y tế",
      "medical_record.errors.delete_failed": "Không thể xóa hồ sơ y tế",
      "patient.errors.missing_identifier": "Cần cung cấp ID hoặc mã bệnh nhân",
      "patient.errors.fetch_failed": "Không thể lấy thông tin bệnh nhân",
      "patient.errors.search_failed": "Không thể tìm kiếm bệnh nhân",
      "patient.errors.medical_summary_failed": "Không thể lấy tóm tắt y tế",
      "patient.errors.stats_failed": "Không thể lấy thống kê bệnh nhân",
      "patient.errors.history_failed": "Không thể lấy lịch sử bệnh nhân",
      "patient.errors.create_failed": "Không thể tạo bệnh nhân",
      "patient.errors.update_failed": "Không thể cập nhật bệnh nhân",
      "patient.errors.delete_failed": "Không thể xóa bệnh nhân",
      "patient.errors.activate_failed": "Không thể kích hoạt bệnh nhân",
      "patient.errors.deactivate_failed": "Không thể vô hiệu hóa bệnh nhân",
      "patient.errors.medical_update_failed":
        "Không thể cập nhật thông tin y tế",
      "patient.errors.insurance_update_failed":
        "Không thể cập nhật thông tin bảo hiểm",
    };

    return fallbackTranslations[key] || key;
  },
};

export default createContext;
