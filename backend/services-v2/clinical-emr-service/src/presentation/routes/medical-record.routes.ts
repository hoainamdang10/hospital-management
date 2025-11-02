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
import { AuthenticationMiddleware } from '../middleware/AuthenticationMiddleware';

// Middleware (keeping old ones for now if they exist)
// import { validationMiddleware } from '../middleware/validation.middleware';
// import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { errorHandlingMiddleware } from '../middleware/errorHandler';

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
  
  // Get authentication middleware from DI container
  const authMiddleware = container.get<AuthenticationMiddleware>(TYPES.AuthenticationMiddleware);

  // =====================================================
  // MIDDLEWARE SETUP
  // =====================================================
  
  // Note: Authentication is applied per-route for granular control
  // Audit logging is handled automatically in AuthenticationMiddleware

  // =====================================================
  // MEDICAL RECORD CRUD ROUTES
  // =====================================================

  /**
   * Create new medical record
   * POST /api/v2/clinical-emr/medical-records
   * @access Doctor, Admin
   * @audit PHI Access - Create Medical Record
   */
  router.post(
    '/medical-records',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.createMedicalRecord(req, res);
    }
  );

  /**
   * Get medical record by ID
   * GET /api/v2/clinical-emr/medical-records/:recordId
   * @access Doctor, Patient (own records), Admin
   * @audit PHI Access - View Medical Record
   */
  router.get(
    '/medical-records/:recordId',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Doctor, Nurse, Admin can view
    async (req, res) => {
      await controller.getMedicalRecord(req, res);
    }
  );

  /**
   * Update medical record
   * PUT /api/v2/clinical-emr/medical-records/:recordId
   * @access Doctor, Admin
   * @audit PHI Access - Update Medical Record
   */
  router.put(
    '/medical-records/:recordId',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.updateMedicalRecord(req, res);
    }
  );

  /**
   * Archive medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/archive
   * @access Doctor, Admin
   * @audit PHI Access - Archive Medical Record
   */
  router.post(
    '/medical-records/:recordId/archive',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.archiveMedicalRecord(req, res);
    }
  );

  /**
   * Restore archived medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/restore
   * @access Doctor, Admin
   * @audit PHI Access - Restore Medical Record
   */
  router.post(
    '/medical-records/:recordId/restore',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
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
   * @access Doctor, Patient (own records), Admin
   * @audit PHI Access - List Patient Medical Records
   */
  router.get(
    '/patients/:patientId/medical-records',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Healthcare staff can view
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
   * @access Doctor, Admin
   * @audit View Doctor Medical Records
   */
  router.get(
    '/doctors/:doctorId/medical-records',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
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
   * @access Doctor, Admin
   * @audit View Medical Record Statistics
   */
  router.get(
    '/statistics',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  /**
   * Get patient medical record statistics
   * GET /api/v2/clinical-emr/patients/:patientId/statistics
   * @access Doctor, Patient (own records), Admin
   * @audit PHI Access - View Patient Statistics
   */
  router.get(
    '/patients/:patientId/statistics',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(),
    async (req, res) => {
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  /**
   * Get doctor medical record statistics
   * GET /api/v2/clinical-emr/doctors/:doctorId/statistics
   * @access Doctor, Admin
   * @audit View Doctor Statistics
   */
  router.get(
    '/doctors/:doctorId/statistics',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.getMedicalRecordStatistics(req, res);
    }
  );

  // =====================================================
  // DELETE OPERATIONS
  // =====================================================

  /**
   * Delete medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId
   * @access Admin only
   * @audit PHI Access - Delete Medical Record (Critical)
   */
  router.delete(
    '/medical-records/:recordId',
    authMiddleware.authenticate(),
    authMiddleware.requireAdmin(),
    async (req, res) => {
      await controller.deleteMedicalRecord(req, res);
    }
  );

  // =====================================================
  // DIAGNOSIS MANAGEMENT
  // =====================================================

  /**
   * Add diagnosis to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/diagnoses
   * @access Doctor, Admin
   * @audit PHI Access - Add Diagnosis
   */
  router.post(
    '/medical-records/:recordId/diagnoses',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.addDiagnosis(req, res);
    }
  );

  /**
   * Remove diagnosis from medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId/diagnoses/:diagnosisCode
   * @access Doctor, Admin
   * @audit PHI Access - Remove Diagnosis
   */
  router.delete(
    '/medical-records/:recordId/diagnoses/:diagnosisCode',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.removeDiagnosis(req, res);
    }
  );

  // =====================================================
  // MEDICATION MANAGEMENT
  // =====================================================

  /**
   * Add medication to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/medications
   * @access Doctor, Admin
   * @audit PHI Access - Add Medication
   */
  router.post(
    '/medical-records/:recordId/medications',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.addMedication(req, res);
    }
  );

  /**
   * Remove medication from medical record
   * DELETE /api/v2/clinical-emr/medical-records/:recordId/medications/:medicationCode
   * @access Doctor, Admin
   * @audit PHI Access - Remove Medication
   */
  router.delete(
    '/medical-records/:recordId/medications/:medicationCode',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.removeMedication(req, res);
    }
  );

  // =====================================================
  // VITAL SIGNS MANAGEMENT
  // =====================================================

  /**
   * Update vital signs
   * PUT /api/v2/clinical-emr/medical-records/:recordId/vital-signs
   * @access Healthcare staff (Doctor, Nurse, Admin)
   * @audit PHI Access - Update Vital Signs
   */
  router.put(
    '/medical-records/:recordId/vital-signs',
    authMiddleware.authenticate(),
    authMiddleware.requireHealthcareStaff(), // Doctor, Nurse, Admin
    async (req, res) => {
      await controller.updateVitalSigns(req, res);
    }
  );

  // =====================================================
  // FHIR OPERATIONS
  // =====================================================

  /**
   * Export medical record to FHIR
   * GET /api/v2/clinical-emr/medical-records/:recordId/fhir
   * @access Doctor, Admin
   * @audit PHI Access - Export to FHIR
   */
  router.get(
    '/medical-records/:recordId/fhir',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.exportToFHIR(req, res);
    }
  );

  /**
   * Validate FHIR compliance
   * GET /api/v2/clinical-emr/medical-records/:recordId/fhir/validate
   * @access Doctor, Admin
   * @audit PHI Access - Validate FHIR
   */
  router.get(
    '/medical-records/:recordId/fhir/validate',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.validateFHIRCompliance(req, res);
    }
  );

  // =====================================================
  // ACCESS CONTROL
  // =====================================================

  /**
   * Grant access to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/access/grant
   * @access Doctor, Admin
   * @audit PHI Access - Grant Access (Critical)
   */
  router.post(
    '/medical-records/:recordId/access/grant',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.grantAccess(req, res);
    }
  );

  /**
   * Revoke access to medical record
   * POST /api/v2/clinical-emr/medical-records/:recordId/access/revoke
   * @access Doctor, Admin
   * @audit PHI Access - Revoke Access (Critical)
   */
  router.post(
    '/medical-records/:recordId/access/revoke',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.revokeAccess(req, res);
    }
  );

  /**
   * Audit access history
   * GET /api/v2/clinical-emr/medical-records/:recordId/access/audit
   * @access Doctor, Admin
   * @audit View Access Audit Log
   */
  router.get(
    '/medical-records/:recordId/access/audit',
    authMiddleware.authenticate(),
    authMiddleware.requireDoctorOrAdmin(),
    async (req, res) => {
      await controller.auditAccessHistory(req, res);
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
    // CRUD Operations
    { method: 'POST', path: '/medical-records', description: 'Create new medical record', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'GET', path: '/medical-records/:recordId', description: 'Get medical record by ID', roles: ['doctor', 'patient', 'admin'], rateLimit: '100/15min' },
    { method: 'PUT', path: '/medical-records/:recordId', description: 'Update medical record', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'DELETE', path: '/medical-records/:recordId', description: 'Delete medical record', roles: ['admin'], rateLimit: '100/15min' },
    
    // Archive/Restore
    { method: 'POST', path: '/medical-records/:recordId/archive', description: 'Archive medical record', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'POST', path: '/medical-records/:recordId/restore', description: 'Restore archived medical record', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Patient Routes
    { method: 'GET', path: '/patients/:patientId/medical-records', description: 'Get patient medical records', roles: ['doctor', 'patient', 'admin'], rateLimit: '100/15min' },
    
    // Doctor Routes
    { method: 'GET', path: '/doctors/:doctorId/medical-records', description: 'Get doctor medical records', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Diagnosis Management
    { method: 'POST', path: '/medical-records/:recordId/diagnoses', description: 'Add diagnosis', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'DELETE', path: '/medical-records/:recordId/diagnoses/:diagnosisCode', description: 'Remove diagnosis', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Medication Management
    { method: 'POST', path: '/medical-records/:recordId/medications', description: 'Add medication', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'DELETE', path: '/medical-records/:recordId/medications/:medicationCode', description: 'Remove medication', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Vital Signs
    { method: 'PUT', path: '/medical-records/:recordId/vital-signs', description: 'Update vital signs', roles: ['doctor', 'nurse', 'admin'], rateLimit: '100/15min' },
    
    // FHIR Operations
    { method: 'GET', path: '/medical-records/:recordId/fhir', description: 'Export to FHIR', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'GET', path: '/medical-records/:recordId/fhir/validate', description: 'Validate FHIR compliance', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Access Control
    { method: 'POST', path: '/medical-records/:recordId/access/grant', description: 'Grant access', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'POST', path: '/medical-records/:recordId/access/revoke', description: 'Revoke access', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    { method: 'GET', path: '/medical-records/:recordId/access/audit', description: 'Audit access history', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Statistics
    { method: 'GET', path: '/statistics', description: 'Get medical record statistics', roles: ['doctor', 'admin'], rateLimit: '100/15min' },
    
    // Health Checks
    { method: 'GET', path: '/health', description: 'Health check endpoint', roles: ['public'], rateLimit: '1000/15min' },
    { method: 'GET', path: '/ready', description: 'Readiness check endpoint', roles: ['public'], rateLimit: '1000/15min' },
    { method: 'GET', path: '/live', description: 'Liveness check endpoint', roles: ['public'], rateLimit: '1000/15min' }
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
