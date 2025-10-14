/**
 * Presentation Layer Exports
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Controllers
export { StaffController } from './controllers/StaffController';

// Routes
export { createStaffRoutes } from './routes/staffRoutes';
export { setupRoutes } from './routes/index';

// DTOs
export * from './dtos/StaffDTOs';

// Middleware
export {
  ErrorHandlingMiddleware,
  ApplicationError,
  DomainError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ResponseHelper,
  getUserId,
  getUserRole,
  hasRole,
  hasPermission
} from './middleware/ErrorHandlingMiddleware';

export * from './middleware/ValidationMiddleware';

