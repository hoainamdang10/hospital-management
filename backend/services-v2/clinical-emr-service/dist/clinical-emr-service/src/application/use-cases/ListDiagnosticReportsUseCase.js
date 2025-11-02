"use strict";
/**
 * ListDiagnosticReportsUseCase - List Diagnostic Reports
 * Query use case for listing diagnostic reports with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListDiagnosticReportsUseCase = void 0;
const DiagnosticReportRequest_1 = require("../dto/DiagnosticReportRequest");
class ListDiagnosticReportsUseCase {
    constructor(reportRepository) {
        this.reportRepository = reportRepository;
    }
    async execute(request) {
        // Validate request
        const validationErrors = (0, DiagnosticReportRequest_1.validateListDiagnosticReportsRequest)(request);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        // Set default pagination
        const limit = request.limit || 20;
        const offset = request.offset || 0;
        // Build search filters
        const filters = {
            patientId: request.patientId,
            medicalRecordId: request.medicalRecordId,
            orderedBy: request.orderedBy,
            reportType: request.reportType,
            status: request.status,
            fromDate: request.fromDate,
            toDate: request.toDate,
            testName: request.testName,
            limit,
            offset,
        };
        // Search reports
        const reports = await this.reportRepository.search(filters);
        // Count total
        const total = await this.reportRepository.count({
            patientId: request.patientId,
            medicalRecordId: request.medicalRecordId,
            orderedBy: request.orderedBy,
            reportType: request.reportType,
            status: request.status,
            fromDate: request.fromDate,
            toDate: request.toDate,
        });
        // Map to summary DTOs
        const reportSummaries = reports.map((report) => ({
            reportId: report.reportId.value,
            medicalRecordId: report.medicalRecordId,
            patientId: report.patientId,
            reportType: report.reportType,
            reportTitle: report.reportTitle,
            testName: report.testName,
            status: report.status,
            orderedBy: report.orderedBy,
            reportedBy: report.reportedBy,
            verifiedBy: report.verifiedBy,
            verifiedAt: report.verifiedAt,
            hasResults: report.hasResults(),
            hasAttachments: report.hasAttachments(),
            attachmentCount: report.attachments.length,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
        }));
        // Return response
        return {
            reports: reportSummaries,
            total,
            limit,
            offset,
        };
    }
    async authorize(request, userId) {
        return request.accessedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.ListDiagnosticReportsUseCase = ListDiagnosticReportsUseCase;
//# sourceMappingURL=ListDiagnosticReportsUseCase.js.map