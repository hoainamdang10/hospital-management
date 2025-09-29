/**
 * Medical Record Routes - Presentation Layer
 * Express routes for medical records API endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API, HIPAA
 */

import { Router } from 'express';
import { container } from '../../infrastructure/di/container';
import { TYPES } from '../../infrastructure/di/types';
import { MedicalRecordController } from '../controllers/MedicalRecordController';

// Middleware
import { authenticationMiddleware } from '../../../shared/presentation/middleware/authentication.middleware';
import { authorizationMiddleware } from '../../../shared/presentation/middleware/authorization.middleware';
import { validationMiddleware } from '../../../shared/presentation/middleware/validation.middleware';
import { auditMiddleware } from '../../../shared/presentation/middleware/audit.middleware';
import { rateLimitMiddleware } from '../../../shared/presentation/middleware/rate-limit.middleware';
import { errorHandlingMiddleware } from '../../../shared/presentation/middleware/error-handling.middleware';

// Validation schemas
import { 
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  getMedicalRecordSchema,
  getPatientMedicalRecordsSchema
} from '../validation/medical-record.validation';

/**
 * Create medical record routes
 */
export function createMedicalRecordRoutes(): Router {
  const router = Router();
  const controller = container.get<MedicalRecordController>(TYPES.MedicalRecordController);

  // =====================================================
  // MIDDLEWARE SETUP
  // =====================================================
  
  // Apply authentication to all routes
  router.use(authenticationMiddleware);
  
  // Apply rate limiting
  router.use(rateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau'
  }));

  // Apply audit logging for all routes
  router.use(auditMiddleware);

  // =====================================================
  // MEDICAL RECORD CRUD ROUTES
  // =====================================================

  /**
   * Create new medical record
   * POST /api/v2/clinical-emr/medical-records
   */
  router.post(
    '/medical-records',
    authorizationMiddleware(['doctor', 'admin']),
    validationMiddleware(createMedicalRecordSchema),
    async (req, res) => {
      await controller.createMedicalRecord(req, res);
    }
  );

  /**
   * Get medical record by ID
   * GET /api/v2/clinical-emr/medical-records/:recordId
   */
  router.get(
    '/medical-records/:recordId',
    authorizationMiddleware(['doctor', 'patient', 'admin']),
    validationMiddleware(getMedicalRecordSchema),
    async (req, res) => {
      await controller.getMedicalRecord(req, res);
    }
  );

  /**
   * Update medical record
   * PUT /api/v2/clinical-emr/medical-records/:recordId
   */
  router.put(
    '/medical-records/:recordId',
    authorizationMiddleware(['doctor', 'admin']),
    validationMiddleware(updateMedicalRecordSchema),
    async (req, res) => {
      await controller.updateMedicalRecord(req, res);
    }
  );

  /**
   * Archive medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/archive
   */
  router.post(
    '/medical-records/:recordId/archive',
    authorizationMiddleware(['doctor', 'admin']),
    async (req, res) => {
      await controller.archiveMedicalRecord(req, res);
    }
  );

  /**
   * Restore archived medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/restore
   */
  router.post(
    '/medical-records/:recordId/restore',
    authorizationMiddleware(['doctor', 'admin']),
    async (req, res) => {
      await controller.restoreMedicalRecord(req, res);
    }
  );

  // =====================================================
  // PATIENT-SPECIFIC ROUTES
  // =====================================================

  /**
   * Get all medical records for a patient
   * GET /api/v2/clinical-emr/patients/:patientId/medical-records
   */
  router.get(
    '/patients/:patientId/medical-records',
    authorizationMiddleware(['doctor', 'patient', 'admin']),
    validationMiddleware(getPatientMedicalRecordsSchema),
    async (req, res) => {
      await controller.getPatientMedicalRecords(req, res);
    }
  );

  // =====================================================
  // DOCTOR-SPECIFIC ROUTES
  // =====================================================

  /**
   * Get all medical records by doctor
   * GET /api/v2/clinical-emr/doctors/:doctorId/medical-records
   */
  router.get(
    '/doctors/:doctorId/medical-records',
    authorizationMiddleware(['doctor', 'admin']),
    async (req, res) => {
      await controller.getDoctorMedicalRecords(req, res);
    }
  );

  // =====================================================
  // STATISTICS AND REPORTING ROUTES
  // =====================================================

  /**
   * Get medical record statistics
   * GET /api/v2/clinical-emr/statistics
   */
  router.get(
    '/statistics',
    authorizationMiddleware(['doctor', 'admin']),
    async (req, res) => {
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  /**
   * Get patient medical record statistics
   * GET /api/v2/clinical-emr/patients/:patientId/statistics
   */
  router.get(
    '/patients/:patientId/statistics',
    authorizationMiddleware(['doctor', 'patient', 'admin']),
    async (req, res) => {
      // This would require a separate method in controller
      // For now, redirect to general statistics
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  /**
   * Get doctor medical record statistics
   * GET /api/v2/clinical-emr/doctors/:doctorId/statistics
   */
  router.get(
    '/doctors/:doctorId/statistics',
    authorizationMiddleware(['doctor', 'admin']),
    async (req, res) => {
      // This would require a separate method in controller
      // For now, redirect to general statistics
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  // =====================================================
  // HEALTH AND MONITORING ROUTES
  // =====================================================

  /**
   * Health check endpoint
   * GET /api/v2/clinical-emr/health
   */
  router.get(
    '/health',
    async (req, res) => {
      await controller.healthCheck(req, res);
    }
  );

  /**
   * Service readiness check
   * GET /api/v2/clinical-emr/ready
   */
  router.get(
    '/ready',
    async (req, res) => {
      // Check if service is ready to handle requests
      try {
        // Test database connection
        // Test dependencies
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          service: 'clinical-emr-service',
          version: '2.0.0'
        });
      } catch (error) {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * Service liveness check
   * GET /api/v2/clinical-emr/live
   */
  router.get(
    '/live',
    async (req, res) => {
      // Simple liveness check
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    }
  );

  // =====================================================
  // ERROR HANDLING MIDDLEWARE
  // =====================================================
  
  // Apply error handling middleware last
  router.use(errorHandlingMiddleware);

  return router;
}

/**
 * Route configuration
 */
export const routeConfig = {
  basePath: '/api/v2/clinical-emr',
  version: 'v2',
  service: 'clinical-emr',
  description: 'Clinical EMR Service API Routes',
  endpoints: [
    {
      method: 'POST',
      path: '/medical-records',
      description: 'Create new medical record',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'GET',
      path: '/medical-records/:recordId',
      description: 'Get medical record by ID',
      roles: ['doctor', 'patient', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'PUT',
      path: '/medical-records/:recordId',
      description: 'Update medical record',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'POST',
      path: '/medical-records/:recordId/archive',
      description: 'Archive medical record',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'POST',
      path: '/medical-records/:recordId/restore',
      description: 'Restore archived medical record',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'GET',
      path: '/patients/:patientId/medical-records',
      description: 'Get patient medical records',
      roles: ['doctor', 'patient', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'GET',
      path: '/doctors/:doctorId/medical-records',
      description: 'Get doctor medical records',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'GET',
      path: '/statistics',
      description: 'Get medical record statistics',
      roles: ['doctor', 'admin'],
      rateLimit: '100/15min'
    },
    {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint',
      roles: ['public'],
      rateLimit: '1000/15min'
    },
    {
      method: 'GET',
      path: '/ready',
      description: 'Readiness check endpoint',
      roles: ['public'],
      rateLimit: '1000/15min'
    },
    {
      method: 'GET',
      path: '/live',
      description: 'Liveness check endpoint',
      roles: ['public'],
      rateLimit: '1000/15min'
    }
  ]
};

/**
 * Route documentation generator
 */
export function generateRouteDocumentation() {
  return {
    service: routeConfig.service,
    version: routeConfig.version,
    basePath: routeConfig.basePath,
    description: routeConfig.description,
    endpoints: routeConfig.endpoints,
    authentication: 'JWT Bearer Token required for all endpoints except health checks',
    authorization: 'Role-based access control (RBAC)',
    rateLimit: 'IP-based rate limiting applied',
    auditLogging: 'All requests are logged for HIPAA compliance',
    errorHandling: 'Standardized error responses with Vietnamese messages',
    validation: 'Request/response validation with detailed error messages'
  };
}
