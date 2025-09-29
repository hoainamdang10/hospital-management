"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthcareController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const database_config_1 = require("../config/database.config");
class HealthcareController {
    async getFHIRAppointment(req, res) {
        try {
            const { appointment_id } = req.params;
            const { data: appointment, error } = await database_config_1.supabaseAdmin
                .from("appointments")
                .select(`
          *,
          doctor_profiles!doctor_id (
            doctor_id,
            specialization,
            profiles!user_id (
              full_name
            )
          ),
          patient_profiles!patient_id (
            patient_id,
            profiles!user_id (
              full_name
            )
          )
        `)
                .eq("appointment_id", appointment_id)
                .single();
            if (error) {
                logger_1.default.error("Error fetching FHIR appointment:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to fetch FHIR appointment data",
                });
                return;
            }
            if (!appointment) {
                res.status(404).json({
                    success: false,
                    error: "Appointment not found",
                });
                return;
            }
            const fhirAppointment = {
                resourceType: "Appointment",
                id: appointment.appointment_id,
                status: appointment.status,
                serviceCategory: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/service-category",
                                code: "gp",
                                display: "General Practice",
                            },
                        ],
                    },
                ],
                serviceType: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/service-type",
                                code: appointment.appointment_type || "consultation",
                                display: appointment.appointment_type || "Consultation",
                            },
                        ],
                    },
                ],
                start: `${appointment.appointment_date}T${appointment.appointment_time}`,
                end: appointment.duration_minutes
                    ? new Date(new Date(`${appointment.appointment_date}T${appointment.appointment_time}`).getTime() +
                        appointment.duration_minutes * 60000).toISOString()
                    : undefined,
                participant: [
                    {
                        actor: {
                            reference: `Practitioner/${appointment.doctor_id}`,
                            display: appointment.doctor_profiles?.profiles?.full_name,
                        },
                        status: "accepted",
                    },
                    {
                        actor: {
                            reference: `Patient/${appointment.patient_id}`,
                            display: appointment.patient_profiles?.profiles?.full_name,
                        },
                        status: "accepted",
                    },
                ],
            };
            res.json({
                success: true,
                data: fhirAppointment,
            });
        }
        catch (error) {
            logger_1.default.error("Exception in getFHIRAppointment:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    async addDiagnosis(req, res) {
        try {
            const { appointment_id } = req.params;
            const { diagnosis, icd10_code, notes } = req.body;
            if (!diagnosis) {
                res.status(400).json({
                    success: false,
                    error: "Diagnosis is required",
                });
                return;
            }
            const { data, error } = await database_config_1.supabaseAdmin
                .from("appointments")
                .update({
                diagnosis,
                notes: notes || null,
                updated_at: new Date().toISOString(),
            })
                .eq("appointment_id", appointment_id)
                .select()
                .single();
            if (error) {
                logger_1.default.error("Error adding diagnosis:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to add diagnosis",
                });
                return;
            }
            res.json({
                success: true,
                data,
                message: "Diagnosis added successfully",
            });
        }
        catch (error) {
            logger_1.default.error("Exception in addDiagnosis:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
    async getICD10Codes(req, res) {
        try {
            const { search } = req.query;
            const mockICD10Codes = [
                {
                    code: "Z00.00",
                    description: "Encounter for general adult medical examination without abnormal findings",
                },
                { code: "K59.00", description: "Constipation, unspecified" },
                { code: "R50.9", description: "Fever, unspecified" },
                {
                    code: "J06.9",
                    description: "Acute upper respiratory infection, unspecified",
                },
                { code: "M79.3", description: "Panniculitis, unspecified" },
            ];
            let filteredCodes = mockICD10Codes;
            if (search) {
                const searchTerm = search.toString().toLowerCase();
                filteredCodes = mockICD10Codes.filter((code) => code.code.toLowerCase().includes(searchTerm) ||
                    code.description.toLowerCase().includes(searchTerm));
            }
            res.json({
                success: true,
                data: filteredCodes,
            });
        }
        catch (error) {
            logger_1.default.error("Exception in getICD10Codes:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
            });
        }
    }
}
exports.HealthcareController = HealthcareController;
//# sourceMappingURL=healthcare.controller.js.map