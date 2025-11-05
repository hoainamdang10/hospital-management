/**
 * BulkExportFHIRUseCase - Application Layer
 * HIPAA Compliance: Bulk FHIR R4 export for data portability
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, FHIR R4, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { IFHIRExportService } from '../../domain/services/IFHIRExportService';

export interface BulkExportFHIRRequest {
  patientIds?: string[]; // If empty, export all accessible records
  resourceTypes?: string[]; // FHIR resource types: Patient, Observation, Condition, etc.
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'xml' | 'ndjson'; // FHIR format
  async?: boolean; // If true, return job ID instead of data
  requestedBy: string;
  requestedByRole: string;
}

export interface BulkExportFHIRResponse {
  success: boolean;
  message: string;
  data?: {
    jobId?: string; // For async exports
    fhirBundle?: {
      resourceType: 'Bundle';
      type: 'collection';
      total: number;
      entry: Array<{
        fullUrl: string;
        resource: any;
      }>;
    };
    exportedAt: string;
    fhirVersion: string;
    format: string;
    statistics: {
      totalRecords: number;
      totalPatients: number;
      resourceCounts: Record<string, number>;
    };
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class BulkExportFHIRUseCase extends BaseHealthcareUseCase<BulkExportFHIRRequest, BulkExportFHIRResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly fhirExportService: IFHIRExportService
  ) {
    super();
  }

  override async execute(request: BulkExportFHIRRequest): Promise<BulkExportFHIRResponse> {
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }

    // Authorization check
    if (!this.isAuthorized(request.requestedByRole)) {
      return {
        success: false,
        message: 'Không có quyền export FHIR data',
        errors: [{ field: 'authorization', message: 'Unauthorized', code: 'FORBIDDEN' }]
      };
    }
    
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: BulkExportFHIRRequest): Promise<BulkExportFHIRResponse> {
    try {
      const format = request.format || 'json';
      const resourceTypes = request.resourceTypes || [
        'Patient', 'Observation', 'Condition', 'MedicationRequest', 
        'DiagnosticReport', 'Procedure', 'Encounter'
      ];

      // If async export requested, create job and return job ID
      if (request.async) {
        const jobId = await this.fhirExportService.createExportJob({
          patientIds: request.patientIds,
          resourceTypes,
          startDate: request.startDate,
          endDate: request.endDate,
          format,
          requestedBy: request.requestedBy
        });

        return {
          success: true,
          message: 'FHIR export job đã được tạo',
          data: {
            jobId,
            exportedAt: new Date().toISOString(),
            fhirVersion: '4.0.1',
            format,
            statistics: {
              totalRecords: 0,
              totalPatients: 0,
              resourceCounts: {}
            }
          }
        };
      }

      // Synchronous export
      const filters: any = {};
      if (request.patientIds && request.patientIds.length > 0) {
        filters.patientIds = request.patientIds;
      }
      if (request.startDate) filters.startDate = new Date(request.startDate);
      if (request.endDate) filters.endDate = new Date(request.endDate);

      // Get medical records
      const records = await this.medicalRecordRepository.findByFilters(filters);

      // Convert to FHIR Bundle
      const fhirBundle = await this.fhirExportService.exportToFHIRBundle(
        records,
        resourceTypes,
        format
      );

      // Calculate statistics
      const resourceCounts: Record<string, number> = {};
      fhirBundle.entry.forEach(entry => {
        const resourceType = entry.resource.resourceType;
        resourceCounts[resourceType] = (resourceCounts[resourceType] || 0) + 1;
      });

      const uniquePatients = new Set(
        records.map(r => r.patientId.value)
      ).size;

      return {
        success: true,
        message: `Đã export ${fhirBundle.total} FHIR resources`,
        data: {
          fhirBundle,
          exportedAt: new Date().toISOString(),
          fhirVersion: '4.0.1',
          format,
          statistics: {
            totalRecords: records.length,
            totalPatients: uniquePatients,
            resourceCounts
          }
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi bulk export FHIR: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: BulkExportFHIRRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.requestedBy) {
      errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
    }

    if (!request.requestedByRole) {
      errors.push({ field: 'requestedByRole', message: 'RequestedByRole là bắt buộc', code: 'REQUIRED' });
    }

    // Validate date range
    if (request.startDate && request.endDate) {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      if (start > end) {
        errors.push({ field: 'dateRange', message: 'Start date phải trước end date', code: 'INVALID_RANGE' });
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private isAuthorized(role: string): boolean {
    const authorizedRoles = ['super_admin', 'admin', 'doctor'];
    return authorizedRoles.includes(role.toLowerCase());
  }

  async authorize(request: BulkExportFHIRRequest, userId: string): Promise<boolean> {
    return this.isAuthorized(request.requestedByRole);
  }

  involvesPHI(request: BulkExportFHIRRequest): boolean {
    return true;
  }

  getPatientId(request: BulkExportFHIRRequest): string | null {
    return request.patientIds && request.patientIds.length === 1 ? request.patientIds[0] : null;
  }

  getDescription(): string {
    return 'Bulk export medical records sang FHIR R4 format (HIPAA data portability)';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'fhir:export', 'bulk:export'];
  }
}

