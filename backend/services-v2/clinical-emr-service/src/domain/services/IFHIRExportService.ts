/**
 * IFHIRExportService - Domain Service Interface
 * FHIR R4 export service for data portability
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance FHIR R4, HIPAA
 */

import { MedicalRecord } from '../aggregates/clinical.aggregate';

export interface FHIRExportJobRequest {
  patientIds?: string[];
  resourceTypes: string[];
  startDate?: string;
  endDate?: string;
  format: 'json' | 'xml' | 'ndjson';
  requestedBy: string;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'collection';
  total: number;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}

export interface IFHIRExportService {
  /**
   * Create async export job
   */
  createExportJob(request: FHIRExportJobRequest): Promise<string>;

  /**
   * Export medical records to FHIR Bundle
   */
  exportToFHIRBundle(
    records: MedicalRecord[],
    resourceTypes: string[],
    format: 'json' | 'xml' | 'ndjson'
  ): Promise<FHIRBundle>;

  /**
   * Get export job status
   */
  getExportJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }>;

  /**
   * Convert single medical record to FHIR resources
   */
  convertToFHIRResources(record: MedicalRecord, resourceTypes: string[]): Promise<any[]>;
}

