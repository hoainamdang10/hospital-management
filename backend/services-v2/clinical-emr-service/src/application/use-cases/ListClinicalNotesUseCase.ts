/**
 * ListClinicalNotesUseCase - Application Layer
 * Use case for listing clinical notes with filtering
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { ListClinicalNotesRequest, ListClinicalNotesResponse, ClinicalNoteSummary } from '../dto/ClinicalNoteRequest';

export class ListClinicalNotesUseCase extends BaseHealthcareUseCase<ListClinicalNotesRequest, ListClinicalNotesResponse> {
  constructor(
    private readonly clinicalNoteRepository: IClinicalNoteRepository
  ) {
    super();
  }

  override async execute(request: ListClinicalNotesRequest): Promise<ListClinicalNotesResponse> {
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

  protected async executeInternal(request: ListClinicalNotesRequest): Promise<ListClinicalNotesResponse> {
    try {
      // Build search criteria
      const criteria: any = {};

      if (request.medicalRecordId) {
        criteria.medicalRecordId = request.medicalRecordId;
      }
      if (request.patientId) {
        criteria.patientId = request.patientId;
      }
      if (request.authorId) {
        criteria.authorId = request.authorId;
      }
      if (request.noteType) {
        criteria.noteType = request.noteType;
      }
      if (request.status) {
        criteria.status = request.status;
      }
      if (request.startDate) {
        criteria.startDate = new Date(request.startDate);
      }
      if (request.endDate) {
        criteria.endDate = new Date(request.endDate);
      }

      // Search clinical notes
      let clinicalNotes = await this.clinicalNoteRepository.search(criteria);

      // Filter by requiresCosign if specified
      if (request.requiresCosign !== undefined) {
        clinicalNotes = clinicalNotes.filter(note => note.requiresCosign === request.requiresCosign);
      }

      // Get total count
      const total = clinicalNotes.length;

      // Apply pagination
      const limit = request.limit || 50;
      const offset = request.offset || 0;
      const paginatedNotes = clinicalNotes.slice(offset, offset + limit);

      // Map to summary DTOs
      const noteSummaries: ClinicalNoteSummary[] = paginatedNotes.map(note => ({
        noteId: note.noteId.value,
        medicalRecordId: note.medicalRecordId,
        patientId: note.patientId,
        authorId: note.authorId,
        noteType: note.noteType,
        noteTitle: note.noteTitle,
        requiresCosign: note.requiresCosign,
        cosignedBy: note.cosignedBy,
        cosignedAt: note.cosignedAt?.toISOString(),
        status: note.status,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString()
      }));

      // Return success response
      return {
        success: true,
        message: `Tìm thấy ${total} ghi chú lâm sàng`,
        data: {
          notes: noteSummaries,
          total,
          limit,
          offset
        }
      };

    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách ghi chú lâm sàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  override async validate(request: ListClinicalNotesRequest): Promise<ValidationResult> {
    const errors = [];

    // Validate pagination
    if (request.limit !== undefined && request.limit <= 0) {
      errors.push({
        field: 'limit',
        message: 'Limit phải lớn hơn 0',
        code: 'INVALID_VALUE',
        value: request.limit
      });
    }

    if (request.limit !== undefined && request.limit > 200) {
      errors.push({
        field: 'limit',
        message: 'Limit không được vượt quá 200',
        code: 'MAX_VALUE_EXCEEDED',
        value: request.limit
      });
    }

    if (request.offset !== undefined && request.offset < 0) {
      errors.push({
        field: 'offset',
        message: 'Offset không thể âm',
        code: 'INVALID_VALUE',
        value: request.offset
      });
    }

    // Validate date range
    if (request.startDate && request.endDate) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      if (startDate > endDate) {
        errors.push({
          field: 'dateRange',
          message: 'Ngày bắt đầu không thể sau ngày kết thúc',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async authorize(request: ListClinicalNotesRequest, userId: string): Promise<boolean> {
    // Authorization: User must be accessing for a legitimate purpose
    return request.accessedBy === userId;
  }

  involvesPHI(request: ListClinicalNotesRequest): boolean {
    // Clinical notes always contain PHI
    return true;
  }

  getPatientId(request: ListClinicalNotesRequest): string | null {
    return request.patientId || null;
  }
}
