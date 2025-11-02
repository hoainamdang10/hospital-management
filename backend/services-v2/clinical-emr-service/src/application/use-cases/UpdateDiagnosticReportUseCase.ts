/**
 * UpdateDiagnosticReportUseCase - Update Diagnostic Report Results
 * Command use case for updating diagnostic report results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';

import {
  UpdateDiagnosticReportRequest,
  UpdateDiagnosticReportResponse,
  validateUpdateDiagnosticReportRequest,
} from '../dto/DiagnosticReportRequest';

export class UpdateDiagnosticReportUseCase {
  constructor(private readonly reportRepository: IDiagnosticReportRepository) {}

  async execute(request: UpdateDiagnosticReportRequest): Promise<UpdateDiagnosticReportResponse> {
    // Validate request
    const validationErrors = validateUpdateDiagnosticReportRequest(request);
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

    // Track updated fields before update
    const beforeUpdate = {
      results: report.results,
      interpretation: report.interpretation,
      conclusion: report.conclusion,
      recommendations: report.recommendations,
      reportedBy: report.reportedBy,
      testPerformedAt: report.testPerformedAt,
    };

    // Update report results
    report.updateResults(
      {
        results: request.results,
        interpretation: request.interpretation,
        conclusion: request.conclusion,
        recommendations: request.recommendations,
        reportedBy: request.reportedBy,
        testPerformedAt: request.testPerformedAt,
      },
      request.updatedBy,
      request.updateReason
    );

    // Determine which fields were actually updated
    const updatedFields: string[] = [];
    if (request.results !== undefined && beforeUpdate.results !== request.results) {
      updatedFields.push('results');
    }
    if (request.interpretation !== undefined && beforeUpdate.interpretation !== request.interpretation) {
      updatedFields.push('interpretation');
    }
    if (request.conclusion !== undefined && beforeUpdate.conclusion !== request.conclusion) {
      updatedFields.push('conclusion');
    }
    if (request.recommendations !== undefined && beforeUpdate.recommendations !== request.recommendations) {
      updatedFields.push('recommendations');
    }
    if (request.reportedBy !== undefined && beforeUpdate.reportedBy !== request.reportedBy) {
      updatedFields.push('reportedBy');
    }
    if (request.testPerformedAt !== undefined && beforeUpdate.testPerformedAt !== request.testPerformedAt) {
      updatedFields.push('testPerformedAt');
    }

    // Save to repository
    await this.reportRepository.save(report);

    // Domain events will be dispatched by the repository layer

    // Return response
    return {
      reportId: report.reportId.value,
      updatedFields,
      status: report.status,
      updatedAt: report.updatedAt,
      updatedBy: report.updatedBy!,
    };
  }

  async authorize(request: UpdateDiagnosticReportRequest, userId: string): Promise<boolean> {
    return request.updatedBy === userId;
  }

  involvesPHI(request: UpdateDiagnosticReportRequest): boolean {
    return true;
  }

  getPatientId(request: UpdateDiagnosticReportRequest): string | null {
    return null;
  }
}
