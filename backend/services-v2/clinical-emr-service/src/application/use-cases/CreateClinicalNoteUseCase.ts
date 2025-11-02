/**
 * CreateClinicalNoteUseCase - Application Layer
 * Use case for creating new clinical notes
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { ClinicalNoteAggregate } from '../../domain/aggregates/ClinicalNote.aggregate';
import { NoteId } from '../../domain/value-objects/NoteId';
import { CreateClinicalNoteRequest, CreateClinicalNoteResponse, validateCreateClinicalNoteRequest } from '../dto/ClinicalNoteRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export class CreateClinicalNoteUseCase extends BaseHealthcareUseCase<CreateClinicalNoteRequest, CreateClinicalNoteResponse> {
  constructor(
    private readonly clinicalNoteRepository: IClinicalNoteRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: CreateClinicalNoteRequest): Promise<CreateClinicalNoteResponse> {
    // Validate
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        noteId: '',
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    // Execute
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: CreateClinicalNoteRequest): Promise<CreateClinicalNoteResponse> {
    try {
      // Generate next sequence number
      const sequence = await this.clinicalNoteRepository.getNextSequence();
      const noteId = NoteId.generate(sequence);

      // Create clinical note aggregate
      const clinicalNote = ClinicalNoteAggregate.create(
        noteId,
        request.medicalRecordId,
        request.patientId,
        request.authorId,
        request.noteType,
        request.noteTitle,
        request.noteContent,
        request.createdBy,
        {
          clinicalFindings: request.clinicalFindings,
          assessment: request.assessment,
          plan: request.plan,
          requiresCosign: request.requiresCosign,
          specialtyCode: request.specialtyCode
        }
      );

      // Save to repository
      await this.clinicalNoteRepository.save(clinicalNote);

      // Publish domain events
      const events = clinicalNote.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        clinicalNote.markEventsAsCommitted();
      }

      // Return success response
      return {
        success: true,
        noteId: noteId.value,
        message: 'Ghi chú lâm sàng đã được tạo thành công',
        data: {
          noteId: noteId.value,
          medicalRecordId: request.medicalRecordId,
          patientId: request.patientId,
          authorId: request.authorId,
          noteType: request.noteType,
          status: clinicalNote.status,
          requiresCosign: clinicalNote.requiresCosign,
          createdAt: clinicalNote.createdAt.toISOString(),
          createdBy: request.createdBy
        }
      };

    } catch (error) {
      // Handle domain validation errors
      if (error instanceof Error && error.message.includes('là bắt buộc')) {
        return {
          success: false,
          noteId: '',
          message: 'Lỗi validation dữ liệu',
          errors: [{
            field: 'general',
            message: error.message,
            code: 'DOMAIN_VALIDATION_ERROR'
          }]
        };
      }

      // Handle other errors
      throw new Error(`Lỗi khi tạo ghi chú lâm sàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  override async validate(request: CreateClinicalNoteRequest): Promise<ValidationResult> {
    const errors = validateCreateClinicalNoteRequest(request);
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  async authorize(request: CreateClinicalNoteRequest, userId: string): Promise<boolean> {
    // Authorization: Only the author can create their own notes
    return request.authorId === userId || request.createdBy === userId;
  }

  involvesPHI(request: CreateClinicalNoteRequest): boolean {
    // Clinical notes always contain PHI (Protected Health Information)
    return true;
  }

  getPatientId(request: CreateClinicalNoteRequest): string | null {
    return request.patientId || null;
  }
}
