/**
 * FHIRController - Presentation Layer
 * REST API controller for FHIR R4 export
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance FHIR R4, HIPAA, Clean Architecture
 */
import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { BulkExportFHIRUseCase } from '../../application/use-cases/BulkExportFHIRUseCase';
export declare class FHIRController extends BaseController {
    private readonly bulkExportFHIRUseCase;
    constructor(bulkExportFHIRUseCase: BulkExportFHIRUseCase);
    /**
     * @swagger
     * /api/v2/clinical-emr/fhir/export:
     *   post:
     *     summary: Bulk export medical records in FHIR R4 format (HIPAA data portability)
     *     tags: [FHIR]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               patientIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Patient IDs to export (empty = all accessible)
     *               resourceTypes:
     *                 type: array
     *                 items:
     *                   type: string
     *                   enum: [Patient, Observation, Condition, MedicationRequest, DiagnosticReport, Procedure, Encounter]
     *                 description: FHIR resource types to include
     *               startDate:
     *                 type: string
     *                 format: date-time
     *                 description: Start date for filtering
     *               endDate:
     *                 type: string
     *                 format: date-time
     *                 description: End date for filtering
     *               format:
     *                 type: string
     *                 enum: [json, xml, ndjson]
     *                 default: json
     *                 description: FHIR export format
     *               async:
     *                 type: boolean
     *                 default: false
     *                 description: If true, return job ID instead of data
     *     responses:
     *       200:
     *         description: FHIR export successful
     *       202:
     *         description: Export job created (async mode)
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden - Insufficient permissions
     *       500:
     *         description: Internal server error
     */
    bulkExportFHIR(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=FHIRController.d.ts.map