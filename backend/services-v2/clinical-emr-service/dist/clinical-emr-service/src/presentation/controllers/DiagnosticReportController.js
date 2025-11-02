"use strict";
/**
 * DiagnosticReportController - HTTP Controller for Diagnostic Reports
 * @compliance Clean Architecture, RESTful API, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticReportController = void 0;
class DiagnosticReportController {
    constructor(createUseCase, getUseCase, updateUseCase, finalizeUseCase, listUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.updateUseCase = updateUseCase;
        this.finalizeUseCase = finalizeUseCase;
        this.listUseCase = listUseCase;
    }
    async createReport(req, res, next) {
        try {
            const request = {
                medicalRecordId: req.body.medicalRecordId,
                patientId: req.body.patientId,
                orderedBy: req.body.orderedBy,
                reportType: req.body.reportType,
                reportTitle: req.body.reportTitle,
                testName: req.body.testName,
                testCode: req.body.testCode,
                specimenType: req.body.specimenType,
                labCode: req.body.labCode,
                status: req.body.status,
                createdBy: req.user?.userId || req.body.createdBy,
            };
            const response = await this.createUseCase.execute(request);
            res.status(201).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async getReport(req, res, next) {
        try {
            const request = {
                reportId: req.params.reportId,
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
    async updateReport(req, res, next) {
        try {
            const request = {
                reportId: req.params.reportId,
                results: req.body.results,
                interpretation: req.body.interpretation,
                conclusion: req.body.conclusion,
                recommendations: req.body.recommendations,
                reportedBy: req.body.reportedBy,
                testPerformedAt: req.body.testPerformedAt,
                updatedBy: req.user?.userId || req.body.updatedBy,
                updateReason: req.body.updateReason,
            };
            const response = await this.updateUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async finalizeReport(req, res, next) {
        try {
            const request = {
                reportId: req.params.reportId,
                verifiedBy: req.user?.userId || req.body.verifiedBy,
                verificationComment: req.body.verificationComment,
            };
            const response = await this.finalizeUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
    async listReports(req, res, next) {
        try {
            const request = {
                patientId: req.query.patientId,
                medicalRecordId: req.query.medicalRecordId,
                orderedBy: req.query.orderedBy,
                reportType: req.query.reportType,
                status: req.query.status,
                fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
                toDate: req.query.toDate ? new Date(req.query.toDate) : undefined,
                testName: req.query.testName,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : undefined,
                accessedBy: req.user?.userId || '',
            };
            const response = await this.listUseCase.execute(request);
            res.status(200).json({ success: true, data: response });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DiagnosticReportController = DiagnosticReportController;
//# sourceMappingURL=DiagnosticReportController.js.map