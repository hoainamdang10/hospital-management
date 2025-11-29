/**
 * Staff Routes
 * Express routes for Provider/Staff Service API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { NextFunction, Request, Response, Router } from "express";
import { StaffController } from "../controllers/StaffController";
import { ErrorHandlingMiddleware } from "../middleware/ErrorHandlingMiddleware";
import { RateLimitMiddleware } from "../middleware/RateLimitMiddleware";
import { AuthenticationMiddleware } from "../middleware/AuthenticationMiddleware";
import {
  validateRegisterStaff,
  validateUpdateStaffInfo,
  validateSelfUpdateStaffInfo,
  validateStaffId,
  validateUserId,
  validateLicenseNumber,
  validateSearchStaff,
  validateGetStaffList,
  validateAssignDepartment,
  validateAddCredential,
  validateRemoveCredential,
  validateRenewCredential,
  validateGetExpiringCredentials,
  validateActivateStaff,
  validateSuspendStaff,
  validateReactivateStaff,
  validateTerminateStaff,
  validateUpdateEmploymentStatus,
  validateUpdateSchedule,
} from "../middleware/ValidationMiddleware";

/**
 * Create staff routes with authentication and rate limiting
 */
export function createStaffRoutes(controller: StaffController): Router {
  const router = Router();
  const asyncHandler = ErrorHandlingMiddleware.asyncHandler;

  // Check if auth bypass is enabled (for development/testing)
  const bypassAuth = process.env.BYPASS_AUTH === "true";

  // Create authentication middleware
  const requireAuth = bypassAuth
    ? AuthenticationMiddleware.bypassAuth
    : AuthenticationMiddleware.requireAuth(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      );

  const adminOnly = bypassAuth
    ? AuthenticationMiddleware.bypassAuth
    : AuthenticationMiddleware.adminOnly(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      );

  const healthcareStaffOnly = bypassAuth
    ? AuthenticationMiddleware.bypassAuth
    : AuthenticationMiddleware.healthcareStaffOnly(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      );

  // Allow internal service-to-service token (Appointments -> Provider) to bypass Supabase auth
  const serviceToken =
    process.env.INTERNAL_SERVICE_TOKEN || process.env.PROVIDER_INTERNAL_TOKEN;
  const serviceOrRequireAuth = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const authHeader = req.headers.authorization;
    if (
      serviceToken &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ") &&
      authHeader.substring(7) === serviceToken
    ) {
      // Minimal service identity for downstream authorization
      (req as any).user = {
        id: "appointments-service",
        role: "service",
        roles: ["service", "appointments"],
      };
      next();
      return;
    }
    return (requireAuth as any)(req, res, next);
  };

  // Log auth bypass status
  if (bypassAuth) {
    console.warn(
      "[SECURITY WARNING] Authentication bypass is ENABLED. This should only be used in development/testing!",
    );
  }

  // Apply general rate limiting to all routes
  router.use(RateLimitMiddleware.general);

  // ==================== SELF SERVICE (DOCTOR) ====================
  /**
   * Self update staff info (doctor tự cập nhật hồ sơ)
   * PUT /api/v1/staff/me
   * - Auth bắt buộc, không rate-limit để tránh cảnh báo trust proxy
   */
  router.put(
    "/me",
    healthcareStaffOnly,
    validateSelfUpdateStaffInfo,
    asyncHandler(controller.selfUpdateStaffInfo.bind(controller)),
  );

  /**
   * Self update staff work schedule
   * PUT /api/v1/staff/me/schedule
   */
  router.put(
    "/me/schedule",
    healthcareStaffOnly,
    RateLimitMiddleware.writeOperations,
    asyncHandler(controller.selfUpdateStaffSchedule.bind(controller)),
  );

  // ==================== PUBLIC ROUTES ====================

  /**
   * Register new staff
   * POST /api/v1/staff
   */
  router.post(
    "/",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateRegisterStaff,
    asyncHandler(controller.registerStaff.bind(controller)),
  );

  // ==================== LIST STAFF ROUTES ====================

  /**
   * Get all staff with pagination and filters
   * GET /api/v1/staff?staffType=...&departmentId=...&status=...&page=1&limit=20
   */
  router.get(
    "/",
    RateLimitMiddleware.search,
    requireAuth,
    validateGetStaffList,
    asyncHandler(controller.getAllStaff.bind(controller)),
  );

  // ==================== SEARCH ROUTES ====================

  /**
   * Search staff (PUBLIC - for appointment booking)
   * GET /api/v1/staff/search?searchTerm=...&departmentId=...&staffType=doctor
   * No authentication required - patients need to search doctors for booking
   */
  router.get(
    "/search",
    RateLimitMiddleware.search,
    validateSearchStaff,
    asyncHandler(controller.searchStaff.bind(controller)),
  );

  // ==================== GET STAFF ROUTES ====================

  /**
   * Get staff by user ID
   * GET /api/v1/staff/user/:userId
   */
  router.get(
    "/user/:userId",
    requireAuth,
    validateUserId,
    asyncHandler(controller.getStaffByUserId.bind(controller)),
  );

  /**
   * Get staff by license number
   * GET /api/v1/staff/license/:licenseNumber
   */
  router.get(
    "/license/:licenseNumber",
    healthcareStaffOnly,
    validateLicenseNumber,
    asyncHandler(controller.getStaffByLicenseNumber.bind(controller)),
  );

  /**
   * Check license availability (for admin/invitation form pre-check)
   * GET /api/v1/staff/license-check/:licenseNumber
   */
  router.get(
    "/license-check/:licenseNumber",
    RateLimitMiddleware.search,
    adminOnly,
    validateLicenseNumber,
    asyncHandler(controller.checkLicenseAvailability.bind(controller)),
  );

  /**
   * Get staff by ID
   * GET /api/v1/staff/:staffId
   * Note: This must be last among GET routes to avoid conflicts
   */
  router.get(
    "/:staffId",
    serviceOrRequireAuth,
    validateStaffId,
    asyncHandler(controller.getStaffById.bind(controller)),
  );

  // ==================== UPDATE STAFF ROUTES ====================

  /**
   * Update staff info
   * PUT /api/v1/staff/:staffId
   */
  router.put(
    "/:staffId",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateUpdateStaffInfo,
    asyncHandler(controller.updateStaffInfo.bind(controller)),
  );

  /**
   * Assign staff to department
   * POST /api/v1/staff/:staffId/departments
   */
  router.post(
    "/:staffId/departments",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateStaffId,
    validateAssignDepartment,
    asyncHandler(controller.assignToDepartment.bind(controller)),
  );

  // ==================== CREDENTIAL MANAGEMENT ROUTES ====================

  /**
   * Get expiring credentials
   * GET /api/v1/staff/credentials/expiring
   * Note: This must be before /:staffId/credentials to avoid route conflicts
   */
  router.get(
    "/credentials/expiring",
    adminOnly,
    validateGetExpiringCredentials,
    asyncHandler(controller.getExpiringCredentials.bind(controller)),
  );

  /**
   * Add staff credential
   * POST /api/v1/staff/:staffId/credentials
   */
  router.post(
    "/:staffId/credentials",
    RateLimitMiddleware.credentialManagement,
    adminOnly,
    validateAddCredential,
    asyncHandler(controller.addStaffCredential.bind(controller)),
  );

  /**
   * Renew staff credential
   * PUT /api/v1/staff/:staffId/credentials/:credentialNumber/renew
   */
  router.put(
    "/:staffId/credentials/:credentialNumber/renew",
    RateLimitMiddleware.credentialManagement,
    adminOnly,
    validateRenewCredential,
    asyncHandler(controller.renewStaffCredential.bind(controller)),
  );

  /**
   * Remove staff credential
   * DELETE /api/v1/staff/:staffId/credentials/:credentialNumber
   */
  router.delete(
    "/:staffId/credentials/:credentialNumber",
    RateLimitMiddleware.credentialManagement,
    adminOnly,
    validateRemoveCredential,
    asyncHandler(controller.removeStaffCredential.bind(controller)),
  );

  // ==================== STATUS MANAGEMENT ROUTES ====================

  /**
   * Activate staff
   * POST /api/v1/staff/:staffId/activate
   */
  router.post(
    "/:staffId/activate",
    RateLimitMiddleware.statusChange,
    adminOnly,
    validateActivateStaff,
    asyncHandler(controller.activateStaff.bind(controller)),
  );

  /**
   * Suspend staff
   * POST /api/v1/staff/:staffId/suspend
   */
  router.post(
    "/:staffId/suspend",
    RateLimitMiddleware.statusChange,
    adminOnly,
    validateSuspendStaff,
    asyncHandler(controller.suspendStaff.bind(controller)),
  );

  /**
   * Reactivate staff
   * POST /api/v1/staff/:staffId/reactivate
   */
  router.post(
    "/:staffId/reactivate",
    RateLimitMiddleware.statusChange,
    adminOnly,
    validateReactivateStaff,
    asyncHandler(controller.reactivateStaff.bind(controller)),
  );

  /**
   * Terminate staff
   * POST /api/v1/staff/:staffId/terminate
   */
  router.post(
    "/:staffId/terminate",
    RateLimitMiddleware.statusChange,
    adminOnly,
    validateTerminateStaff,
    asyncHandler(controller.terminateStaff.bind(controller)),
  );

  /**
   * Update employment status
   * PATCH /api/v1/staff/:staffId/employment-status
   */
  router.patch(
    "/:staffId/employment-status",
    RateLimitMiddleware.statusChange,
    adminOnly,
    validateUpdateEmploymentStatus,
    asyncHandler(controller.updateEmploymentStatus.bind(controller)),
  );

  // ==================== SCHEDULE MANAGEMENT ====================

  /**
   * Update staff work schedule
   * PUT /api/v1/staff/:staffId/schedule
   */
  router.put(
    "/:staffId/schedule",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateStaffId,
    validateUpdateSchedule,
    asyncHandler(controller.updateStaffSchedule.bind(controller)),
  );

  /**
   * Get staff work schedule
   * GET /api/v1/staff/:staffId/schedule
   */
  router.get(
    "/:staffId/schedule",
    serviceOrRequireAuth,
    validateStaffId,
    asyncHandler(controller.getStaffSchedule.bind(controller)),
  );

  /**
   * Availability Management Routes
   * GET /api/v1/staff/:staffId/availability
   * POST /api/v1/staff/:staffId/availability
   * PUT /api/v1/staff/:staffId/availability/:availabilityId
   * DELETE /api/v1/staff/:staffId/availability/:availabilityId
   */
  // REMOVED: 4 Availability Routes - Belongs to Scheduling/Appointment Service (bounded context violation)
  // - GET /:staffId/availability
  // - POST /:staffId/availability
  // - PUT /:staffId/availability/:availabilityId
  // - DELETE /:staffId/availability/:availabilityId
  //
  // These endpoints should be implemented in Appointments Service:
  // - GET /api/appointments/providers/:providerId/available-slots?date=YYYY-MM-DD&duration=30
  // - GET /api/appointments/providers/:providerId/schedule

  /**
   * Specialization Management Routes
   * GET /api/v1/staff/:staffId/specializations
   * POST /api/v1/staff/:staffId/specializations
   * DELETE /api/v1/staff/:staffId/specializations/:specializationCode
   */
  router.get(
    "/:staffId/specializations",
    requireAuth,
    validateStaffId,
    asyncHandler(controller.getStaffSpecializations.bind(controller)),
  );

  router.post(
    "/:staffId/specializations",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateStaffId,
    asyncHandler(controller.addStaffSpecialization.bind(controller)),
  );

  router.delete(
    "/:staffId/specializations/:specializationCode",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateStaffId,
    asyncHandler(controller.removeStaffSpecialization.bind(controller)),
  );

  /**
   * Set department head
   * PUT /api/v1/staff/:staffId/department-head
   */
  router.put(
    "/:staffId/department-head",
    RateLimitMiddleware.writeOperations,
    adminOnly,
    validateStaffId,
    asyncHandler(controller.setDepartmentHead.bind(controller)),
  );

  return router;
}

