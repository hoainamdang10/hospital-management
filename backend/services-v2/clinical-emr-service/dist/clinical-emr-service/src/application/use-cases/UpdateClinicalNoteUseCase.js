"use strict";
/**
 * UpdateClinicalNoteUseCase - Application Layer
 * Use case for updating clinical note content
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateClinicalNoteUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const ClinicalNoteRequest_1 = require("../dto/ClinicalNoteRequest");
class UpdateClinicalNoteUseCase extends use_case_interface_1.BaseHealthcareUseCase {
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
            // Prepare updates
            const updates = {};
            const updatedFields = [];
            if (request.noteTitle !== undefined) {
                updates.noteTitle = request.noteTitle;
                updatedFields.push('noteTitle');
            }
            if (request.noteContent !== undefined) {
                updates.noteContent = request.noteContent;
                updatedFields.push('noteContent');
            }
            if (request.clinicalFindings !== undefined) {
                updates.clinicalFindings = request.clinicalFindings;
                updatedFields.push('clinicalFindings');
            }
            if (request.assessment !== undefined) {
                updates.assessment = request.assessment;
                updatedFields.push('assessment');
            }
            if (request.plan !== undefined) {
                updates.plan = request.plan;
                updatedFields.push('plan');
            }
            // Update clinical note
            clinicalNote.updateContent(updates, request.updatedBy, request.updateReason);
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
                message: 'Cập nhật ghi chú lâm sàng thành công',
                data: {
                    noteId: request.noteId,
                    updatedFields,
                    updatedAt: clinicalNote.updatedAt.toISOString(),
                    updatedBy: request.updatedBy
                }
            };
        }
        catch (error) {
            // Handle domain validation errors
            if (error instanceof Error && error.message.includes('Không thể cập nhật')) {
                return {
                    success: false,
                    noteId: request.noteId,
                    message: error.message,
                    errors: [{
                            field: 'general',
                            message: error.message,
                            code: 'UPDATE_NOT_ALLOWED'
                        }]
                };
            }
            // Handle other errors
            throw new Error(`Lỗi khi cập nhật ghi chú lâm sàng: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async validate(request) {
        const errors = (0, ClinicalNoteRequest_1.validateUpdateClinicalNoteRequest)(request);
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    async authorize(request, userId) {
        // Authorization: Only the person updating can modify
        return request.updatedBy === userId;
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
exports.UpdateClinicalNoteUseCase = UpdateClinicalNoteUseCase;
//# sourceMappingURL=UpdateClinicalNoteUseCase.js.map