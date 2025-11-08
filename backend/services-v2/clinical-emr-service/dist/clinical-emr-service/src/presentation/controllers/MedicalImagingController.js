"use strict";
/**
 * MedicalImagingController - Presentation Layer
 * HTTP request handlers for medical imaging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, REST API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImagingController = void 0;
const BaseController_1 = require("./BaseController");
class MedicalImagingController extends BaseController_1.BaseController {
    constructor(createMedicalImagingUseCase, getMedicalImagingUseCase, updateMedicalImagingUseCase, getPatientMedicalImagingUseCase) {
        super();
        this.createMedicalImagingUseCase = createMedicalImagingUseCase;
        this.getMedicalImagingUseCase = getMedicalImagingUseCase;
        this.updateMedicalImagingUseCase = updateMedicalImagingUseCase;
        this.getPatientMedicalImagingUseCase = getPatientMedicalImagingUseCase;
    }
    /**
     * Create new medical imaging study
     * POST /api/v2/clinical-emr/medical-imaging
     */
    async createMedicalImaging(req, res) {
        try {
            const userId = req.user?.userId || 'system';
            const result = await this.createMedicalImagingUseCase.execute({
                medicalRecordId: req.body.medicalRecordId,
                patientId: req.body.patientId,
                imagingType: req.body.imagingType,
                modality: req.body.modality,
                bodyPart: req.body.bodyPart,
                laterality: req.body.laterality,
                studyDate: req.body.studyDate ? new Date(req.body.studyDate) : undefined,
                studyDescription: req.body.studyDescription,
                clinicalIndication: req.body.clinicalIndication,
                orderedBy: req.body.orderedBy || userId,
                orderedAt: req.body.orderedAt ? new Date(req.body.orderedAt) : undefined,
                priority: req.body.priority,
                technique: req.body.technique,
                contrastUsed: req.body.contrastUsed,
                contrastType: req.body.contrastType,
                notes: req.body.notes,
                createdBy: userId,
            });
            if (result.success) {
                res.status(201).json({
                    success: true,
                    data: {
                        imagingId: result.imagingId,
                    },
                    message: 'Medical imaging created successfully',
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    /**
     * Get medical imaging by ID
     * GET /api/v2/clinical-emr/medical-imaging/:id
     */
    async getMedicalImaging(req, res) {
        try {
            const userId = req.user?.userId || 'system';
            const imagingId = req.params.id;
            const accessPurpose = req.query.accessPurpose || 'view';
            const ipAddress = req.ip;
            const result = await this.getMedicalImagingUseCase.execute({
                imagingId,
                accessedBy: userId,
                accessPurpose,
                ipAddress,
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.imaging,
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    /**
     * Update medical imaging
     * PUT /api/v2/clinical-emr/medical-imaging/:id
     */
    async updateMedicalImaging(req, res) {
        try {
            const userId = req.user?.userId || 'system';
            const imagingId = req.params.id;
            const result = await this.updateMedicalImagingUseCase.execute({
                imagingId,
                findings: req.body.findings,
                impression: req.body.impression,
                radiologistId: req.body.radiologistId,
                technique: req.body.technique,
                imageUrls: req.body.imageUrls,
                dicomStudyUid: req.body.dicomStudyUid,
                seriesCount: req.body.seriesCount,
                instanceCount: req.body.instanceCount,
                verifiedBy: req.body.verifiedBy,
                notes: req.body.notes,
                updatedBy: userId,
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: {
                        imagingId: result.imagingId,
                        status: result.status,
                    },
                    message: 'Medical imaging updated successfully',
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
    /**
     * Get patient medical imaging
     * GET /api/v2/clinical-emr/medical-imaging/patients/:patientId
     */
    async getPatientMedicalImaging(req, res) {
        try {
            const patientId = req.params.patientId;
            const imagingType = req.query.imagingType;
            const modality = req.query.modality;
            const status = req.query.status;
            const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
            const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit) : 50;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const result = await this.getPatientMedicalImagingUseCase.execute({
                patientId,
                imagingType,
                modality,
                status,
                fromDate,
                toDate,
                limit,
                offset,
            });
            if (result.success) {
                res.status(200).json({
                    success: true,
                    data: result.imaging,
                    pagination: {
                        total: result.total,
                        limit: result.limit,
                        offset: result.offset,
                    },
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: result.error,
                });
            }
        }
        catch (error) {
            this.handleError(res, error);
        }
    }
}
exports.MedicalImagingController = MedicalImagingController;
//# sourceMappingURL=MedicalImagingController.js.map