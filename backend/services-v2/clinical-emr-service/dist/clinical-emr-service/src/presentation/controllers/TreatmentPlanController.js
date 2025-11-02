"use strict";
/**
 * TreatmentPlanController - HTTP Controller for Treatment Plans
 * @compliance Clean Architecture, RESTful API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentPlanController = void 0;
class TreatmentPlanController {
    constructor(createUseCase, getUseCase, updateUseCase, completeUseCase, listUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.updateUseCase = updateUseCase;
        this.completeUseCase = completeUseCase;
        this.listUseCase = listUseCase;
    }
    async createPlan(req, res, next) {
        try {
            const request = {
                medicalRecordId: req.body.medicalRecordId,
                patientId: req.body.patientId,
                diagnosis: req.body.diagnosis,
                treatmentGoals: req.body.treatmentGoals,
                treatmentItems: req.body.treatmentItems,
                startDate: req.body.startDate,
                createdBy: req.user?.userId || req.body.createdBy,
                diagnosisCode: req.body.diagnosisCode,
                endDate: req.body.endDate,
                notes: req.body.notes,
            };
            const response = await this.createUseCase.execute(request);
            res.status(201).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async getPlan(req, res, next) {
        try {
            const request = {
                planId: req.params.planId,
                accessedBy: req.user?.userId || '',
                accessPurpose: req.query.accessPurpose,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            };
            const response = await this.getUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePlan(req, res, next) {
        try {
            const request = {
                planId: req.params.planId,
                treatmentGoals: req.body.treatmentGoals,
                treatmentItems: req.body.treatmentItems,
                endDate: req.body.endDate,
                notes: req.body.notes,
                itemStatusUpdates: req.body.itemStatusUpdates,
                progressPercentage: req.body.progressPercentage,
                patientConsent: req.body.patientConsent,
                updatedBy: req.user?.userId || req.body.updatedBy,
            };
            const response = await this.updateUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async completePlan(req, res, next) {
        try {
            const request = {
                planId: req.params.planId,
                completedBy: req.user?.userId || req.body.completedBy,
                completionNotes: req.body.completionNotes,
            };
            const response = await this.completeUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async listPlans(req, res, next) {
        try {
            const request = {
                patientId: req.query.patientId,
                medicalRecordId: req.query.medicalRecordId,
                status: req.query.status,
                createdBy: req.query.createdBy,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
                diagnosisCode: req.query.diagnosisCode,
                hasConsent: req.query.hasConsent === 'true' ? true : req.query.hasConsent === 'false' ? false : undefined,
                searchText: req.query.searchText,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
            };
            const response = await this.listUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TreatmentPlanController = TreatmentPlanController;
//# sourceMappingURL=TreatmentPlanController.js.map