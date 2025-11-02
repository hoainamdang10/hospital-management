/**
 * ClinicalNoteController - HTTP Controller for Clinical Notes
 * Handles HTTP requests and delegates to use cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreateClinicalNoteUseCase,
  GetClinicalNoteUseCase,
  UpdateClinicalNoteUseCase,
  CosignClinicalNoteUseCase,
  ListClinicalNotesUseCase,
} from '../../application/use-cases';
import {
  CreateClinicalNoteRequest,
  GetClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  CosignClinicalNoteRequest,
  ListClinicalNotesRequest,
} from '../../application/dto/ClinicalNoteRequest';

export class ClinicalNoteController {
  constructor(
    private readonly createUseCase: CreateClinicalNoteUseCase,
    private readonly getUseCase: GetClinicalNoteUseCase,
    private readonly updateUseCase: UpdateClinicalNoteUseCase,
    private readonly cosignUseCase: CosignClinicalNoteUseCase,
    private readonly listUseCase: ListClinicalNotesUseCase
  ) {}

  async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CreateClinicalNoteRequest = {
        medicalRecordId: req.body.medicalRecordId,
        patientId: req.body.patientId,
        authorId: req.body.authorId || req.user?.userId,
        noteType: req.body.noteType,
        noteTitle: req.body.noteTitle,
        noteContent: req.body.noteContent,
        clinicalFindings: req.body.clinicalFindings,
        assessment: req.body.assessment,
        plan: req.body.plan,
        requiresCosign: req.body.requiresCosign,
        specialtyCode: req.body.specialtyCode,
        createdBy: req.user?.userId || req.body.createdBy,
      };

      const response = await this.createUseCase.execute(request);
      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async getNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: GetClinicalNoteRequest = {
        noteId: req.params.noteId,
        accessedBy: req.user?.userId || '',
        purpose: req.query.purpose as string,
      };

      const response = await this.getUseCase.execute(request);
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UpdateClinicalNoteRequest = {
        noteId: req.params.noteId,
        noteTitle: req.body.noteTitle,
        noteContent: req.body.noteContent,
        clinicalFindings: req.body.clinicalFindings,
        assessment: req.body.assessment,
        plan: req.body.plan,
        updatedBy: req.user?.userId || req.body.updatedBy,
        updateReason: req.body.updateReason,
      };

      const response = await this.updateUseCase.execute(request);
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async cosignNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: CosignClinicalNoteRequest = {
        noteId: req.params.noteId,
        cosignedBy: req.user?.userId || req.body.cosignedBy,
        cosignComment: req.body.cosignComment,
      };

      const response = await this.cosignUseCase.execute(request);
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ListClinicalNotesRequest = {
        patientId: req.query.patientId as string,
        medicalRecordId: req.query.medicalRecordId as string,
        authorId: req.query.authorId as string,
        noteType: req.query.noteType as any,
        status: req.query.status as any,
        requiresCosign: req.query.requiresCosign === 'true',
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
        accessedBy: req.user?.userId || '',
      };

      const response = await this.listUseCase.execute(request);
      res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }
}
