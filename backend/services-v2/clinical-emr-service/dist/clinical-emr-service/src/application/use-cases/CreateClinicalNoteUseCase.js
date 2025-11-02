"use strict";
/**
 * CreateClinicalNoteUseCase - Application Layer
 * Use case for creating new clinical notes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClinicalNoteUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const ClinicalNote_aggregate_1 = require("../../domain/aggregates/ClinicalNote.aggregate");
const NoteId_1 = require("../../domain/value-objects/NoteId");
const ClinicalNoteRequest_1 = require("../dto/ClinicalNoteRequest");
class CreateClinicalNoteUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(clinicalNoteRepository, eventPublisher) {
        super();
        this.clinicalNoteRepository = clinicalNoteRepository;
        this.eventPublisher = eventPublisher;
    }
    async execute(request) {
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
    async executeInternal(request) {
        try {
            // Generate next sequence number
            const sequence = await this.clinicalNoteRepository.getNextSequence();
            const noteId = NoteId_1.NoteId.generate(sequence);
            // Create clinical note aggregate
            const clinicalNote = ClinicalNote_aggregate_1.ClinicalNoteAggregate.create(noteId, request.medicalRecordId, request.patientId, request.authorId, request.noteType, request.noteTitle, request.noteContent, request.createdBy, {
                clinicalFindings: request.clinicalFindings,
                assessment: request.assessment,
                plan: request.plan,
                requiresCosign: request.requiresCosign,
                specialtyCode: request.specialtyCode
            });
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
        }
        catch (error) {
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
    async validate(request) {
        const errors = (0, ClinicalNoteRequest_1.validateCreateClinicalNoteRequest)(request);
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    async authorize(request, userId) {
        // Authorization: Only the author can create their own notes
        return request.authorId === userId || request.createdBy === userId;
    }
    involvesPHI(request) {
        // Clinical notes always contain PHI (Protected Health Information)
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.CreateClinicalNoteUseCase = CreateClinicalNoteUseCase;
//# sourceMappingURL=CreateClinicalNoteUseCase.js.map