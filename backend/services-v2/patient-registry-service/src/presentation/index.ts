/**
 * Presentation Layer Exports
 * Patient Registry Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Controllers
export { PatientController } from './controllers/PatientController';

// Routes
export { createPatientRoutes } from './routes/patientRoutes';

// DTOs
export * from './dtos/PatientDTOs';

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
  ResponseHelper
} from './middleware/ErrorHandlingMiddleware';

export * from './middleware/ValidationMiddleware';

