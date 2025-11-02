"use strict";
/**
 * CreateDiagnosticReportUseCase - Create Diagnostic Report
 * Command use case for creating a new diagnostic report
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDiagnosticReportUseCase = void 0;
const DiagnosticReport_aggregate_1 = require("../../domain/aggregates/DiagnosticReport.aggregate");
const DiagnosticReportId_1 = require("../../domain/value-objects/DiagnosticReportId");
const DiagnosticReportRequest_1 = require("../dto/DiagnosticReportRequest");
class CreateDiagnosticReportUseCase {
    constructor(reportRepository) {
        this.reportRepository = reportRepository;
    }
    async execute(request) {
        // Validate request
        const validationErrors = (0, DiagnosticReportRequest_1.validateCreateDiagnosticReportRequest)(request);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        // Generate report ID with sequence
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const sequence = await this.reportRepository.getNextSequence(yearMonth);
        const reportId = DiagnosticReportId_1.DiagnosticReportId.generate(sequence);
        // Create diagnostic report aggregate
        const report = DiagnosticReport_aggregate_1.DiagnosticReportAggregate.create(reportId, request.medicalRecordId, request.patientId, request.orderedBy, request.reportType, request.reportTitle, request.testName, request.createdBy, {
            testCode: request.testCode,
            specimenType: request.specimenType,
            labCode: request.labCode,
            status: request.status,
        });
        // Save to repository
        await this.reportRepository.save(report);
        // Domain events will be dispatched by the repository layer
        // Return response
        return {
            reportId: report.reportId.value,
            medicalRecordId: report.medicalRecordId,
            patientId: report.patientId,
            orderedBy: report.orderedBy,
            reportType: report.reportType,
            reportTitle: report.reportTitle,
            testName: report.testName,
            status: report.status,
            createdAt: report.createdAt,
            createdBy: report.createdBy,
        };
    }
    async authorize(request, userId) {
        return request.orderedBy === userId || request.createdBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.CreateDiagnosticReportUseCase = CreateDiagnosticReportUseCase;
//# sourceMappingURL=CreateDiagnosticReportUseCase.js.map