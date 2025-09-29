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
export class FHIRExportService {
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly fhirVersion: string;
  private readonly validateByDefault: boolean;
  private readonly includeVietnameseExtensions: boolean;

  constructor(config: FHIRExportServiceConfig) {
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.fhirVersion = config.fhirVersion || '4.0.1';
    this.validateByDefault = config.validateByDefault ?? true;
    this.includeVietnameseExtensions = config.includeVietnameseExtensions ?? true;
  }

  /**
   * Export medical record to FHIR Composition
   */
  async exportComposition(
    medicalRecord: MedicalRecordAggregate,
    options: FHIRExportOptions = {}
  ): Promise<FHIRExportResult> {
    try {
      this.logger.info('Starting FHIR export for medical record', {
        recordId: medicalRecord.recordId.value,
        patientId: medicalRecord.patientId,
        options
      });

      // Validate FHIR compliance first
      const shouldValidate = options.validateOutput ?? this.validateByDefault;
      if (shouldValidate) {
        const validation = medicalRecord.validateFHIRCompliance();
        if (!validation.isValid) {
          this.logger.warn('Medical record failed FHIR validation', {
            recordId: medicalRecord.recordId.value,
            errors: validation.errors
          });

          return {
            success: false,
            message: 'Hồ sơ bệnh án không tuân thủ chuẩn FHIR',
            errors: validation.errors.map(error => ({
              field: 'fhir_compliance',
              message: error,
              code: 'FHIR_VALIDATION_ERROR'
            }))
          };
        }
      }

      // Generate FHIR Composition
      const composition = medicalRecord.toFHIR();

      // Add Vietnamese healthcare extensions if enabled
      if (this.includeVietnameseExtensions) {
        this.addVietnameseHealthcareExtensions(composition, medicalRecord);
      }

      // Add narrative if requested
      if (options.includeNarrative) {
        composition.text = this.generateNarrative(medicalRecord, options.language || 'vi');
      }

      // Calculate size and resource count
      const jsonString = JSON.stringify(composition);
      const size = new Blob([jsonString]).size;
      const resourceCount = this.countResources(composition);

      const result: FHIRExportResult = {
        success: true,
        message: 'FHIR Composition exported successfully',
        data: {
          composition,
          format: options.format || 'json',
          version: options.version || 'R4',
          size,
          resourceCount
        }
      };

      // Add validation result if requested
      if (options.validateOutput) {
        result.data!.validationResult = {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: []
        };
      }

      // Convert to XML if requested
      if (options.format === 'xml') {
        result.data!.composition = this.convertToXML(composition);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        message: `Failed to export FHIR Composition: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'export',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'EXPORT_ERROR'
        }]
      };
    }
  }

  /**
   * Export medical record to FHIR Bundle
   */
  async exportBundle(
    medicalRecords: MedicalRecordAggregate[],
    bundleType: FHIRBundleType = 'collection',
    options: FHIRExportOptions = {}
  ): Promise<FHIRExportResult> {
    try {
      const resources: any[] = [];
      const entries: any[] = [];

      // Process each medical record
      for (const record of medicalRecords) {
        const composition = record.toFHIR();
        
        // Add narrative if requested
        if (options.includeNarrative) {
          composition.text = this.generateNarrative(record, options.language || 'en');
        }

        resources.push(composition);
        entries.push({
          fullUrl: `urn:uuid:${composition.id}`,
          resource: composition
        });

        // Add related resources if requested
        if (options.includePatientData) {
          const patientResource = this.createPatientResource(record);
          resources.push(patientResource);
          entries.push({
            fullUrl: `urn:uuid:${patientResource.id}`,
            resource: patientResource
          });
        }

        if (options.includePractitionerData) {
          const practitionerResource = this.createPractitionerResource(record);
          resources.push(practitionerResource);
          entries.push({
            fullUrl: `urn:uuid:${practitionerResource.id}`,
            resource: practitionerResource
          });
        }

        if (options.includeEncounterData) {
          const encounterResource = this.createEncounterResource(record);
          resources.push(encounterResource);
          entries.push({
            fullUrl: `urn:uuid:${encounterResource.id}`,
            resource: encounterResource
          });
        }
      }

      // Create FHIR Bundle
      const bundle = {
        resourceType: 'Bundle',
        id: `bundle-${Date.now()}`,
        meta: {
          lastUpdated: new Date().toISOString(),
          profile: ['http://hl7.org/fhir/StructureDefinition/Bundle']
        },
        type: bundleType,
        timestamp: new Date().toISOString(),
        total: resources.length,
        entry: entries
      };

      // Calculate size
      const jsonString = JSON.stringify(bundle);
      const size = new Blob([jsonString]).size;

      const result: FHIRExportResult = {
        success: true,
        message: `FHIR Bundle exported successfully with ${resources.length} resources`,
        data: {
          composition: bundle, // For backward compatibility
          bundle,
          resources,
          format: options.format || 'json',
          version: options.version || 'R4',
          size,
          resourceCount: resources.length
        }
      };

      // Convert to XML if requested
      if (options.format === 'xml') {
        result.data!.bundle = this.convertToXML(bundle);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        message: `Failed to export FHIR Bundle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'bundle_export',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'BUNDLE_EXPORT_ERROR'
        }]
      };
    }
  }

  /**
   * Export diagnosis to FHIR Condition resource
   */
  async exportDiagnosis(diagnosis: Diagnosis): Promise<any> {
    return diagnosis.toFHIR();
  }

  /**
   * Export medication to FHIR MedicationRequest resource
   */
  async exportMedication(medication: Medication): Promise<any> {
    return medication.toFHIR();
  }

  /**
   * Validate FHIR resource
   */
  async validateFHIRResource(resource: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic FHIR validation
      if (!resource.resourceType) {
        errors.push('Missing required field: resourceType');
      }

      if (!resource.id) {
        warnings.push('Missing recommended field: id');
      }

      // Resource-specific validation
      switch (resource.resourceType) {
        case 'Composition':
          this.validateComposition(resource, errors, warnings);
          break;
        case 'Condition':
          this.validateCondition(resource, errors, warnings);
          break;
        case 'MedicationRequest':
          this.validateMedicationRequest(resource, errors, warnings);
          break;
        case 'Bundle':
          this.validateBundle(resource, errors, warnings);
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Generate narrative text for FHIR resource
   */
  private generateNarrative(medicalRecord: MedicalRecordAggregate, language: 'en' | 'vi'): any {
    const summary = medicalRecord.getSummary();
    
    if (language === 'vi') {
      return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">
          <h3>Hồ sơ bệnh án</h3>
          <p><strong>Mã hồ sơ:</strong> ${medicalRecord.recordId.value}</p>
          <p><strong>Ngày khám:</strong> ${medicalRecord.visitDate.toLocaleDateString('vi-VN')}</p>
          <p><strong>Tóm tắt:</strong> ${summary}</p>
          <p><strong>Số chẩn đoán:</strong> ${medicalRecord.diagnoses.length}</p>
          <p><strong>Số thuốc:</strong> ${medicalRecord.medications.length}</p>
        </div>`
      };
    } else {
      return {
        status: 'generated',
        div: `<div xmlns="http://www.w3.org/1999/xhtml">
          <h3>Medical Record</h3>
          <p><strong>Record ID:</strong> ${medicalRecord.recordId.value}</p>
          <p><strong>Visit Date:</strong> ${medicalRecord.visitDate.toLocaleDateString('en-US')}</p>
          <p><strong>Summary:</strong> ${summary}</p>
          <p><strong>Diagnoses:</strong> ${medicalRecord.diagnoses.length}</p>
          <p><strong>Medications:</strong> ${medicalRecord.medications.length}</p>
        </div>`
      };
    }
  }

  /**
   * Count resources in FHIR structure
   */
  private countResources(fhirResource: any): number {
    if (fhirResource.resourceType === 'Bundle') {
      return fhirResource.entry ? fhirResource.entry.length : 0;
    }
    return 1;
  }

  /**
   * Convert JSON to XML (simplified implementation)
   */
  private convertToXML(jsonObject: any): string {
    // This is a simplified XML conversion
    // In production, use a proper JSON to XML library
    return `<?xml version="1.0" encoding="UTF-8"?>
<fhir xmlns="http://hl7.org/fhir">
  <!-- FHIR XML representation would go here -->
  <!-- This is a placeholder implementation -->
  <resourceType>${jsonObject.resourceType}</resourceType>
  <id>${jsonObject.id}</id>
</fhir>`;
  }

  /**
   * Create Patient resource from medical record
   */
  private createPatientResource(medicalRecord: MedicalRecordAggregate): any {
    return {
      resourceType: 'Patient',
      id: `patient-${medicalRecord.patientId}`,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      identifier: [{
        system: 'http://hospital.vn/patient-id',
        value: medicalRecord.patientId
      }],
      active: true
    };
  }

  /**
   * Create Practitioner resource from medical record
   */
  private createPractitionerResource(medicalRecord: MedicalRecordAggregate): any {
    return {
      resourceType: 'Practitioner',
      id: `practitioner-${medicalRecord.doctorId}`,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      identifier: [{
        system: 'http://hospital.vn/doctor-id',
        value: medicalRecord.doctorId
      }],
      active: true
    };
  }

  /**
   * Create Encounter resource from medical record
   */
  private createEncounterResource(medicalRecord: MedicalRecordAggregate): any {
    return {
      resourceType: 'Encounter',
      id: `encounter-${medicalRecord.recordId.value}`,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      status: 'finished',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      subject: {
        reference: `Patient/patient-${medicalRecord.patientId}`
      },
      participant: [{
        individual: {
          reference: `Practitioner/practitioner-${medicalRecord.doctorId}`
        }
      }],
      period: {
        start: medicalRecord.visitDate.toISOString(),
        end: medicalRecord.visitDate.toISOString()
      }
    };
  }

  /**
   * Validate FHIR Composition
   */
  private validateComposition(resource: any, errors: string[], warnings: string[]): void {
    if (!resource.status) {
      errors.push('Composition: Missing required field: status');
    }
    if (!resource.type) {
      errors.push('Composition: Missing required field: type');
    }
    if (!resource.subject) {
      errors.push('Composition: Missing required field: subject');
    }
    if (!resource.date) {
      errors.push('Composition: Missing required field: date');
    }
    if (!resource.author || resource.author.length === 0) {
      errors.push('Composition: Missing required field: author');
    }
    if (!resource.title) {
      warnings.push('Composition: Missing recommended field: title');
    }
  }

  /**
   * Validate FHIR Condition
   */
  private validateCondition(resource: any, errors: string[], warnings: string[]): void {
    if (!resource.subject) {
      errors.push('Condition: Missing required field: subject');
    }
    if (!resource.code) {
      errors.push('Condition: Missing required field: code');
    }
  }

  /**
   * Validate FHIR MedicationRequest
   */
  private validateMedicationRequest(resource: any, errors: string[], warnings: string[]): void {
    if (!resource.status) {
      errors.push('MedicationRequest: Missing required field: status');
    }
    if (!resource.intent) {
      errors.push('MedicationRequest: Missing required field: intent');
    }
    if (!resource.subject) {
      errors.push('MedicationRequest: Missing required field: subject');
    }
    if (!resource.medicationCodeableConcept && !resource.medicationReference) {
      errors.push('MedicationRequest: Missing required field: medication');
    }
  }

  /**
   * Validate FHIR Bundle
   */
  private validateBundle(resource: any, errors: string[], warnings: string[]): void {
    if (!resource.type) {
      errors.push('Bundle: Missing required field: type');
    }
    if (!resource.entry) {
      warnings.push('Bundle: No entries found');
    }
  }

  /**
   * Add Vietnamese healthcare extensions to FHIR composition
   */
  private addVietnameseHealthcareExtensions(composition: any, medicalRecord: MedicalRecordAggregate): void {
    try {
      // Initialize extensions array if not exists
      if (!composition.extension) {
        composition.extension = [];
      }

      // Add Vietnamese medical code extension
      if (medicalRecord.vietnameseMedicalCode) {
        composition.extension.push({
          url: 'http://moh.gov.vn/fhir/StructureDefinition/vietnamese-medical-code',
          valueString: medicalRecord.vietnameseMedicalCode
        });
      }

      // Add specialty code extension
      if (medicalRecord.specialtyCode) {
        composition.extension.push({
          url: 'http://moh.gov.vn/fhir/StructureDefinition/specialty-code',
          valueString: medicalRecord.specialtyCode
        });
      }

      // Add hospital code extension
      if (medicalRecord.hospitalCode) {
        composition.extension.push({
          url: 'http://moh.gov.vn/fhir/StructureDefinition/hospital-code',
          valueString: medicalRecord.hospitalCode
        });
      }

      // Add Vietnamese healthcare compliance extension
      composition.extension.push({
        url: 'http://moh.gov.vn/fhir/StructureDefinition/healthcare-compliance',
        extension: [
          {
            url: 'mohCompliant',
            valueBoolean: true
          },
          {
            url: 'fhirVersion',
            valueString: this.fhirVersion
          },
          {
            url: 'exportedAt',
            valueDateTime: new Date().toISOString()
          },
          {
            url: 'language',
            valueCode: 'vi-VN'
          }
        ]
      });

      this.logger.info('Added Vietnamese healthcare extensions to FHIR composition', {
        recordId: medicalRecord.recordId.value,
        extensionCount: composition.extension.length
      });

    } catch (error) {
      this.logger.error('Error adding Vietnamese healthcare extensions', {
        recordId: medicalRecord.recordId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate narrative text for FHIR resource
   */
  private generateNarrative(medicalRecord: MedicalRecordAggregate, language: string = 'vi'): any {
    const isVietnamese = language === 'vi';

    const title = isVietnamese ? 'Hồ sơ bệnh án' : 'Medical Record';
    const patientLabel = isVietnamese ? 'Bệnh nhân' : 'Patient';
    const doctorLabel = isVietnamese ? 'Bác sĩ' : 'Doctor';
    const visitDateLabel = isVietnamese ? 'Ngày khám' : 'Visit Date';
    const symptomsLabel = isVietnamese ? 'Triệu chứng' : 'Symptoms';
    const diagnosisLabel = isVietnamese ? 'Chẩn đoán' : 'Diagnosis';
    const treatmentLabel = isVietnamese ? 'Điều trị' : 'Treatment';

    const narrativeText = `
      <div xmlns="http://www.w3.org/1999/xhtml">
        <h2>${title}</h2>
        <p><strong>${patientLabel}:</strong> ${medicalRecord.patientId}</p>
        <p><strong>${doctorLabel}:</strong> ${medicalRecord.doctorId}</p>
        <p><strong>${visitDateLabel}:</strong> ${medicalRecord.visitDate.toLocaleDateString('vi-VN')}</p>
        ${medicalRecord.symptoms ? `<p><strong>${symptomsLabel}:</strong> ${medicalRecord.symptoms}</p>` : ''}
        ${medicalRecord.diagnosis ? `<p><strong>${diagnosisLabel}:</strong> ${medicalRecord.diagnosis}</p>` : ''}
        ${medicalRecord.treatment ? `<p><strong>${treatmentLabel}:</strong> ${medicalRecord.treatment}</p>` : ''}
      </div>
    `;

    return {
      status: 'generated',
      div: narrativeText
    };
  }
}
