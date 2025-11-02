/**
 * TreatmentPlanController - HTTP Controller for Treatment Plans
 * @compliance Clean Architecture, RESTful API
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreateTreatmentPlanUseCase,
  GetTreatmentPlanUseCase,
  UpdateTreatmentPlanUseCase,
  CompleteTreatmentPlanUseCase,
  ListTreatmentPlansUseCase,
} from '../../application/use-cases';
import {
  CreateTreatmentPlanRequest,
  GetTreatmentPlanRequest,
  UpdateTreatmentPlanRequest,
  CompleteTreatmentPlanRequest,
  ListTreatmentPlansRequest,
} from '../../application/dto/TreatmentPlanRequest';

export class TreatmentPlanController {
  constructor(
    private readonly createUseCase: CreateTreatmentPlanUseCase,
    private readonly getUseCase: GetTreatmentPlanUseCase,
    private readonly updateUseCase: UpdateTreatmentPlanUseCase,
    private readonly completeUseCase: CompleteTreatmentPlanUseCase,
    private readonly listUseCase: ListTreatmentPlansUseCase
  ) {}

  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateTreatmentPlanRequest = {
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        diagnosis: req.body.diagnosis,
        treatmentGoals: req.body.treatmentGoals,
        treatmentItems: req.body.treatmentItems,
        startDate: req.body.startDate,
        createdBy: req.user?.userId || req.body.createdBy,
        diagnosisCode: req.body.diagnosisCode,
        endDate: req.body.endDate,
        notes: req.body.notes,
      };

      const response = await this.createUseCase.execute(request);
      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: GetTreatmentPlanRequest = {
        planId: req.params.planId,
        accessedBy: req.user?.userId || '',
        accessPurpose: req.query.accessPurpose as string,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };

      const response = await this.getUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UpdateTreatmentPlanRequest = {
        planId: req.params.planId,
        treatmentGoals: req.body.treatmentGoals,
        treatmentItems: req.body.treatmentItems,
        endDate: req.body.endDate,
        notes: req.body.notes,
        itemStatusUpdates: req.body.itemStatusUpdates,
        progressPercentage: req.body.progressPercentage,
        patientConsent: req.body.patientConsent,
        updatedBy: req.user?.userId || req.body.updatedBy,
      };

      const response = await this.updateUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async completePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CompleteTreatmentPlanRequest = {
        planId: req.params.planId,
        completedBy: req.user?.userId || req.body.completedBy,
        completionNotes: req.body.completionNotes,
      };

      const response = await this.completeUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ListTreatmentPlansRequest = {
        patientId: req.query.patientId as string,
        medicalRecordId: req.query.medicalRecordId as string,
        status: req.query.status as any,
        createdBy: req.query.createdBy as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        diagnosisCode: req.query.diagnosisCode as string,
        hasConsent: req.query.hasConsent === 'true' ? true : req.query.hasConsent === 'false' ? false : undefined,
        searchText: req.query.searchText as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const response = await this.listUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }
}
