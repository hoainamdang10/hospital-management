/**
 * LabResultController - Presentation Layer
 * HTTP request handlers for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */

import { Request, Response } from 'express';
import { CreateLabResultUseCase } from '../../application/use-cases/CreateLabResultUseCase';
import { GetLabResultUseCase } from '../../application/use-cases/GetLabResultUseCase';
import { UpdateLabResultUseCase } from '../../application/use-cases/UpdateLabResultUseCase';
import { GetPatientLabResultsUseCase } from '../../application/use-cases/GetPatientLabResultsUseCase';
import { BaseController } from './BaseController';
import { LabTestType, LabResultStatus } from '../../domain/aggregates/LabResult.aggregate';

export class LabResultController extends BaseController {
  constructor(
    private readonly createLabResultUseCase: CreateLabResultUseCase,
    private readonly getLabResultUseCase: GetLabResultUseCase,
    private readonly updateLabResultUseCase: UpdateLabResultUseCase,
    private readonly getPatientLabResultsUseCase: GetPatientLabResultsUseCase
  ) {
    super();
  }

  /**
   * Create new lab result
   * POST /api/v2/clinical-emr/lab-results
   */
  async createLabResult(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';

      const result = await this.createLabResultUseCase.execute({
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        testName: req.body.testName,
        testType: req.body.testType,
        testCode: req.body.testCode,
        specimenType: req.body.specimenType,
        orderedBy: req.body.orderedBy || userId,
        orderedAt: req.body.orderedAt ? new Date(req.body.orderedAt) : undefined,
        priority: req.body.priority,
        notes: req.body.notes,
        createdBy: userId,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            resultId: result.resultId,
          },
          message: 'Lab result created successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Get lab result by ID
   * GET /api/v2/clinical-emr/lab-results/:id
   */
  async getLabResult(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';
      const resultId = req.params.id;
      const accessPurpose = (req.query.accessPurpose as string) || 'view';
      const ipAddress = req.ip;

      const result = await this.getLabResultUseCase.execute({
        resultId,
        accessedBy: userId,
        accessPurpose,
        ipAddress,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.labResult,
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Update lab result
   * PUT /api/v2/clinical-emr/lab-results/:id
   */
  async updateLabResult(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';
      const resultId = req.params.id;

      const result = await this.updateLabResultUseCase.execute({
        resultId,
        resultValue: req.body.resultValue,
        referenceRange: req.body.referenceRange,
        unit: req.body.unit,
        interpretation: req.body.interpretation,
        performedBy: req.body.performedBy,
        verifiedBy: req.body.verifiedBy,
        status: req.body.status,
        notes: req.body.notes,
        updatedBy: userId,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            resultId: result.resultId,
            status: result.status,
          },
          message: 'Lab result updated successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  /**
   * Get patient lab results
   * GET /api/v2/clinical-emr/patients/:patientId/lab-results
   */
  async getPatientLabResults(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.params.patientId;
      const testType = req.query.testType as LabTestType | undefined;
      const status = req.query.status as LabResultStatus | undefined;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await this.getPatientLabResultsUseCase.execute({
        patientId,
        testType,
        status,
        fromDate,
        toDate,
        limit,
        offset,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.labResults,
          pagination: {
            total: result.total,
            limit: result.limit,
            offset: result.offset,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      this.handleError(res, error);
    }
  }
}

