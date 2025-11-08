"use strict";
/**
 * FHIRExportServiceAdapter - Infrastructure Layer
 * Adapter to match IFHIRExportService interface with existing FHIRExportService
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FHIRExportServiceAdapter = void 0;
const inversify_1 = require("inversify");
const FHIRExportService_1 = require("../external/FHIRExportService");
const types_1 = require("../di/types");
let FHIRExportServiceAdapter = class FHIRExportServiceAdapter {
    constructor(fhirExportService) {
        this.fhirExportService = fhirExportService;
        // In-memory job storage (in production, use Redis or database)
        this.exportJobs = new Map();
    }
    /**
     * Create async export job
     */
    async createExportJob(request) {
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
    async exportToFHIRBundle(records, resourceTypes, format) {
        // Use existing FHIRExportService to create bundle
        const result = await this.fhirExportService.exportBundle(records, 'collection', {
            format: format === 'ndjson' ? 'json' : format,
            includePatientData: resourceTypes.includes('Patient'),
            includePractitionerData: resourceTypes.includes('Practitioner'),
            includeEncounterData: resourceTypes.includes('Encounter')
        });
        if (!result.success || !result.data?.bundle) {
            throw new Error(result.message || 'Failed to export FHIR bundle');
        }
        return result.data.bundle;
    }
    /**
     * Get export job status
     */
    async getExportJobStatus(jobId) {
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
    async convertToFHIRResources(record, resourceTypes) {
        const resources = [];
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
    async processExportJob(jobId) {
        const job = this.exportJobs.get(jobId);
        if (!job)
            return;
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
        }
        catch (error) {
            job.status = 'failed';
            job.error = error instanceof Error ? error.message : 'Unknown error';
        }
    }
};
exports.FHIRExportServiceAdapter = FHIRExportServiceAdapter;
exports.FHIRExportServiceAdapter = FHIRExportServiceAdapter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.FHIRExportService)),
    __metadata("design:paramtypes", [FHIRExportService_1.FHIRExportService])
], FHIRExportServiceAdapter);
//# sourceMappingURL=FHIRExportServiceAdapter.js.map