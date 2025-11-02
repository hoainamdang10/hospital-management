/**
 * PrescriptionController - HTTP Controller for Prescriptions
 * @compliance Clean Architecture, RESTful API, Pharmacy Integration
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreatePrescriptionUseCase,
  GetPrescriptionUseCase,
  DispensePrescriptionUseCase,
  ListPrescriptionsUseCase,
} from '../../application/use-cases';
import {
  CreatePrescriptionRequest,
  GetPrescriptionRequest,
  DispensePrescriptionRequest,
  ListPrescriptionsRequest,
} from '../../application/dto/PrescriptionRequest';

export class PrescriptionController {
  constructor(
    private readonly createUseCase: CreatePrescriptionUseCase,
    private readonly getUseCase: GetPrescriptionUseCase,
    private readonly dispenseUseCase: DispensePrescriptionUseCase,
    private readonly listUseCase: ListPrescriptionsUseCase
  ) {}

  async createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreatePrescriptionRequest = {
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        prescribedBy: req.body.prescribedBy,
        medications: req.body.medications,
        prescribedDate: req.body.prescribedDate,
        createdBy: req.user?.userId || req.body.createdBy,
        diagnosis: req.body.diagnosis,
        diagnosisCode: req.body.diagnosisCode,
        generalInstructions: req.body.generalInstructions,
        precautions: req.body.precautions,
        validUntil: req.body.validUntil,
        refillsAllowed: req.body.refillsAllowed,
      };

      const response = await this.createUseCase.execute(request);
      res.status(201).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async getPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: GetPrescriptionRequest = {
        prescriptionId: req.params.prescriptionId,
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

  async dispensePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: DispensePrescriptionRequest = {
        prescriptionId: req.params.prescriptionId,
        dispensedBy: req.user?.userId || req.body.dispensedBy,
        pharmacyId: req.body.pharmacyId,
      };

      const response = await this.dispenseUseCase.execute(request);
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  async listPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ListPrescriptionsRequest = {
        patientId: req.query.patientId as string,
        medicalRecordId: req.query.medicalRecordId as string,
        prescribedBy: req.query.prescribedBy as string,
        status: req.query.status as any,
        pharmacyId: req.query.pharmacyId as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        hasRefills: req.query.hasRefills === 'true' ? true : req.query.hasRefills === 'false' ? false : undefined,
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
