"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRegistrationController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
class PatientRegistrationController {
    constructor() {
        this.registerPatient = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const patientData = req.body;
                if (!patientData.email || !patientData.password || !patientData.full_name) {
                    res.status(400).json({
                        success: false,
                        error: "Missing required fields: email, password, full_name",
                    });
                    return;
                }
                if (!patientData.national_id || !patientData.phone_number) {
                    res.status(400).json({
                        success: false,
                        error: "Missing required fields: national_id, phone_number",
                    });
                    return;
                }
                if (!patientData.emergency_contact?.name || !patientData.emergency_contact?.phone_number) {
                    res.status(400).json({
                        success: false,
                        error: "Missing required emergency contact information",
                    });
                    return;
                }
                const authServiceData = {
                    email: patientData.email,
                    password: patientData.password,
                    full_name: patientData.full_name,
                    role: "patient",
                    phone_number: patientData.phone_number,
                    gender: patientData.gender,
                    date_of_birth: patientData.date_of_birth,
                    national_id: patientData.national_id,
                    address: patientData.address,
                    blood_type: patientData.blood_type,
                    weight: patientData.weight,
                    height: patientData.height,
                    medical_history: patientData.medical_history,
                    drug_allergies: patientData.drug_allergies,
                    current_medications: patientData.current_medications,
                    insurance_number: patientData.insurance_number,
                    insurance_provider: patientData.insurance_provider,
                    insurance_valid_from: patientData.insurance_valid_from,
                    insurance_valid_to: patientData.insurance_valid_to,
                    emergency_contact: patientData.emergency_contact,
                    occupation: patientData.occupation,
                    notes: patientData.notes,
                };
                logger_1.default.info("🏥 Patient registration attempt", {
                    email: patientData.email,
                    full_name: patientData.full_name,
                    national_id: patientData.national_id,
                    has_insurance: !!patientData.insurance_number,
                    medical_conditions: patientData.medical_history?.length || 0,
                    drug_allergies: patientData.drug_allergies?.length || 0,
                });
                const result = await this.authService.signUp(authServiceData);
                if (result.error) {
                    let statusCode = 400;
                    if (result.error.includes("already registered") ||
                        result.error.includes("already exists") ||
                        result.error.includes("duplicate")) {
                        statusCode = 409;
                    }
                    else if (result.error.includes("Invalid") ||
                        result.error.includes("validation")) {
                        statusCode = 400;
                    }
                    else if (result.error.includes("service")) {
                        statusCode = 503;
                    }
                    logger_1.default.error("❌ Patient registration failed", {
                        email: patientData.email,
                        error: result.error,
                        statusCode,
                    });
                    res.status(statusCode).json({
                        success: false,
                        error: result.error,
                    });
                    return;
                }
                logger_1.default.info("✅ Patient registration successful", {
                    email: patientData.email,
                    full_name: patientData.full_name,
                    user_id: result.user?.id,
                    patient_id: result.user?.patient_id,
                });
                res.status(201).json({
                    success: true,
                    message: "Patient registration successful",
                    data: {
                        user: result.user,
                        session: result.session,
                    },
                });
            }
            catch (error) {
                logger_1.default.error("💥 Patient registration controller error", {
                    error: error.message,
                    stack: error.stack,
                    body: req.body,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error during patient registration",
                });
            }
        };
        this.validatePatientData = (data) => {
            const errors = [];
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                errors.push("Invalid email format");
            }
            if (data.password.length < 8) {
                errors.push("Password must be at least 8 characters long");
            }
            const nationalIdRegex = /^[0-9]{9,12}$/;
            if (!nationalIdRegex.test(data.national_id)) {
                errors.push("National ID must be 9-12 digits");
            }
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(data.phone_number)) {
                errors.push("Phone number must be 10 digits starting with 0");
            }
            if (data.emergency_contact?.phone_number && !phoneRegex.test(data.emergency_contact.phone_number)) {
                errors.push("Emergency contact phone number must be 10 digits starting with 0");
            }
            const birthDate = new Date(data.date_of_birth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 0 || age > 150) {
                errors.push("Invalid date of birth");
            }
            if (data.weight && (data.weight < 1 || data.weight > 300)) {
                errors.push("Weight must be between 1-300 kg");
            }
            if (data.height && (data.height < 50 || data.height > 250)) {
                errors.push("Height must be between 50-250 cm");
            }
            return errors;
        };
        this.getRegistrationStats = async (req, res) => {
            try {
                const stats = {
                    total_patients: 0,
                    registrations_today: 0,
                    registrations_this_month: 0,
                    average_age: 0,
                    gender_distribution: {
                        male: 0,
                        female: 0,
                        other: 0,
                    },
                    insurance_coverage: {
                        with_insurance: 0,
                        without_insurance: 0,
                    },
                };
                res.json({
                    success: true,
                    data: stats,
                });
            }
            catch (error) {
                logger_1.default.error("💥 Error getting registration stats", {
                    error: error.message,
                    stack: error.stack,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                });
            }
        };
        this.authService = new auth_service_1.AuthService();
    }
}
exports.PatientRegistrationController = PatientRegistrationController;
//# sourceMappingURL=patient-registration.controller.js.map