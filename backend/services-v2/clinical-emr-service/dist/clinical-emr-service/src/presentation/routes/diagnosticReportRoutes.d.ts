/**
 * Diagnostic Report Routes - RESTful API Endpoints
 * Presentation Layer - Routes for diagnostic reports (lab, imaging, pathology)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
import { Router } from 'express';
import { DiagnosticReportController } from '../controllers/DiagnosticReportController';
/**
 * Create diagnostic report routes with authentication and authorization
 */
export declare function createDiagnosticReportRoutes(controller: DiagnosticReportController): Router;
//# sourceMappingURL=diagnosticReportRoutes.d.ts.map