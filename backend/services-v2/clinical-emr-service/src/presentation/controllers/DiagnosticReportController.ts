/**
 * DiagnosticReportController - HTTP Controller for Diagnostic Reports
 * @compliance Clean Architecture, RESTful API, FHIR R4
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreateDiagnosticReportUseCase,
  GetDiagnosticReportUseCase,
  UpdateDiagnosticReportUseCase,
  FinalizeDiagnosticReportUseCase,
  ListDiagnosticReportsUseCase,
} from '../../application/use-cases';
import {
  CreateDiagnosticReportRequest,
  GetDiagnosticReportRequest,
  UpdateDiagnosticReportRequest,
  FinalizeDiagnosticReportRequest,
  ListDiagnosticReportsRequest,
} from '../../application/dto/DiagnosticReportRequest';

export class DiagnosticReportController {
  constructor(
    private readonly createUseCase: CreateDiagnosticReportUseCase,
    private readonly getUseCase: GetDiagnosticReportUseCase,
    private readonly updateUseCase: UpdateDiagnosticReportUseCase,
    private readonly finalizeUseCase: FinalizeDiagnosticReportUseCase,
    private readonly listUseCase: ListDiagnosticReportsUseCase
  ) {}

  async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateDiagnosticReportRequest = {
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        orderedBy: req.body.orderedBy,
        reportType: req.body.reportType,
        reportTitle: req.body.reportTitle,
        testName: req.body.testName,
        testCode: req.body.testCode,
        specimenType: req.body.specimenType,
        labCode: req.body.labCode,
        status: req.body.status,
        createdBy: req.user?.userId || req.body.createdBy,
      };

      const response = await this.createUseCase.execute(request);
      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: GetDiagnosticReportRequest = {
        reportId: req.params.reportId,
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

  async updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UpdateDiagnosticReportRequest = {
        reportId: req.params.reportId,
        results: req.body.results,
        interpretation: req.body.interpretation,
        conclusion: req.body.conclusion,
        recommendations: req.body.recommendations,
        reportedBy: req.body.reportedBy,
        testPerformedAt: req.body.testPerformedAt,
        updatedBy: req.user?.userId || req.body.updatedBy,
        updateReason: req.body.updateReason,
      };

      const response = await this.updateUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async finalizeReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: FinalizeDiagnosticReportRequest = {
        reportId: req.params.reportId,
        verifiedBy: req.user?.userId || req.body.verifiedBy,
        verificationComment: req.body.verificationComment,
      };

      const response = await this.finalizeUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ListDiagnosticReportsRequest = {
        patientId: req.query.patientId as string,
        medicalRecordId: req.query.medicalRecordId as string,
        orderedBy: req.query.orderedBy as string,
        reportType: req.query.reportType as any,
        status: req.query.status as any,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
        testName: req.query.testName as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
        accessedBy: req.user?.userId || '',
      };

      const response = await this.listUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }
}
