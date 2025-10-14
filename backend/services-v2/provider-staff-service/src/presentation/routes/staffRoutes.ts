/**
 * Staff Routes
 * Express routes for Provider/Staff Service API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance RESTful API, Clean Architecture
 */

import { Router } from 'express';
import { StaffController } from '../controllers/StaffController';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';
import {
  validateRegisterStaff,
  validateUpdateStaffInfo,
  validateUpdateStaffStatus,
  validateStaffId,
  validateUserId,
  validateLicenseNumber,
  validateSearchStaff,
  validateAddCredential,
  validateAssignDepartment
} from '../middleware/ValidationMiddleware';

/**
 * Create staff routes
 */
export function createStaffRoutes(controller: StaffController): Router {
  const router = Router();
  const asyncHandler = ErrorHandlingMiddleware.asyncHandler;

  // ==================== PUBLIC ROUTES ====================

  /**
   * Register new staff
   * POST /api/v1/staff
   */
  router.post(
    '/',
    validateRegisterStaff,
    asyncHandler(controller.registerStaff.bind(controller))
  );

  // ==================== SEARCH ROUTES ====================

  /**
   * Search staff
   * GET /api/v1/staff/search?searchTerm=...
   */
  router.get(
    '/search',
    validateSearchStaff,
    asyncHandler(controller.searchStaff.bind(controller))
  );

  // ==================== GET STAFF ROUTES ====================

  /**
   * Get staff by user ID
   * GET /api/v1/staff/user/:userId
   */
  router.get(
    '/user/:userId',
    validateUserId,
    asyncHandler(controller.getStaffByUserId.bind(controller))
  );

  /**
   * Get staff by license number
   * GET /api/v1/staff/license/:licenseNumber
   */
  router.get(
    '/license/:licenseNumber',
    validateLicenseNumber,
    asyncHandler(controller.getStaffByLicenseNumber.bind(controller))
  );

  /**
   * Get staff by ID
   * GET /api/v1/staff/:staffId
   * Note: This must be last among GET routes to avoid conflicts
   */
  router.get(
    '/:staffId',
    validateStaffId,
    asyncHandler(controller.getStaffById.bind(controller))
  );

  // ==================== UPDATE STAFF ROUTES ====================

  /**
   * Update staff info
   * PUT /api/v1/staff/:staffId
   */
  router.put(
    '/:staffId',
    validateUpdateStaffInfo,
    asyncHandler(controller.updateStaffInfo.bind(controller))
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
 * 2. GET /search?searchTerm=...
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
 */

