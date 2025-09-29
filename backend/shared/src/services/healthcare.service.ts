// ============================================================================
// HEALTHCARE SERVICE - FHIR & ICD-10 Integration Service
// Healthcare standards integration service
// ============================================================================

import {
  CreateDiagnosisRequest,
  Diagnosis,
  FHIRPatient,
  FHIRPractitioner,
  FHIRValidationResult,
  ICD10Code,
  ICD10SearchResult,
  UpdateDiagnosisRequest,
} from "../types/healthcare.types";
import logger from "../utils/logger";

export class HealthcareService {
  private icd10Codes: Map<string, ICD10Code> = new Map();

  constructor() {
    this.initializeICD10Codes();
  }

  // ============================================================================
  // FHIR INTEGRATION METHODS
  // ============================================================================

  /**
   * Convert doctor data to FHIR Practitioner format
   */
  async convertDoctorToFHIR(doctorId: string): Promise<FHIRPractitioner> {
    try {
      logger.info(`Converting doctor ${doctorId} to FHIR format`);

      // TODO: Fetch actual doctor data from database
      // For now, return a mock FHIR Practitioner
      const fhirPractitioner: FHIRPractitioner = {
        resourceType: "Practitioner",
        id: doctorId,
        identifier: [
          {
            use: "official",
            system: "http://hospital.local/doctor-id",
            value: doctorId,
          },
        ],
        active: true,
        name: [
          {
            use: "official",
            family: "Doctor",
            given: ["Sample"],
            prefix: ["Dr."],
          },
        ],
        telecom: [
          {
            system: "phone",
            value: "+1234567890",
            use: "work",
          },
          {
            system: "email",
            value: "doctor@hospital.local",
            use: "work",
          },
        ],
        qualification: [
          {
            identifier: [
              {
                system: "http://hospital.local/license",
                value: "MD-12345",
              },
            ],
            code: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0360",
                  code: "MD",
                  display: "Doctor of Medicine",
                },
              ],
            },
          },
        ],
      };

      return fhirPractitioner;
    } catch (error) {
      logger.error("Error converting doctor to FHIR:", error);
      throw error;
    }
  }

  /**
   * Validate FHIR Practitioner resource
   */
  async validateFHIRPractitioner(
    practitioner: FHIRPractitioner
  ): Promise<FHIRValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let score = 100;

      // Basic validation
      if (
        !practitioner.resourceType ||
        practitioner.resourceType !== "Practitioner"
      ) {
        errors.push("Invalid resourceType");
        score -= 20;
      }

      if (!practitioner.id) {
        errors.push("Missing required field: id");
        score -= 15;
      }

      if (!practitioner.identifier || practitioner.identifier.length === 0) {
        errors.push("Missing required field: identifier");
        score -= 15;
      }

      if (!practitioner.name || practitioner.name.length === 0) {
        errors.push("Missing required field: name");
        score -= 15;
      }

      if (
        !practitioner.qualification ||
        practitioner.qualification.length === 0
      ) {
        warnings.push("Missing qualification information");
        score -= 10;
      }

      if (!practitioner.telecom || practitioner.telecom.length === 0) {
        warnings.push("Missing contact information");
        score -= 5;
      }

      return {
        isValid: errors.length === 0,
        fhir_compliance_score: Math.max(0, score),
        errors,
        warnings,
        validated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error validating FHIR Practitioner:", error);
      throw error;
    }
  }

  // ============================================================================
  // ICD-10 INTEGRATION METHODS
  // ============================================================================

  /**
   * Search ICD-10 codes
   */
  async searchICD10Codes(
    query: string,
    limit: number = 10
  ): Promise<ICD10SearchResult> {
    try {
      const startTime = Date.now();
      const searchQuery = query.toLowerCase();

      const matchingCodes: ICD10Code[] = [];

      for (const [code, icd10] of this.icd10Codes) {
        if (
          code.toLowerCase().includes(searchQuery) ||
          icd10.description.toLowerCase().includes(searchQuery) ||
          icd10.category.toLowerCase().includes(searchQuery)
        ) {
          matchingCodes.push(icd10);
          if (matchingCodes.length >= limit) break;
        }
      }

      const searchTime = Date.now() - startTime;

      return {
        codes: matchingCodes,
        total: matchingCodes.length,
        query,
        search_time: searchTime,
      };
    } catch (error) {
      logger.error("Error searching ICD-10 codes:", error);
      throw error;
    }
  }

  /**
   * Validate ICD-10 code
   */
  async validateICD10Code(
    code: string
  ): Promise<{ isValid: boolean; code?: ICD10Code }> {
    try {
      const icd10Code = this.icd10Codes.get(code.toUpperCase());

      return {
        isValid: !!icd10Code,
        code: icd10Code,
      };
    } catch (error) {
      logger.error("Error validating ICD-10 code:", error);
      throw error;
    }
  }

  /**
   * Get ICD-10 codes by category
   */
  async getICD10CodesByCategory(category: string): Promise<ICD10Code[]> {
    try {
      const codes: ICD10Code[] = [];

      for (const [, icd10] of this.icd10Codes) {
        if (icd10.category.toLowerCase() === category.toLowerCase()) {
          codes.push(icd10);
        }
      }

      return codes;
    } catch (error) {
      logger.error("Error getting ICD-10 codes by category:", error);
      throw error;
    }
  }

  // ============================================================================
  // DIAGNOSIS MANAGEMENT METHODS
  // ============================================================================

  /**
   * Create diagnosis (placeholder)
   */
  async createDiagnosis(
    diagnosisData: CreateDiagnosisRequest
  ): Promise<Diagnosis> {
    try {
      // TODO: Implement actual database creation
      const diagnosis: Diagnosis = {
        diagnosis_id: `DIAG-${Date.now()}`,
        ...diagnosisData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: diagnosisData.doctor_id,
      };

      logger.info("Created diagnosis:", diagnosis.diagnosis_id);
      return diagnosis;
    } catch (error) {
      logger.error("Error creating diagnosis:", error);
      throw error;
    }
  }

  /**
   * Update diagnosis (placeholder)
   */
  async updateDiagnosis(
    diagnosisId: string,
    updateData: UpdateDiagnosisRequest
  ): Promise<Diagnosis> {
    try {
      // TODO: Implement actual database update
      logger.info("Updated diagnosis:", diagnosisId);
      throw new Error("Update diagnosis not implemented yet");
    } catch (error) {
      logger.error("Error updating diagnosis:", error);
      throw error;
    }
  }

  /**
   * Get patient diagnoses (placeholder)
   */
  async getPatientDiagnoses(patientId: string): Promise<Diagnosis[]> {
    try {
      // TODO: Implement actual database query
      logger.info("Getting diagnoses for patient:", patientId);
      return [];
    } catch (error) {
      logger.error("Error getting patient diagnoses:", error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Initialize sample ICD-10 codes
   */
  private initializeICD10Codes(): void {
    // Sample ICD-10 codes for testing
    const sampleCodes: ICD10Code[] = [
      {
        code: "I10",
        description: "Essential (primary) hypertension",
        category: "Diseases of the circulatory system",
      },
      {
        code: "E11",
        description: "Type 2 diabetes mellitus",
        category: "Endocrine, nutritional and metabolic diseases",
      },
      {
        code: "J44",
        description: "Other chronic obstructive pulmonary disease",
        category: "Diseases of the respiratory system",
      },
      {
        code: "M79.3",
        description: "Panniculitis, unspecified",
        category: "Diseases of the musculoskeletal system",
      },
      {
        code: "R50.9",
        description: "Fever, unspecified",
        category: "Symptoms, signs and abnormal clinical findings",
      },
    ];

    sampleCodes.forEach((code) => {
      this.icd10Codes.set(code.code, code);
    });

    logger.info(`Initialized ${sampleCodes.length} sample ICD-10 codes`);
  }

  // ============================================================================
  // PATIENT-SPECIFIC FHIR METHODS
  // ============================================================================

  /**
   * Convert patient data to FHIR Patient format
   */
  async convertPatientToFHIR(patientId: string): Promise<FHIRPatient> {
    try {
      logger.info(`Converting patient ${patientId} to FHIR format`);

      // TODO: Fetch actual patient data from database
      // For now, return a mock FHIR Patient
      const fhirPatient: FHIRPatient = {
        resourceType: "Patient",
        id: patientId,
        identifier: [
          {
            use: "official",
            system: "http://hospital.local/patient-id",
            value: patientId,
          },
        ],
        active: true,
        name: [
          {
            use: "official",
            family: "Patient",
            given: ["Sample"],
          },
        ],
        telecom: [
          {
            system: "phone",
            value: "+1234567890",
            use: "home",
          },
          {
            system: "email",
            value: "patient@hospital.local",
            use: "home",
          },
        ],
        gender: "unknown",
        birthDate: "1990-01-01",
      };

      return fhirPatient;
    } catch (error) {
      logger.error("Error converting patient to FHIR:", error);
      throw error;
    }
  }

  /**
   * Validate FHIR Patient resource
   */
  async validateFHIRPatient(
    patient: FHIRPatient
  ): Promise<FHIRValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let score = 100;

      // Basic validation
      if (!patient.resourceType || patient.resourceType !== "Patient") {
        errors.push("Invalid resourceType");
        score -= 20;
      }

      if (!patient.id) {
        errors.push("Missing required field: id");
        score -= 15;
      }

      if (!patient.identifier || patient.identifier.length === 0) {
        errors.push("Missing required field: identifier");
        score -= 15;
      }

      if (!patient.name || patient.name.length === 0) {
        errors.push("Missing required field: name");
        score -= 15;
      }

      if (!patient.birthDate) {
        warnings.push("Missing birth date");
        score -= 5;
      }

      if (!patient.gender) {
        warnings.push("Missing gender information");
        score -= 5;
      }

      if (!patient.telecom || patient.telecom.length === 0) {
        warnings.push("Missing contact information");
        score -= 5;
      }

      return {
        isValid: errors.length === 0,
        fhir_compliance_score: Math.max(0, score),
        errors,
        warnings,
        validated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error validating FHIR Patient:", error);
      throw error;
    }
  }
}