/**
 * API Documentation
 *
 * Base URL: /api/v1/staff
 *
 * Endpoints:
 *
 * 1. POST /
 *    - Register new staff
 *    - Body: RegisterStaffRequestDto
 *    - Response: StaffResponseDto
 *
 * 2. GET /
 *    - Get all staff with pagination and filters
 *    - Query: staffType, departmentId, status, isActive, page, limit, sortBy, sortOrder
 *    - Response: PaginatedResponse<StaffResponseDto>
 *
 * 3. GET /search?searchTerm=...
 *    - Search staff
 *    - Query: searchTerm, staffType, departmentId, specialization, status, isActive, page, limit
 *    - Response: PaginatedResponse<StaffResponseDto>
 *
 * 3. GET /user/:userId
 *    - Get staff by user ID
 *    - Params: userId (UUID)
 *    - Response: StaffResponseDto
 *
 * 4. GET /license/:licenseNumber
 *    - Get staff by license number
 *    - Params: licenseNumber
 *    - Response: StaffResponseDto
 *
 * 5. GET /:staffId
 *    - Get staff by ID
 *    - Params: staffId (STAFF-YYYYMM-XXX)
 *    - Response: StaffResponseDto
 *
 * 6. PUT /:staffId
 *    - Update staff info
 *    - Params: staffId (STAFF-YYYYMM-XXX)
 *    - Body: UpdateStaffInfoRequestDto
 *    - Response: StaffResponseDto
 *
 * Response Format:
 * {
 *   "success": true,
 *   "message": "Success message",
 *   "data": { ... }
 * }
 *
 * Error Response Format:
 * {
 *   "success": false,
 *   "error": "ERROR_CODE",
 *   "message": "Error message",
 *   "details": { ... }
 * }
 *
 * ==================== STATUS MANAGEMENT ROUTES ====================
 *
 * 7. POST /:staffId/activate
 *    - Activate staff
 *    - Params: staffId ({TYPE}-{DEPT}-YYYYMM-XXX)
 *    - Response: ActivateStaffResponse
 *
 * 8. POST /:staffId/suspend
 *    - Suspend staff
 *    - Params: staffId ({TYPE}-{DEPT}-YYYYMM-XXX)
 *    - Body: { reason, suspensionStartDate?, suspensionEndDate? }
 *    - Response: SuspendStaffResponse
 *
 * 9. POST /:staffId/reactivate
 *    - Reactivate staff
 *    - Params: staffId ({TYPE}-{DEPT}-YYYYMM-XXX)
 *    - Response: ReactivateStaffResponse
 *
 * 10. POST /:staffId/terminate
 *     - Terminate staff
 *     - Params: staffId ({TYPE}-{DEPT}-YYYYMM-XXX)
 *     - Body: { reason, terminationDate? }
 *     - Response: TerminateStaffResponse
 *
 * 11. PATCH /:staffId/employment-status
 *     - Update employment status
 *     - Params: staffId ({TYPE}-{DEPT}-YYYYMM-XXX)
 *     - Body: { employmentType, contractEndDate? }
 *     - Response: UpdateEmploymentStatusResponse
 */
