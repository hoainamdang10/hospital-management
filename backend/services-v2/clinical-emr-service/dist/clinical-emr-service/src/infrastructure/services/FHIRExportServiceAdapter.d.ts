/**
 * FHIRExportServiceAdapter - Infrastructure Layer
 * Adapter to match IFHIRExportService interface with existing FHIRExportService
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IFHIRExportService, FHIRExportJobRequest, FHIRBundle } from '../../domain/services/IFHIRExportService';
import { MedicalRecord } from '../../domain/aggregates/clinical.aggregate';
import { FHIRExportService } from '../external/FHIRExportService';
export declare class FHIRExportServiceAdapter implements IFHIRExportService {
    private readonly fhirExportService;
    private exportJobs;
    constructor(fhirExportService: FHIRExportService);
    /**
     * Create async export job
     */
    createExportJob(request: FHIRExportJobRequest): Promise<string>;
    /**
     * Export medical records to FHIR Bundle
     */
    exportToFHIRBundle(records: MedicalRecord[], resourceTypes: string[], format: 'json' | 'xml' | 'ndjson'): Promise<FHIRBundle>;
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
    /**
     * Process export job asynchronously
     */
    private processExportJob;
}
//# sourceMappingURL=FHIRExportServiceAdapter.d.ts.map