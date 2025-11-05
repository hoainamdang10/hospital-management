/**
 * FHIRExportServiceAdapter - Infrastructure Layer
 * Adapter to match IFHIRExportService interface with existing FHIRExportService
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { injectable, inject } from 'inversify';
import { IFHIRExportService, FHIRExportJobRequest, FHIRBundle } from '../../domain/services/IFHIRExportService';
import { MedicalRecord } from '../../domain/aggregates/clinical.aggregate';
import { FHIRExportService } from '../external/FHIRExportService';
import { TYPES } from '../di/types';

@injectable()
export class FHIRExportServiceAdapter implements IFHIRExportService {
  // In-memory job storage (in production, use Redis or database)
  private exportJobs: Map<string, {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
    request: FHIRExportJobRequest;
  }> = new Map();

  constructor(
    @inject(TYPES.FHIRExportService) private readonly fhirExportService: FHIRExportService
  ) {}

  /**
   * Create async export job
   */
  async createExportJob(request: FHIRExportJobRequest): Promise<string> {
    const jobId = `fhir-export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store job metadata
    this.exportJobs.set(jobId, {
      status: 'pending',
      progress: 0,
      request
    });

    // Start async processing (in production, use job queue like Bull/BullMQ)
    this.processExportJob(jobId).catch(error => {
      const job = this.exportJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

    return jobId;
  }

  /**
   * Export medical records to FHIR Bundle
   */
  async exportToFHIRBundle(
    records: MedicalRecord[],
    resourceTypes: string[],
    format: 'json' | 'xml' | 'ndjson'
  ): Promise<FHIRBundle> {
    // Use existing FHIRExportService to create bundle
    const result = await this.fhirExportService.exportBundle(
      records,
      'collection',
      {
        format: format === 'ndjson' ? 'json' : format,
        includePatientData: resourceTypes.includes('Patient'),
        includePractitionerData: resourceTypes.includes('Practitioner'),
        includeEncounterData: resourceTypes.includes('Encounter')
      }
    );

    if (!result.success || !result.data?.bundle) {
      throw new Error(result.message || 'Failed to export FHIR bundle');
    }

    return result.data.bundle as FHIRBundle;
  }

  /**
   * Get export job status
   */
  async getExportJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }> {
    const job = this.exportJobs.get(jobId);

    if (!job) {
      throw new Error(`Export job not found: ${jobId}`);
    }

    return {
      status: job.status,
      progress: job.progress,
      downloadUrl: job.downloadUrl,
      error: job.error
    };
  }

  /**
   * Convert single medical record to FHIR resources
   */
  async convertToFHIRResources(record: MedicalRecord, resourceTypes: string[]): Promise<any[]> {
    const resources: any[] = [];

    // Export main composition
    const compositionResult = await this.fhirExportService.exportComposition(record, {
      format: 'json'
    });

    if (compositionResult.success && compositionResult.data?.composition) {
      resources.push(compositionResult.data.composition);
    }

    // Export diagnoses as Condition resources
    if (resourceTypes.includes('Condition') && record.diagnoses) {
      for (const diagnosis of record.diagnoses) {
        const conditionResource = await this.fhirExportService.exportDiagnosis(diagnosis);
        resources.push(conditionResource);
      }
    }

    // Export medications as MedicationRequest resources
    if (resourceTypes.includes('MedicationRequest') && record.medications) {
      for (const medication of record.medications) {
        const medicationResource = await this.fhirExportService.exportMedication(medication);
        resources.push(medicationResource);
      }
    }

    return resources;
  }

  /**
   * Process export job asynchronously
   */
  private async processExportJob(jobId: string): Promise<void> {
    const job = this.exportJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 10;

      // Simulate processing (in production, fetch records and export)
      await new Promise(resolve => setTimeout(resolve, 1000));
      job.progress = 50;

      await new Promise(resolve => setTimeout(resolve, 1000));
      job.progress = 90;

      // Mark as completed
      job.status = 'completed';
      job.progress = 100;
      job.downloadUrl = `/api/v2/clinical-emr/fhir/export/${jobId}/download`;

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }
}

