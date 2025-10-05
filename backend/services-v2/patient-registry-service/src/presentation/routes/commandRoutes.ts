/**
 * Command Routes
 * Express routes for CQRS Command API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CQRS Pattern, Clean Architecture
 */

import { Router } from 'express';
import { CommandController } from '../controllers/CommandController';
import { ErrorHandlingMiddleware } from '../middleware/ErrorHandlingMiddleware';

/**
 * Create command routes
 */
export function createCommandRoutes(controller: CommandController): Router {
  const router = Router();
  const asyncHandler = ErrorHandlingMiddleware.asyncHandler;

  /**
   * Execute patient command
   * POST /api/v1/commands/patient
   */
  router.post(
    '/patient',
    asyncHandler(controller.executePatientCommand.bind(controller))
  );

  /**
   * Get command handler status
   * GET /api/v1/commands/status
   */
  router.get(
    '/status',
    asyncHandler(controller.getCommandHandlerStatus.bind(controller))
  );

  return router;
}

/**
 * API Documentation
 *
 * Base URL: /api/v1/commands
 *
 * Endpoints:
 *
 * 1. POST /patient
 *    - Execute a patient command
 *    - Body: PatientCommand (RegisterPatient, UpdatePatientInfo, DeactivatePatient, GrantPatientConsent, AddEmergencyContact)
 *    - Response: Command result
 *
 * 2. GET /status
 *    - Get command handler status
 *    - Response: Handler status and supported commands
 *
 * Command Structure:
 * {
 *   "commandId": "uuid",
 *   "commandType": "RegisterPatient" | "UpdatePatientInfo" | "DeactivatePatient" | "GrantPatientConsent" | "AddEmergencyContact",
 *   "timestamp": "ISO 8601 date",
 *   "requestedBy": "userId",
 *   "data": { ... command-specific data ... }
 * }
 */

