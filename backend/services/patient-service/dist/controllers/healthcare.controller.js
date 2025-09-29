"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientHealthcareController = void 0;
const healthcare_service_1 = require("@hospital/shared/dist/services/healthcare.service");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientHealthcareController {
    constructor() {
        this.validatePatientFHIR = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                logger_1.default.info(`Validating patient FHIR compliance for patient: ${patient_id}`);
                const fhirPatient = await this.healthcareService.convertPatientToFHIR(patient_id);
                const validationResult = await this.healthcareService.validateFHIRPatient(fhirPatient);
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        fhir_resource: fhirPatient,
                        validation: validationResult,
                        compliance_status: validationResult.fhir_compliance_score >= 80
                            ? "COMPLIANT"
                            : "NON_COMPLIANT",
                    },
                    message: `Patient FHIR validation completed with ${validationResult.fhir_compliance_score}% compliance`,
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Validate patient FHIR failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to validate patient FHIR compliance",
                    code: "FHIR_VALIDATION_ERROR",
                });
            }
        };
        this.getPatientFHIR = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                logger_1.default.info(`Converting patient to FHIR format: ${patient_id}`);
                const fhirPatient = await this.healthcareService.convertPatientToFHIR(patient_id);
                res.json({
                    success: true,
                    data: fhirPatient,
                    message: "Patient successfully converted to FHIR Patient resource",
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get patient FHIR failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to convert patient to FHIR format",
                    code: "FHIR_CONVERSION_ERROR",
                });
            }
        };
        this.getPatientMedicalHistory = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                const { include_resolved = "false" } = req.query;
                logger_1.default.info(`Getting medical history for patient: ${patient_id}`);
                const diagnosesResult = await this.healthcareService.getPatientDiagnoses(patient_id);
                let diagnoses = diagnosesResult || [];
                if (include_resolved === "false") {
                    diagnoses = diagnoses.filter((d) => d.status !== "resolved");
                }
                const groupedDiagnoses = {
                    active: diagnoses.filter((d) => d.status === "active"),
                    chronic: diagnoses.filter((d) => d.status === "chronic"),
                    recurrent: diagnoses.filter((d) => d.status === "recurrent"),
                    resolved: diagnoses.filter((d) => d.status === "resolved"),
                };
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        total_diagnoses: diagnoses.length,
                        diagnoses: groupedDiagnoses,
                        summary: {
                            active_conditions: groupedDiagnoses.active.length,
                            chronic_conditions: groupedDiagnoses.chronic.length,
                            recurrent_conditions: groupedDiagnoses.recurrent.length,
                            resolved_conditions: groupedDiagnoses.resolved.length,
                        },
                    },
                    message: `Retrieved medical history with ${diagnoses.length} diagnoses`,
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get medical history failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get patient medical history",
                    code: "MEDICAL_HISTORY_ERROR",
                });
            }
        };
        this.getDiagnosesByCategory = async (req, res) => {
            try {
                const { id: patient_id, category } = req.params;
                logger_1.default.info(`Getting diagnoses by category for patient: ${patient_id}`);
                const diagnosesResult = await this.healthcareService.getPatientDiagnoses(patient_id);
                const filteredDiagnoses = (diagnosesResult || []).filter((diagnosis) => {
                    return diagnosis.icd10_code.startsWith(category.toUpperCase());
                });
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        category: category,
                        diagnoses: filteredDiagnoses,
                        total_count: filteredDiagnoses.length,
                    },
                    message: `Found ${filteredDiagnoses.length} diagnoses in category ${category}`,
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get diagnoses by category failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get diagnoses by category",
                    code: "DIAGNOSIS_CATEGORY_ERROR",
                });
            }
        };
        this.getHealthcareTimeline = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                const { start_date, end_date, limit = "50" } = req.query;
                logger_1.default.info(`Getting healthcare timeline for patient: ${patient_id}`);
                const diagnosesResult = await this.healthcareService.getPatientDiagnoses(patient_id);
                let diagnoses = diagnosesResult || [];
                if (start_date) {
                    diagnoses = diagnoses.filter((d) => (d.diagnosis_date || d.created_at) >= start_date);
                }
                if (end_date) {
                    diagnoses = diagnoses.filter((d) => (d.diagnosis_date || d.created_at) <= end_date);
                }
                diagnoses = diagnoses.slice(0, parseInt(limit, 10));
                const timelineEvents = diagnoses.map((diagnosis) => ({
                    date: diagnosis.diagnosis_date || diagnosis.created_at,
                    type: "diagnosis",
                    event: {
                        id: diagnosis.id || diagnosis.diagnosis_id,
                        icd10_code: diagnosis.icd10_code,
                        diagnosis_type: diagnosis.diagnosis_type,
                        severity: diagnosis.severity,
                        status: diagnosis.status,
                        clinical_notes: diagnosis.clinical_notes || diagnosis.notes || "",
                        doctor_id: diagnosis.doctor_id,
                    },
                }));
                timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        timeline: timelineEvents,
                        total_events: timelineEvents.length,
                        date_range: {
                            start: start_date || "all",
                            end: end_date || "all",
                        },
                    },
                    message: `Retrieved healthcare timeline with ${timelineEvents.length} events`,
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get healthcare timeline failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get healthcare timeline",
                    code: "TIMELINE_ERROR",
                });
            }
        };
        this.getHealthcareCompliance = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                logger_1.default.info(`Getting healthcare compliance status for patient: ${patient_id}`);
                const fhirPatient = await this.healthcareService.convertPatientToFHIR(patient_id);
                const fhirValidation = await this.healthcareService.validateFHIRPatient(fhirPatient);
                const diagnosesResult = await this.healthcareService.getPatientDiagnoses(patient_id);
                const diagnosesCount = diagnosesResult?.length || 0;
                const medicalRecordsScore = Math.min(100, diagnosesCount * 10);
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        fhir_compliance: {
                            score: fhirValidation.fhir_compliance_score,
                            status: fhirValidation.fhir_compliance_score >= 80
                                ? "COMPLIANT"
                                : "NON_COMPLIANT",
                            errors: fhirValidation.errors,
                        },
                        medical_records_completeness: {
                            score: medicalRecordsScore,
                            status: medicalRecordsScore >= 70 ? "COMPLETE" : "INCOMPLETE",
                            diagnoses_count: diagnosesCount,
                        },
                        overall_compliance: {
                            score: Math.round((fhirValidation.fhir_compliance_score + medicalRecordsScore) / 2),
                            status: "COMPLIANT",
                        },
                    },
                    message: "Healthcare compliance status retrieved successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get healthcare compliance failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get healthcare compliance status",
                    code: "COMPLIANCE_CHECK_ERROR",
                });
            }
        };
        this.getHealthSummary = async (req, res) => {
            try {
                const { id: patient_id } = req.params;
                logger_1.default.info(`Getting health summary for patient: ${patient_id}`);
                const diagnosesResult = await this.healthcareService.getPatientDiagnoses(patient_id);
                const diagnoses = diagnosesResult || [];
                const summary = {
                    total_diagnoses: diagnoses.length,
                    active_conditions: diagnoses.filter((d) => d.status === "active")
                        .length,
                    chronic_conditions: diagnoses.filter((d) => d.status === "chronic")
                        .length,
                    recent_diagnoses: diagnoses.filter((d) => {
                        const diagnosisDate = new Date(d.diagnosis_date || d.created_at);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return diagnosisDate >= thirtyDaysAgo;
                    }).length,
                    follow_up_required: diagnoses.filter((d) => (d.follow_up_required || false) && d.status === "active").length,
                    severity_distribution: {
                        mild: diagnoses.filter((d) => d.severity === "mild").length,
                        moderate: diagnoses.filter((d) => d.severity === "moderate").length,
                        severe: diagnoses.filter((d) => d.severity === "severe").length,
                        critical: diagnoses.filter((d) => d.severity === "critical").length,
                    },
                };
                res.json({
                    success: true,
                    data: {
                        patient_id: patient_id,
                        health_summary: summary,
                        last_updated: new Date().toISOString(),
                    },
                    message: "Patient health summary retrieved successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Patient Healthcare Controller - Get health summary failed:", error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Failed to get patient health summary",
                    code: "HEALTH_SUMMARY_ERROR",
                });
            }
        };
        this.healthcareService = new healthcare_service_1.HealthcareService();
    }
}
exports.PatientHealthcareController = PatientHealthcareController;
//# sourceMappingURL=healthcare.controller.js.map