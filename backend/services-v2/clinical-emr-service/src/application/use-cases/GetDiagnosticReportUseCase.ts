/**
 * GetDiagnosticReportUseCase - Retrieve Diagnostic Report
 * Query use case for retrieving a diagnostic report by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */

import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';
import {
  GetDiagnosticReportRequest,
  GetDiagnosticReportResponse,
} from '../dto/DiagnosticReportRequest';

export class GetDiagnosticReportUseCase {
  constructor(private readonly reportRepository: IDiagnosticReportRepository) {}

  async execute(request: GetDiagnosticReportRequest): Promise<GetDiagnosticReportResponse> {
    // Validate report ID
    if (!request.reportId || request.reportId.trim() === '') {
      throw new Error('Report ID là bắt buộc');
    }

    const reportIdRegex = /^DIAG-\d{6}-\d{3}$/;
    if (!reportIdRegex.test(request.reportId)) {
      throw new Error('Report ID phải có định dạng DIAG-YYYYMM-XXX');
    }

    // Validate accessed by
    if (!request.accessedBy || request.accessedBy.trim() === '') {
      throw new Error('Accessed By là bắt buộc');
    }

    // Parse report ID
    const reportId = DiagnosticReportId.create(request.reportId);

    // Find report
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error(`Báo cáo chẩn đoán với ID ${request.reportId} không tồn tại`);
    }

    // Record read access for HIPAA compliance
    report.recordReadAccess(
      request.accessedBy,
      request.accessPurpose || 'Xem báo cáo chẩn đoán',
      request.ipAddress,
      request.userAgent
    );

    // Save access log
    await this.reportRepository.save(report);

    // Return response
    return {
      reportId: report.reportId.value,
      medicalRecordId: report.medicalRecordId,
      patientId: report.patientId,
      orderedBy: report.orderedBy,
      reportType: report.reportType,
      reportTitle: report.reportTitle,
      testName: report.testName,
      testCode: report.testCode,
      results: report.results,
      interpretation: report.interpretation,
      conclusion: report.conclusion,
      recommendations: report.recommendations,
      specimenType: report.specimenType,
      specimenCollectedAt: report.specimenCollectedAt,
      testPerformedAt: report.testPerformedAt,
      reportedBy: report.reportedBy,
      verifiedBy: report.verifiedBy,
      verifiedAt: report.verifiedAt,
      attachments: report.attachments,
      fhirResourceId: report.toJSON().fhirResourceId,
      fhirVersion: report.toJSON().fhirVersion,
      vietnameseReportCode: report.toJSON().vietnameseReportCode,
      labCode: report.toJSON().labCode,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      createdBy: report.createdBy,
      updatedBy: report.updatedBy,
      lastAccessedAt: report.lastAccessedAt,
      lastAccessedBy: report.lastAccessedBy,
    };
  }

  async authorize(request: GetDiagnosticReportRequest, userId: string): Promise<boolean> {
    return request.accessedBy === userId;
  }

  involvesPHI(request: GetDiagnosticReportRequest): boolean {
    return true;
  }

  getPatientId(request: GetDiagnosticReportRequest): string | null {
    return null;
  }
}
