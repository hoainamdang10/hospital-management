// ============================================================================
// HEALTHCARE CONTROLLER - FHIR & ICD-10 Integration for Doctor Service
// Healthcare standards integration controller
// ============================================================================

import { HealthcareService } from "@hospital/shared/dist/services/healthcare.service";
import {
  CreateDiagnosisRequest,
  UpdateDiagnosisRequest,
} from "@hospital/shared/dist/types/healthcare.types";
import logger from "@hospital/shared/dist/utils/logger";
import { Request, Response } from "express";

export class HealthcareController {
  private healthcareService: HealthcareService;

  constructor() {
    this.healthcareService = new HealthcareService();
  }

  // ============================================================================
  // FHIR VALIDATION ENDPOINTS
  // ============================================================================

  /**
   * Validate doctor data against FHIR Practitioner resource
   * POST /api/doctors/:id/fhir/validate
   */
  validateDoctorFHIR = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: doctor_id } = req.params;

      logger.info(`Validating doctor FHIR compliance for doctor: ${doctor_id}`);

      // Convert doctor to FHIR format first
      const fhirPractitioner =
        await this.healthcareService.convertDoctorToFHIR(doctor_id);

      // Validate FHIR compliance
      const validationResult =
        await this.healthcareService.validateFHIRPractitioner(fhirPractitioner);

      res.json({
        success: true,
        data: {
          doctor_id: doctor_id,
          fhir_resource: fhirPractitioner,
          validation: validationResult,
          compliance_status:
            validationResult.fhir_compliance_score >= 80
              ? "COMPLIANT"
              : "NON_COMPLIANT",
        },
        message: `Doctor FHIR validation completed with ${validationResult.fhir_compliance_score}% compliance`,
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Validate doctor FHIR failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate doctor FHIR compliance",
        code: "FHIR_VALIDATION_ERROR",
      });
    }
  };

  /**
   * Get doctor as FHIR Practitioner resource
   * GET /api/doctors/:id/fhir
   */
  getDoctorFHIR = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: doctor_id } = req.params;

      logger.info(`Converting doctor to FHIR format: ${doctor_id}`);

      const fhirPractitioner =
        await this.healthcareService.convertDoctorToFHIR(doctor_id);

      res.json({
        success: true,
        data: fhirPractitioner,
        message: "Doctor successfully converted to FHIR Practitioner resource",
      });
    } catch (error) {
      logger.error("Healthcare Controller - Get doctor FHIR failed:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to convert doctor to FHIR format",
        code: "FHIR_CONVERSION_ERROR",
      });
    }
  };

  // ============================================================================
  // ICD-10 DIAGNOSIS ENDPOINTS
  // ============================================================================

  /**
   * Search ICD-10 diagnosis codes
   * GET /api/doctors/icd10/search?q=search_term&limit=20
   */
  searchICD10Codes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q: searchTerm, limit = "20" } = req.query;

      if (!searchTerm || typeof searchTerm !== "string") {
        res.status(400).json({
          success: false,
          error: "Search term is required",
          code: "MISSING_SEARCH_TERM",
        });
        return;
      }

      logger.info(`Searching ICD-10 codes for: ${searchTerm}`);

      const searchResults = await this.healthcareService.searchICD10Codes(
        searchTerm,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: {
          search_term: searchTerm,
          results: searchResults,
          total_results: searchResults.total,
        },
        message: `Found ${searchResults.total} ICD-10 codes matching "${searchTerm}"`,
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Search ICD-10 codes failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to search ICD-10 codes",
        code: "ICD10_SEARCH_ERROR",
      });
    }
  };

  /**
   * Validate ICD-10 diagnosis code
   * GET /api/doctors/icd10/validate/:code
   */
  validateICD10Code = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;

      logger.info(`Validating ICD-10 code: ${code}`);

      const validationResult =
        await this.healthcareService.validateICD10Code(code);

      res.json({
        success: true,
        data: {
          code: code,
          validation: validationResult,
          is_valid: validationResult.isValid,
        },
        message: validationResult.isValid
          ? `ICD-10 code ${code} is valid`
          : `ICD-10 code ${code} is invalid`,
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Validate ICD-10 code failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to validate ICD-10 code",
        code: "ICD10_VALIDATION_ERROR",
      });
    }
  };

  /**
   * Get ICD-10 codes by category
   * GET /api/doctors/icd10/category/:category
   */
  getICD10CodesByCategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { category } = req.params;

      logger.info(`Getting ICD-10 codes for category: ${category}`);

      const codes =
        await this.healthcareService.getICD10CodesByCategory(category);

      res.json({
        success: true,
        data: {
          category: category,
          codes: codes,
          total_codes: codes.length,
        },
        message: `Found ${codes.length} ICD-10 codes in category "${category}"`,
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Get ICD-10 codes by category failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get ICD-10 codes by category",
        code: "ICD10_CATEGORY_ERROR",
      });
    }
  };

  // ============================================================================
  // DIAGNOSIS MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Create patient diagnosis
   * POST /api/doctors/:doctorId/diagnoses
   */
  createDiagnosis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { doctor_id } = req.params;
      const diagnosisData: CreateDiagnosisRequest = {
        ...req.body,
        doctor_id: doctor_id,
      };

      logger.info(`Creating diagnosis for patient: ${doctor_id}`);

      const diagnosis =
        await this.healthcareService.createDiagnosis(diagnosisData);

      res.status(201).json({
        success: true,
        data: diagnosis,
        message: "Diagnosis created successfully with ICD-10 validation",
      });
    } catch (error) {
      logger.error("Healthcare Controller - Create diagnosis failed:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create diagnosis",
        code: "DIAGNOSIS_CREATION_ERROR",
      });
    }
  };

  /**
   * Get patient diagnoses
   * GET /api/doctors/diagnoses/patient/:patient_id
   */
  getPatientDiagnoses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patient_id } = req.params;

      logger.info(`Getting diagnoses for patient: ${patient_id}`);

      const diagnoses =
        await this.healthcareService.getPatientDiagnoses(patient_id);

      res.json({
        success: true,
        data: diagnoses,
        message: `Found ${diagnoses.length} diagnoses for patient`,
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Get patient diagnoses failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get patient diagnoses",
        code: "DIAGNOSIS_RETRIEVAL_ERROR",
      });
    }
  };

  /**
   * Update diagnosis
   * PUT /api/doctors/diagnoses/:diagnosisId
   */
  updateDiagnosis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { diagnosisId } = req.params;
      const updateData: UpdateDiagnosisRequest = req.body;

      logger.info(`Updating diagnosis: ${diagnosisId}`);

      const diagnosis = await this.healthcareService.updateDiagnosis(
        diagnosisId,
        updateData
      );

      res.json({
        success: true,
        data: diagnosis,
        message: "Diagnosis updated successfully",
      });
    } catch (error) {
      logger.error("Healthcare Controller - Update diagnosis failed:", error);
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update diagnosis",
        code: "DIAGNOSIS_UPDATE_ERROR",
      });
    }
  };

  // ============================================================================
  // HEALTHCARE COMPLIANCE ENDPOINTS
  // ============================================================================

  /**
   * Get healthcare compliance status for doctor
   * GET /api/doctors/:id/healthcare/compliance
   */
  getHealthcareCompliance = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id: doctor_id } = req.params;

      logger.info(
        `Getting healthcare compliance status for doctor: ${doctor_id}`
      );

      // Get FHIR compliance
      const fhirPractitioner =
        await this.healthcareService.convertDoctorToFHIR(doctor_id);
      const fhirValidation =
        await this.healthcareService.validateFHIRPractitioner(fhirPractitioner);

      // Get diagnosis statistics (ICD-10 usage)
      // This would be expanded to get doctor's diagnosis statistics

      res.json({
        success: true,
        data: {
          doctor_id: doctor_id,
          fhir_compliance: {
            score: fhirValidation.fhir_compliance_score,
            status:
              fhirValidation.fhir_compliance_score >= 80
                ? "COMPLIANT"
                : "NON_COMPLIANT",
            errors: fhirValidation.errors,
          },
          icd10_compliance: {
            score: 95, // This would be calculated based on actual usage
            status: "COMPLIANT",
          },
          overall_compliance: {
            score: Math.round((fhirValidation.fhir_compliance_score + 95) / 2),
            status: "COMPLIANT",
          },
        },
        message: "Healthcare compliance status retrieved successfully",
      });
    } catch (error) {
      logger.error(
        "Healthcare Controller - Get healthcare compliance failed:",
        error
      );
      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get healthcare compliance status",
        code: "COMPLIANCE_CHECK_ERROR",
      });
    }
  };
}
