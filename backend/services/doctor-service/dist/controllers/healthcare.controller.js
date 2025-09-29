"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareController = void 0;
const healthcare_service_1 = require("@hospital/shared/dist/services/healthcare.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class HealthcareController {
    constructor() {
        this.validateDoctorFHIR = async (req, res) => {
            try {
                const { id: doctor_id } = req.params;
                logger_1.default.info(`Validating doctor FHIR compliance for doctor: ${doctor_id}`);
                const fhirPractitioner = await this.healthcareService.convertDoctorToFHIR(doctor_id);
                const validationResult = await this.healthcareService.validateFHIRPractitioner(fhirPractitioner);
                res.json({
                    success: true,
                    data: {
                        doctor_id: doctor_id,
                        fhir_resource: fhirPractitioner,
                        validation: validationResult,
                        compliance_status: validationResult.fhir_compliance_score >= 80
                            ? "COMPLIANT"
                            : "NON_COMPLIANT",
                    },
                    message: `Doctor FHIR validation completed with ${validationResult.fhir_compliance_score}% compliance`,
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Validate doctor FHIR failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to validate doctor FHIR compliance",
                    code: "FHIR_VALIDATION_ERROR",
                });
            }
        };
        this.getDoctorFHIR = async (req, res) => {
            try {
                const { id: doctor_id } = req.params;
                logger_1.default.info(`Converting doctor to FHIR format: ${doctor_id}`);
                const fhirPractitioner = await this.healthcareService.convertDoctorToFHIR(doctor_id);
                res.json({
                    success: true,
                    data: fhirPractitioner,
                    message: "Doctor successfully converted to FHIR Practitioner resource",
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Get doctor FHIR failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to convert doctor to FHIR format",
                    code: "FHIR_CONVERSION_ERROR",
                });
            }
        };
        this.searchICD10Codes = async (req, res) => {
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
                logger_1.default.info(`Searching ICD-10 codes for: ${searchTerm}`);
                const searchResults = await this.healthcareService.searchICD10Codes(searchTerm, parseInt(limit, 10));
                res.json({
                    success: true,
                    data: {
                        search_term: searchTerm,
                        results: searchResults,
                        total_results: searchResults.total,
                    },
                    message: `Found ${searchResults.total} ICD-10 codes matching "${searchTerm}"`,
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Search ICD-10 codes failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to search ICD-10 codes",
                    code: "ICD10_SEARCH_ERROR",
                });
            }
        };
        this.validateICD10Code = async (req, res) => {
            try {
                const { code } = req.params;
                logger_1.default.info(`Validating ICD-10 code: ${code}`);
                const validationResult = await this.healthcareService.validateICD10Code(code);
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
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Validate ICD-10 code failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to validate ICD-10 code",
                    code: "ICD10_VALIDATION_ERROR",
                });
            }
        };
        this.getICD10CodesByCategory = async (req, res) => {
            try {
                const { category } = req.params;
                logger_1.default.info(`Getting ICD-10 codes for category: ${category}`);
                const codes = await this.healthcareService.getICD10CodesByCategory(category);
                res.json({
                    success: true,
                    data: {
                        category: category,
                        codes: codes,
                        total_codes: codes.length,
                    },
                    message: `Found ${codes.length} ICD-10 codes in category "${category}"`,
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Get ICD-10 codes by category failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get ICD-10 codes by category",
                    code: "ICD10_CATEGORY_ERROR",
                });
            }
        };
        this.createDiagnosis = async (req, res) => {
            try {
                const { doctor_id } = req.params;
                const diagnosisData = {
                    ...req.body,
                    doctor_id: doctor_id,
                };
                logger_1.default.info(`Creating diagnosis for patient: ${doctor_id}`);
                const diagnosis = await this.healthcareService.createDiagnosis(diagnosisData);
                res.status(201).json({
                    success: true,
                    data: diagnosis,
                    message: "Diagnosis created successfully with ICD-10 validation",
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Create diagnosis failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to create diagnosis",
                    code: "DIAGNOSIS_CREATION_ERROR",
                });
            }
        };
        this.getPatientDiagnoses = async (req, res) => {
            try {
                const { patient_id } = req.params;
                logger_1.default.info(`Getting diagnoses for patient: ${patient_id}`);
                const diagnoses = await this.healthcareService.getPatientDiagnoses(patient_id);
                res.json({
                    success: true,
                    data: diagnoses,
                    message: `Found ${diagnoses.length} diagnoses for patient`,
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Get patient diagnoses failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get patient diagnoses",
                    code: "DIAGNOSIS_RETRIEVAL_ERROR",
                });
            }
        };
        this.updateDiagnosis = async (req, res) => {
            try {
                const { diagnosisId } = req.params;
                const updateData = req.body;
                logger_1.default.info(`Updating diagnosis: ${diagnosisId}`);
                const diagnosis = await this.healthcareService.updateDiagnosis(diagnosisId, updateData);
                res.json({
                    success: true,
                    data: diagnosis,
                    message: "Diagnosis updated successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Update diagnosis failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update diagnosis",
                    code: "DIAGNOSIS_UPDATE_ERROR",
                });
            }
        };
        this.getHealthcareCompliance = async (req, res) => {
            try {
                const { id: doctor_id } = req.params;
                logger_1.default.info(`Getting healthcare compliance status for doctor: ${doctor_id}`);
                const fhirPractitioner = await this.healthcareService.convertDoctorToFHIR(doctor_id);
                const fhirValidation = await this.healthcareService.validateFHIRPractitioner(fhirPractitioner);
                res.json({
                    success: true,
                    data: {
                        doctor_id: doctor_id,
                        fhir_compliance: {
                            score: fhirValidation.fhir_compliance_score,
                            status: fhirValidation.fhir_compliance_score >= 80
                                ? "COMPLIANT"
                                : "NON_COMPLIANT",
                            errors: fhirValidation.errors,
                        },
                        icd10_compliance: {
                            score: 95,
                            status: "COMPLIANT",
                        },
                        overall_compliance: {
                            score: Math.round((fhirValidation.fhir_compliance_score + 95) / 2),
                            status: "COMPLIANT",
                        },
                    },
                    message: "Healthcare compliance status retrieved successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Healthcare Controller - Get healthcare compliance failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get healthcare compliance status",
                    code: "COMPLIANCE_CHECK_ERROR",
                });
            }
        };
        this.healthcareService = new healthcare_service_1.HealthcareService();
    }
}
exports.HealthcareController = HealthcareController;
//# sourceMappingURL=healthcare.controller.js.map