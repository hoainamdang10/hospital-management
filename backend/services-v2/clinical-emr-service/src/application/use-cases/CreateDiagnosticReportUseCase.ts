/**
 * CreateDiagnosticReportUseCase - Create Diagnostic Report
 * Command use case for creating a new diagnostic report
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { DiagnosticReportAggregate } from '../../domain/aggregates/DiagnosticReport.aggregate';
import { DiagnosticReportId } from '../../domain/value-objects/DiagnosticReportId';

import {
  CreateDiagnosticReportRequest,
  CreateDiagnosticReportResponse,
  validateCreateDiagnosticReportRequest,
} from '../dto/DiagnosticReportRequest';

export class CreateDiagnosticReportUseCase {
  constructor(private readonly reportRepository: IDiagnosticReportRepository) {}

  async execute(request: CreateDiagnosticReportRequest): Promise<CreateDiagnosticReportResponse> {
    // Validate request
    const validationErrors = validateCreateDiagnosticReportRequest(request);
    if (validationErrors.length > 0) {
      throw new Error(
        `Validation failed: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    // Generate report ID with sequence
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const sequence = await this.reportRepository.getNextSequence(yearMonth);
    const reportId = DiagnosticReportId.generate(sequence);

    // Create diagnostic report aggregate
    const report = DiagnosticReportAggregate.create(
      reportId,
      request.medicalRecordId,
      request.patientId,
      request.orderedBy,
      request.reportType,
      request.reportTitle,
      request.testName,
      request.createdBy,
      {
        testCode: request.testCode,
        specimenType: request.specimenType,
        labCode: request.labCode,
        status: request.status,
      }
    );

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

  async authorize(request: CreateDiagnosticReportRequest, userId: string): Promise<boolean> {
    return request.orderedBy === userId || request.createdBy === userId;
  }

  involvesPHI(request: CreateDiagnosticReportRequest): boolean {
    return true;
  }

  getPatientId(request: CreateDiagnosticReportRequest): string | null {
    return request.patientId || null;
  }
}
