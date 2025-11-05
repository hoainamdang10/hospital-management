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

export class FHIRController extends BaseController {
  constructor(
    private readonly bulkExportFHIRUseCase: BulkExportFHIRUseCase
  ) {
    super();
  }

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
  async bulkExportFHIR(req: Request, res: Response): Promise<void> {
    try {
      const { patientIds, resourceTypes, startDate, endDate, format, async } = req.body;
      const requestedBy = (req as any).user?.id || 'unknown';
      const requestedByRole = (req as any).user?.role || 'unknown';

      this.logger.info('Bulk FHIR export requested', {
        requestedBy,
        requestedByRole,
        patientCount: patientIds?.length || 'all',
        resourceTypes,
        format,
        async
      });

      const result = await this.bulkExportFHIRUseCase.execute({
        patientIds,
        resourceTypes,
        startDate,
        endDate,
        format: format || 'json',
        async: async || false,
        requestedBy,
        requestedByRole
      });

      if (!result.success) {
        this.logger.warn('Failed to export FHIR data', {
          message: result.message,
          errors: result.errors
        });

        if (result.errors?.some(e => e.code === 'FORBIDDEN')) {
          res.status(403).json(result);
          return;
        }

        res.status(400).json(result);
        return;
      }

      // If async export, return 202 Accepted with job ID
      if (result.data?.jobId) {
        this.logger.info('FHIR export job created', {
          jobId: result.data.jobId
        });

        res.status(202).json(result);
        return;
      }

      // Synchronous export
      this.logger.info('FHIR export completed', {
        totalRecords: result.data?.statistics.totalRecords,
        totalPatients: result.data?.statistics.totalPatients
      });

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error exporting FHIR data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi export FHIR data',
        errors: [{ field: 'system', message: error instanceof Error ? error.message : 'Unknown', code: 'INTERNAL_ERROR' }]
      });
    }
  }
}

