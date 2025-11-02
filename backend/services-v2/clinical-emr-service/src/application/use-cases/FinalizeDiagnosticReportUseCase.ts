/**
 * FinalizeDiagnosticReportUseCase - Finalize Diagnostic Report
 * Command use case for finalizing diagnostic report (mark as final)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';

import {
  FinalizeDiagnosticReportRequest,
  FinalizeDiagnosticReportResponse,
  validateFinalizeDiagnosticReportRequest,
} from '../dto/DiagnosticReportRequest';

export class FinalizeDiagnosticReportUseCase {
  constructor(private readonly reportRepository: IDiagnosticReportRepository) {}

  async execute(request: FinalizeDiagnosticReportRequest): Promise<FinalizeDiagnosticReportResponse> {
    // Validate request
    const validationErrors = validateFinalizeDiagnosticReportRequest(request);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    // Parse report ID
    const reportId = DiagnosticReportId.create(request.reportId);

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
      verifiedBy: report.verifiedBy!,
      verifiedAt: report.verifiedAt!,
      verificationComment: request.verificationComment,
    };
  }

  async authorize(request: FinalizeDiagnosticReportRequest, userId: string): Promise<boolean> {
    return request.verifiedBy === userId;
  }

  involvesPHI(request: FinalizeDiagnosticReportRequest): boolean {
    return true;
  }

  getPatientId(request: FinalizeDiagnosticReportRequest): string | null {
    return null;
  }
}
