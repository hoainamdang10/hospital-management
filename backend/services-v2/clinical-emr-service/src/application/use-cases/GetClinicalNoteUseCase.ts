/**
 * GetClinicalNoteUseCase - Application Layer
 * Use case for retrieving a clinical note
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { GetClinicalNoteRequest, GetClinicalNoteResponse } from '../dto/ClinicalNoteRequest';

export class GetClinicalNoteUseCase extends BaseHealthcareUseCase<GetClinicalNoteRequest, GetClinicalNoteResponse> {
  constructor(
    private readonly clinicalNoteRepository: IClinicalNoteRepository
  ) {
    super();
  }

  override async execute(request: GetClinicalNoteRequest): Promise<GetClinicalNoteResponse> {
    // Validate
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    // Execute
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: GetClinicalNoteRequest): Promise<GetClinicalNoteResponse> {
    try {
      // Find clinical note
      const clinicalNote = await this.clinicalNoteRepository.findByIdString(request.noteId);

      if (!clinicalNote) {
        return {
          success: false,
          message: 'Không tìm thấy ghi chú lâm sàng',
          errors: [{
            field: 'noteId',
            message: 'Ghi chú lâm sàng không tồn tại',
            code: 'NOTE_NOT_FOUND',
            value: request.noteId
          }]
        };
      }

      // Record access for HIPAA compliance
      clinicalNote.recordReadAccess(request.accessedBy, request.purpose);
      await this.clinicalNoteRepository.save(clinicalNote);

      // Return clinical note data
      return {
        success: true,
        message: 'Lấy ghi chú lâm sàng thành công',
        data: {
          noteId: clinicalNote.noteId.value,
          medicalRecordId: clinicalNote.medicalRecordId,
          patientId: clinicalNote.patientId,
          authorId: clinicalNote.authorId,
          noteType: clinicalNote.noteType,
          noteTitle: clinicalNote.noteTitle,
          noteContent: clinicalNote.noteContent,
          clinicalFindings: clinicalNote.clinicalFindings,
          assessment: clinicalNote.assessment,
          plan: clinicalNote.plan,
          requiresCosign: clinicalNote.requiresCosign,
          cosignedBy: clinicalNote.cosignedBy,
          cosignedAt: clinicalNote.cosignedAt?.toISOString(),
          cosignComment: clinicalNote.cosignComment,
          status: clinicalNote.status,
          createdAt: clinicalNote.createdAt.toISOString(),
          updatedAt: clinicalNote.updatedAt.toISOString(),
          createdBy: clinicalNote.createdBy,
          updatedBy: clinicalNote.updatedBy
        }
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy ghi chú lâm sàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  override async validate(request: GetClinicalNoteRequest): Promise<ValidationResult> {
    const errors = [];

    if (!request.noteId || request.noteId.trim() === '') {
      errors.push({
        field: 'noteId',
        message: 'NoteId là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.accessedBy || request.accessedBy.trim() === '') {
      errors.push({
        field: 'accessedBy',
        message: 'AccessedBy là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async authorize(request: GetClinicalNoteRequest, userId: string): Promise<boolean> {
    // Authorization: User must be accessing for a legitimate purpose
    return request.accessedBy === userId;
  }

  involvesPHI(request: GetClinicalNoteRequest): boolean {
    // Clinical notes always contain PHI
    return true;
  }

  getPatientId(request: GetClinicalNoteRequest): string | null {
    // Patient ID is determined after fetching the note
    return null;
  }
}
