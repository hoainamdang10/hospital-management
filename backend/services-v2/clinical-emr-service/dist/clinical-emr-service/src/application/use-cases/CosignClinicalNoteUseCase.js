"use strict";
/**
 * CosignClinicalNoteUseCase - Application Layer
 * Use case for cosigning clinical notes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosignClinicalNoteUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const ClinicalNoteRequest_1 = require("../dto/ClinicalNoteRequest");
class CosignClinicalNoteUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
                noteId: request.noteId,
                message: 'Validation failed',
                errors: validation.errors
            };
        }
        // Execute
        return await this.executeInternal(request);
    }
    async executeInternal(request) {
        try {
            // Find clinical note
            const clinicalNote = await this.clinicalNoteRepository.findByIdString(request.noteId);
            if (!clinicalNote) {
                return {
                    success: false,
                    noteId: request.noteId,
                    message: 'Không tìm thấy ghi chú lâm sàng',
                    errors: [{
                            field: 'noteId',
                            message: 'Ghi chú lâm sàng không tồn tại',
                            code: 'NOTE_NOT_FOUND',
                            value: request.noteId
                        }]
                };
            }
            // Cosign clinical note
            clinicalNote.cosign(request.cosignedBy, request.cosignComment);
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
                noteId: request.noteId,
                message: 'Ký tên ghi chú lâm sàng thành công',
                data: {
                    noteId: request.noteId,
                    authorId: clinicalNote.authorId,
                    cosignedBy: request.cosignedBy,
                    cosignedAt: clinicalNote.cosignedAt.toISOString(),
                    status: clinicalNote.status
                }
            };
        }
        catch (error) {
            // Handle domain validation errors
            if (error instanceof Error && (error.message.includes('không yêu cầu ký tên') ||
                error.message.includes('đã được ký tên') ||
                error.message.includes('Chỉ có thể ký tên') ||
                error.message.includes('không thể là tác giả'))) {
                return {
                    success: false,
                    noteId: request.noteId,
                    message: error.message,
                    errors: [{
                            field: 'general',
                            message: error.message,
                            code: 'COSIGN_NOT_ALLOWED'
                        }]
                };
            }
            // Handle other errors
            throw new Error(`Lỗi khi ký tên ghi chú lâm sàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validate(request) {
        const errors = (0, ClinicalNoteRequest_1.validateCosignClinicalNoteRequest)(request);
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    async authorize(request, userId) {
        // Authorization: Only the cosigner can perform this action
        return request.cosignedBy === userId;
    }
    involvesPHI(request) {
        // Clinical notes always contain PHI
        return true;
    }
    getPatientId(request) {
        // Patient ID is determined after fetching the note
        return null;
    }
}
exports.CosignClinicalNoteUseCase = CosignClinicalNoteUseCase;
//# sourceMappingURL=CosignClinicalNoteUseCase.js.map