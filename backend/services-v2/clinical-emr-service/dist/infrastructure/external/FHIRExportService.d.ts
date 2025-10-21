/**
 * FHIRExportService - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Service for exporting medical records to FHIR R4 format with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance FHIR R4, HIPAA, Vietnamese Healthcare Standards, MOH-2024
 */
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { Diagnosis } from '../../domain/value-objects/Diagnosis';
import { Medication } from '../../domain/value-objects/Medication';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
/**
 * FHIR Export Options
 */
export interface FHIRExportOptions {
    includePatientData?: boolean;
    includePractitionerData?: boolean;
    includeOrganizationData?: boolean;
    includeEncounterData?: boolean;
    format?: 'json' | 'xml';
    version?: 'R4' | 'R5';
    validateOutput?: boolean;
    includeNarrative?: boolean;
    language?: 'en' | 'vi';
}
/**
 * FHIR Export Result
 */
export interface FHIRExportResult {
    success: boolean;
    message: string;
    data?: {
        composition: any;
        bundle?: any;
        resources?: any[];
        format: 'json' | 'xml';
        version: string;
        size: number;
        resourceCount: number;
        validationResult?: {
            isValid: boolean;
            errors: string[];
            warnings: string[];
        };
    };
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * FHIR Bundle Type
 */
export type FHIRBundleType = 'document' | 'collection' | 'searchset' | 'history' | 'transaction' | 'batch';
export interface FHIRExportServiceConfig {
    logger: ILogger;
    auditService: IAuditService;
    fhirVersion: string;
    validateByDefault: boolean;
    includeVietnameseExtensions: boolean;
}
/**
 * FHIR Export Service
 * Implements FHIR R4 export with Vietnamese healthcare compliance
 */
export declare class FHIRExportService {
    private readonly logger;
    private readonly auditService;
    private readonly fhirVersion;
    private readonly validateByDefault;
    private readonly includeVietnameseExtensions;
    constructor(config: FHIRExportServiceConfig);
    /**
     * Export medical record to FHIR Composition
     */
    exportComposition(medicalRecord: MedicalRecordAggregate, options?: FHIRExportOptions): Promise<FHIRExportResult>;
    /**
     * Export medical record to FHIR Bundle
     */
    exportBundle(medicalRecords: MedicalRecordAggregate[], bundleType?: FHIRBundleType, options?: FHIRExportOptions): Promise<FHIRExportResult>;
    /**
     * Export diagnosis to FHIR Condition resource
     */
    exportDiagnosis(diagnosis: Diagnosis): Promise<any>;
    /**
     * Export medication to FHIR MedicationRequest resource
     */
    exportMedication(medication: Medication): Promise<any>;
    /**
     * Validate FHIR resource
     */
    validateFHIRResource(resource: any): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Count resources in FHIR structure
     */
    private countResources;
    /**
     * Convert JSON to XML (simplified implementation)
     */
    private convertToXML;
    /**
     * Create Patient resource from medical record
     */
    private createPatientResource;
    /**
     * Create Practitioner resource from medical record
     */
    private createPractitionerResource;
    /**
     * Create Encounter resource from medical record
     */
    private createEncounterResource;
    /**
     * Validate FHIR Composition
     */
    private validateComposition;
    /**
     * Validate FHIR Condition
     */
    private validateCondition;
    /**
     * Validate FHIR MedicationRequest
     */
    private validateMedicationRequest;
    /**
     * Validate FHIR Bundle
     */
    private validateBundle;
    /**
     * Add Vietnamese healthcare extensions to FHIR composition
     */
    private addVietnameseHealthcareExtensions;
}
//# sourceMappingURL=FHIRExportService.d.ts.map