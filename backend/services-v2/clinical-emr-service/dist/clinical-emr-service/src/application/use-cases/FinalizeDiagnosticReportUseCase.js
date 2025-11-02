"use strict";
/**
 * FinalizeDiagnosticReportUseCase - Finalize Diagnostic Report
 * Command use case for finalizing diagnostic report (mark as final)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalizeDiagnosticReportUseCase = void 0;
const DiagnosticReportId_1 = require("../../domain/value-objects/DiagnosticReportId");
const DiagnosticReportRequest_1 = require("../dto/DiagnosticReportRequest");
class FinalizeDiagnosticReportUseCase {
    constructor(reportRepository) {
        this.reportRepository = reportRepository;
    }
    async execute(request) {
        // Validate request
        const validationErrors = (0, DiagnosticReportRequest_1.validateFinalizeDiagnosticReportRequest)(request);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        // Parse report ID
        const reportId = DiagnosticReportId_1.DiagnosticReportId.create(request.reportId);
        // Find report
        const report = await this.reportRepository.findById(reportId);
        if (!report) {
            throw new Error(`Báo cáo chẩn đoán với ID ${request.reportId} không tồn tại`);
        }
        // Finalize report (mark as final with verification)
        report.finalize(request.verifiedBy, request.verificationComment);
        // Save to repository
        await this.reportRepository.save(report);
        // Domain events will be dispatched by the repository layer
        // Return response
        return {
            reportId: report.reportId.value,
            medicalRecordId: report.medicalRecordId,
            patientId: report.patientId,
            status: report.status,
            verifiedBy: report.verifiedBy,
            verifiedAt: report.verifiedAt,
            verificationComment: request.verificationComment,
        };
    }
    async authorize(request, userId) {
        return request.verifiedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.FinalizeDiagnosticReportUseCase = FinalizeDiagnosticReportUseCase;
//# sourceMappingURL=FinalizeDiagnosticReportUseCase.js.map