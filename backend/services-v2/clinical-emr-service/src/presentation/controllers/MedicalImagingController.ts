/**
 * MedicalImagingController - Presentation Layer
 * HTTP request handlers for medical imaging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */

import { Request, Response } from 'express';
import { CreateMedicalImagingUseCase } from '../../application/use-cases/CreateMedicalImagingUseCase';
import { GetMedicalImagingUseCase } from '../../application/use-cases/GetMedicalImagingUseCase';
import { UpdateMedicalImagingUseCase } from '../../application/use-cases/UpdateMedicalImagingUseCase';
import { GetPatientMedicalImagingUseCase } from '../../application/use-cases/GetPatientMedicalImagingUseCase';
import { BaseController } from './BaseController';
import { ImagingType, ImagingModality, ImagingStatus } from '../../domain/aggregates/MedicalImaging.aggregate';

export class MedicalImagingController extends BaseController {
  constructor(
    private readonly createMedicalImagingUseCase: CreateMedicalImagingUseCase,
    private readonly getMedicalImagingUseCase: GetMedicalImagingUseCase,
    private readonly updateMedicalImagingUseCase: UpdateMedicalImagingUseCase,
    private readonly getPatientMedicalImagingUseCase: GetPatientMedicalImagingUseCase
  ) {
    super();
  }

  /**
   * Create new medical imaging study
   * POST /api/v2/clinical-emr/medical-imaging
   */
  async createMedicalImaging(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';

      const result = await this.createMedicalImagingUseCase.execute({
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        imagingType: req.body.imagingType,
        modality: req.body.modality,
        bodyPart: req.body.bodyPart,
        laterality: req.body.laterality,
        studyDate: req.body.studyDate ? new Date(req.body.studyDate) : undefined,
        studyDescription: req.body.studyDescription,
        clinicalIndication: req.body.clinicalIndication,
        orderedBy: req.body.orderedBy || userId,
        orderedAt: req.body.orderedAt ? new Date(req.body.orderedAt) : undefined,
        priority: req.body.priority,
        technique: req.body.technique,
        contrastUsed: req.body.contrastUsed,
        contrastType: req.body.contrastType,
        notes: req.body.notes,
        createdBy: userId,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          data: {
            imagingId: result.imagingId,
          },
          message: 'Medical imaging created successfully',
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
   * Get medical imaging by ID
   * GET /api/v2/clinical-emr/medical-imaging/:id
   */
  async getMedicalImaging(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';
      const imagingId = req.params.id;
      const accessPurpose = (req.query.accessPurpose as string) || 'view';
      const ipAddress = req.ip;

      const result = await this.getMedicalImagingUseCase.execute({
        imagingId,
        accessedBy: userId,
        accessPurpose,
        ipAddress,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.imaging,
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
   * Update medical imaging
   * PUT /api/v2/clinical-emr/medical-imaging/:id
   */
  async updateMedicalImaging(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId || 'system';
      const imagingId = req.params.id;

      const result = await this.updateMedicalImagingUseCase.execute({
        imagingId,
        findings: req.body.findings,
        impression: req.body.impression,
        radiologistId: req.body.radiologistId,
        technique: req.body.technique,
        imageUrls: req.body.imageUrls,
        dicomStudyUid: req.body.dicomStudyUid,
        seriesCount: req.body.seriesCount,
        instanceCount: req.body.instanceCount,
        verifiedBy: req.body.verifiedBy,
        notes: req.body.notes,
        updatedBy: userId,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            imagingId: result.imagingId,
            status: result.status,
          },
          message: 'Medical imaging updated successfully',
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
   * Get patient medical imaging
   * GET /api/v2/clinical-emr/medical-imaging/patients/:patientId
   */
  async getPatientMedicalImaging(req: Request, res: Response): Promise<void> {
    try {
      const patientId = req.params.patientId;
      const imagingType = req.query.imagingType as ImagingType | undefined;
      const modality = req.query.modality as ImagingModality | undefined;
      const status = req.query.status as ImagingStatus | undefined;
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await this.getPatientMedicalImagingUseCase.execute({
        patientId,
        imagingType,
        modality,
        status,
        fromDate,
        toDate,
        limit,
        offset,
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.imaging,
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

