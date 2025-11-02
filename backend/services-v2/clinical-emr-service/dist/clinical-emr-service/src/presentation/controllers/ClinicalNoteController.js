"use strict";
/**
 * ClinicalNoteController - HTTP Controller for Clinical Notes
 * Handles HTTP requests and delegates to use cases
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalNoteController = void 0;
class ClinicalNoteController {
    constructor(createUseCase, getUseCase, updateUseCase, cosignUseCase, listUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.updateUseCase = updateUseCase;
        this.cosignUseCase = cosignUseCase;
        this.listUseCase = listUseCase;
    }
    async createNote(req, res, next) {
        try {
            const request = {
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
        }
        catch (error) {
            next(error);
        }
    }
    async getNote(req, res, next) {
        try {
            const request = {
                noteId: req.params.noteId,
                accessedBy: req.user?.userId || '',
                purpose: req.query.purpose,
            };
            const response = await this.getUseCase.execute(request);
            res.status(200).json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateNote(req, res, next) {
        try {
            const request = {
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
        }
        catch (error) {
            next(error);
        }
    }
    async cosignNote(req, res, next) {
        try {
            const request = {
                noteId: req.params.noteId,
                cosignedBy: req.user?.userId || req.body.cosignedBy,
                cosignComment: req.body.cosignComment,
            };
            const response = await this.cosignUseCase.execute(request);
            res.status(200).json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listNotes(req, res, next) {
        try {
            const request = {
                patientId: req.query.patientId,
                medicalRecordId: req.query.medicalRecordId,
                authorId: req.query.authorId,
                noteType: req.query.noteType,
                status: req.query.status,
                requiresCosign: req.query.requiresCosign === 'true',
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
                accessedBy: req.user?.userId || '',
            };
            const response = await this.listUseCase.execute(request);
            res.status(200).json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ClinicalNoteController = ClinicalNoteController;
//# sourceMappingURL=ClinicalNoteController.js.map